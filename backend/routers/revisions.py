"""
routers/revisions.py — Revision submission and retrieval.
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from feedback_engine import analyze_submission
from models import Revision, Submission
from schemas import RevisionCreate, RevisionOut

router = APIRouter(prefix="/api", tags=["revisions"])


@router.post("/revisions", response_model=RevisionOut, status_code=201)
def submit_revision(payload: RevisionCreate, db: Session = Depends(get_db)):
    original = db.query(Submission).filter(Submission.id == payload.original_submission_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original submission not found")

    # Determine next version number
    existing_revisions = (
        db.query(Revision)
        .filter(Revision.original_submission_id == payload.original_submission_id)
        .count()
    )
    next_version = existing_revisions + 2  # draft is version 1

    engine_out = analyze_submission(payload.content)
    revision = Revision(
        original_submission_id=payload.original_submission_id,
        content=payload.content,
        submitted_at=datetime.utcnow(),
        version=next_version,
        score=round(engine_out.score, 2),
    )
    db.add(revision)
    db.flush()

    # Update original submission's final score
    original.final_score = revision.score
    original.is_final = True

    db.commit()
    db.refresh(revision)
    return revision


@router.get("/revisions/{submission_id}", response_model=List[RevisionOut])
def get_revisions(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return (
        db.query(Revision)
        .filter(Revision.original_submission_id == submission_id)
        .order_by(Revision.version)
        .all()
    )
