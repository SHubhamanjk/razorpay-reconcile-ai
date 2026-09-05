"""Duplicate detection service for identifying redundant records and references."""

import pandas as pd


def find_duplicate_references(df: pd.DataFrame, ref_col: str = "reference_normalized") -> set[str]:
    """Find references that appear multiple times in the dataset (excluding empty references)."""
    valid_refs = df[df[ref_col] != ""][ref_col]
    dup_series = valid_refs[valid_refs.duplicated(keep=False)]
    return set(dup_series.unique())


def find_duplicate_transactions(
    df: pd.DataFrame,
    id_col: str = "transaction_id_clean",
    amount_col: str = "amount_normalized",
    date_col: str = "date_normalized",
    ref_col: str = "reference_normalized",
) -> dict[str, list[str]]:
    """
    Find duplicate transaction clusters where reference or (amount + date) are identical.
    Returns a mapping: record_id -> list of other duplicate record_ids.
    """
    duplicates_map: dict[str, list[str]] = {}

    # Group by non-empty reference
    ref_groups = df[df[ref_col] != ""].groupby(ref_col)[id_col].apply(list)
    for ref, id_list in ref_groups.items():
        if len(id_list) > 1:
            for rec_id in id_list:
                duplicates_map[rec_id] = [other for other in id_list if other != rec_id]

    # Group by exact amount + date where reference is empty
    empty_ref_df = df[df[ref_col] == ""]
    if not empty_ref_df.empty:
        amt_date_groups = empty_ref_df.groupby([amount_col, date_col])[id_col].apply(list)
        for _, id_list in amt_date_groups.items():
            if len(id_list) > 1:
                for rec_id in id_list:
                    if rec_id not in duplicates_map:
                        duplicates_map[rec_id] = [other for other in id_list if other != rec_id]
                    else:
                        for other in id_list:
                            if other != rec_id and other not in duplicates_map[rec_id]:
                                duplicates_map[rec_id].append(other)

    return duplicates_map
