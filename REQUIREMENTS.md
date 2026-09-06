# REQUIREMENTS.md — Formative Feedback Assistant

## Problem Statement

Online courses with thousands of learners cannot provide timely, individualised formative feedback
using human mentors alone. This system provides immediate, explainable, actionable feedback on
student submissions while ensuring humans remain in control of all high-impact decisions.

## Users

| Role | Needs |
|------|-------|
| Student | Submit work, receive feedback, revise, track improvement |
| Mentor/Instructor | Review high-impact cases, manage queue, monitor metrics |

## Functional Requirements

### FR-1: Submission
- FR-1.1: Student can submit draft text for an assignment
- FR-1.2: System validates content (non-empty, non-whitespace)
- FR-1.3: Multiple revisions can be submitted
- FR-1.4: Each submission is versioned

### FR-2: Rubric Engine
- FR-2.1: Rubric criteria are configurable with weights, descriptions, and rules
- FR-2.2: Criteria include: Definition (20%), Advantages (30%), Examples (30%), Organization (10%), Clarity (10%)
- FR-2.3: Each criterion has minimum conditions and evaluation rules stored as structured data

### FR-3: Feedback Generation
- FR-3.1: System generates deterministic, rule-based feedback
- FR-3.2: Each feedback item includes: criterion, problem, recommendation, evidence, rule_id, confidence, priority
- FR-3.3: Evidence must be extracted from the actual submission — never fabricated
- FR-3.4: Grammar issues are flagged as low-priority informational notes, not conceptual problems

### FR-4: Human-in-the-Loop
- FR-4.1: High-impact triggers always produce `requires_human_review=True`
- FR-4.2: Mentor must Approve / Reject / Modify before decision is finalized
- FR-4.3: Reject or Modify requires an override reason
- FR-4.4: Override reasons are permanently logged

### FR-5: Revision History
- FR-5.1: All drafts and revisions are stored
- FR-5.2: A revision timeline is displayed per student

### FR-6: Quality Improvement
- FR-6.1: Draft score and final score are computed per submission
- FR-6.2: `improvement = final_score − draft_score`
- FR-6.3: `relative_improvement = ((final−draft)/draft) × 100`
- FR-6.4: Per-criterion scores are tracked

### FR-7: Metrics
- FR-7.1: Mentor dashboard shows aggregated statistics
- FR-7.2: Metrics are labeled as DEMO DATA until replaced by real experiment values

### FR-8: API
- FR-8.1: REST API with Pydantic validation
- FR-8.2: All endpoints documented at /docs (Swagger)

## Non-Functional Requirements

| NFR | Requirement |
|-----|------------|
| NFR-1: Explainability | Every recommendation exposes rule_id, evidence, confidence |
| NFR-2: Transparency | No "AI says this" — always show WHY |
| NFR-3: Human Oversight | High-impact decisions never auto-finalized |
| NFR-4: Accessibility | WCAG 2.1 AA: keyboard navigation, semantic HTML, visible focus, contrast |
| NFR-5: Language Fairness | Grammar issues separated from concept score |
| NFR-6: Modularity | LLM can be added as additional evidence source without replacing rule layer |
| NFR-7: Testability | All rules have automated tests; 57 tests pass |
| NFR-8: Data Integrity | Seed data clearly labeled as demo; no fabricated experimental results |
