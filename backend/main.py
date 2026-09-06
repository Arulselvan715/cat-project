"""
main.py — FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
from models import Base
from routers import experiments, feedback, metrics, reviews, revisions, submissions
from seed import seed_database

# Create all tables
Base.metadata.create_all(bind=engine)

# Seed on startup
with SessionLocal() as db:
    seed_database(db)

app = FastAPI(
    title="Formative Feedback Assistant API",
    description=(
        "Deterministic, explainable formative feedback for student submissions "
        "with human-in-the-loop mentor review for high-impact decisions."
    ),
    version="1.0.0",
)

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(submissions.router)
app.include_router(feedback.router)
app.include_router(revisions.router)
app.include_router(reviews.router)
app.include_router(metrics.router)
app.include_router(experiments.router)


@app.get("/")
def root():
    return {
        "app": "Formative Feedback Assistant",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
