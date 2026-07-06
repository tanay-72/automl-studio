"""
GET  /api/predict/schema/{session_id} - input field metadata for building a
                                          dynamic prediction form
POST /api/predict                     - run a trained model on user-supplied
                                          feature values
"""
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.schemas import PredictRequest, PredictResponse
from app.storage import store

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.get("/schema/{session_id}")
async def get_prediction_schema(session_id: str):
    if not store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    df = store.get(session_id, "cleaned_df")
    numeric_features = store.get(session_id, "numeric_features")
    categorical_features = store.get(session_id, "categorical_features")
    trained_algorithms = store.get(session_id, "trained_algorithms")

    if df is None:
        raise HTTPException(status_code=400, detail="Select a target column first.")
    if not trained_algorithms:
        raise HTTPException(status_code=400, detail="Train at least one model before predicting.")

    fields = []
    for col in numeric_features:
        series = df[col].dropna()
        fields.append({
            "name": col,
            "type": "numeric",
            "min": float(series.min()) if not series.empty else 0,
            "max": float(series.max()) if not series.empty else 0,
            "mean": float(series.mean()) if not series.empty else 0,
        })
    for col in categorical_features:
        options = sorted(df[col].dropna().astype(str).unique().tolist())
        fields.append({"name": col, "type": "categorical", "options": options})

    return {
        "fields": fields,
        "available_models": trained_algorithms,
    }


@router.post("", response_model=PredictResponse)
async def predict(req: PredictRequest):
    if not store.exists(req.session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    pipeline = store.get(req.session_id, f"model_{req.model_key}")
    if pipeline is None:
        raise HTTPException(status_code=404, detail=f"Model '{req.model_key}' has not been trained for this session.")

    numeric_features = store.get(req.session_id, "numeric_features")
    categorical_features = store.get(req.session_id, "categorical_features")
    task_type = store.get(req.session_id, "task_type")
    label_encoder = store.get(req.session_id, "label_encoder")

    row = {}
    for col in numeric_features:
        val = req.inputs.get(col)
        row[col] = float(val) if val is not None and val != "" else np.nan
    for col in categorical_features:
        val = req.inputs.get(col)
        row[col] = str(val) if val is not None and val != "" else np.nan

    input_df = pd.DataFrame([row], columns=numeric_features + categorical_features)

    try:
        raw_pred = pipeline.predict(input_df)[0]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {exc}")

    probability = None
    if task_type == "classification":
        prediction = label_encoder.inverse_transform([int(raw_pred)])[0] if label_encoder is not None else str(raw_pred)
        if hasattr(pipeline, "predict_proba"):
            try:
                proba = pipeline.predict_proba(input_df)[0]
                classes = label_encoder.classes_ if label_encoder is not None else range(len(proba))
                probability = {str(cls): float(p) for cls, p in zip(classes, proba)}
            except Exception:
                probability = None
    else:
        prediction = float(raw_pred)

    return PredictResponse(prediction=prediction, probability=probability)
