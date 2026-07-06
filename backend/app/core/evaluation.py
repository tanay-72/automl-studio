"""
Metric computation helpers, kept separate from training so they can be
unit-tested independently and reused for both single-model evaluation and
multi-model comparison charts.
"""
from typing import Any, Dict

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)


def classification_metrics(y_true, y_pred, y_proba=None) -> Dict[str, float]:
    is_binary = len(np.unique(y_true)) == 2
    average = "binary" if is_binary else "macro"

    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average=average, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average=average, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average=average, zero_division=0)),
    }

    if y_proba is not None:
        try:
            if is_binary:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba[:, 1]))
            else:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro"))
        except Exception:
            pass  # ROC-AUC can fail for degenerate cases (e.g. single class predicted)

    return metrics


def regression_metrics(y_true, y_pred) -> Dict[str, float]:
    mse = mean_squared_error(y_true, y_pred)
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "mse": float(mse),
        "rmse": float(np.sqrt(mse)),
        "r2_score": float(r2_score(y_true, y_pred)),
    }


def primary_metric_key(task_type: str) -> str:
    """The single metric used to rank models and pick the 'best' one."""
    return "f1_score" if task_type == "classification" else "r2_score"


def higher_is_better(task_type: str) -> bool:
    return True  # both f1_score and r2_score are "higher is better"
