"""Text normalization and string similarity utilities."""

import re
import unicodedata
from functools import lru_cache

try:
    from rapidfuzz import fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    import difflib
    RAPIDFUZZ_AVAILABLE = False


COMPANY_SUFFIX_EXPANSIONS = {
    r"\bpvt\b": "private",
    r"\bpvt\.\b": "private",
    r"\bltd\b": "limited",
    r"\bltd\.\b": "limited",
    r"\binc\b": "incorporated",
    r"\binc\.\b": "incorporated",
    r"\bcorp\b": "corporation",
    r"\bcorp\.\b": "corporation",
    r"\bco\b": "company",
    r"\bco\.\b": "company",
    r"\bllc\b": "limited liability company",
    r"\bllp\b": "limited liability partnership",
    r"\btech\b": "technologies",
    r"\btechno\b": "technologies",
    r"\bsols\b": "solutions",
    r"\bsol\b": "solutions",
    r"\bintl\b": "international",
    r"\bmfg\b": "manufacturing",
    r"\bsys\b": "systems",
    r"\bsyst\b": "systems",
    r"\bsvc\b": "services",
    r"\bsvcs\b": "services",
    r"\bserv\b": "services",
    r"\bmgmt\b": "management",
    r"\bengg\b": "engineering",
    r"\bfin\b": "finance",
}


def normalize_text(text: str | None) -> str:
    """Strip unicode accents, lowercase, and collapse multiple whitespaces."""
    if text is None:
        return ""
    text = str(text).strip()
    if not text or text.lower() == "nan" or text.lower() == "none":
        return ""
    # Normalize unicode (NFKD) and strip accents
    normalized = unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8")
    normalized = normalized.lower()
    # Replace non-alphanumeric (except spaces) with space
    normalized = re.sub(r"[^\w\s]", " ", normalized)
    # Collapse whitespaces
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def normalize_name(name: str | None) -> str:
    """
    Normalize customer or company name:
    - Lowercase, strip accents & punctuation
    - Expand common business abbreviations (Pvt, Ltd, Inc, Corp, Mfg, Tech, etc.)
    - Remove extra whitespace
    """
    if name is None:
        return ""
    text = str(name).strip().lower()
    if not text or text == "nan" or text == "none":
        return ""

    # Remove standard punctuation like periods, commas, dashes
    text = re.sub(r"[,;:\'\"()\-]", " ", text)

    # Expand known suffixes using word boundaries
    for pattern, expansion in COMPANY_SUFFIX_EXPANSIONS.items():
        text = re.sub(pattern, expansion, text)

    # Normalize unicode and clean up any remaining symbols
    clean = normalize_text(text)
    return clean


def normalize_reference(ref: str | None) -> str:
    """
    Normalize reference code:
    - Lowercase and trim
    - Strip hyphens, underscores, slashes, and spaces
    - Example: 'REF-001/A' -> 'ref001a'
    """
    if ref is None:
        return ""
    text = str(ref).strip().lower()
    if not text or text == "nan" or text == "none" or text == "null":
        return ""
    # Keep only alphanumeric characters
    cleaned = re.sub(r"[^a-z0-9]", "", text)
    return cleaned


@lru_cache(maxsize=8192)
def calculate_string_similarity(str1: str, str2: str) -> float:
    """
    Calculate similarity percentage [0.0, 100.0] between two strings with LRU caching.
    Uses RapidFuzz token_sort_ratio and token_set_ratio if available, or difflib SequenceMatcher as fallback.
    """
    s1 = normalize_text(str1)
    s2 = normalize_text(str2)
    
    if not s1 and not s2:
        return 100.0
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 100.0

    if RAPIDFUZZ_AVAILABLE:
        # token_sort_ratio handles word order differences
        # token_set_ratio handles subsets (e.g. 'Horizon Media' in 'Horizon Media Works Settlement')
        sort_score = fuzz.token_sort_ratio(s1, s2)
        set_score = fuzz.token_set_ratio(s1, s2)
        partial_score = fuzz.partial_ratio(s1, s2)
        return float(max(sort_score, set_score, partial_score))
    else:
        # Fallback using difflib
        matcher = difflib.SequenceMatcher(None, s1, s2)
        score = matcher.ratio() * 100.0
        words1 = set(s1.split())
        words2 = set(s2.split())
        if words1 and words2:
            intersection = len(words1 & words2)
            subset_ratio = (intersection / min(len(words1), len(words2))) * 100.0
            jaccard = (intersection / len(words1 | words2)) * 100.0
            return float(max(score, subset_ratio, jaccard))
        return float(score)
