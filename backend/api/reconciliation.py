"""Reconciliation API routes."""

from fastapi import APIRouter, File, UploadFile, HTTPException, Query, status
from models.schemas import ReconciliationResponse, BenchmarkEvaluationReport
from services.file_parser import parse_csv_content, FileParsingError
from services.normalizer import normalize_invoices, normalize_payments, normalize_bank_transactions
from services.reconciler import reconcile_sources
from services.metrics import evaluate_ground_truth
from data.synthetic_generator import generate_synthetic_dataset

router = APIRouter(tags=["Reconciliation"])


@router.post(
    "/reconcile",
    response_model=ReconciliationResponse,
    summary="Reconcile Invoices, Payments, and Bank Transactions",
)
async def reconcile_files(
    invoices: UploadFile = File(..., description="Invoices CSV file"),
    bank_transactions: UploadFile = File(..., description="Bank Transactions CSV file"),
    payments: UploadFile = File(..., description="Payments CSV file"),
):
    """
    Reconciles uploaded invoices, payments, and bank transactions.
    """
    uploaded_files = [
        ("invoices", invoices),
        ("bank_transactions", bank_transactions),
        ("payments", payments),
    ]

    for name, f in uploaded_files:
        if not f or not f.filename:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": "Missing file upload", "file": name}
            )

    try:
        inv_content = await invoices.read()
        inv_df = parse_csv_content(inv_content, invoices.filename or "invoices.csv", "invoices")
    except FileParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": e.message, "file": e.file_name, "column": e.column}
        )

    try:
        pay_content = await payments.read()
        pay_df = parse_csv_content(pay_content, payments.filename or "payments.csv", "payments")
    except FileParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": e.message, "file": e.file_name, "column": e.column}
        )

    try:
        bnk_content = await bank_transactions.read()
        bnk_df = parse_csv_content(bnk_content, bank_transactions.filename or "bank_transactions.csv", "bank_transactions")
    except FileParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": e.message, "file": e.file_name, "column": e.column}
        )

    inv_norm_df = normalize_invoices(inv_df)
    pay_norm_df = normalize_payments(pay_df)
    bnk_norm_df = normalize_bank_transactions(bnk_df)

    response = reconcile_sources(
        invoices_df=inv_norm_df,
        payments_df=pay_norm_df,
        bank_df=bnk_norm_df,
    )

    return response


@router.post(
    "/evaluate-benchmark",
    response_model=BenchmarkEvaluationReport,
    summary="Evaluate reconciliation benchmark metrics",
)
def evaluate_benchmark(
    count: int = Query(500, ge=10, le=10000, description="Number of records to evaluate"),
    seed: int = Query(42, description="Random seed"),
):
    """
    Runs benchmark evaluation and returns reconciliation metrics.
    """
    inv_df, pay_df, bnk_df, ground_truth = generate_synthetic_dataset(count=count, seed=seed)

    inv_norm_df = normalize_invoices(inv_df)
    pay_norm_df = normalize_payments(pay_df)
    bnk_norm_df = normalize_bank_transactions(bnk_df)

    rec_response = reconcile_sources(
        invoices_df=inv_norm_df,
        payments_df=pay_norm_df,
        bank_df=bnk_norm_df,
    )

    raw_datasets = {
        "invoices": inv_df.to_dict(orient="records"),
        "payments": pay_df.to_dict(orient="records"),
        "bank_transactions": bnk_df.to_dict(orient="records"),
    }

    report = evaluate_ground_truth(rec_response, ground_truth, raw_datasets=raw_datasets)
    return report
