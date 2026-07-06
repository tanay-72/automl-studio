"""
GET  /api/train/algorithms/{session_id} - list algorithms available for the
                                            detected task, with tunable params
POST /api/train                          - train one or more selected
                                            algorithms and return comparison
                                            metrics + charts
"""
from fastapi import APIRouter, HTTPException

from app.core.evaluation import primary_metric_key
from app.core.model_zoo import list_available_algorithms
from app.core.training import (
    build_comparison_chart,
    build_confusion_matrices,
    build_residual_plot,
    build_roc_curves,
    prepare_train_test_split,
    train_single_model,
)
from app.schemas import AvailableAlgorithmsResponse, ModelResult, TrainRequest, TrainResponse
from app.storage import store

router = APIRouter(prefix="/api/train", tags=["train"])


@router.get("/algorithms/{session_id}", response_model=AvailableAlgorithmsResponse)
async def get_available_algorithms(session_id: str):
    task_type = store.get(session_id, "task_type")
    if task_type is None:
        raise HTTPException(status_code=400, detail="Select a target column first.")
    return AvailableAlgorithmsResponse(task_type=task_type, algorithms=list_available_algorithms(task_type))


@router.post("", response_model=TrainResponse)
async def train_models(req: TrainRequest):
    session_id = req.session_id
    if not store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    df = store.get(session_id, "cleaned_df")
    target_column = store.get(session_id, "target_column")
    task_type = store.get(session_id, "task_type")
    numeric_features = store.get(session_id, "numeric_features")
    categorical_features = store.get(session_id, "categorical_features")

    if df is None or target_column is None:
        raise HTTPException(status_code=400, detail="Select a target column before training.")
    if not req.algorithms:
        raise HTTPException(status_code=400, detail="Select at least one algorithm to train.")

    X_train, X_test, y_train, y_test, label_encoder = prepare_train_test_split(
        df, target_column, numeric_features, categorical_features, task_type
    )

    class_labels = list(label_encoder.classes_) if label_encoder is not None else None

    results = []
    pipelines = {}
    for model_key in req.algorithms:
        hp = (req.hyperparameters or {}).get(model_key)
        pipeline, result = train_single_model(
            model_key=model_key,
            task_type=task_type,
            X_train=X_train, X_test=X_test, y_train=y_train, y_test=y_test,
            numeric_features=numeric_features,
            categorical_features=categorical_features,
            hyperparameters=hp,
            tune=req.tune_hyperparameters,
        )
        results.append(result)
        pipelines[model_key] = pipeline
        # Persist each fitted pipeline so it can be used for prediction/download later
        store.set(session_id, f"model_{model_key}", pipeline)

    # Persist test split + label encoder for confusion matrices / ROC reuse if needed later
    store.set(session_id, "y_test", y_test, persist=False)
    store.set(session_id, "label_encoder", label_encoder)
    store.set(session_id, "trained_algorithms", req.algorithms, persist=False)

    metric_key = primary_metric_key(task_type)
    best_result = max(results, key=lambda r: r["metrics"].get(metric_key, float("-inf")))

    comparison_chart = build_comparison_chart(results, task_type)

    roc_or_residual_chart = None
    confusion_matrices = None
    if task_type == "classification":
        roc_or_residual_chart = build_roc_curves(results, y_test)
        confusion_matrices = build_confusion_matrices(results, y_test, class_labels)
    else:
        roc_or_residual_chart = build_residual_plot(results, y_test)

    # Strip internal-only fields before returning
    clean_results = [
        ModelResult(
            model_key=r["model_key"],
            display_name=r["display_name"],
            metrics=r["metrics"],
            best_params=r["best_params"],
            feature_importance=r["feature_importance"],
            training_time_sec=r["training_time_sec"],
        )
        for r in results
    ]

    return TrainResponse(
        session_id=session_id,
        task_type=task_type,
        results=clean_results,
        comparison_chart=comparison_chart,
        roc_or_residual_chart=roc_or_residual_chart,
        confusion_matrices=confusion_matrices,
        best_model_key=best_result["model_key"],
    )
