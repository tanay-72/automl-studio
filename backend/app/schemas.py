"""
Pydantic schemas for request/response validation.
Keeping these separate from route logic keeps the API contract explicit
and self-documenting (visible automatically in /docs).
"""
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    session_id: str
    columns: List[str]
    n_rows: int
    n_cols: int
    preview: List[Dict[str, Any]]
    dtypes: Dict[str, str]


class TargetSelectRequest(BaseModel):
    session_id: str
    target_column: str
    # Optional manual override; "auto" lets the backend decide.
    task_type: Optional[str] = Field(default="auto", pattern="^(auto|classification|regression)$")


class TargetSelectResponse(BaseModel):
    session_id: str
    task_type: str
    target_column: str
    n_classes: Optional[int] = None
    class_labels: Optional[List[str]] = None
    feature_columns: List[str]
    numeric_features: List[str]
    categorical_features: List[str]
    dropped_columns: List[str]
    cleaning_report: Dict[str, Any]


class EDAResponse(BaseModel):
    session_id: str
    summary_stats: Dict[str, Any]
    missing_value_report: Dict[str, Any]
    correlation_heatmap: Optional[Dict[str, Any]] = None
    distributions: Dict[str, Any]
    box_plots: Dict[str, Any]
    feature_target_relationships: Dict[str, Any]
    class_balance: Optional[Dict[str, Any]] = None


class TrainRequest(BaseModel):
    session_id: str
    # algorithm keys, e.g. ["logistic_regression", "random_forest"]
    algorithms: List[str]
    # optional per-algorithm hyperparameter overrides
    hyperparameters: Optional[Dict[str, Dict[str, Any]]] = None
    # whether to run grid-search tuning instead of using provided/default params
    tune_hyperparameters: bool = False


class ModelResult(BaseModel):
    model_key: str
    display_name: str
    metrics: Dict[str, float]
    best_params: Optional[Dict[str, Any]] = None
    feature_importance: Optional[Dict[str, float]] = None
    training_time_sec: float


class TrainResponse(BaseModel):
    session_id: str
    task_type: str
    results: List[ModelResult]
    comparison_chart: Dict[str, Any]
    roc_or_residual_chart: Optional[Dict[str, Any]] = None
    confusion_matrices: Optional[Dict[str, Any]] = None
    best_model_key: str


class PredictRequest(BaseModel):
    session_id: str
    model_key: str
    inputs: Dict[str, Union[str, float, int, None]]


class PredictResponse(BaseModel):
    prediction: Union[str, float, int]
    probability: Optional[Dict[str, float]] = None


class AvailableAlgorithmsResponse(BaseModel):
    task_type: str
    algorithms: List[Dict[str, Any]]
