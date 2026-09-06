# ARCHITECTURE.md — Formative Feedback Assistant

## 1. System Architecture Diagram

`
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Client Browser (React 18 + Vite)                       │
│  Learner Workspace:                                                         │
│    /student             /student/assignment  /student/submission            │
│    /student/feedback    /student/revision    /student/progress              │
│  Mentor & Rigor Workspace:                                                  │
│    /mentor              /mentor/reviews      /mentor/metrics                │
│    /mentor/experiment   /mentor/errors       /mentor/validation             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON REST API (Port 8000)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                                FastAPI Server                               │
│  Routers:                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │ submissions  │ │   feedback   │ │  revisions   │ │      reviews        │ │
│  │ (draft CRUD) │ │ (rule engine)│ │(diff & score)│ │(human oversight)   │ │
│  └──────────────┘ └──────┬───────┘ └──────────────┘ └─────────────────────┘ │
│                          │                                                  │
│               ┌──────────▼──────────────┐   ┌─────────────────────────────┐ │
│               │ Deterministic Feedback  │   │         experiments         │ │
│               │ Engine                  │   │ (A/B baseline, error audits,│ │
│               │ - 13 Rubric Rules       │   │  accessibility, user checks)│ │
│               │ - Substring Evidence    │   └─────────────────────────────┘ │
│               │ - Confidence Score      │   ┌─────────────────────────────┐ │
│               │ - High-Impact Triggers  │   │           metrics           │ │
│               └─────────────────────────┘   │  (cohort analytics)        │ │
│                                             └─────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQLAlchemy 2.0 ORM
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       SQLite (formative_feedback.db)                        │
│  Core Domain Tables:                                                        │
│    students · assignments · rubrics · rubric_criteria · submissions         │
│    feedback · revisions · reviews · override_reasons                        │
│  Evaluation & Validation Tables:                                            │
│    experiments · experiment_observations · error_analysis_records           │
│    user_validation_records · accessibility_check_records                    │
│    explainability_validation_records                                        │
└─────────────────────────────────────────────────────────────────────────────┘
`

---

## 2. Component Roles & Workflow

### Frontend (React + Vite)
- Built with standard React 18 functional components and React Router 6.
- Organized into **Learner Workspace** and **Mentor & Moderation Workspace** with persistent dark sidebar, global top navigation, and quick role switching.
- Visualizations powered by Recharts with clean KPI metric cards, status badges, and empty-state placeholders.

### Backend (FastAPI + Pydantic v2)
- High-performance asynchronous Python REST API.
- All request and response models strictly validated via Pydantic v2 schemas.
- Dependency injection handles database sessions (get_db) ensuring transaction safety and connection closure.

### Persistence Layer (SQLite + SQLAlchemy 2.0)
- Single-file zero-configuration relational database (ormative_feedback.db).
- Schema managed via declarative SQLAlchemy models across 14 tables with foreign-key relationships.

---

## 3. Feedback Engine Architecture

The formative feedback engine (ackend/feedback_engine.py) is strictly **deterministic, explainable, and transparent**:

- **No Hallucinated Evidence**: Every feedback item extracts verbatim evidence quotes from the student's actual text via verified substring boundary slicing.
- **Rule Confidence Calibration**: Generates a certainty score (0.0 to 1.0) indicating rule pattern match certainty. The UI explicitly alerts users that this measures rule applicability, not student quality.
- **Priority Classification**: Every recommendation is categorized as High, Medium, or Low priority.

### Rule Execution Pipeline:
1. RULE_DEF_001 / RULE_DEF_001B: Definition detection, keyword pattern matching, and sentence length.
2. RULE_ADV_001 / RULE_ADV_002: Minimum advantages count and specific quantified elaboration.
3. RULE_EX_001 / RULE_EX_002 / RULE_EX_003: Minimum examples count, conceptual linkage to advantages, and ambiguous named entity checks.
4. RULE_ORG_001: Structural layout and multi-paragraph coherence.
5. RULE_CLR_001: Overall submission length and brevity evaluation.
6. RULE_LANG_001: Grammar, capitalization, and ESL phrasing — strictly handled as an informational note without deducting conceptual rubric points.
7. RULE_PLAG_001: Plagiarism signal heuristic (low vocabulary diversity and repetitive structures).
8. RULE_HI_001 / RULE_HI_002: Extreme low (<20) and extreme high (>95) score detection.

---

## 4. Human-in-the-Loop Oversight Architecture

All high-impact decisions strictly require human sign-off before being finalized:

`
High-Impact Trigger
(Score < 20, Score > 95, Plagiarism Signal, Confidence < 0.50)
       │
       ▼
FeedbackItem.requires_human_review = True
       │
       ▼
Review Record Created with status = "pending"
       │
       ▼
Mentor Review Queue (/mentor/reviews)
├── Displays Full Original Submission
├── Highlights Separate Evidence Snippet
├── Renders Human-Readable Rule & Pedagogical Explanation
├── Generates "WHY THIS RULE FIRED" Analysis
└── Displays "WHAT THE MENTOR SHOULD CHECK" Prompt
       │
       ▼
Mentor Action: [ ✓ Approve ] [ ✏️ Modify ] [ ✕ Reject ]
       │
       ├── If Reject or Modify: Mandatory override reason required
       │
       ▼
OverrideReason stored in immutable audit table
Review.status updated ('approved' | 'modified' | 'rejected')
`

**Core Safety Invariant**: The system never auto-finalizes high-impact feedback. Only an authenticated mentor action via POST /api/reviews/{id} can transition a review out of pending status.

---

## 5. Experimentation & Validation Subsystem

The evaluation architecture provides structured verification:
- **A/B Experiment Model**: Tracks Control (BASELINE) versus Treatment (PROTOTYPE) observations, draft vs final scores, rubric coverage, and instructor feedback adherence.
- **9-Class Error Taxonomy**: Classifies feedback edge cases into False positive, False negative, Incorrect evidence, Incorrect rule, Low-confidence recommendation, Language-related issue, Ambiguous submission, Human override, and Ground truth not available.
- **Multidimensional Validation**: Audits WCAG 2.1 AA accessibility checklists, language fairness across ESL variants, and explainability comprehension.
