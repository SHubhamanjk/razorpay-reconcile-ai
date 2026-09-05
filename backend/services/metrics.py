"""Metrics calculation and ground-truth benchmark evaluation."""

from typing import Any
from models.enums import ReconciliationStatus
from models.schemas import BenchmarkEvaluationReport, ReconciliationResponse


def evaluate_ground_truth(
    response: ReconciliationResponse,
    ground_truth: list[dict[str, Any]],
    raw_datasets: dict[str, list[dict[str, Any]]] | None = None,
) -> BenchmarkEvaluationReport:
    """
    Compare reconciliation engine results against known ground truth labels.
    """
    gt_map = {item["invoice_id"]: item for item in ground_truth}
    total = len(ground_truth)

    correct_matches = 0
    correct_exceptions = 0
    false_positives = 0
    false_negatives = 0

    for result in response.results:
        inv_id = result.invoice_id
        if inv_id not in gt_map:
            continue

        gt = gt_map[inv_id]
        expected_status = gt.get("expected_status")
        expected_pay = gt.get("expected_payment_id")
        expected_tx = gt.get("expected_transaction_id")

        is_engine_reconciled = (result.status == ReconciliationStatus.RECONCILED)
        is_expected_reconciled = (expected_status == ReconciliationStatus.RECONCILED.value)

        # Check exact ID alignment if reconciled
        id_match = (result.payment_id == expected_pay and result.transaction_id == expected_tx)

        if is_engine_reconciled and is_expected_reconciled and id_match:
            correct_matches += 1
        elif is_engine_reconciled and (not is_expected_reconciled or not id_match):
            false_positives += 1
        elif (not is_engine_reconciled) and is_expected_reconciled:
            false_negatives += 1
        elif (not is_engine_reconciled) and (not is_expected_reconciled):
            correct_exceptions += 1

    accuracy = (correct_matches + correct_exceptions) / max(total, 1)
    precision = correct_matches / max(correct_matches + false_positives, 1)
    recall = correct_matches / max(correct_matches + false_negatives, 1)
    f1 = (2 * precision * recall) / max(precision + recall, 1e-6)
    false_match_rate = false_positives / max(correct_matches + false_positives, 1)

    return BenchmarkEvaluationReport(
        total_test_cases=total,
        correct_matches=correct_matches,
        correct_exceptions=correct_exceptions,
        false_positives=false_positives,
        false_negatives=false_negatives,
        accuracy=round(accuracy, 4),
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1_score=round(f1, 4),
        false_match_rate=round(false_match_rate, 4),
        processing_time_seconds=response.summary.processing_time_seconds,
        reconciliation_details=response,
        ground_truth=ground_truth,
        raw_datasets=raw_datasets,
    )

