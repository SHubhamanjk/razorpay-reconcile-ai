"""Amount parsing, normalization, and monetary comparison utilities."""

import re
from typing import Any
import pandas as pd


def normalize_amount(val: Any) -> float | None:
    """
    Parse monetary amount from string, float, integer, or pandas value:
    - Strips currency symbols (₹, $, €, £, ¥, etc.)
    - Removes thousand commas and spaces
    - Handles accounting negative format '(1000.00)' -> -1000.00
    - Rounds to 2 decimal places
    Returns None if parsing fails.
    """
    if val is None or pd.isna(val):
        return None

    if isinstance(val, (int, float)):
        return round(float(val), 2)

    text = str(val).strip()
    if not text or text.lower() in ("nan", "none", "null", ""):
        return None

    is_negative = False
    # Check accounting parentheses: (25000.00)
    if text.startswith("(") and text.endswith(")"):
        is_negative = True
        text = text[1:-1].strip()
    elif text.startswith("-"):
        is_negative = True
        text = text[1:].strip()

    # Remove all currency symbols, commas, spaces
    cleaned = re.sub(r"[^\d.]", "", text)
    if not cleaned:
        return None

    try:
        amount = float(cleaned)
        if is_negative:
            amount = -amount
        return round(amount, 2)
    except ValueError:
        return None


def score_amount_match(amt1: float | None, amt2: float | None, max_score: float = 30.0) -> tuple[float, float | None]:
    """
    Compare two amounts and score similarity:
    - Exact match (within 0.01 tolerance): 100% of max_score
    - Within 1% difference (e.g. minor fee or rounding): 80% of max_score
    - Within 5% difference: 40% of max_score
    - Difference > 5% or missing: 0
    Returns (score, absolute_difference)
    """
    if amt1 is None or amt2 is None:
        return 0.0, None

    diff = abs(amt1 - amt2)
    if diff <= 0.01:
        return max_score, round(diff, 2)

    base = max(abs(amt1), abs(amt2), 1.0)
    percentage_diff = (diff / base) * 100.0

    if percentage_diff <= 1.0:
        return max_score * 0.8, round(diff, 2)
    elif percentage_diff <= 5.0:
        return max_score * 0.4, round(diff, 2)
    else:
        return 0.0, round(diff, 2)


def is_amount_within_tolerance(amt1: float | None, amt2: float | None, tolerance_pct: float = 5.0) -> bool:
    """Check if two amounts are within a given percentage tolerance."""
    if amt1 is None or amt2 is None:
        return False
    diff = abs(amt1 - amt2)
    if diff <= 0.01:
        return True
    base = max(abs(amt1), abs(amt2), 1.0)
    return (diff / base) * 100.0 <= tolerance_pct
