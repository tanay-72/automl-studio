"""
Endpoints for the first two wizard steps:
  POST /api/dataset/upload         - upload a CSV, get a session + preview
  POST /api/dataset/select-target  - choose target column, run cleaning,
                                      detect task type, split feature types
"""
import io
import os

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_MB
from app.core.preprocessing import clean_dataframe, split_feature_types
from app.core.task_detection import detect_task_type
from app.schemas import TargetSelectRequest, TargetSelectResponse, UploadResponse
from app.storage import store

router = APIRouter(prefix="/api/dataset", tags=["dataset"])


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    raw = await file.read()
    size_mb = len(raw) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit.")

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    if df.empty or df.shape[1] == 0:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty.")

    session_id = store.create_session()
    store.set(session_id, "raw_df", df)
    store.set(session_id, "filename", file.filename, persist=False)

    preview = df.head(10).where(pd.notna(df.head(10)), None).to_dict(orient="records")
    dtypes = {c: str(t) for c, t in df.dtypes.items()}

    return UploadResponse(
        session_id=session_id,
        columns=list(df.columns),
        n_rows=len(df),
        n_cols=len(df.columns),
        preview=preview,
        dtypes=dtypes,
    )


@router.post("/select-target", response_model=TargetSelectResponse)
async def select_target(req: TargetSelectRequest):
    if not store.exists(req.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please re-upload your dataset.")

    df = store.get(req.session_id, "raw_df")
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset found for this session.")

    if req.target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.target_column}' not found in dataset.")

    cleaned_df, cleaning_report = clean_dataframe(df, req.target_column)

    if req.target_column not in cleaned_df.columns:
        raise HTTPException(status_code=400, detail="Target column was dropped during cleaning (too many missing values).")

    if req.task_type and req.task_type != "auto":
        task_type = req.task_type
        diagnostics = {"reason": "User override"}
    else:
        task_type, diagnostics = detect_task_type(cleaned_df[req.target_column])

    numeric_features, categorical_features = split_feature_types(cleaned_df, req.target_column)

    n_classes = None
    class_labels = None
    if task_type == "classification":
        labels = sorted(cleaned_df[req.target_column].astype(str).unique().tolist())
        n_classes = len(labels)
        class_labels = labels

    cleaning_report["task_detection"] = diagnostics

    store.set(req.session_id, "cleaned_df", cleaned_df)
    store.set(req.session_id, "target_column", req.target_column, persist=False)
    store.set(req.session_id, "task_type", task_type, persist=False)
    store.set(req.session_id, "numeric_features", numeric_features, persist=False)
    store.set(req.session_id, "categorical_features", categorical_features, persist=False)

    return TargetSelectResponse(
        session_id=req.session_id,
        task_type=task_type,
        target_column=req.target_column,
        n_classes=n_classes,
        class_labels=class_labels,
        feature_columns=numeric_features + categorical_features,
        numeric_features=numeric_features,
        categorical_features=categorical_features,
        dropped_columns=cleaning_report.get("dropped_columns", []),
        cleaning_report=cleaning_report,
    )
