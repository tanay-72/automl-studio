"""
Central configuration for the ML web app backend.
Keeping all tunables in one place makes the app easier to operate and audit.
"""
import os

# Directory where per-session artifacts (uploaded data, fitted pipelines,
# trained models) are persisted to disk. Each session gets its own subfolder.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)

# Upload constraints
MAX_UPLOAD_SIZE_MB = 50
ALLOWED_EXTENSIONS = {".csv"}

# Dataset heuristics
MAX_ROWS_FOR_INMEMORY = 500_000  # safety guard for naive in-memory processing
MAX_CATEGORICAL_CARDINALITY = 50  # columns with more unique values are dropped/hashed
HIGH_MISSING_DROP_THRESHOLD = 0.6  # drop a column if >60% missing

# Task detection heuristics
CLASSIFICATION_MAX_UNIQUE_RATIO = 0.05  # unique/n_rows below this => likely classification
CLASSIFICATION_MAX_UNIQUE_ABS = 20      # or fewer than this many unique values

# Train/test split
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Cross-validation folds used during hyperparameter tuning
CV_FOLDS = 5

# CORS - in production, replace "*" with the deployed frontend origin
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
