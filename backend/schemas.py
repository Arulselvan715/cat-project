"""
schemas.py — Pydantic models for request/response validation.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------
class StudentBase(BaseModel):
    name: str
    email: str


class StudentCreate(StudentBase):
    pass


class StudentOut(StudentBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Rubric Criteria
# ---------------------------------------------------------------------------
class RubricCriterionOut(BaseModel):
    id: int
    criterion_id: str
    name: str
    description: Optional[str]
    weight: float
    min_conditions: Any  # parsed JSON
    rules: Any           # parsed JSON

    model_config = {"from_attributes": True}


class RubricOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    criteria: List[RubricCriterionOut]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------
class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    rubric_id: int
    rubric: Optional[RubricOut] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------
class SubmissionCreate(BaseModel):
    student_id: int
    assignment_id: int
    content: str = Field(..., min_length=1, description="Submission text must not be empty")
    is_final: bool = False

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Submission content cannot be blank or whitespace only.")
        return v


class SubmissionOut(BaseModel):
    id: int
    student_id: int
    assignment_id: int
    content: str
    submitted_at: datetime
    is_final: bool
    version: int
    draft_score: Optional[float]
    final_score: Optional[float]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------
class FeedbackItemOut(BaseModel):
    id: int
    submission_id: int
    criterion_id: Optional[int]
    message: str
    evidence: Optional[str]
    rule_id: str
    confidence: float
    priority: str
    requires_human_review: bool
    generated_at: datetime
    criterion_name: Optional[str] = None  # populated from join

    model_config = {"from_attributes": True}


class FeedbackRequest(BaseModel):
    submission_id: int


class FeedbackResponse(BaseModel):
    submission_id: int
    score: float
    feedback: List[FeedbackItemOut]
    requires_human_review: bool
    high_impact_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Revisions
# ---------------------------------------------------------------------------
class RevisionCreate(BaseModel):
    original_submission_id: int
    content: str = Field(..., min_length=1)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Revision content cannot be blank.")
        return v


class RevisionOut(BaseModel):
    id: int
    original_submission_id: int
    content: str
    submitted_at: datetime
    version: int
    score: Optional[float]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class ReviewAction(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected|modified)$")
    reviewer: str = Field(..., min_length=1)
    override_reason: Optional[str] = None
    final_decision: Optional[str] = None

    @model_validator(mode="after")
    def reason_required_for_non_approve(self) -> "ReviewAction":
        if self.status in ("rejected", "modified") and not self.override_reason:
            raise ValueError("override_reason is required when status is rejected or modified.")
        return self


class ReviewOut(BaseModel):
    id: int
    feedback_id: int
    status: str
    reviewer: Optional[str]
    reviewed_at: Optional[datetime]
    override_reason: Optional[str]
    original_recommendation: Optional[str]
    final_decision: Optional[str]
    # Denormalized fields for the review table
    student_name: Optional[str] = None
    assignment_title: Optional[str] = None
    criterion_name: Optional[str] = None
    evidence: Optional[str] = None
    confidence: Optional[float] = None
    priority: Optional[str] = None
    rule_id: Optional[str] = None
    submission_id: Optional[int] = None
    # Full submission context — used by mentor for explainability
    submission_content: Optional[str] = None
    submission_score: Optional[float] = None
    # Why this feedback item was flagged for human review
    high_impact_reason: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
class CriterionImprovement(BaseModel):
    criterion_name: str
    avg_draft: float
    avg_final: float
    improvement: float


class MetricsOut(BaseModel):
    # Counts
    total_submissions: int
    total_students: int
    automatic_feedback_count: int
    human_review_required_count: int
    pending_reviews: int
    approved_reviews: int
    rejected_reviews: int
    modified_reviews: int
    # Scores (DEMO DATA — seed values)
    avg_draft_score: float
    avg_final_score: float
    avg_improvement: float
    relative_improvement_pct: float
    # Feedback quality (DEMO DATA)
    feedback_accuracy: Optional[float]
    feedback_usefulness: Optional[float]
    rubric_coverage: float
    mentor_workload: float   # avg reviews per mentor
    pct_high_impact_reviewed: float
    # Per-criterion
    criterion_improvements: List[CriterionImprovement]
    # Label
    data_label: str = "DEMO DATA — seed submissions. Replace with measured experiment results."


# ---------------------------------------------------------------------------
# Experiment & Validation Schemas
# ---------------------------------------------------------------------------
class ExperimentObservationOut(BaseModel):
    id: int
    experiment_id: int
    student_id: Optional[int]
    student_name: Optional[str]
    assignment_id: Optional[int]
    group: str
    draft_submission_id: Optional[int]
    final_submission_id: Optional[int]
    draft_score: float
    final_score: float
    improvement_points: float
    relative_improvement: float
    rubric_coverage_draft: float
    rubric_coverage_final: float
    feedback_used: str
    instructor_feedback: Optional[str]
    instructor_feedback_addressed: Optional[bool]
    instructor_feedback_evidence: Optional[str]
    revision_count: int
    recommendations_generated: int
    recommendations_acted_upon: int

    model_config = {"from_attributes": True}


class ExperimentOut(BaseModel):
    id: int
    experiment_id: str
    name: str
    description: str
    baseline_definition: str
    target: str
    start_date: datetime
    end_date: Optional[datetime]
    status: str

    model_config = {"from_attributes": True}


class GroupStatsOut(BaseModel):
    group_name: str
    label: str
    count: int
    avg_draft_score: Optional[float]
    avg_final_score: Optional[float]
    avg_improvement: Optional[float]
    relative_improvement_pct: Optional[float] = None
    median_improvement: Optional[float]
    rubric_coverage_draft: Optional[float]
    rubric_coverage_final: Optional[float]
    rubric_coverage_change: Optional[float]
    instructor_feedback_addressed_pct: Optional[float]
    avg_revisions: Optional[float]
    recommendations_generated_total: int
    recommendations_acted_upon_total: int
    acted_upon_pct: Optional[float]
    data_status: str  # "Measured Data" or "Insufficient measured data"


class TargetMetricRow(BaseModel):
    metric: str
    baseline: str
    target: str
    measured_result: str
    status: str  # "Target Met", "In Progress", "Needs Attention", "Pending Data"


class InstructorFeedbackItemOut(BaseModel):
    id: int
    student_name: str
    instructor_feedback: str
    final_evidence: Optional[str]
    addressed: bool
    status_display: str


class ExperimentComparisonOut(BaseModel):
    experiment_name: str
    experiment_id: str
    baseline_definition: str
    data_label: str
    baseline: GroupStatsOut
    prototype: GroupStatsOut
    quality_improvement_points: Optional[float]
    relative_quality_improvement_pct: Optional[float]
    targets_table: List[TargetMetricRow]
    instructor_feedback_items: List[InstructorFeedbackItemOut]
    instructor_feedback_addressed_pct: Optional[float]


# ---------------------------------------------------------------------------
# Error Analysis Schemas
# ---------------------------------------------------------------------------
class ErrorAnalysisRecordCreate(BaseModel):
    student_name: str = Field(..., min_length=1)
    submission_id: Optional[int] = None
    recommendation: str = Field(..., min_length=1)
    expected_result: Optional[str] = None
    actual_result: str = Field(..., min_length=1)
    error_type: str = Field(..., min_length=1)
    impact: str = Field(..., min_length=1)
    correction_improvement: str = Field(..., min_length=1)
    ground_truth_available: bool = True
    is_correct: bool = False


class ErrorAnalysisRecordOut(BaseModel):
    id: int
    student_name: str
    submission_id: Optional[int]
    recommendation: str
    expected_result: Optional[str]
    actual_result: str
    error_type: str
    impact: str
    correction_improvement: str
    ground_truth_available: bool
    is_correct: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ErrorAnalysisSummaryOut(BaseModel):
    total_recommendations: int
    correct_recommendations: int
    incorrect_recommendations: int
    accuracy_pct: Optional[float]
    accuracy_display: str
    ground_truth_available_count: int
    error_breakdown: Dict[str, int]
    records: List[ErrorAnalysisRecordOut]


# ---------------------------------------------------------------------------
# User Validation Schemas
# ---------------------------------------------------------------------------
class TaskRating(BaseModel):
    task_id: int
    task_name: str
    success: bool
    ease_rating: int = Field(..., ge=1, le=5)  # 1-5
    comment: Optional[str] = None


class UserValidationCreate(BaseModel):
    role: str = Field(..., pattern="^(Student|Mentor/Instructor)$")
    task_ratings: List[TaskRating]
    accessibility_feedback: Optional[str] = None
    language_feedback: Optional[str] = None
    explainability_feedback: Optional[str] = None
    overall_usefulness_rating: Optional[int] = Field(None, ge=1, le=5)


class UserValidationOut(BaseModel):
    id: int
    role: str
    task_ratings: List[TaskRating]
    accessibility_feedback: Optional[str]
    language_feedback: Optional[str]
    explainability_feedback: Optional[str]
    overall_usefulness_rating: Optional[int]
    created_at: datetime


class UserValidationSummaryOut(BaseModel):
    total_submissions: int
    student_count: int
    mentor_count: int
    avg_usefulness: Optional[float]
    task_success_rates: Dict[str, float]
    task_avg_ease: Dict[str, float]
    recent_evaluations: List[UserValidationOut]


# ---------------------------------------------------------------------------
# Accessibility Validation Schemas
# ---------------------------------------------------------------------------
class AccessibilityCheckUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pass|Fail|Needs Improvement)$")
    comments: Optional[str] = None
    tester: Optional[str] = None


class AccessibilityCheckOut(BaseModel):
    id: int
    item_name: str
    status: str
    comments: Optional[str]
    tester: Optional[str]
    checked_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Explainability Validation Schemas
# ---------------------------------------------------------------------------
class ExplainabilityQuestionAction(BaseModel):
    status: str = Field(..., pattern="^(UNDERSTOOD|NOT UNDERSTOOD)$")
    comment: Optional[str] = None
    tester_role: Optional[str] = None


class ExplainabilityCheckOut(BaseModel):
    id: int
    question: str
    status: str
    comment: Optional[str]
    tester_role: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Language Validation Schemas
# ---------------------------------------------------------------------------
class LanguageCaseResult(BaseModel):
    case_name: str
    category: str
    sample_text: str
    concept_score: float
    grammar_flagged: bool
    grammar_priority: Optional[str]
    conceptual_quality_preserved: bool
    explanation: str
