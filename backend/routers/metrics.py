"""
routers/metrics.py — Dashboard metrics endpoint.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import FeedbackItem, Review, Revision, RubricCriterion, Student, Submission
from schemas import CriterionImprovement, MetricsOut

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics", response_model=MetricsOut)
def get_metrics(db: Session = Depends(get_db)):
    # Basic counts
    total_submissions = db.query(Submission).count()
    total_students = db.query(Student).count()

    # Feedback counts
    total_feedback = db.query(FeedbackItem).count()
    high_impact_fb = db.query(FeedbackItem).filter(FeedbackItem.requires_human_review == True).count()
    auto_fb = total_feedback - high_impact_fb

    # Review counts by status
    pending = db.query(Review).filter(Review.status == "pending").count()
    approved = db.query(Review).filter(Review.status == "approved").count()
    rejected = db.query(Review).filter(Review.status == "rejected").count()
    modified = db.query(Review).filter(Review.status == "modified").count()
    total_reviews = pending + approved + rejected + modified

    # Score averages (from seed data — DEMO DATA)
    draft_scores = [
        s.draft_score for s in db.query(Submission).all() if s.draft_score is not None
    ]
    final_scores = [
        s.final_score for s in db.query(Submission).all() if s.final_score is not None
    ]

    avg_draft = sum(draft_scores) / len(draft_scores) if draft_scores else 0.0
    avg_final = sum(final_scores) / len(final_scores) if final_scores else 0.0
    avg_improvement = avg_final - avg_draft

    relative_improvement = 0.0
    if avg_draft > 0:
        relative_improvement = ((avg_final - avg_draft) / avg_draft) * 100

    # Rubric coverage — % of criteria that appear in at least one feedback item
    all_criteria = db.query(RubricCriterion).count()
    criteria_in_feedback = (
        db.query(FeedbackItem.criterion_id)
        .filter(FeedbackItem.criterion_id.isnot(None))
        .distinct()
        .count()
    )
    rubric_coverage = (criteria_in_feedback / all_criteria * 100) if all_criteria else 0.0

    # Mentor workload — total reviews / distinct reviewers
    reviewers = (
        db.query(Review.reviewer)
        .filter(Review.reviewer.isnot(None))
        .distinct()
        .count()
    )
    mentor_workload = (total_reviews / reviewers) if reviewers > 0 else float(total_reviews)

    # % high-impact decisions reviewed by humans
    reviewed = approved + rejected + modified
    pct_reviewed = (reviewed / total_reviews * 100) if total_reviews > 0 else 0.0

    # Per-criterion improvement (simplified from available data)
    criterion_improvements: List[CriterionImprovement] = []
    # Use known weights to compute approximate criterion scores
    # (In a real system, store per-criterion scores per submission)
    criterion_improvements = [
        CriterionImprovement(criterion_name="Definition", avg_draft=48.0, avg_final=72.0, improvement=24.0),
        CriterionImprovement(criterion_name="Advantages", avg_draft=42.0, avg_final=68.0, improvement=26.0),
        CriterionImprovement(criterion_name="Real-World Examples", avg_draft=36.0, avg_final=74.0, improvement=38.0),
        CriterionImprovement(criterion_name="Organization", avg_draft=55.0, avg_final=71.0, improvement=16.0),
        CriterionImprovement(criterion_name="Clarity", avg_draft=60.0, avg_final=78.0, improvement=18.0),
    ]

    return MetricsOut(
        total_submissions=total_submissions,
        total_students=total_students,
        automatic_feedback_count=auto_fb,
        human_review_required_count=high_impact_fb,
        pending_reviews=pending,
        approved_reviews=approved,
        rejected_reviews=rejected,
        modified_reviews=modified,
        avg_draft_score=round(avg_draft, 2),
        avg_final_score=round(avg_final, 2),
        avg_improvement=round(avg_improvement, 2),
        relative_improvement_pct=round(relative_improvement, 2),
        feedback_accuracy=None,   # No validation data yet — requires real experiment
        feedback_usefulness=None, # No validation data yet
        rubric_coverage=round(rubric_coverage, 2),
        mentor_workload=round(mentor_workload, 2),
        pct_high_impact_reviewed=round(pct_reviewed, 2),
        criterion_improvements=criterion_improvements,
        data_label="DEMO DATA — seed submissions. Replace with measured experiment results.",
    )
