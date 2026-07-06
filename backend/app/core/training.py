"""
Orchestrates the full training workflow for one or more algorithms:

  1. Build a Pipeline(preprocessor -> estimator) per algorithm so the
     exported model is self-contained (raw dataframe in, prediction out).
  2. Either fit with default/user-supplied hyperparameters, or run
     GridSearchCV for tuning.
  3. Evaluate on a held-out test split with task-appropriate metrics.
  4. Extract feature importances where the estimator supports them.
  5. Build comparison visualizations (metric bar chart, ROC curves /
     residual plots, confusion matrices).
"""
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

from app.config import CV_FOLDS, RANDOM_STATE, TEST_SIZE
from app.core.evaluation import classification_metrics, primary_metric_key, regression_metrics
from app.core.model_zoo import get_model_registry
from app.core.preprocessing import build_preprocessor, get_output_feature_names


def _fig_json(fig: go.Figure) -> Dict[str, Any]:
    import json
    return json.loads(pio.to_json(fig))


def prepare_train_test_split(
    df: pd.DataFrame,
    target_column: str,
    numeric_features: List[str],
    categorical_features: List[str],
    task_type: str,
):
    X = df[numeric_features + categorical_features]
    y_raw = df[target_column]

    label_encoder = None
    if task_type == "classification":
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw.astype(str))
    else:
        y = y_raw.values

    stratify = y if task_type == "classification" else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=stratify
    )
    return X_train, X_test, y_train, y_test, label_encoder


def _extract_feature_importance(pipeline: Pipeline, meta: Dict[str, Any]) -> Optional[Dict[str, float]]:
    if not meta["supports_feature_importance"]:
        return None
    estimator = pipeline.named_steps["estimator"]
    preprocessor = pipeline.named_steps["preprocessor"]
    feature_names = get_output_feature_names(preprocessor)
    if not feature_names:
        return None

    attr = meta["importance_attr"]
    if not hasattr(estimator, attr):
        return None
    values = getattr(estimator, attr)
    values = np.ravel(values)
    if len(values) != len(feature_names):
        return None

    importance = {name: float(abs(val)) for name, val in zip(feature_names, values)}
    # Keep the top 20 for readability in the UI
    top = dict(sorted(importance.items(), key=lambda kv: kv[1], reverse=True)[:20])
    return top


def train_single_model(
    model_key: str,
    task_type: str,
    X_train, X_test, y_train, y_test,
    numeric_features: List[str],
    categorical_features: List[str],
    hyperparameters: Optional[Dict[str, Any]] = None,
    tune: bool = False,
) -> Tuple[Pipeline, Dict[str, Any]]:
    registry = get_model_registry(task_type)
    if model_key not in registry:
        raise ValueError(f"Unknown algorithm '{model_key}' for task '{task_type}'")
    meta = registry[model_key]

    start = time.time()
    preprocessor = build_preprocessor(numeric_features, categorical_features)

    best_params = None
    if tune:
        base_estimator = meta["factory"]()
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("estimator", base_estimator)])
        param_grid = {f"estimator__{k}": v for k, v in meta["param_grid"].items()}
        scoring = "f1_weighted" if task_type == "classification" else "r2"
        search = GridSearchCV(pipeline, param_grid=param_grid, cv=CV_FOLDS, scoring=scoring, n_jobs=-1)
        search.fit(X_train, y_train)
        pipeline = search.best_estimator_
        best_params = {k.replace("estimator__", ""): v for k, v in search.best_params_.items()}
    else:
        params = dict(meta["default_params"])
        if hyperparameters:
            params.update(hyperparameters)
        estimator = meta["factory"](**params)
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("estimator", estimator)])
        pipeline.fit(X_train, y_train)

    training_time = time.time() - start

    y_pred = pipeline.predict(X_test)
    y_proba = None
    if task_type == "classification" and hasattr(pipeline, "predict_proba"):
        try:
            y_proba = pipeline.predict_proba(X_test)
        except Exception:
            y_proba = None

    if task_type == "classification":
        metrics = classification_metrics(y_test, y_pred, y_proba)
    else:
        metrics = regression_metrics(y_test, y_pred)

    feature_importance = _extract_feature_importance(pipeline, meta)

    result = {
        "model_key": model_key,
        "display_name": meta["display_name"],
        "metrics": metrics,
        "best_params": best_params,
        "feature_importance": feature_importance,
        "training_time_sec": round(training_time, 3),
        "_y_pred": y_pred,
        "_y_proba": y_proba,
    }
    return pipeline, result


def build_comparison_chart(results: List[Dict[str, Any]], task_type: str) -> Dict[str, Any]:
    """Grouped bar chart comparing every trained model across all computed metrics."""
    metric_keys = list(results[0]["metrics"].keys())
    fig = go.Figure()
    colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
    for i, r in enumerate(results):
        fig.add_trace(go.Bar(
            name=r["display_name"],
            x=metric_keys,
            y=[r["metrics"][m] for m in metric_keys],
            marker_color=colors[i % len(colors)],
        ))
    fig.update_layout(
        barmode="group",
        title="Model Comparison",
        xaxis_title="Metric",
        yaxis_title="Score",
        margin=dict(l=40, r=20, t=50, b=40),
        height=420,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
    )
    return _fig_json(fig)


def build_roc_curves(results: List[Dict[str, Any]], y_test) -> Optional[Dict[str, Any]]:
    """ROC curve overlay for binary classification models that exposed predict_proba."""
    from sklearn.metrics import roc_curve

    fig = go.Figure()
    plotted_any = False
    colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
    for i, r in enumerate(results):
        proba = r.get("_y_proba")
        if proba is None or proba.shape[1] != 2:
            continue
        fpr, tpr, _ = roc_curve(y_test, proba[:, 1])
        fig.add_trace(go.Scatter(x=fpr, y=tpr, mode="lines", name=r["display_name"],
                                  line=dict(color=colors[i % len(colors)])))
        plotted_any = True

    if not plotted_any:
        return None

    fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode="lines", name="Random",
                              line=dict(dash="dash", color="gray")))
    fig.update_layout(title="ROC Curves", xaxis_title="False Positive Rate",
                       yaxis_title="True Positive Rate", height=420, margin=dict(l=40, r=20, t=50, b=40))
    return _fig_json(fig)


def build_residual_plot(results: List[Dict[str, Any]], y_test) -> Optional[Dict[str, Any]]:
    """Predicted-vs-actual scatter for regression models (one trace per model)."""
    fig = go.Figure()
    colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
    for i, r in enumerate(results):
        y_pred = r.get("_y_pred")
        if y_pred is None:
            continue
        fig.add_trace(go.Scatter(x=y_test, y=y_pred, mode="markers", name=r["display_name"],
                                  marker=dict(color=colors[i % len(colors)], opacity=0.6, size=6)))
    lo, hi = float(np.min(y_test)), float(np.max(y_test))
    fig.add_trace(go.Scatter(x=[lo, hi], y=[lo, hi], mode="lines", name="Perfect prediction",
                              line=dict(dash="dash", color="gray")))
    fig.update_layout(title="Predicted vs Actual", xaxis_title="Actual", yaxis_title="Predicted",
                       height=420, margin=dict(l=40, r=20, t=50, b=40))
    return _fig_json(fig)


def build_confusion_matrices(results: List[Dict[str, Any]], y_test, class_labels: List[str]) -> Dict[str, Any]:
    from sklearn.metrics import confusion_matrix

    matrices = {}
    for r in results:
        y_pred = r.get("_y_pred")
        if y_pred is None:
            continue
        cm = confusion_matrix(y_test, y_pred)
        fig = go.Figure(go.Heatmap(
            z=cm, x=class_labels, y=class_labels, colorscale="Blues",
            text=cm, texttemplate="%{text}",
        ))
        fig.update_layout(title=f"Confusion Matrix: {r['display_name']}",
                           xaxis_title="Predicted", yaxis_title="Actual",
                           height=380, margin=dict(l=60, r=20, t=50, b=40))
        matrices[r["model_key"]] = _fig_json(fig)
    return matrices
