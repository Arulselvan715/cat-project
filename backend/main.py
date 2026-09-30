"""
main.py — FastAPI application entry point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from database import engine, SessionLocal
from models import Base
from routers import experiments, feedback, metrics, reviews, revisions, submissions
from seed import seed_database

# ---------------------------------------------------------------------------
# Rate limiter — 30 requests/minute per IP (prototype configuration).
# NOTE: This is a conservative engineering default for a single-server prototype.
# It does NOT represent a validated production capacity requirement.
# ---------------------------------------------------------------------------
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["30/minute"],
    # Health check is exempted from rate limiting so it can be used
    # as a monitoring / load-test probe without hitting the global limit.
)

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

# Attach limiter state to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
@limiter.exempt  # Exempt from rate limiting — used for monitoring probes and load benchmarks.
def health():
    return {"status": "ok"}
