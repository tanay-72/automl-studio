"""
Generates interactive EDA visualizations as Plotly figure JSON
(plotly.io.to_json) so the React frontend can render them directly with
react-plotly.js without any server-side image rendering.
"""
import json
from typing import Any, Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio

MAX_DISTRIBUTION_COLS = 12  # cap chart count for very wide datasets
MAX_CATEGORIES_IN_BOX = 15


def _fig_to_dict(fig: go.Figure) -> Dict[str, Any]:
    return json.loads(pio.to_json(fig))


def summary_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Per-column descriptive statistics, separated by dtype."""
    numeric_df = df.select_dtypes(include=np.number)
    cat_df = df.select_dtypes(exclude=np.number)

    numeric_summary = {}
    if not numeric_df.empty:
        desc = numeric_df.describe().to_dict()
        for col, stats in desc.items():
            numeric_summary[col] = {k: (None if pd.isna(v) else round(float(v), 4)) for k, v in stats.items()}

    categorical_summary = {}
    for col in cat_df.columns:
        vc = df[col].value_counts(dropna=True).head(10)
        categorical_summary[col] = {
            "unique_values": int(df[col].nunique(dropna=True)),
            "top_values": {str(k): int(v) for k, v in vc.items()},
        }

    return {
        "n_rows": int(len(df)),
        "n_columns": int(len(df.columns)),
        "numeric": numeric_summary,
        "categorical": categorical_summary,
    }


def missing_value_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Bar chart + table of missing value counts/percentages per column."""
    missing_counts = df.isna().sum()
    missing_pct = (df.isna().mean() * 100).round(2)
    table = {
        col: {"missing_count": int(missing_counts[col]), "missing_pct": float(missing_pct[col])}
        for col in df.columns if missing_counts[col] > 0
    }

    cols_with_missing = [c for c in df.columns if missing_counts[c] > 0]
    chart = None
    if cols_with_missing:
        sorted_cols = sorted(cols_with_missing, key=lambda c: missing_pct[c], reverse=True)
        fig = go.Figure(go.Bar(
            x=[missing_pct[c] for c in sorted_cols],
            y=sorted_cols,
            orientation="h",
            marker_color="#6366f1",
        ))
        fig.update_layout(
            title="Missing Values by Column (%)",
            xaxis_title="% Missing",
            yaxis_title="Column",
            margin=dict(l=120, r=20, t=50, b=40),
            height=max(280, 28 * len(sorted_cols)),
        )
        chart = _fig_to_dict(fig)

    return {"table": table, "chart": chart, "total_missing_cells": int(missing_counts.sum())}


def correlation_heatmap(df: pd.DataFrame) -> Dict[str, Any]:
    """Pearson correlation heatmap over numeric columns."""
    numeric_df = df.select_dtypes(include=np.number)
    if numeric_df.shape[1] < 2:
        return None
    corr = numeric_df.corr(numeric_only=True).round(3)
    fig = go.Figure(go.Heatmap(
        z=corr.values,
        x=corr.columns.tolist(),
        y=corr.columns.tolist(),
        colorscale="RdBu",
        zmid=0,
        text=corr.values,
        texttemplate="%{text}",
        hovertemplate="%{x} vs %{y}: %{z}<extra></extra>",
    ))
    fig.update_layout(
        title="Correlation Heatmap (numeric features)",
        margin=dict(l=100, r=20, t=50, b=100),
        height=max(400, 40 * len(corr.columns)),
    )
    return _fig_to_dict(fig)


def distribution_plots(df: pd.DataFrame) -> Dict[str, Any]:
    """Histogram for each numeric column, bar chart for each low-cardinality categorical column."""
    charts: Dict[str, Any] = {}
    numeric_cols = list(df.select_dtypes(include=np.number).columns)[:MAX_DISTRIBUTION_COLS]
    for col in numeric_cols:
        fig = px.histogram(df, x=col, nbins=40, marginal="box", opacity=0.85,
                            color_discrete_sequence=["#6366f1"])
        fig.update_layout(title=f"Distribution of {col}", margin=dict(l=40, r=20, t=50, b=40), height=320)
        charts[col] = _fig_to_dict(fig)

    cat_cols = [c for c in df.select_dtypes(exclude=np.number).columns if df[c].nunique() <= 30]
    for col in cat_cols[:MAX_DISTRIBUTION_COLS]:
        vc = df[col].value_counts(dropna=True).head(20)
        fig = go.Figure(go.Bar(x=vc.index.astype(str), y=vc.values, marker_color="#10b981"))
        fig.update_layout(title=f"Frequency of {col}", margin=dict(l=40, r=20, t=50, b=40), height=320)
        charts[col] = _fig_to_dict(fig)

    return charts


def box_plots(df: pd.DataFrame, target_column: str, task_type: str) -> Dict[str, Any]:
    """Box plots for numeric columns to visualize spread/outliers, grouped by target if classification."""
    charts: Dict[str, Any] = {}
    numeric_cols = [c for c in df.select_dtypes(include=np.number).columns if c != target_column][:MAX_DISTRIBUTION_COLS]

    group_by_target = task_type == "classification" and df[target_column].nunique() <= MAX_CATEGORIES_IN_BOX

    for col in numeric_cols:
        if group_by_target:
            fig = px.box(df, x=target_column, y=col, color=target_column,
                         color_discrete_sequence=px.colors.qualitative.Bold)
            fig.update_layout(title=f"{col} by {target_column}", showlegend=False)
        else:
            fig = go.Figure(go.Box(y=df[col], name=col, marker_color="#f59e0b"))
            fig.update_layout(title=f"Box Plot: {col}")
        fig.update_layout(margin=dict(l=40, r=20, t=50, b=40), height=320)
        charts[col] = _fig_to_dict(fig)

    return charts


def feature_target_relationships(df: pd.DataFrame, target_column: str, task_type: str) -> Dict[str, Any]:
    """
    Scatter plots (numeric feature vs numeric target) for regression, or
    grouped distributions (numeric feature vs class) for classification.
    Also includes a categorical-feature-vs-target view when relevant.
    """
    charts: Dict[str, Any] = {}
    numeric_cols = [c for c in df.select_dtypes(include=np.number).columns if c != target_column][:MAX_DISTRIBUTION_COLS]

    if task_type == "regression":
        for col in numeric_cols:
            fig = px.scatter(df, x=col, y=target_column, opacity=0.6, trendline="ols",
                              color_discrete_sequence=["#6366f1"])
            fig.update_layout(title=f"{col} vs {target_column}", margin=dict(l=40, r=20, t=50, b=40), height=320)
            charts[col] = _fig_to_dict(fig)
    else:
        for col in numeric_cols:
            fig = px.violin(df, x=target_column, y=col, color=target_column, box=True, points=False,
                             color_discrete_sequence=px.colors.qualitative.Bold)
            fig.update_layout(title=f"{col} distribution by {target_column}", showlegend=False,
                               margin=dict(l=40, r=20, t=50, b=40), height=320)
            charts[col] = _fig_to_dict(fig)

    return charts


def class_balance_chart(df: pd.DataFrame, target_column: str) -> Dict[str, Any]:
    """Bar chart showing class distribution - flags imbalance for classification tasks."""
    vc = df[target_column].value_counts(dropna=True)
    fig = go.Figure(go.Bar(x=vc.index.astype(str), y=vc.values, marker_color="#ef4444"))
    fig.update_layout(title=f"Class Balance: {target_column}", margin=dict(l=40, r=20, t=50, b=40), height=320)
    return {
        "chart": _fig_to_dict(fig),
        "counts": {str(k): int(v) for k, v in vc.items()},
        "is_imbalanced": bool((vc.min() / vc.max()) < 0.3) if len(vc) > 1 else False,
    }
