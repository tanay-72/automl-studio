"""
Heuristics to automatically decide whether a target column implies a
classification or a regression problem.

Rules of thumb applied (in order):
1. Non-numeric dtype (object/bool/category)              -> classification
2. Numeric but very low cardinality relative to row count -> classification
   (e.g. a 0/1 flag stored as int, or a small fixed set of integer codes)
3. Otherwise                                              -> regression
"""
from typing import Tuple

import pandas as pd

from app.config import CLASSIFICATION_MAX_UNIQUE_ABS, CLASSIFICATION_MAX_UNIQUE_RATIO


def detect_task_type(series: pd.Series) -> Tuple[str, dict]:
    """
    Returns (task_type, diagnostics) where task_type in {"classification", "regression"}.
    """
    clean = series.dropna()
    n = len(clean)
    n_unique = clean.nunique()

    diagnostics = {
        "n_rows": n,
        "n_unique": int(n_unique),
        "dtype": str(series.dtype),
    }

    if n == 0:
        raise ValueError("Target column has no non-null values.")

    is_numeric = pd.api.types.is_numeric_dtype(clean) and not pd.api.types.is_bool_dtype(clean)
    is_bool = pd.api.types.is_bool_dtype(clean)

    if not is_numeric or is_bool:
        diagnostics["reason"] = "Non-numeric or boolean target -> classification"
        return "classification", diagnostics

    unique_ratio = n_unique / n
    if n_unique <= CLASSIFICATION_MAX_UNIQUE_ABS or unique_ratio <= CLASSIFICATION_MAX_UNIQUE_RATIO:
        # Extra guard: if values aren't integer-like (e.g. continuous floats with
        # low cardinality due to a small sample), still prefer regression.
        looks_discrete = (clean % 1 == 0).mean() > 0.99
        if looks_discrete:
            diagnostics["reason"] = (
                f"Numeric but low cardinality ({n_unique} unique, ratio={unique_ratio:.3f}) "
                f"and integer-like -> classification"
            )
            return "classification", diagnostics

    diagnostics["reason"] = "Numeric, continuous/high-cardinality -> regression"
    return "regression", diagnostics
