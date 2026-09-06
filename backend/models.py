"""
models.py — SQLAlchemy ORM models for all database tables.
"""
import json
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from database import Base


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, nullable=False)

    submissions = relationship("Submission", back_populates="student")


# ---------------------------------------------------------------------------
# Rubrics & Criteria
# ---------------------------------------------------------------------------
class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    criteria = relationship("RubricCriterion", back_populates="rubric")
    assignments = relationship("Assignment", back_populates="rubric")


class RubricCriterion(Base):
    __tablename__ = "rubric_criteria"

    id = Column(Integer, primary_key=True, index=True)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)
    criterion_id = Column(String(50), unique=True, nullable=False)  # e.g. "DEF", "ADV"
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, nullable=False)          # 0.0 – 1.0
    # JSON-encoded lists/dicts stored as text
    min_conditions = Column(Text, default="[]")    # list of condition dicts
    rules = Column(Text, default="[]")             # list of rule dicts

    rubric = relationship("Rubric", back_populates="criteria")
    feedback_items = relationship("FeedbackItem", back_populates="criterion")


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)

    rubric = relationship("Rubric", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    content = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_final = Column(Boolean, default=False)
    version = Column(Integer, default=1)          # 1 = draft, 2+ = revision
    draft_score = Column(Float, nullable=True)    # 0 – 100
    final_score = Column(Float, nullable=True)    # 0 – 100, set on final submission

    student = relationship("Student", back_populates="submissions")
    assignment = relationship("Assignment", back_populates="submissions")
    feedback_items = relationship("FeedbackItem", back_populates="submission")
    revisions = relationship("Revision", back_populates="original_submission")


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------
class FeedbackItem(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("rubric_criteria.id"), nullable=True)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)        # exact quote or "" if none
    rule_id = Column(String(50), nullable=False)  # e.g. "RULE_EX_001"
    confidence = Column(Float, nullable=False)    # 0.0 – 1.0
    priority = Column(String(20), nullable=False) # "high" / "medium" / "low"
    requires_human_review = Column(Boolean, default=False)
    # Why human review was triggered — stored for mentor explainability
    high_impact_reason = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="feedback_items")
    criterion = relationship("RubricCriterion", back_populates="feedback_items")
    review = relationship("Review", back_populates="feedback_item", uselist=False)


# ---------------------------------------------------------------------------
# Revisions
# ---------------------------------------------------------------------------
class Revision(Base):
    __tablename__ = "revisions"

    id = Column(Integer, primary_key=True, index=True)
    original_submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    content = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, nullable=False)     # 2, 3, …
    score = Column(Float, nullable=True)          # scored on submission

    original_submission = relationship("Submission", back_populates="revisions")


# ---------------------------------------------------------------------------
# Reviews (Human-in-the-loop)
# ---------------------------------------------------------------------------
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending/approved/rejected/modified
    reviewer = Column(String(120), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    override_reason = Column(Text, nullable=True)
    original_recommendation = Column(Text, nullable=True)  # snapshot of feedback message
    final_decision = Column(Text, nullable=True)

    feedback_item = relationship("FeedbackItem", back_populates="review")


# ---------------------------------------------------------------------------
# Override Reasons (audit log)
# ---------------------------------------------------------------------------
class OverrideReason(Base):
    __tablename__ = "override_reasons"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    reviewer = Column(String(120), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Experiments & Observations
# ---------------------------------------------------------------------------
class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    baseline_definition = Column(Text, nullable=False)
    target = Column(Text, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")  # active / completed

    observations = relationship("ExperimentObservation", back_populates="experiment")


class ExperimentObservation(Base):
    __tablename__ = "experiment_observations"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    group = Column(String(20), nullable=False)  # "BASELINE" or "PROTOTYPE"
    draft_submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    final_submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    draft_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    improvement_points = Column(Float, nullable=False)
    relative_improvement = Column(Float, nullable=False)
    rubric_coverage_draft = Column(Float, nullable=False)
    rubric_coverage_final = Column(Float, nullable=False)
    feedback_used = Column(Text, nullable=False)
    instructor_feedback = Column(Text, nullable=True)
    instructor_feedback_addressed = Column(Boolean, nullable=True)
    instructor_feedback_evidence = Column(Text, nullable=True)
    revision_count = Column(Integer, default=1)
    recommendations_generated = Column(Integer, default=0)
    recommendations_acted_upon = Column(Integer, default=0)
    student_name = Column(String(120), nullable=True)

    experiment = relationship("Experiment", back_populates="observations")


# ---------------------------------------------------------------------------
# Error Analysis Records
# ---------------------------------------------------------------------------
class ErrorAnalysisRecord(Base):
    __tablename__ = "error_analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(120), nullable=False)
    submission_id = Column(Integer, nullable=True)
    recommendation = Column(Text, nullable=False)
    expected_result = Column(Text, nullable=True)
    actual_result = Column(Text, nullable=False)
    error_type = Column(String(100), nullable=False)  # False positive, False negative, etc.
    impact = Column(Text, nullable=False)
    correction_improvement = Column(Text, nullable=False)
    ground_truth_available = Column(Boolean, default=True)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# User Validation Records
# ---------------------------------------------------------------------------
class UserValidationRecord(Base):
    __tablename__ = "user_validation_records"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False)  # "Student" or "Mentor/Instructor"
    task_ratings = Column(Text, nullable=False)  # JSON-encoded list of task evals
    accessibility_feedback = Column(Text, nullable=True)
    language_feedback = Column(Text, nullable=True)
    explainability_feedback = Column(Text, nullable=True)
    overall_usefulness_rating = Column(Integer, nullable=True)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Accessibility Validation Records
# ---------------------------------------------------------------------------
class AccessibilityCheckRecord(Base):
    __tablename__ = "accessibility_check_records"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(120), nullable=False)
    status = Column(String(30), nullable=False)  # "Pass", "Fail", "Needs Improvement"
    comments = Column(Text, nullable=True)
    tester = Column(String(100), nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Explainability Validation Records
# ---------------------------------------------------------------------------
class ExplainabilityValidationRecord(Base):
    __tablename__ = "explainability_validation_records"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(250), nullable=False)
    status = Column(String(30), nullable=False)  # "UNDERSTOOD" or "NOT UNDERSTOOD"
    comment = Column(Text, nullable=True)
    tester_role = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
