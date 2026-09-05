"""Google Gemini AI Service for Financial Reconciliation Analysis & Interactive Chat."""

import json
import os
from typing import Any
from dotenv import load_dotenv

from models.schemas import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    AIRuleAction,
    AIChatRequest,
    AIChatResponse,
    ChatMessage,
)

load_dotenv()

# Common model names to try with Google GenAI SDK
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-3.8-flash"]

PLACEHOLDER_KEYS = {
    "",
    "your_google_gemini_api_key_here",
    "your_gemini_api_key_here",
    "your_api_key_here",
    "your_key_here",
}


class GeminiNotConfiguredError(Exception):
    """Raised when Google Gemini API key is missing or not configured."""
    def __init__(self, message: str = "Google Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env to use AI Forensic Copilot."):
        super().__init__(message)
        self.message = message


class GeminiAuthenticationError(Exception):
    """Raised when Google Gemini API key is invalid or rejected by Google API."""
    def __init__(self, message: str = "Google Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY in backend/.env."):
        super().__init__(message)
        self.message = message


def is_gemini_configured() -> bool:
    """Returns True if a valid non-placeholder GEMINI_API_KEY is present in environment."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        return False
    if api_key.lower() in PLACEHOLDER_KEYS or api_key.lower().startswith("your_"):
        return False
    return True


def _get_gemini_client():
    """Initializes and returns Google GenAI client if API key is present and valid."""
    if not is_gemini_configured():
        raise GeminiNotConfiguredError()

    api_key = os.getenv("GEMINI_API_KEY", "").strip().strip('"').strip("'")
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[GeminiService] Could not initialize google.genai: {e}")
        raise GeminiNotConfiguredError(f"Failed to initialize Google GenAI client: {e}")


def _build_context_prompt(record: AIAnalysisRequest) -> str:
    """Builds structured text representing all data streams and engine audits for the AI."""
    sb = record.score_breakdown
    sb_text = "N/A"
    if sb:
        sb_text = (
            f"Reference: {sb.reference_score}/40, Amount: {sb.amount_score}/30, "
            f"Customer: {sb.customer_score}/20, Date Proximity: {sb.date_score}/10 (Total: {sb.total_score}/100)"
        )

    reasons_text = "\n".join([f"- {r}" for r in record.reasons]) if record.reasons else "None logged"

    return f"""
FINANCIAL RECONCILIATION RECORD DETAILS:
----------------------------------------
Invoice ID: {record.invoice_id}
Customer Name: {record.customer_name or 'Unknown'}
Reference: {record.reference or 'N/A'}
Engine Reconciliation Status: {record.status}
Match Type: {record.match_type}
Confidence Score: {record.score}/100

TRI-PARTY STREAM AMOUNTS:
- Stream 1 (Invoice Amount): {f'₹{record.invoice_amount:,.2f}' if record.invoice_amount is not None else 'N/A'}
- Stream 2 (Payment Amount): {f'₹{record.payment_amount:,.2f}' if record.payment_amount is not None else 'MISSING'} (ID: {record.payment_id or 'None'})
- Stream 3 (Bank Settlement): {f'₹{record.bank_amount:,.2f}' if record.bank_amount is not None else 'MISSING'} (ID: {record.transaction_id or 'None'})

4-SIGNAL SCORE BREAKDOWN:
{sb_text}

ENGINE AUDIT & REASONING LOG:
{reasons_text}
"""


def _heuristic_analysis(record: AIAnalysisRequest) -> AIAnalysisResponse:
    """Intelligent financial heuristic analyzer when running without Gemini API key or in offline mode."""
    inv_amt = record.invoice_amount
    pay_amt = record.payment_amount
    bnk_amt = record.bank_amount
    status = record.status

    # Case 1: Amount Mismatch (Check for MDR fees, GST, or partial deductions)
    if status == "AMOUNT_MISMATCH" or (inv_amt is not None and pay_amt is not None and abs(inv_amt - pay_amt) > 0.01):
        diff = round(inv_amt - pay_amt, 2) if inv_amt is not None and pay_amt is not None else 0.0
        pct = round((diff / inv_amt) * 100, 2) if inv_amt and inv_amt > 0 else 0.0

        # Check standard 2.0% MDR + 18% GST = 2.36%
        is_standard_mdr_gst = abs(pct - 2.36) <= 0.15 or abs(pct - 2.0) <= 0.1 or abs(pct - 1.77) <= 0.1
        if is_standard_mdr_gst:
            return AIAnalysisResponse(
                invoice_id=record.invoice_id,
                verdict="RESOLVABLE_MDR_FEE",
                root_cause=f"Difference of ₹{abs(diff):,.2f} ({pct}%) matches standard Payment Gateway MDR fee (2.0% + 18% GST).",
                confidence=0.96,
                actionable_items=[
                    f"Invoice gross amount is ₹{inv_amt:,.2f}, net settlement received is ₹{pay_amt:,.2f}.",
                    f"Variance of ₹{abs(diff):,.2f} is consistent with 2.36% gateway interchange and processing surcharge.",
                    f"Reference '{record.reference}' and Customer '{record.customer_name}' match with high confidence.",
                    "Safe to auto-reconcile with 'MDR Fee Adjustment'."
                ],
                recommended_action=AIRuleAction(
                    action_type="APPLY_FEE_ADJUSTMENT",
                    label=f"Apply ₹{abs(diff):,.2f} Fee Variance & Reconcile",
                    suggested_status="RECONCILED",
                    payload={"adjustment_amount": abs(diff), "type": "GATEWAY_MDR_FEE"}
                ),
                source="heuristic_engine"
            )
        else:
            return AIAnalysisResponse(
                invoice_id=record.invoice_id,
                verdict="AMOUNT_VARIANCE_INVESTIGATION",
                root_cause=f"Unexplained amount difference of ₹{abs(diff):,.2f} ({pct}%) between invoice and payment stream.",
                confidence=0.88,
                actionable_items=[
                    f"Invoice Amount: ₹{inv_amt:,.2f} vs Payment Amount: ₹{pay_amt:,.2f}.",
                    f"Discrepancy: ₹{abs(diff):,.2f}.",
                    "Review whether partial payment was accepted or an unauthorized deduction occurred.",
                    "Recommend requesting updated credit memo or debit adjustment from payment vendor."
                ],
                recommended_action=AIRuleAction(
                    action_type="FLAG_VARIANCE_REVIEW",
                    label="Flag for Partial Payment Review",
                    suggested_status="REVIEW_REQUIRED",
                    payload={"variance": abs(diff)}
                ),
                source="heuristic_engine"
            )

    # Case 2: Missing Bank Transaction
    if status == "MISSING_BANK_TRANSACTION" or (record.payment_id and not record.transaction_id):
        return AIAnalysisResponse(
            invoice_id=record.invoice_id,
            verdict="SETTLEMENT_FLOAT_TIMING_DELAY",
            root_cause="Payment was confirmed on gateway but corresponding bank settlement has not arrived (T+1/T+2 settlement delay).",
            confidence=0.92,
            actionable_items=[
                f"Payment ID {record.payment_id} successfully captured for ₹{pay_amt or inv_amt or 0:,.2f}.",
                "Bank batch settlement file has no matching transaction ID.",
                "Likely pending within standard 24-48h nodal bank clearing window.",
                "Recommend accepting as in-flight settlement float or running next-day bank statement sync."
            ],
            recommended_action=AIRuleAction(
                action_type="MARK_IN_FLIGHT_FLOAT",
                label="Mark as In-Flight Bank Settlement",
                suggested_status="REVIEW_REQUIRED",
                payload={"payment_id": record.payment_id}
            ),
            source="heuristic_engine"
        )

    # Case 3: Missing Payment
    if status == "MISSING_PAYMENT" or (not record.payment_id and record.transaction_id):
        return AIAnalysisResponse(
            invoice_id=record.invoice_id,
            verdict="UNLINKED_BANK_DEPOSIT",
            root_cause="Direct bank credit was detected but gateway payment record is missing or unlinked.",
            confidence=0.89,
            actionable_items=[
                f"Bank credit {record.transaction_id} for ₹{bnk_amt or inv_amt or 0:,.2f} exists without gateway tracking.",
                "Customer may have paid via direct NEFT/RTGS/IMPS bypassing the payment gateway.",
                "Match customer reference to confirm direct bank deposit receipt."
            ],
            recommended_action=AIRuleAction(
                action_type="LINK_DIRECT_BANK_DEPOSIT",
                label="Link Direct Bank Credit & Reconcile",
                suggested_status="RECONCILED",
                payload={"transaction_id": record.transaction_id}
            ),
            source="heuristic_engine"
        )

    # Case 4: Duplicate Record
    if status == "DUPLICATE":
        return AIAnalysisResponse(
            invoice_id=record.invoice_id,
            verdict="DUPLICATE_COLLISION",
            root_cause=f"Reference '{record.reference}' or transaction amount was detected across multiple invoices/entries.",
            confidence=0.94,
            actionable_items=[
                f"Collision detected on reference identifier '{record.reference}'.",
                "Multiple records claim the same settlement entry.",
                "Investigate sibling records before applying resolution to avoid double crediting."
            ],
            recommended_action=AIRuleAction(
                action_type="FLAG_DUPLICATE_CLUSTER",
                label="Isolate Duplicate Cluster for Audit",
                suggested_status="REVIEW_REQUIRED",
                payload={"reference": record.reference}
            ),
            source="heuristic_engine"
        )

    # Default / General Review
    return AIAnalysisResponse(
        invoice_id=record.invoice_id,
        verdict="MANUAL_REVIEW_RECOMMENDED",
        root_cause=f"Record confidence score ({record.score}/100) indicates multi-signal ambiguity across streams.",
        confidence=0.80,
        actionable_items=[
            f"Current status: {status}.",
            f"Customer: {record.customer_name or 'N/A'}, Reference: {record.reference or 'N/A'}.",
            "Verify entity name spelling and date ranges across files."
        ],
        recommended_action=AIRuleAction(
            action_type="MANUAL_AUDIT_ACCEPT",
            label="Approve Manual Exception",
            suggested_status="RECONCILED",
            payload={"score": record.score}
        ),
        source="heuristic_engine"
    )


def analyze_record_with_ai(record: AIAnalysisRequest) -> AIAnalysisResponse:
    """Performs deep AI analysis on an unreconciled record using Google Gemini with explicit error propagation."""
    client = _get_gemini_client()

    context_prompt = _build_context_prompt(record)
    system_instruction = (
        "You are Razorpay's Senior Forensic Financial Investigator and Reconciliation Specialist. "
        "Investigate discrepancies across the 3 streams (Invoices, Payments, Bank Settlement) using the provided record data. "
        "Identify root causes with exact mathematical evidence and reference matching, and provide clear auditor recommendations. "
        "Return your response ONLY in valid JSON matching the schema."
    )

    user_prompt = f"""
{context_prompt}

INVESTIGATION TASK:
1. 'verdict': Concise category identifier string (e.g. RESOLVABLE_MDR_FEE, SETTLEMENT_FLOAT_TIMING_DELAY, UNLINKED_BANK_DEPOSIT, DUPLICATE_COLLISION, AMOUNT_MISMATCH, UNMATCHED_ORPHAN).
2. 'root_cause': 1-2 sentence plain-English explanation of what occurred across the streams.
3. 'confidence': Float between 0.0 and 1.0.
4. 'actionable_items': Array of 2 to 4 forensic findings breaking down exact amounts, reference keys, and date differences.
5. 'recommended_action': Object with 'label' providing actionable next steps for the finance team.

Output JSON format:
{{
  "invoice_id": "{record.invoice_id}",
  "verdict": "string",
  "root_cause": "string",
  "confidence": 0.95,
  "actionable_items": ["finding 1", "finding 2"],
  "recommended_action": {{
    "action_type": "string",
    "label": "string",
    "suggested_status": "string",
    "payload": {{}}
  }}
}}
"""

    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
            )

            if response and response.text:
                data = json.loads(response.text)
                return AIAnalysisResponse(
                    invoice_id=record.invoice_id,
                    verdict=data.get("verdict", "AI_ANALYZED"),
                    root_cause=data.get("root_cause", "AI analysis completed."),
                    confidence=float(data.get("confidence", 0.90)),
                    actionable_items=data.get("actionable_items", []),
                    recommended_action=AIRuleAction(**data["recommended_action"]) if data.get("recommended_action") else None,
                    source="gemini"
                )
        except Exception as e:
            err_str = str(e)
            print(f"[GeminiService] Error with model {model_name}: {err_str}")
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str or "PERMISSION_DENIED" in err_str:
                raise GeminiAuthenticationError()
            last_error = e
            continue

    # Fallback to heuristic analysis if all Gemini models temporarily rate-limit or fail
    if last_error:
        print(f"[GeminiService] All Gemini models failed, using heuristic analysis fallback: {last_error}")
    return _heuristic_analysis(record)


def chat_with_reconciliation_ai(req: AIChatRequest) -> AIChatResponse:
    """Multi-turn conversational chat with Gemini regarding a specific reconciliation record."""
    client = _get_gemini_client()

    context_prompt = _build_context_prompt(req.record)

    # Use Gemini for dynamic conversational response
    system_instruction = (
        "You are Razorpay's Senior AI Financial Controller and Reconciliation Specialist. "
        "Your mission is to provide crystal-clear, highly actionable, and user-friendly guidance for financial controllers. "
        "Guidelines for your response: "
        "1. Structure explanations with clear bullet points, bold key terms, and exact numbers (₹ amounts, percentage variances, dates, references). "
        "2. When explaining discrepancies or giving instructions, provide clear, doable step-by-step actions. "
        "3. Keep tone professional, encouraging, and easy to read. "
        "4. Respond directly with your formatted markdown text."
    )

    conversation_text = f"{context_prompt}\n\nCONVERSATION HISTORY:\n"
    for msg in req.messages[-6:]:  # Keep recent history
        conversation_text += f"{msg.role.upper()}: {msg.content}\n"
    conversation_text += f"USER: {req.user_query}\nASSISTANT:"

    last_error = None
    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=conversation_text,
                config={
                    "system_instruction": system_instruction,
                    "temperature": 0.3,
                }
            )
            if response and response.text:
                return AIChatResponse(
                    reply=response.text.strip(),
                    source="gemini"
                )
        except Exception as e:
            err_str = str(e)
            print(f"[GeminiService] Chat error with {model_name}: {err_str}")
            if "API_KEY_INVALID" in err_str or "API key not valid" in err_str or "PERMISSION_DENIED" in err_str:
                raise GeminiAuthenticationError()
            last_error = e
            continue

    # Fallback message
    return AIChatResponse(
        reply=f"Regarding **{req.record.invoice_id}**: Current status is **{req.record.status}** with score **{req.record.score}/100**.",
        source="fallback"
    )

