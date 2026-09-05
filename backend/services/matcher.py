"""Matcher orchestration for finding the best target candidate with ambiguity checks."""

from dataclasses import dataclass, field
from typing import Any
from models.enums import MatchType
from models.schemas import ScoreBreakdown
from services.candidate_generator import TargetIndex
from services.scorer import calculate_pair_score


@dataclass
class MatchCandidateResult:
    target_id: str | None = None
    target_record: dict[str, Any] | None = None
    score: float = 0.0
    score_breakdown: ScoreBreakdown | None = None
    score_margin: float | None = None
    match_type: MatchType = MatchType.UNMATCHED
    is_ambiguous: bool = False
    reasons: list[str] = field(default_factory=list)
    all_scored_candidates: list[tuple[float, str]] = field(default_factory=list)


def find_best_match(
    primary_row: dict[str, Any],
    target_index: TargetIndex,
    target_id_col: str,
    high_confidence_threshold: float = 85.0,
    medium_confidence_threshold: float = 48.0,
    min_margin_threshold: float = 10.0,
) -> MatchCandidateResult:
    """
    Find best match for a primary record among target records.
    Applies multi-signal rules and margin safety:
    - If exact reference match and amount matches: EXACT_REFERENCE (highest priority)
    - If exact amount + high customer match + date proximity: HIGH_CONFIDENCE_MULTI_SIGNAL
    - If genuine ambiguity (multiple exact amounts with close scores): MANUAL_REVIEW_NEEDED
    - If moderate fuzzy match: MEDIUM_CONFIDENCE_FUZZY
    - If low score (< 48): UNMATCHED
    """
    ref = primary_row.get("reference_normalized")
    amt = primary_row.get("amount_normalized")
    name = primary_row.get("customer_normalized")
    date_val = primary_row.get("date_normalized")

    candidates = target_index.find_candidates(ref=ref, amount=amt, customer_name=name)

    if not candidates:
        return MatchCandidateResult(
            match_type=MatchType.UNMATCHED,
            reasons=["No viable candidate found matching reference, amount, or name"],
        )

    scored_candidates = []
    for cand in candidates:
        cand_ref = cand.get("reference_normalized")
        cand_amt = cand.get("amount_normalized")
        cand_name = cand.get("customer_normalized")
        cand_date = cand.get("date_normalized")
        cand_id = str(cand.get(f"{target_id_col}_clean", cand.get(target_id_col, "")))

        breakdown, reasons = calculate_pair_score(
            ref1=ref,
            ref2=cand_ref,
            amt1=amt,
            amt2=cand_amt,
            name1=name,
            name2=cand_name,
            date1=date_val,
            date2=cand_date,
        )
        scored_candidates.append({
            "target_id": cand_id,
            "record": cand,
            "score": breakdown.total_score,
            "breakdown": breakdown,
            "reasons": reasons,
        })

    # Sort descending by score
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)

    top = scored_candidates[0]
    top_score = top["score"]
    second = scored_candidates[1] if len(scored_candidates) > 1 else None
    second_score = second["score"] if second else 0.0
    margin = round(top_score - second_score, 2) if second else None

    if top["breakdown"] is not None:
        top["breakdown"].score_margin = margin

    all_scored = [(c["score"], c["target_id"]) for c in scored_candidates]

    # Rule 1: Exact reference match with valid amount match (exact or within 5%)
    if top["breakdown"].reference_score >= 40.0 and top["breakdown"].amount_score >= 12.0:
        return MatchCandidateResult(
            target_id=top["target_id"],
            target_record=top["record"],
            score=top_score,
            score_breakdown=top["breakdown"],
            score_margin=margin,
            match_type=MatchType.EXACT_REFERENCE,
            is_ambiguous=False,
            reasons=top["reasons"],
            all_scored_candidates=all_scored,
        )

    # Rule 2: Ambiguity detection ONLY when both candidates have identical amount accuracy
    # If top candidate is exact amount (30.0) and second is NOT exact amount (<30.0), it is NOT ambiguous.
    is_ambiguous = False
    if second is not None and top_score >= 50.0 and margin is not None and margin < min_margin_threshold:
        top_amt_exact = (top["breakdown"].amount_score >= 30.0)
        second_amt_exact = (second["breakdown"].amount_score >= 30.0)

        # Ambiguity only if second candidate is also an exact amount match (or both are inexact)
        if (top_amt_exact and second_amt_exact) or (not top_amt_exact and not second_amt_exact):
            is_ambiguous = True
            return MatchCandidateResult(
                target_id=top["target_id"],
                target_record=top["record"],
                score=top_score,
                score_breakdown=top["breakdown"],
                score_margin=margin,
                match_type=MatchType.MANUAL_REVIEW_NEEDED,
                is_ambiguous=True,
                reasons=top["reasons"] + [f"Ambiguous match: margin between top candidates is only {margin} points ({top_score} vs {second_score})"],
                all_scored_candidates=all_scored,
            )

    # Rule 3: High confidence multi-signal match
    if (top_score >= high_confidence_threshold and (margin is None or margin >= min_margin_threshold)) or \
       (top["breakdown"].amount_score >= 30.0 and top["breakdown"].customer_score >= 15.0 and top["breakdown"].date_score >= 5.0 and not is_ambiguous):
        return MatchCandidateResult(
            target_id=top["target_id"],
            target_record=top["record"],
            score=top_score,
            score_breakdown=top["breakdown"],
            score_margin=margin,
            match_type=MatchType.HIGH_CONFIDENCE_MULTI_SIGNAL,
            is_ambiguous=False,
            reasons=top["reasons"],
            all_scored_candidates=all_scored,
        )

    # Rule 4: Medium confidence fuzzy match
    if top_score >= medium_confidence_threshold:
        return MatchCandidateResult(
            target_id=top["target_id"],
            target_record=top["record"],
            score=top_score,
            score_breakdown=top["breakdown"],
            score_margin=margin,
            match_type=MatchType.MEDIUM_CONFIDENCE_FUZZY,
            is_ambiguous=False,
            reasons=top["reasons"],
            all_scored_candidates=all_scored,
        )

    # Rule 5: Unmatched / Low score
    return MatchCandidateResult(
        target_id=None,
        target_record=None,
        score=top_score,
        score_breakdown=top["breakdown"],
        score_margin=margin,
        match_type=MatchType.UNMATCHED,
        is_ambiguous=False,
        reasons=top["reasons"] + [f"Score {top_score} is below threshold {medium_confidence_threshold}"],
        all_scored_candidates=all_scored,
    )
