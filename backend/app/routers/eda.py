"""
GET /api/eda/{session_id} - generates every chart/table for the EDA dashboard.
"""
from fastapi import APIRouter, HTTPException

from app.core import eda_plots
from app.schemas import EDAResponse
from app.storage import store

router = APIRouter(prefix="/api/eda", tags=["eda"])


@router.get("/{session_id}", response_model=EDAResponse)
async def get_eda(session_id: str):
    if not store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    df = store.get(session_id, "cleaned_df")
    target_column = store.get(session_id, "target_column")
    task_type = store.get(session_id, "task_type")

    if df is None or target_column is None:
        raise HTTPException(status_code=400, detail="Select a target column before requesting EDA.")

    class_balance = None
    if task_type == "classification":
        class_balance = eda_plots.class_balance_chart(df, target_column)

    return EDAResponse(
        session_id=session_id,
        summary_stats=eda_plots.summary_statistics(df),
        missing_value_report=eda_plots.missing_value_report(df),
        correlation_heatmap=eda_plots.correlation_heatmap(df),
        distributions=eda_plots.distribution_plots(df),
        box_plots=eda_plots.box_plots(df, target_column, task_type),
        feature_target_relationships=eda_plots.feature_target_relationships(df, target_column, task_type),
        class_balance=class_balance,
    )
