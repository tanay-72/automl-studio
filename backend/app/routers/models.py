"""
GET /api/models/download/{session_id}/{model_key} - download a trained
    pipeline (preprocessing + estimator bundled together) as a .joblib file
    that can be loaded directly with `joblib.load(...)` and called with
    `.predict(dataframe)` on raw, uncleaned feature columns.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.storage import store

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/download/{session_id}/{model_key}")
async def download_model(session_id: str, model_key: str):
    if not store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    path = store.model_path(session_id, model_key)
    import os
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Model '{model_key}' has not been trained for this session.")

    filename = f"{model_key}_pipeline.joblib"
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


@router.get("/list/{session_id}")
async def list_trained_models(session_id: str):
    trained_algorithms = store.get(session_id, "trained_algorithms") or []
    return {"trained_models": trained_algorithms}
