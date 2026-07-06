# AutoML Studio

Upload a CSV, pick a target column, and the app takes care of the rest:
cleaning, encoding, scaling, an interactive EDA dashboard, training and
comparing multiple scikit-learn models, hyperparameter tuning, custom
predictions, and downloadable trained pipelines.

```
ml-webapp/
├── backend/                 FastAPI + scikit-learn API
│   ├── main.py               app entrypoint, CORS, router registration
│   ├── requirements.txt
│   ├── sessions/             per-session uploaded data & trained models (gitignored)
│   └── app/
│       ├── config.py         all tunables in one place
│       ├── schemas.py        pydantic request/response models
│       ├── storage.py        session store (in-memory cache + disk persistence)
│       ├── routers/
│       │   ├── dataset.py    upload, target selection, cleaning
│       │   ├── eda.py        EDA dashboard data
│       │   ├── train.py      algorithm listing + training/tuning
│       │   ├── predict.py    prediction schema + custom predictions
│       │   └── models.py     downloadable model artifacts
│       └── core/
│           ├── task_detection.py    classification vs regression heuristic
│           ├── preprocessing.py     cleaning + ColumnTransformer builder
│           ├── eda_plots.py         Plotly figure generation
│           ├── model_zoo.py         algorithm registry + hyperparameter grids
│           ├── training.py          pipeline fitting, tuning, comparison charts
│           └── evaluation.py        metric computation
│
└── frontend/                 React + Tailwind single-page app
    ├── index.html
    ├── vite.config.js        dev proxy: /api -> http://localhost:8000
    ├── tailwind.config.js    design tokens (color/type)
    └── src/
        ├── App.jsx            layout + step routing
        ├── api/client.js      fetch wrapper for every backend endpoint
        ├── context/AppContext.jsx   shared wizard state
        └── components/
            ├── PipelineRail.jsx     step tracker sidebar
            ├── UploadStep.jsx       1. CSV upload
            ├── TargetStep.jsx       2. target column + preview
            ├── EDAStep.jsx          3. EDA dashboard (tabs)
            ├── TrainStep.jsx        4. algorithm selection + training
            ├── CompareStep.jsx      5. metrics, charts, downloads
            ├── PredictStep.jsx      6. custom prediction form
            └── shared/              Card, Spinner, Badge, PlotlyChart
```

## How it works

1. **Upload** — a CSV is parsed with pandas and stored under a per-session
   UUID (`backend/sessions/<id>/raw_df.joblib`). The first 10 rows and
   inferred dtypes are returned for a live preview.
2. **Target selection & cleaning** — `core/preprocessing.clean_dataframe`
   strips whitespace, coerces numeric-looking text, drops empty/constant/
   high-missing/ID-like/high-cardinality columns, drops duplicate rows, and
   drops rows with a missing target. `core/task_detection.detect_task_type`
   then looks at the cleaned target column's dtype and cardinality to decide
   **classification** vs **regression** (with a manual override available).
3. **EDA dashboard** — `core/eda_plots` computes summary statistics, a
   missing-value bar chart, a correlation heatmap, per-column distribution
   charts, box plots (grouped by class for classification), and
   feature-vs-target relationship charts (scatter+trendline for regression,
   violin plots for classification), all serialized as Plotly JSON.
4. **Training** — for each selected algorithm, a fresh
   `Pipeline(preprocessor -> estimator)` is built (median/most-frequent
   imputation, standard scaling, one-hot encoding) and fit on an 80/20 split.
   Hyperparameters are either the user's manual values or come from a
   `GridSearchCV` over a predefined grid (5-fold CV). Because preprocessing
   lives inside the pipeline, the exported model accepts raw feature columns
   directly — no separate scaler/encoder to ship alongside it.
5. **Comparison** — metrics (accuracy/precision/recall/F1/ROC-AUC for
   classification; MAE/MSE/RMSE/R² for regression), a grouped bar chart, ROC
   curves or a predicted-vs-actual scatter, confusion matrices, and feature
   importances (coefficients or `feature_importances_`) are returned together.
6. **Prediction** — a dynamic form is built from the cleaned feature columns
   (numeric inputs with observed min/max, dropdowns for categorical values).
   Submitting it runs `pipeline.predict()` (and `predict_proba()` when
   available) on any of the trained models.
7. **Download** — every trained pipeline is persisted as a `.joblib` file
   and downloadable via `/api/models/download/{session_id}/{model_key}`.
   Loading it with `joblib.load(...)` and calling `.predict(df)` on a
   dataframe with the original feature columns reproduces the same result.

## Running locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs (Swagger UI) are then available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to `http://localhost:8000`
in development (see `vite.config.js`), so no CORS configuration is needed
locally.

### Production build

```bash
cd frontend
npm run build       # outputs static files to frontend/dist
```

Serve `frontend/dist` from any static host or behind the same reverse proxy
as the FastAPI app, and set `VITE_API_BASE` at build time if the API isn't
served from the same origin under `/api`.

## Notes on design choices

- **No data leakage**: the preprocessing `ColumnTransformer` is fit fresh
  inside each model's `Pipeline` on the training split only, never on the
  full dataset.
- **Stateless-ish sessions**: sessions are plain UUID folders on disk
  (`backend/sessions/`), so the API can run as multiple workers sharing a
  volume without a database. Swap `app/storage.py` for Redis/S3 if you need
  multi-machine deployment.
- **Extensible model registry**: adding a new algorithm is a single entry in
  `app/core/model_zoo.py` (factory function + default params + grid-search
  ranges) — no changes needed elsewhere.
- **Charts are server-rendered JSON, client-rendered pixels**: the backend
  never rasterizes images; it returns Plotly figure JSON and the frontend
  renders it with `react-plotly.js`, keeping charts interactive (zoom, hover,
  legend toggling) for free.

## Extending it

- Swap `SessionStore` (`backend/app/storage.py`) for Redis or a database for
  multi-instance deployments.
- Add new algorithms by adding an entry to `CLASSIFICATION_MODELS` or
  `REGRESSION_MODELS` in `backend/app/core/model_zoo.py`.
- Add authentication by wrapping routers with a dependency that checks a
  session/user token before allowing access to `sessions/<id>`.
