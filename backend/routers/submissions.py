"""
routers/submissions.py — Submission endpoints.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from feedback_engine import analyze_submission
from models import Assignment, FeedbackItem, Review, RubricCriterion, Student, Submission
from schemas import AssignmentOut, RubricOut, StudentOut, SubmissionCreate, SubmissionOut

router = APIRouter(prefix="/api", tags=["submissions"])


@router.get("/students", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(db: Session = Depends(get_db)):
    from models import Rubric
    assignments = db.query(Assignment).all()
    result = []
    for a in assignments:
        rubric = db.query(Rubric).filter(Rubric.id == a.rubric_id).first()
        criteria = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == rubric.id).all()
        import json
        criteria_out = []
        for c in criteria:
            criteria_out.append({
                "id": c.id,
                "criterion_id": c.criterion_id,
                "name": c.name,
                "description": c.description,
                "weight": c.weight,
                "min_conditions": json.loads(c.min_conditions or "[]"),
                "rules": json.loads(c.rules or "[]"),
            })
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "rubric_id": a.rubric_id,
            "rubric": {
                "id": rubric.id,
                "name": rubric.name,
                "description": rubric.description,
                "criteria": criteria_out,
            },
        })
    return result


@router.get("/rubrics/{rubric_id}", response_model=RubricOut)
def get_rubric(rubric_id: int, db: Session = Depends(get_db)):
    from models import Rubric
    import json
    rubric = db.query(Rubric).filter(Rubric.id == rubric_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    criteria = db.query(RubricCriterion).filter(RubricCriterion.rubric_id == rubric_id).all()
    criteria_out = []
    for c in criteria:
        criteria_out.append({
            "id": c.id,
            "criterion_id": c.criterion_id,
            "name": c.name,
            "description": c.description,
            "weight": c.weight,
            "min_conditions": json.loads(c.min_conditions or "[]"),
            "rules": json.loads(c.rules or "[]"),
        })
    return {
        "id": rubric.id,
        "name": rubric.name,
        "description": rubric.description,
        "criteria": criteria_out,
    }


@router.post("/submissions", response_model=SubmissionOut, status_code=201)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    # Validate references
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    assignment = db.query(Assignment).filter(Assignment.id == payload.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Determine version (count existing submissions for this student+assignment)
    existing = (
        db.query(Submission)
        .filter(
            Submission.student_id == payload.student_id,
            Submission.assignment_id == payload.assignment_id,
        )
        .count()
    )

    submission = Submission(
        student_id=payload.student_id,
        assignment_id=payload.assignment_id,
        content=payload.content,
        is_final=payload.is_final,
        version=existing + 1,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.flush()

    # Auto-score via engine
    engine_out = analyze_submission(payload.content)
    submission.draft_score = engine_out.score

    db.commit()
    db.refresh(submission)
    return submission


@router.get("/submissions/{student_id}", response_model=List[SubmissionOut])
def get_student_submissions(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return (
        db.query(Submission)
        .filter(Submission.student_id == student_id)
        .order_by(Submission.submitted_at)
        .all()
    )
