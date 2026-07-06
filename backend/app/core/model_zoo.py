"""
Registry of available algorithms per task type, including:
  - the estimator class/factory
  - sensible default hyperparameters
  - a hyperparameter grid used when the user requests tuning (GridSearchCV)
  - display metadata for the frontend

Adding a new algorithm only requires adding an entry here.
"""
from typing import Any, Callable, Dict

from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

from app.config import RANDOM_STATE

ModelFactory = Callable[..., Any]


CLASSIFICATION_MODELS: Dict[str, Dict[str, Any]] = {
    "logistic_regression": {
        "display_name": "Logistic Regression",
        "factory": lambda **kw: LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, **kw),
        "default_params": {"C": 1.0},
        "param_grid": {"C": [0.01, 0.1, 1.0, 10.0]},
        "supports_feature_importance": True,
        "importance_attr": "coef_",
    },
    "decision_tree": {
        "display_name": "Decision Tree",
        "factory": lambda **kw: DecisionTreeClassifier(random_state=RANDOM_STATE, **kw),
        "default_params": {"max_depth": 8},
        "param_grid": {"max_depth": [3, 5, 8, 12, None], "min_samples_leaf": [1, 2, 5]},
        "supports_feature_importance": True,
        "importance_attr": "feature_importances_",
    },
    "random_forest": {
        "display_name": "Random Forest",
        "factory": lambda **kw: RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1, **kw),
        "default_params": {"n_estimators": 200, "max_depth": None},
        "param_grid": {"n_estimators": [100, 200, 300], "max_depth": [5, 10, None]},
        "supports_feature_importance": True,
        "importance_attr": "feature_importances_",
    },
    "knn": {
        "display_name": "K-Nearest Neighbors",
        "factory": lambda **kw: KNeighborsClassifier(**kw),
        "default_params": {"n_neighbors": 5},
        "param_grid": {"n_neighbors": [3, 5, 7, 9, 11], "weights": ["uniform", "distance"]},
        "supports_feature_importance": False,
        "importance_attr": None,
    },
    "svm": {
        "display_name": "Support Vector Machine",
        "factory": lambda **kw: SVC(probability=True, random_state=RANDOM_STATE, **kw),
        "default_params": {"C": 1.0, "kernel": "rbf"},
        "param_grid": {"C": [0.1, 1.0, 10.0], "kernel": ["linear", "rbf"]},
        "supports_feature_importance": False,
        "importance_attr": None,
    },
}


REGRESSION_MODELS: Dict[str, Dict[str, Any]] = {
    "linear_regression": {
        "display_name": "Linear Regression",
        "factory": lambda **kw: LinearRegression(**kw),
        "default_params": {},
        "param_grid": {"fit_intercept": [True, False]},
        "supports_feature_importance": True,
        "importance_attr": "coef_",
    },
    "decision_tree": {
        "display_name": "Decision Tree Regressor",
        "factory": lambda **kw: DecisionTreeRegressor(random_state=RANDOM_STATE, **kw),
        "default_params": {"max_depth": 8},
        "param_grid": {"max_depth": [3, 5, 8, 12, None], "min_samples_leaf": [1, 2, 5]},
        "supports_feature_importance": True,
        "importance_attr": "feature_importances_",
    },
    "random_forest": {
        "display_name": "Random Forest Regressor",
        "factory": lambda **kw: RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1, **kw),
        "default_params": {"n_estimators": 200, "max_depth": None},
        "param_grid": {"n_estimators": [100, 200, 300], "max_depth": [5, 10, None]},
        "supports_feature_importance": True,
        "importance_attr": "feature_importances_",
    },
    "knn": {
        "display_name": "K-Nearest Neighbors Regressor",
        "factory": lambda **kw: KNeighborsRegressor(**kw),
        "default_params": {"n_neighbors": 5},
        "param_grid": {"n_neighbors": [3, 5, 7, 9, 11], "weights": ["uniform", "distance"]},
        "supports_feature_importance": False,
        "importance_attr": None,
    },
}


def get_model_registry(task_type: str) -> Dict[str, Dict[str, Any]]:
    if task_type == "classification":
        return CLASSIFICATION_MODELS
    if task_type == "regression":
        return REGRESSION_MODELS
    raise ValueError(f"Unknown task_type: {task_type}")


def list_available_algorithms(task_type: str):
    registry = get_model_registry(task_type)
    return [
        {
            "key": key,
            "display_name": meta["display_name"],
            "default_params": meta["default_params"],
            "tunable_params": list(meta["param_grid"].keys()),
            "param_grid": meta["param_grid"],
            "supports_feature_importance": meta["supports_feature_importance"],
        }
        for key, meta in registry.items()
    ]
