"""Scoring engine with 4-signal deterministic scoring and margin safety."""

from typing import Any
from models.schemas import ScoreBreakdown
from utils.text import calculate_string_similarity
from utils.amounts import score_amount_match
from utils.dates import score_date_proximity


def calculate_pair_score(
    ref1: str | None,
    ref2: str | None,
    amt1: float | None,
    amt2: float | None,
    name1: str | None,
    name2: str | None,
    date1: Any,
    date2: Any,
) -> tuple[ScoreBreakdown, list[str]]:
    """
    Calculate deterministic multi-signal match score (0 to 100) between two financial records.
    Weights:
    - Reference Match: 40 pts
    - Amount Match: 30 pts
    - Customer Name Similarity: 20 pts
    - Date Proximity: 10 pts
    """
    reasons: list[str] = []

    # 1. Reference Signal (40 max)
    ref_score = 0.0
    r1 = (ref1 or "").strip().lower()
    r2 = (ref2 or "").strip().lower()
    if r1 and r2 and r1 == r2:
        ref_score = 40.0
        reasons.append(f"Exact reference match: '{r1}'")
    elif r1 and r2:
        reasons.append(f"Reference mismatch: '{r1}' vs '{r2}'")
    else:
        reasons.append("Reference missing on one or both records")

    # 2. Amount Signal (30 max)
    amt_score, amt_diff = score_amount_match(amt1, amt2, max_score=30.0)
    if amt_diff is not None:
        if amt_diff <= 0.01:
            reasons.append(f"Amount exact match: {amt1}")
        else:
            reasons.append(f"Amount differs by {amt_diff} (Primary: {amt1}, Target: {amt2})")
    else:
        reasons.append("Amount missing on one or both records")

    # 3. Customer / Description Similarity (20 max)
    cust_sim = calculate_string_similarity(name1 or "", name2 or "")
    if cust_sim >= 90.0:
        cust_score = 20.0
        reasons.append(f"Strong customer name match ({cust_sim:.1f}%): '{name1}' ~ '{name2}'")
    elif cust_sim >= 75.0:
        cust_score = 15.0
        reasons.append(f"Moderate customer name match ({cust_sim:.1f}%): '{name1}' ~ '{name2}'")
    elif cust_sim >= 50.0:
        cust_score = 8.0
        reasons.append(f"Weak customer name similarity ({cust_sim:.1f}%)")
    else:
        cust_score = 0.0
        reasons.append(f"Customer name mismatch ({cust_sim:.1f}%)")

    # 4. Date Proximity (10 max)
    dt_score, day_diff = score_date_proximity(date1, date2, max_score=10.0)
    if day_diff is not None:
        if day_diff == 0:
            reasons.append("Same date transaction")
        elif day_diff <= 3:
            reasons.append(f"Date timing within {day_diff} day(s)")
        elif day_diff <= 7:
            reasons.append(f"Moderate date difference of {day_diff} days")
        else:
            reasons.append(f"Large date difference of {day_diff} days")
    else:
        reasons.append("Date missing on one or both records")

    total = round(ref_score + amt_score + cust_score + dt_score, 2)

    breakdown = ScoreBreakdown(
        reference_score=round(ref_score, 2),
        amount_score=round(amt_score, 2),
        customer_score=round(cust_score, 2),
        date_score=round(dt_score, 2),
        total_score=total,
        score_margin=None,
    )

    return breakdown, reasons
