"""
routers/feedback.py — Feedback generation endpoint.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from feedback_engine import analyze_submission
from models import FeedbackItem, Review, RubricCriterion, Submission
from schemas import FeedbackItemOut, FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/api", tags=["feedback"])


def _criterion_name(db: Session, criterion_id: Optional[int]) -> Optional[str]:
    if not criterion_id:
        return None
    c = db.query(RubricCriterion).filter(RubricCriterion.id == criterion_id).first()
    return c.name if c else None


@router.post("/feedback", response_model=FeedbackResponse)
def generate_feedback(payload: FeedbackRequest, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Re-run engine (idempotent — delete old feedback first for this submission)
    db.query(FeedbackItem).filter(FeedbackItem.submission_id == submission.id).delete()
    db.flush()

    engine_out = analyze_submission(submission.content)
    submission.draft_score = engine_out.score

    # Get rubric criteria for criterion_id lookup
    from models import Assignment, Rubric
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    criteria = (
        db.query(RubricCriterion)
        .filter(RubricCriterion.rubric_id == assignment.rubric_id)
        .all()
    )
    crit_map = {c.criterion_id: c for c in criteria}

    feedback_items: List[FeedbackItem] = []
    review_created = False

    for fb in engine_out.feedback:
        crit_obj = crit_map.get(fb.criterion_key)
        fi = FeedbackItem(
            submission_id=submission.id,
            criterion_id=crit_obj.id if crit_obj else None,
            message=fb.message,
            evidence=fb.evidence or "",
            rule_id=fb.rule_id,
            confidence=fb.confidence,
            priority=fb.priority,
            requires_human_review=fb.requires_human_review,
            high_impact_reason=fb.high_impact_reason,
            generated_at=datetime.utcnow(),
        )
        db.add(fi)
        db.flush()

        if fb.requires_human_review and not review_created:
            review = Review(
                feedback_id=fi.id,
                status="pending",
                original_recommendation=fb.message,
            )
            db.add(review)
            review_created = True

        feedback_items.append(fi)

    db.commit()

    # Build response
    items_out = []
    for fi in feedback_items:
        items_out.append(
            FeedbackItemOut(
                id=fi.id,
                submission_id=fi.submission_id,
                criterion_id=fi.criterion_id,
                message=fi.message,
                evidence=fi.evidence,
                rule_id=fi.rule_id,
                confidence=fi.confidence,
                priority=fi.priority,
                requires_human_review=fi.requires_human_review,
                generated_at=fi.generated_at,
                criterion_name=_criterion_name(db, fi.criterion_id),
            )
        )

    return FeedbackResponse(
        submission_id=submission.id,
        score=engine_out.score,
        feedback=items_out,
        requires_human_review=engine_out.requires_human_review,
        high_impact_reason=engine_out.high_impact_reason,
    )


@router.get("/feedback/{submission_id}", response_model=List[FeedbackItemOut])
def get_feedback_for_submission(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    items = (
        db.query(FeedbackItem)
        .filter(FeedbackItem.submission_id == submission_id)
        .all()
    )
    result = []
    for fi in items:
        result.append(
            FeedbackItemOut(
                id=fi.id,
                submission_id=fi.submission_id,
                criterion_id=fi.criterion_id,
                message=fi.message,
                evidence=fi.evidence,
                rule_id=fi.rule_id,
                confidence=fi.confidence,
                priority=fi.priority,
                requires_human_review=fi.requires_human_review,
                generated_at=fi.generated_at,
                criterion_name=_criterion_name(db, fi.criterion_id),
            )
        )
    return result
