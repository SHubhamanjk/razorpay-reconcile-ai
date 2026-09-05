"""Pydantic schemas for reconciliation data structures and API responses."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from models.enums import ReconciliationStatus, MatchType, QualityIssueType


# --- Data Quality Schemas ---

class QualityIssue(BaseModel):
    record_id: str | None = None
    issue_type: QualityIssueType
    description: str
    raw_data: dict[str, Any] | None = None


class SourceQualitySummary(BaseModel):
    source_name: str
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    issues: list[QualityIssue] = Field(default_factory=list)


class DataQualityReport(BaseModel):
    invoices: SourceQualitySummary
    payments: SourceQualitySummary
    bank_transactions: SourceQualitySummary


# --- Scoring & Matching Detail Schemas ---

class ScoreBreakdown(BaseModel):
    reference_score: float = Field(0.0, description="Score for reference matching (out of 40)")
    amount_score: float = Field(0.0, description="Score for amount matching (out of 30)")
    customer_score: float = Field(0.0, description="Score for customer/description fuzzy similarity (out of 20)")
    date_score: float = Field(0.0, description="Score for date proximity (out of 10)")
    total_score: float = Field(0.0, description="Combined score (out of 100)")
    score_margin: float | None = Field(None, description="Difference between top candidate score and second top score")


class ReconciliationResultItem(BaseModel):
    invoice_id: str
    payment_id: str | None = None
    transaction_id: str | None = None
    status: ReconciliationStatus
    score: float = Field(0.0, ge=0.0, le=100.0)
    match_type: MatchType
    reasons: list[str] = Field(default_factory=list)
    score_breakdown: ScoreBreakdown | None = None
    invoice_amount: float | None = None
    payment_amount: float | None = None
    bank_amount: float | None = None
    customer_name: str | None = None
    reference: str | None = None


class ExceptionItem(BaseModel):
    invoice_id: str | None = None
    payment_id: str | None = None
    transaction_id: str | None = None
    status: ReconciliationStatus
    reason: str
    details: dict[str, Any] = Field(default_factory=dict)


# --- Summary & Batch Metrics Schemas ---

class ReconciliationSummary(BaseModel):
    total_invoices: int
    total_payments: int
    total_bank_transactions: int
    reconciled: int
    review_required: int
    exceptions: int
    duplicates: int
    unmatched: int
    match_rate: float = Field(..., description="reconciled / total_invoices (0.0 to 1.0)")
    exception_rate: float = Field(..., description="exceptions / total_invoices (0.0 to 1.0)")
    processing_time_seconds: float
    throughput_records_per_second: float


class ReconciliationResponse(BaseModel):
    run_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    summary: ReconciliationSummary
    data_quality: DataQualityReport
    results: list[ReconciliationResultItem]
    exceptions: list[ExceptionItem]
    unmatched_payments: list[str] = Field(default_factory=list, description="List of payment_ids that could not be linked to any invoice")
    unmatched_transactions: list[str] = Field(default_factory=list, description="List of transaction_ids that could not be linked to any invoice")


# --- Evaluation Schemas (Milestone 5) ---

class BenchmarkEvaluationReport(BaseModel):
    total_test_cases: int
    correct_matches: int
    correct_exceptions: int
    false_positives: int
    false_negatives: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_match_rate: float
    processing_time_seconds: float
    reconciliation_details: ReconciliationResponse | None = None
    ground_truth: list[dict[str, Any]] | None = None
    raw_datasets: dict[str, list[dict[str, Any]]] | None = None


# --- AI Financial Analyst & Chat Schemas ---

class AIRuleAction(BaseModel):
    action_type: str = Field(..., description="Action identifier e.g. APPLY_FEE_ADJUSTMENT, LINK_BANK_TXN, ACCEPT_TIMING_LAG, FLAG_CHARGEBACK")
    label: str = Field(..., description="Human readable button label")
    suggested_status: str = Field(..., description="Recommended reconciliation status after action")
    payload: dict[str, Any] = Field(default_factory=dict, description="Metadata for executing the action")


class AIAnalysisRequest(BaseModel):
    invoice_id: str
    payment_id: str | None = None
    transaction_id: str | None = None
    status: str
    score: float = 0.0
    match_type: str = "UNMATCHED"
    reasons: list[str] = Field(default_factory=list)
    score_breakdown: ScoreBreakdown | None = None
    invoice_amount: float | None = None
    payment_amount: float | None = None
    bank_amount: float | None = None
    customer_name: str | None = None
    reference: str | None = None
    additional_context: dict[str, Any] = Field(default_factory=dict)


class AIAnalysisResponse(BaseModel):
    invoice_id: str
    verdict: str = Field(..., description="High-level category e.g. RESOLVABLE_MDR_FEE, TIMING_DELAY, DUPLICATE_COLLISION, UNMATCHED_ORPHAN")
    root_cause: str = Field(..., description="Plain-English financial root cause summary")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    actionable_items: list[str] = Field(default_factory=list, description="List of 2-4 concise actionable findings")
    recommended_action: AIRuleAction | None = None
    source: str = Field(default="gemini", description="AI provider or heuristic fallback")


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str


class AIChatRequest(BaseModel):
    record: AIAnalysisRequest
    messages: list[ChatMessage]
    user_query: str


class AIChatResponse(BaseModel):
    reply: str
    source: str = Field(default="gemini")


