"""Data validation service that audits data quality and detects malformed records."""

import pandas as pd
from models.enums import QualityIssueType, DataSourceType
from models.schemas import DataQualityReport, SourceQualitySummary, QualityIssue


def validate_dataframe(
    df: pd.DataFrame,
    source_type: DataSourceType,
    id_col: str,
    date_col: str = "date_normalized",
    amount_col: str = "amount_normalized",
) -> tuple[pd.Series, SourceQualitySummary]:
    """
    Validate normalized dataframe rows for:
    - Missing or empty primary key
    - Duplicate primary keys
    - Missing or non-parsable amount
    - Negative amounts
    - Missing or non-parsable date
    
    Returns:
    - valid_mask: Boolean pandas Series indicating which rows are fully valid
    - summary: SourceQualitySummary containing metrics and details of issues
    """
    total = len(df)
    issues: list[QualityIssue] = []
    is_valid = pd.Series([True] * total, index=df.index)

    # 1. Check duplicate primary keys
    seen_ids = set()
    dup_count = 0
    id_clean_col = f"{id_col}_clean" if f"{id_col}_clean" in df.columns else id_col

    for idx, row in df.iterrows():
        raw_id = str(row.get(id_clean_col, "")).strip()
        if not raw_id or raw_id.lower() in ("nan", "none", ""):
            is_valid.at[idx] = False
            issues.append(
                QualityIssue(
                    record_id=None,
                    issue_type=QualityIssueType.MISSING_PRIMARY_KEY,
                    description=f"Row index {idx} has missing or empty primary ID in column '{id_col}'",
                    raw_data=row.to_dict(),
                )
            )
        elif raw_id in seen_ids:
            is_valid.at[idx] = False
            dup_count += 1
            issues.append(
                QualityIssue(
                    record_id=raw_id,
                    issue_type=QualityIssueType.DUPLICATE_ID,
                    description=f"Duplicate primary ID '{raw_id}' detected in {source_type.value}",
                    raw_data=row.to_dict(),
                )
            )
        else:
            seen_ids.add(raw_id)

    # 2. Check Amount
    for idx, row in df.iterrows():
        amt = row.get(amount_col)
        rec_id = str(row.get(id_clean_col, f"idx_{idx}"))
        if amt is None or pd.isna(amt):
            is_valid.at[idx] = False
            issues.append(
                QualityIssue(
                    record_id=rec_id,
                    issue_type=QualityIssueType.MISSING_AMOUNT,
                    description=f"Record '{rec_id}' has invalid or missing monetary amount",
                    raw_data=row.to_dict(),
                )
            )
        elif amt < 0:
            is_valid.at[idx] = False
            issues.append(
                QualityIssue(
                    record_id=rec_id,
                    issue_type=QualityIssueType.NEGATIVE_AMOUNT,
                    description=f"Record '{rec_id}' has negative monetary amount: {amt}",
                    raw_data=row.to_dict(),
                )
            )

    # 3. Check Date
    for idx, row in df.iterrows():
        dt = row.get(date_col)
        rec_id = str(row.get(id_clean_col, f"idx_{idx}"))
        if dt is None or pd.isna(dt):
            is_valid.at[idx] = False
            issues.append(
                QualityIssue(
                    record_id=rec_id,
                    issue_type=QualityIssueType.INVALID_DATE,
                    description=f"Record '{rec_id}' has unparseable or missing date",
                    raw_data=row.to_dict(),
                )
            )

    valid_count = int(is_valid.sum())
    invalid_count = total - valid_count

    summary = SourceQualitySummary(
        source_name=source_type.value,
        total_records=total,
        valid_records=valid_count,
        invalid_records=invalid_count,
        duplicate_records=dup_count,
        issues=issues[:50],  # cap details to 50 items for efficiency
    )

    return is_valid, summary


def generate_quality_report(
    invoices_df: pd.DataFrame,
    payments_df: pd.DataFrame,
    bank_df: pd.DataFrame,
) -> tuple[tuple[pd.Series, pd.Series, pd.Series], DataQualityReport]:
    """Validate all three datasets and produce composite DataQualityReport."""
    inv_valid, inv_summary = validate_dataframe(invoices_df, DataSourceType.INVOICES, "invoice_id")
    pay_valid, pay_summary = validate_dataframe(payments_df, DataSourceType.PAYMENTS, "payment_id")
    bnk_valid, bnk_summary = validate_dataframe(bank_df, DataSourceType.BANK_TRANSACTIONS, "transaction_id")

    report = DataQualityReport(
        invoices=inv_summary,
        payments=pay_summary,
        bank_transactions=bnk_summary,
    )
    return (inv_valid, pay_valid, bnk_valid), report
