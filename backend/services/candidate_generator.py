"""Candidate generation service for indexing and fast pre-filtering of potential matches."""

from typing import Any
import pandas as pd
from utils.amounts import is_amount_within_tolerance
from utils.text import calculate_string_similarity


class TargetIndex:
    """In-memory index over target dataset for fast candidate lookups."""

    def __init__(self, df: pd.DataFrame, id_col: str):
        self.df = df
        self.id_col = id_col
        self.records = df.to_dict(orient="records")
        
        # Build reference map: reference_normalized -> list of row indices
        self.ref_index: dict[str, list[int]] = {}
        for idx, row in enumerate(self.records):
            ref = str(row.get("reference_normalized", "")).strip()
            if ref:
                self.ref_index.setdefault(ref, []).append(idx)

    def find_candidates(
        self,
        ref: str | None,
        amount: float | None,
        customer_name: str | None,
        max_candidates: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Generate candidate matches using optimized pre-filtering:
        1. Exact reference matches (instant O(1))
        2. Fast numeric amount filter (tight <= 2% first, then <= 5%)
        """
        candidate_indices: set[int] = set()

        # 1. Exact Reference Match (Instant O(1))
        clean_ref = (ref or "").strip().lower()
        if clean_ref and clean_ref in self.ref_index:
            for idx in self.ref_index[clean_ref]:
                candidate_indices.add(idx)

        # 2. Fast numeric amount scan (tight window first)
        if amount is not None:
            # Pass 1: exact and tight amounts (<= 2%)
            for idx, row in enumerate(self.records):
                if idx in candidate_indices:
                    continue

                tgt_amt = row.get("amount_normalized")
                if tgt_amt is None:
                    continue

                if is_amount_within_tolerance(amount, tgt_amt, tolerance_pct=2.0):
                    tgt_name = row.get("customer_normalized", "")
                    if customer_name and tgt_name:
                        name_sim = calculate_string_similarity(customer_name, tgt_name)
                        if name_sim >= 40.0:
                            candidate_indices.add(idx)
                    else:
                        candidate_indices.add(idx)

                if len(candidate_indices) >= max_candidates:
                    break

            # Pass 2: wider window (<= 5%) only if no candidates found yet
            if len(candidate_indices) == 0:
                for idx, row in enumerate(self.records):
                    if idx in candidate_indices:
                        continue

                    tgt_amt = row.get("amount_normalized")
                    if tgt_amt is None:
                        continue

                    if is_amount_within_tolerance(amount, tgt_amt, tolerance_pct=5.0):
                        tgt_name = row.get("customer_normalized", "")
                        if customer_name and tgt_name:
                            name_sim = calculate_string_similarity(customer_name, tgt_name)
                            if name_sim >= 40.0:
                                candidate_indices.add(idx)
                        else:
                            candidate_indices.add(idx)

                    if len(candidate_indices) >= max_candidates:
                        break

        return [self.records[i] for i in list(candidate_indices)]
