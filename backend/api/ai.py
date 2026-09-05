"""AI Financial Analysis & Chat API Routes."""

from fastapi import APIRouter, HTTPException, status
from models.schemas import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    AIChatRequest,
    AIChatResponse,
)
from services.gemini_service import (
    analyze_record_with_ai,
    chat_with_reconciliation_ai,
    is_gemini_configured,
    GeminiNotConfiguredError,
    GeminiAuthenticationError,
)

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


@router.get(
    "/status",
    summary="Check if Gemini AI API key is configured",
)
def check_ai_status():
    """
    Returns whether Google Gemini API key is configured in backend environment.
    """
    configured = is_gemini_configured()
    return {
        "configured": configured,
        "message": (
            "Google Gemini AI Copilot is configured and operational."
            if configured
            else "Google Gemini API key is not configured. Please add GEMINI_API_KEY in backend/.env to use AI features."
        ),
    }


@router.post(
    "/analyze-record",
    response_model=AIAnalysisResponse,
    summary="Analyze Unreconciled Record with Gemini AI",
)
def analyze_record(req: AIAnalysisRequest):
    """
    Analyzes an unreconciled record across 3 data streams using Google Gemini.
    Returns root-cause diagnosis, actionable findings, and a 1-click remediation action.
    """
    try:
        return analyze_record_with_ai(req)
    except GeminiNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except GeminiAuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Analysis error: {str(e)}",
        )


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="Interactive Multi-Turn Chat with Gemini on Record Context",
)
def chat_with_gemini(req: AIChatRequest):
    """
    Conversational assistant for reconciliation operations with full context of the investigated record.
    """
    try:
        return chat_with_reconciliation_ai(req)
    except GeminiNotConfiguredError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except GeminiAuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Chat error: {str(e)}",
        )
