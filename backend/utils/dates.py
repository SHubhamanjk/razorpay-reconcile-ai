"""Date parsing, normalization, and proximity scoring utilities."""

import datetime
from typing import Any
import pandas as pd


DATE_FORMATS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%m-%d-%Y",
    "%m/%d/%Y",
    "%Y-%m-%d %H:%M:%S",
    "%Y/%m/%d %H:%M:%S",
    "%d-%m-%Y %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
    "%d-%b-%Y",  # 20-Aug-2026
    "%d %b %Y",  # 20 Aug 2026
    "%b %d, %Y", # Aug 20, 2026
    "%B %d, %Y", # August 20, 2026
]


def normalize_date(val: Any) -> datetime.date | None:
    """
    Parse any date representation (string, datetime, date, pandas Timestamp)
    into a standard Python datetime.date object.
    Returns None if parsing fails.
    """
    if val is None or pd.isna(val):
        return None

    if isinstance(val, datetime.datetime):
        return val.date()

    if isinstance(val, datetime.date):
        return val

    text = str(val).strip()
    if not text or text.lower() in ("nan", "none", "nat", "null", ""):
        return None

    # Try explicit fast formats
    for fmt in DATE_FORMATS:
        try:
            return datetime.datetime.strptime(text, fmt).date()
        except (ValueError, TypeError):
            pass

    # Try pandas to_datetime as broad fallback
    try:
        ts = pd.to_datetime(text, errors="coerce")
        if pd.notna(ts):
            return ts.date()
    except Exception:
        pass

    return None


def calculate_date_difference_days(d1: datetime.date | None, d2: datetime.date | None) -> int | None:
    """Calculate absolute difference in days between two dates."""
    if d1 is None or d2 is None:
        return None
    return abs((d1 - d2).days)


def score_date_proximity(d1: datetime.date | None, d2: datetime.date | None, max_score: float = 10.0) -> tuple[float, int | None]:
    """
    Score date proximity out of max_score:
    - 0 to 3 days difference: 100% (max_score)
    - 4 to 7 days difference: 50% (0.5 * max_score)
    - 8 to 14 days difference: 20% (0.2 * max_score)
    - > 14 days or missing: 0%
    Returns (score, day_difference)
    """
    diff = calculate_date_difference_days(d1, d2)
    if diff is None:
        return 0.0, None

    if diff <= 3:
        return max_score, diff
    elif diff <= 7:
        return max_score * 0.5, diff
    elif diff <= 14:
        return max_score * 0.2, diff
    else:
        return 0.0, diff
