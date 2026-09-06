# ARCHITECTURE.md — Formative Feedback Assistant

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite, port 5173)                              │
│  /student  /student/submission  /student/revision  /student/feedback  │
│  /mentor   /mentor/reviews      /mentor/metrics                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (Vite proxy → localhost:8000)
┌──────────────────────▼──────────────────────────────────────────┐
│  FastAPI (port 8000)                                            │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ submissions │ │   feedback   │ │   revisions  │             │
│  └─────────────┘ └──────┬───────┘ └──────────────┘             │
│                         │                                       │
│              ┌──────────▼──────────────┐                       │
│              │  Feedback Engine         │                       │
│              │  (deterministic rules)   │                       │
│              │                          │                       │
│              │  Rule Layer (primary)    │                       │
│              │  ↓ output               │                       │
│              │  LLM Hook (future)      │ ← pluggable           │
│              └──────────────────────────┘                       │
│  ┌────────────────┐  ┌─────────────────┐                       │
│  │    reviews     │  │    metrics      │                       │
│  └────────────────┘  └─────────────────┘                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQLAlchemy ORM
┌──────────────────────▼──────────────────────────────────────────┐
│  SQLite (formative_feedback.db)                                 │
│  students · assignments · rubrics · rubric_criteria             │
│  submissions · feedback · revisions · reviews · override_reasons│
└─────────────────────────────────────────────────────────────────┘
```

## Feedback Engine Architecture

The engine is **deterministic and transparent**. Every feedback item has:
- `rule_id` — identifies which rule fired
- `evidence` — exact text from the submission (never fabricated)
- `confidence` — 0.0–1.0, based on pattern certainty
- `priority` — high / medium / low

**Rule execution order:**
1. `RULE_DEF_001/B` — definition presence and length
2. `RULE_ADV_001/002` — advantages count and elaboration
3. `RULE_EX_001/002/003` — examples count, linkage, ambiguity
4. `RULE_ORG_001` — paragraph structure
5. `RULE_CLR_001` — submission length
6. `RULE_LANG_001` — grammar issues (informational, low-priority)
7. `RULE_PLAG_001` — plagiarism signal (always → human review)
8. `RULE_HI_001/002` — extreme low/high scores (always → human review)

**LLM integration point:** The `analyze_submission()` function can be extended to also call an LLM and merge its output as additional `FeedbackResult` objects. The rule layer always runs first and is never replaced.

## Human-in-the-Loop Design

```
High-Impact Trigger
       │
       ▼
FeedbackItem.requires_human_review = True
       │
       ▼
Review created with status="pending"
       │
   ┌───┴────────────────┐
   │  Mentor Review UI  │
   │  - sees evidence   │
   │  - sees rule       │
   │  - sees confidence │
   └───┬────────────────┘
       │
  ┌────┴─────────────────────┐
  │  Approve / Reject / Modify│
  └────┬─────────────────────┘
       │
  Rejected/Modified requires override_reason
       │
  OverrideReason logged permanently
       │
  Review.status updated, final_decision stored
```

**Invariant:** No high-impact decision is ever auto-finalized. The system enforces this at the API layer — `POST /api/reviews/{id}` is the only path to changing review status.

## Database Schema

| Table | Key Fields |
|-------|-----------|
| students | id, name, email |
| assignments | id, title, description, rubric_id |
| rubrics | id, name |
| rubric_criteria | id, rubric_id, criterion_id, name, weight, min_conditions, rules |
| submissions | id, student_id, assignment_id, content, draft_score, final_score, version |
| feedback | id, submission_id, criterion_id, rule_id, evidence, confidence, priority, requires_human_review |
| revisions | id, original_submission_id, content, version, score |
| reviews | id, feedback_id, status, reviewer, override_reason, final_decision |
| override_reasons | id, review_id, reviewer, reason, created_at |

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | FastAPI | Async, auto-docs, Pydantic native |
| ORM | SQLAlchemy 2.0 | Type-safe, widely supported |
| DB | SQLite | Zero-config, sufficient for prototype |
| Frontend | React + Vite | Fast HMR, standard ecosystem |
| Charts | Recharts | Lightweight, React-native |
| Feedback | Deterministic rules | Fully explainable, testable, no external API |
