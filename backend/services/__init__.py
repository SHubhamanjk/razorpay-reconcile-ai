"""Services package for reconciliation engine."""
from services.file_parser import parse_csv_content, FileParsingError
from services.normalizer import normalize_invoices, normalize_payments, normalize_bank_transactions
from services.validator import validate_dataframe, generate_quality_report
from services.duplicate_detector import find_duplicate_references, find_duplicate_transactions
from services.candidate_generator import TargetIndex
from services.scorer import calculate_pair_score
from services.matcher import find_best_match, MatchCandidateResult
from services.reconciler import reconcile_sources
from services.metrics import evaluate_ground_truth

__all__ = [
    "parse_csv_content",
    "FileParsingError",
    "normalize_invoices",
    "normalize_payments",
    "normalize_bank_transactions",
    "validate_dataframe",
    "generate_quality_report",
    "find_duplicate_references",
    "find_duplicate_transactions",
    "TargetIndex",
    "calculate_pair_score",
    "find_best_match",
    "MatchCandidateResult",
    "reconcile_sources",
    "evaluate_ground_truth",
]
