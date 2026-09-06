"""
routers/reviews.py — Mentor review queue endpoints.
Human-in-the-loop: high-impact decisions must be approved/rejected/modified by a mentor.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Assignment, FeedbackItem, OverrideReason, Review, RubricCriterion, Student, Submission
from schemas import ReviewAction, ReviewOut

router = APIRouter(prefix="/api", tags=["reviews"])


def _build_review_out(review: Review, db: Session) -> ReviewOut:
    fi = db.query(FeedbackItem).filter(FeedbackItem.id == review.feedback_id).first()
    sub = db.query(Submission).filter(Submission.id == fi.submission_id).first() if fi else None
    student = db.query(Student).filter(Student.id == sub.student_id).first() if sub else None
    assignment = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first() if sub else None
    crit = db.query(RubricCriterion).filter(RubricCriterion.id == fi.criterion_id).first() if fi and fi.criterion_id else None

    return ReviewOut(
        id=review.id,
        feedback_id=review.feedback_id,
        status=review.status,
        reviewer=review.reviewer,
        reviewed_at=review.reviewed_at,
        override_reason=review.override_reason,
        original_recommendation=review.original_recommendation,
        final_decision=review.final_decision,
        student_name=student.name if student else None,
        assignment_title=assignment.title if assignment else None,
        criterion_name=crit.name if crit else None,
        evidence=fi.evidence if fi else None,
        confidence=fi.confidence if fi else None,
        priority=fi.priority if fi else None,
        rule_id=fi.rule_id if fi else None,
        submission_id=sub.id if sub else None,
        # New explainability fields
        submission_content=sub.content if sub else None,
        submission_score=sub.draft_score if sub else None,
        high_impact_reason=fi.high_impact_reason if fi else None,
    )


@router.get("/reviews", response_model=List[ReviewOut])
def get_reviews(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Review)
    if status:
        q = q.filter(Review.status == status)
    reviews = q.order_by(Review.id.desc()).all()
    return [_build_review_out(r, db) for r in reviews]


@router.post("/reviews/{review_id}", response_model=ReviewOut)
def action_review(review_id: int, payload: ReviewAction, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Review is already in status '{review.status}' and cannot be updated.",
        )

    review.status = payload.status
    review.reviewer = payload.reviewer
    review.reviewed_at = datetime.utcnow()
    review.override_reason = payload.override_reason
    review.final_decision = payload.final_decision or payload.override_reason

    # If rejected or modified, store override reason in audit log
    if payload.status in ("rejected", "modified") and payload.override_reason:
        override = OverrideReason(
            review_id=review.id,
            reviewer=payload.reviewer,
            reason=payload.override_reason,
            created_at=datetime.utcnow(),
        )
        db.add(override)

    db.commit()
    db.refresh(review)
    return _build_review_out(review, db)
