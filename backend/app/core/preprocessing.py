"""
Data cleaning + preprocessing.

Design:
- We separate "cleaning" (dataset-level fixes: dropping empty/duplicate
  columns, trimming whitespace, parsing obvious numerics) from
  "preprocessing" (the sklearn ColumnTransformer used inside every model
  pipeline: imputation, encoding, scaling).
- The ColumnTransformer is fit *inside* each model's Pipeline during
  training (not once globally) so that there is zero leakage between
  train/test splits and every model owns a fully reproducible, exportable
  pipeline (cleaning -> preprocessing -> estimator) for the downloadable
  artifact.
"""
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.config import HIGH_MISSING_DROP_THRESHOLD, MAX_CATEGORICAL_CARDINALITY


def clean_dataframe(df: pd.DataFrame, target_column: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Dataset-level cleaning applied once, before train/test split:
      - strip whitespace from string columns and column names
      - coerce numeric-looking object columns to numeric
      - drop fully-empty / constant columns
      - drop columns that are >HIGH_MISSING_DROP_THRESHOLD missing (except target)
      - drop exact duplicate rows
    Returns the cleaned dataframe and a human-readable report.
    """
    report: Dict[str, Any] = {"steps": [], "dropped_columns": []}

    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    # Trim whitespace in object columns and normalize empty strings to NaN
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"": np.nan, "nan": np.nan, "None": np.nan, "NULL": np.nan, "N/A": np.nan})

    # Try to coerce object columns that are "secretly" numeric
    for col in df.select_dtypes(include="object").columns:
        if col == target_column:
            continue
        coerced = pd.to_numeric(df[col], errors="coerce")
        non_null = df[col].notna().sum()
        if non_null > 0 and coerced.notna().sum() / non_null > 0.9:
            df[col] = coerced
            report["steps"].append(f"Coerced column '{col}' to numeric.")

    n_rows = len(df)

    # Drop fully empty columns
    empty_cols = [c for c in df.columns if df[c].isna().all()]
    for c in empty_cols:
        df.drop(columns=c, inplace=True)
        report["dropped_columns"].append(c)
    if empty_cols:
        report["steps"].append(f"Dropped fully-empty columns: {empty_cols}")

    # Drop constant columns (zero variance) except target
    constant_cols = [
        c for c in df.columns
        if c != target_column and df[c].nunique(dropna=True) <= 1
    ]
    for c in constant_cols:
        df.drop(columns=c, inplace=True)
        report["dropped_columns"].append(c)
    if constant_cols:
        report["steps"].append(f"Dropped constant columns: {constant_cols}")

    # Drop columns with excessive missingness (except target)
    high_missing_cols = [
        c for c in df.columns
        if c != target_column and df[c].isna().mean() > HIGH_MISSING_DROP_THRESHOLD
    ]
    for c in high_missing_cols:
        df.drop(columns=c, inplace=True)
        report["dropped_columns"].append(c)
    if high_missing_cols:
        report["steps"].append(
            f"Dropped columns with >{int(HIGH_MISSING_DROP_THRESHOLD * 100)}% missing values: {high_missing_cols}"
        )

    # Drop likely-ID columns (every value unique, looks like an identifier)
    id_like_cols = [
        c for c in df.columns
        if c != target_column
        and df[c].nunique(dropna=True) == n_rows
        and (df[c].dtype == object or "id" in c.lower())
    ]
    for c in id_like_cols:
        df.drop(columns=c, inplace=True)
        report["dropped_columns"].append(c)
    if id_like_cols:
        report["steps"].append(f"Dropped likely identifier columns: {id_like_cols}")

    # Drop high-cardinality categorical columns (too sparse to one-hot encode usefully)
    high_card_cols = [
        c for c in df.select_dtypes(include="object").columns
        if c != target_column and df[c].nunique(dropna=True) > MAX_CATEGORICAL_CARDINALITY
    ]
    for c in high_card_cols:
        df.drop(columns=c, inplace=True)
        report["dropped_columns"].append(c)
    if high_card_cols:
        report["steps"].append(
            f"Dropped high-cardinality categorical columns (> {MAX_CATEGORICAL_CARDINALITY} unique values): {high_card_cols}"
        )

    # Drop exact duplicate rows
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    if before != after:
        report["steps"].append(f"Dropped {before - after} duplicate rows.")

    # Drop rows where target is missing - can't train/evaluate on those
    before = len(df)
    df = df.dropna(subset=[target_column])
    after = len(df)
    if before != after:
        report["steps"].append(f"Dropped {before - after} rows with missing target values.")

    report["final_shape"] = {"rows": len(df), "cols": len(df.columns)}
    return df, report


def split_feature_types(df: pd.DataFrame, target_column: str) -> Tuple[List[str], List[str]]:
    """Split feature columns into numeric vs categorical (excluding target)."""
    features = [c for c in df.columns if c != target_column]
    numeric_features = [c for c in features if pd.api.types.is_numeric_dtype(df[c])]
    categorical_features = [c for c in features if c not in numeric_features]
    return numeric_features, categorical_features


def build_preprocessor(numeric_features: List[str], categorical_features: List[str]) -> ColumnTransformer:
    """
    Build the sklearn ColumnTransformer applying, per feature type:
      - Numeric: median imputation + standard scaling
      - Categorical: most-frequent imputation + one-hot encoding
    This transformer is embedded inside every model Pipeline (fit per training
    run on the train split only) to avoid data leakage.
    """
    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    transformers = []
    if numeric_features:
        transformers.append(("numeric", numeric_pipeline, numeric_features))
    if categorical_features:
        transformers.append(("categorical", categorical_pipeline, categorical_features))

    return ColumnTransformer(transformers=transformers, remainder="drop")


def get_output_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """Best-effort retrieval of feature names after the ColumnTransformer, for feature importance display."""
    try:
        return list(preprocessor.get_feature_names_out())
    except Exception:
        return []
