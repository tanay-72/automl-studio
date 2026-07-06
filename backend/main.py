"""
Application entrypoint.

Run locally with:
    uvicorn main:app --reload --port 8000

API docs available at http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

from app.config import FRONTEND_ORIGINS
from app.routers import dataset, eda, models, predict, train

app = FastAPI(
    title="AutoML Studio API",
    description="Upload a CSV, auto-detect the ML task, explore your data, "
                 "train and compare multiple models, and download the result.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router)
app.include_router(eda.router)
app.include_router(train.router)
app.include_router(predict.router)
app.include_router(models.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
