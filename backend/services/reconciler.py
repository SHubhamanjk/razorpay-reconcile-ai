"""Three-way multi-source reconciliation engine."""

import time
import uuid
import pandas as pd
from models.enums import ReconciliationStatus, MatchType
from models.schemas import (
    ReconciliationResultItem,
    ExceptionItem,
    ReconciliationSummary,
    ReconciliationResponse,
    DataQualityReport,
    ScoreBreakdown,
)

from services.candidate_generator import TargetIndex
from services.matcher import find_best_match
from services.duplicate_detector import find_duplicate_references, find_duplicate_transactions
from services.validator import generate_quality_report


def reconcile_sources(
    invoices_df: pd.DataFrame,
    payments_df: pd.DataFrame,
    bank_df: pd.DataFrame,
) -> ReconciliationResponse:
    """
    Reconciles three financial data sources (Invoices, Payments, Bank Transactions).
    Flow:
    1. Data quality auditing & report generation
    2. Pre-indexing & duplicate detection
    3. Invoice-driven 3-way reconciliation loop
    4. 3-way consistency and status classification
    5. Batch metrics calculation & exception aggregation
    """
    start_time = time.perf_counter()
    run_id = f"REC-{time.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Step 1: Validate data quality
    (inv_valid, pay_valid, bnk_valid), quality_report = generate_quality_report(
        invoices_df, payments_df, bank_df
    )

    # Step 2: Build target indices for fast candidate lookup
    payment_index = TargetIndex(payments_df, id_col="payment_id")
    bank_index = TargetIndex(bank_df, id_col="transaction_id")

    # Step 3: Identify duplicates
    inv_dup_refs = find_duplicate_references(invoices_df)
    pay_dup_map = find_duplicate_transactions(payments_df, id_col="payment_id_clean")
    bnk_dup_map = find_duplicate_transactions(bank_df, id_col="transaction_id_clean")

    results: list[ReconciliationResultItem] = []
    exceptions: list[ExceptionItem] = []

    matched_payment_ids: set[str] = set()
    matched_transaction_ids: set[str] = set()

    # Step 4: Main Reconciliation Loop (Invoice as primary record)
    for idx, inv_row in invoices_df.iterrows():
        inv_id = str(inv_row.get("invoice_id_clean", inv_row.get("invoice_id", f"INV_ROW_{idx}")))
        inv_amt = inv_row.get("amount_normalized")
        inv_ref = inv_row.get("reference_normalized")
        inv_name = inv_row.get("customer_normalized")

        # 4a. Check Data Quality validity
        if not inv_valid.at[idx]:
            item = ReconciliationResultItem(
                invoice_id=inv_id,
                status=ReconciliationStatus.INVALID_DATA,
                score=0.0,
                match_type=MatchType.UNMATCHED,
                reasons=["Invoice failed data quality validation checks"],
                invoice_amount=inv_amt,
                customer_name=inv_name,
                reference=inv_ref,
            )
            results.append(item)
            exceptions.append(
                ExceptionItem(
                    invoice_id=inv_id,
                    status=ReconciliationStatus.INVALID_DATA,
                    reason="Invoice record contains invalid date, amount, or missing identifier",
                    details={"raw": inv_row.to_dict()},
                )
            )
            continue

        # 4b. Check Duplicate references in invoices
        if inv_ref and inv_ref in inv_dup_refs:
            item = ReconciliationResultItem(
                invoice_id=inv_id,
                status=ReconciliationStatus.DUPLICATE,
                score=50.0,
                match_type=MatchType.MANUAL_REVIEW_NEEDED,
                reasons=[f"Duplicate reference '{inv_ref}' found across multiple invoices"],
                invoice_amount=inv_amt,
                customer_name=inv_name,
                reference=inv_ref,
            )
            results.append(item)
            exceptions.append(
                ExceptionItem(
                    invoice_id=inv_id,
                    status=ReconciliationStatus.DUPLICATE,
                    reason=f"Duplicate reference '{inv_ref}' shared with other invoices",
                    details={"reference": inv_ref},
                )
            )
            continue

        # 4c. Find matching Payment & Bank Transaction
        pay_match = find_best_match(inv_row.to_dict(), payment_index, target_id_col="payment_id")
        bnk_match = find_best_match(inv_row.to_dict(), bank_index, target_id_col="transaction_id")

        pay_rec = pay_match.target_record
        bnk_rec = bnk_match.target_record

        pay_id = pay_match.target_id
        bnk_id = bnk_match.target_id

        pay_amt = pay_rec.get("amount_normalized") if pay_rec else None
        bnk_amt = bnk_rec.get("amount_normalized") if bnk_rec else None

        combined_reasons = []
        if pay_match.reasons:
            combined_reasons.append(f"Payment match: {'; '.join(pay_match.reasons)}")
        if bnk_match.reasons:
            combined_reasons.append(f"Bank match: {'; '.join(bnk_match.reasons)}")

        # Calculate average confidence score
        valid_scores = [s for s in [pay_match.score, bnk_match.score] if s > 0]
        avg_score = round(sum(valid_scores) / len(valid_scores), 2) if valid_scores else 0.0

        # Determine MatchType
        if pay_match.match_type == MatchType.EXACT_REFERENCE and bnk_match.match_type == MatchType.EXACT_REFERENCE:
            final_match_type = MatchType.EXACT_REFERENCE
        elif pay_match.match_type in (MatchType.EXACT_REFERENCE, MatchType.HIGH_CONFIDENCE_MULTI_SIGNAL) and \
             bnk_match.match_type in (MatchType.EXACT_REFERENCE, MatchType.HIGH_CONFIDENCE_MULTI_SIGNAL):
            final_match_type = MatchType.HIGH_CONFIDENCE_MULTI_SIGNAL
        elif pay_match.is_ambiguous or bnk_match.is_ambiguous:
            final_match_type = MatchType.MANUAL_REVIEW_NEEDED
        elif pay_match.match_type == MatchType.MEDIUM_CONFIDENCE_FUZZY or bnk_match.match_type == MatchType.MEDIUM_CONFIDENCE_FUZZY:
            final_match_type = MatchType.MEDIUM_CONFIDENCE_FUZZY
        else:
            final_match_type = MatchType.UNMATCHED

        # 4d. Classification Logic
        # Case 1: Ambiguity detected in either payment or bank match
        if pay_match.is_ambiguous or bnk_match.is_ambiguous:
            final_status = ReconciliationStatus.AMBIGUOUS_MATCH
            ex_reason = "Multiple target records have closely competing match scores"
        # Case 2: Both Payment and Bank are missing
        elif not pay_id and not bnk_id:
            final_status = ReconciliationStatus.UNMATCHED
            ex_reason = "No matching payment or bank transaction found"
        # Case 3: Missing Payment but Bank present
        elif not pay_id and bnk_id:
            final_status = ReconciliationStatus.MISSING_PAYMENT
            ex_reason = f"Bank transaction {bnk_id} matched but corresponding payment record is missing"
            matched_transaction_ids.add(bnk_id)
        # Case 4: Missing Bank Transaction but Payment present
        elif pay_id and not bnk_id:
            final_status = ReconciliationStatus.MISSING_BANK_TRANSACTION
            ex_reason = f"Payment {pay_id} matched but corresponding bank settlement is missing"
            matched_payment_ids.add(pay_id)
        # Case 5: Both Payment and Bank present -> Check Consistency
        else:
            matched_payment_ids.add(pay_id)
            matched_transaction_ids.add(bnk_id)

            # Check if payment or bank is a known duplicate record
            if (pay_id and pay_id in pay_dup_map) or (bnk_id and bnk_id in bnk_dup_map):
                final_status = ReconciliationStatus.DUPLICATE
                ex_reason = "Matched payment or bank transaction is part of a duplicate cluster"
            # Check Amount Consistency across all 3
            elif inv_amt is not None and pay_amt is not None and bnk_amt is not None and \
                 (abs(inv_amt - pay_amt) > 0.01 or abs(inv_amt - bnk_amt) > 0.01 or abs(pay_amt - bnk_amt) > 0.01):
                final_status = ReconciliationStatus.AMOUNT_MISMATCH
                ex_reason = f"Amount mismatch detected: Invoice={inv_amt}, Payment={pay_amt}, Bank={bnk_amt}"
            # High confidence reconciliation
            elif (final_match_type in (MatchType.EXACT_REFERENCE, MatchType.HIGH_CONFIDENCE_MULTI_SIGNAL)) or \
                 (pay_amt is not None and inv_amt is not None and bnk_amt is not None and
                  abs(inv_amt - pay_amt) <= 0.01 and abs(inv_amt - bnk_amt) <= 0.01 and
                  pay_match.score >= 48.0 and bnk_match.score >= 48.0 and
                  not pay_match.is_ambiguous and not bnk_match.is_ambiguous):
                final_status = ReconciliationStatus.RECONCILED
                ex_reason = None
            # Moderate score -> manual review required
            elif avg_score >= 45.0:
                final_status = ReconciliationStatus.REVIEW_REQUIRED
                ex_reason = f"Multi-signal confidence score ({avg_score}) requires human review"
            else:
                final_status = ReconciliationStatus.UNMATCHED
                ex_reason = f"Overall confidence score ({avg_score}) is too low"

        # Calculate combined 4-signal score breakdown across active streams
        active_breakdowns = [
            b for b in [pay_match.score_breakdown, bnk_match.score_breakdown] if b is not None
        ]
        if active_breakdowns:
            comb_ref = round(sum(b.reference_score for b in active_breakdowns) / len(active_breakdowns), 2)
            comb_amt = round(sum(b.amount_score for b in active_breakdowns) / len(active_breakdowns), 2)
            comb_cust = round(sum(b.customer_score for b in active_breakdowns) / len(active_breakdowns), 2)
            comb_date = round(sum(b.date_score for b in active_breakdowns) / len(active_breakdowns), 2)
            combined_breakdown = ScoreBreakdown(
                reference_score=comb_ref,
                amount_score=comb_amt,
                customer_score=comb_cust,
                date_score=comb_date,
                total_score=round(comb_ref + comb_amt + comb_cust + comb_date, 2),
            )
        else:
            combined_breakdown = None

        item = ReconciliationResultItem(
            invoice_id=inv_id,
            payment_id=pay_id,
            transaction_id=bnk_id,
            status=final_status,
            score=avg_score,
            match_type=final_match_type,
            reasons=combined_reasons,
            score_breakdown=combined_breakdown,
            invoice_amount=inv_amt,
            payment_amount=pay_amt,
            bank_amount=bnk_amt,
            customer_name=inv_name,
            reference=inv_ref,
        )
        results.append(item)


        if final_status != ReconciliationStatus.RECONCILED and ex_reason:
            exceptions.append(
                ExceptionItem(
                    invoice_id=inv_id,
                    payment_id=pay_id,
                    transaction_id=bnk_id,
                    status=final_status,
                    reason=ex_reason,
                    details={
                        "invoice_amount": inv_amt,
                        "payment_amount": pay_amt,
                        "bank_amount": bnk_amt,
                        "score": avg_score,
                    },
                )
            )

    # Step 5: Unmatched Payments and Bank Transactions
    all_pay_ids = set(payments_df["payment_id_clean"].tolist()) if "payment_id_clean" in payments_df.columns else set(payments_df["payment_id"].astype(str).tolist())
    all_bnk_ids = set(bank_df["transaction_id_clean"].tolist()) if "transaction_id_clean" in bank_df.columns else set(bank_df["transaction_id"].astype(str).tolist())

    unmatched_pay_ids = sorted(list(all_pay_ids - matched_payment_ids))
    unmatched_bnk_ids = sorted(list(all_bnk_ids - matched_transaction_ids))

    # Step 6: Compute Summary Metrics
    end_time = time.perf_counter()
    processing_time = round(max(end_time - start_time, 0.001), 4)

    total_invoices = len(invoices_df)
    reconciled_cnt = sum(1 for r in results if r.status == ReconciliationStatus.RECONCILED)
    review_cnt = sum(1 for r in results if r.status in (ReconciliationStatus.REVIEW_REQUIRED, ReconciliationStatus.AMBIGUOUS_MATCH))
    duplicate_cnt = sum(1 for r in results if r.status == ReconciliationStatus.DUPLICATE)
    unmatched_cnt = sum(1 for r in results if r.status == ReconciliationStatus.UNMATCHED)
    exception_cnt = len(exceptions)

    match_rate = round(reconciled_cnt / max(total_invoices, 1), 4)
    exception_rate = round(exception_cnt / max(total_invoices, 1), 4)
    throughput = round(total_invoices / processing_time, 2)

    summary = ReconciliationSummary(
        total_invoices=total_invoices,
        total_payments=len(payments_df),
        total_bank_transactions=len(bank_df),
        reconciled=reconciled_cnt,
        review_required=review_cnt,
        exceptions=exception_cnt,
        duplicates=duplicate_cnt,
        unmatched=unmatched_cnt,
        match_rate=match_rate,
        exception_rate=exception_rate,
        processing_time_seconds=processing_time,
        throughput_records_per_second=throughput,
    )

    return ReconciliationResponse(
        run_id=run_id,
        summary=summary,
        data_quality=quality_report,
        results=results,
        exceptions=exceptions,
        unmatched_payments=unmatched_pay_ids,
        unmatched_transactions=unmatched_bnk_ids,
    )
