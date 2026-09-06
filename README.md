# Formative Feedback Assistant

> Deterministic, explainable formative feedback for online course submissions — with human-in-the-loop mentor oversight for all high-impact decisions and comprehensive experiment and validation tracking.

---

## 1. Project Purpose & Scope

The **Formative Feedback Assistant** is an educational technology system engineered to bridge the formative assessment gap in scaled online courses. When thousands of students submit written work simultaneously, human mentors cannot provide instantaneous, line-by-line formative critique.

Assistant capabilities:
- **Instantaneous Formative Feedback**: Evaluates submissions against structured rubric criteria in under 2 seconds.
- **Non-Fabricated Evidence Extraction**: Directly quotes relevant text passages from student submissions without hallucination.
- **Actionable Recommendations**: Maps detected gaps to pedagogical next steps and plain-English explanations.
- **Explainable Rule Confidence**: Explicitly communicates system rule applicability certainty (distinguished from student performance).
- **Human Oversight for High-Impact Decisions**: Automatically identifies high-impact or low-confidence decisions (extreme scores, plagiarism signals, ambiguous contexts) and routes them to a human mentor review queue.
- **Mentor Workflow (Approve / Modify / Reject)**: Mentors triage flagged recommendations with mandatory documented override justifications stored in an immutable audit trail.
- **Revision History & Quality Tracking**: Measures draft-to-final quality gain across iterative revisions.
- **A/B Experimentation**: Compares the formative assistant against traditional generic delayed feedback baselines.
- **9-Class Error Taxonomy**: Systematically logs and classifies edge cases to direct rule calibration.
- **Representative User Validation**: Audits usability across simulated student and mentor personas, WCAG 2.1 AA accessibility, non-native language fairness, and explainability comprehension.

> **Important Disclosure**: Experimental metrics and validation observations shown in this prototype are based on seeded/demo data and simulated validation records. They demonstrate the evaluation workflow and should not be presented as results from a real-world external participant study. Representative user validation records reflect simulated persona walkthroughs.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Recharts, Modern SaaS Dashboard UI/UX
- **Backend**: FastAPI (Python 3.11), Pydantic v2 validation, Starlette
- **Database & ORM**: SQLite, SQLAlchemy 2.0 (14 ORM tables)
- **Testing & Verification**: Pytest, Pytest-Asyncio, Requests/TestClient (79 automated tests)

---

## 3. Current Functionality & Architecture

The application provides two dedicated operational workspaces alongside an evaluation and research suite:

### Learner Workspace
1. **Dashboard (/student)**: Overview of current course progress, active assignments, and detailed criteria weights.
2. **Course Rubric (/student/assignment)**: Deep-dive rubric view detailing criteria weights, minimum conditions, and evaluation standards.
3. **Submit Draft (/student/submission)**: Real-time writing environment with live word count, character count, and draft versioning.
4. **Feedback (/student/feedback)**: Actionable recommendations with excerpted evidence quotes, priority levels, rule certainty meters, and criteria badges.
5. **Revisions & Timeline (/student/revision)**: Side-by-side draft versus revision diff viewer tracking score deltas, version history, and addressed feedback.
6. **Progress Analytics (/student/progress)**: Longitudinal mastery metrics across rubric criteria over time.

### Mentor & Moderation Workspace
1. **Overview (/mentor)**: High-level cohort health KPIs, review queue velocity, and priority alerts.
2. **Review Queue (/mentor/reviews)**: Dedicated human-in-the-loop triage interface. Features full original submission rendering, separate evidence snippets, rule explainability cards, "WHY THIS RULE FIRED" context, mentor verification checklists, and mandatory documented justifications for all override actions (Approve, Modify, Reject).
3. **Cohort Metrics (/mentor/metrics)**: Aggregated cohort performance indicators, submission counts, and rubric coverage.

### Evaluation & Rigor Suite
1. **A/B Experiments (/mentor/experiment)**: Controlled evaluation comparing Control (generic delayed feedback) versus Treatment (assistant workflow) measuring draft-to-final score improvements, rubric coverage, and instructor feedback adherence.
2. **Error Analysis / 9-Class Error Taxonomy (/mentor/errors)**: 9-class error classification taxonomy (False positive, False negative, Incorrect evidence, Incorrect rule, Low-confidence recommendation, Language-related issue, Ambiguous submission, Human override, Ground truth not available) with precision audits and missing ground-truth handling.
3. **Human Validation (/mentor/validation)**: 4-tab interactive validation suite covering:
   - **Simulated Representative User Panel**: Task completion rates and Likert ease/usefulness ratings from simulated student and mentor personas.
   - **WCAG 2.1 AA Accessibility Checklist**: 8-point audit verifying keyboard navigation, visible focus indicators, semantic labels, contrast, and screen-reader compatibility.
   - **Language Diversity & Fairness**: Non-native ESL evaluation verifying grammar feedback is isolated into low-priority informational notes without deducting conceptual points.
   - **Explainability Validation**: Verification of the 7 core explainability questions ensuring complete transparency.

---

## 4. Key Core Features & Safeguards

- **Deterministic Rubric-Based Feedback**: Evaluates submissions against multi-criteria rubrics (Definition 20%, Advantages 30%, Real-World Examples 30%, Organization 10%, Clarity 10%).
- **Non-Fabricated Evidence Extraction**: Text quotes are extracted verbatim via substring search; no evidence is ever hallucinated or synthesized.
- **Actionable Recommendations**: Feedback messages provide concrete next steps referencing specific rubric requirements.
- **Rule Confidence Calibration**: Explicitly informs mentors and students that confidence represents pattern match certainty, not the learner's subject mastery.
- **High-Impact Human Review**: Low scores (<20), plagiarism heuristic signals, extreme high scores (>95), and low pattern confidence (<0.50) are held in pending state until reviewed by an authorized human mentor.
- **Mentor Approve / Modify / Reject Workflow**: Mentors can confirm, edit, or dismiss recommendations.
- **Mandatory Override Reason**: Mentors modifying or rejecting automated recommendations must submit a documented justification.
- **Audit Trail**: Every override justification, reviewer name, and timestamp is permanently recorded in an immutable audit log.
- **Revision History**: Comprehensive tracking of draft versus revision progression with score delta computation.
- **Transparent Missing Data & Ground Truth**: The system renders explicit "Insufficient measured data" or "Ground truth not available" notices when empirical labels are missing.

---

## 5. Measured Prototype Experiment Metrics

Calculated directly from the active experiment dataset (`backend/seed.py` and `backend/routers/experiments.py`):

| Evaluation Metric | Baseline (Control, n=5) | Formative Assistant (Treatment, n=7) | Measured Net Gain |
|---|---|---|---|
| **Average Draft Score** | 49.20 / 100 | 45.86 / 100 | -3.34 pts (Comparable initial cohorts) |
| **Average Final Score** | 61.00 / 100 | 77.57 / 100 | **+16.57 pts higher final achievement** |
| **Average Quality Improvement** | **+11.80 pts** | **+31.71 pts** | **+19.91 pts differential gain** |
| **Relative Improvement** | **+24.0%** | **+69.2%** | **+168.7% relative efficacy lead** |
| **Median Improvement** | +12.00 pts | +32.00 pts | +20.00 pts median increase |
| **Final Rubric Coverage** | 62.0% | 89.0% | +27.0% criteria coverage advantage |
| **Instructor Notes Addressed** | 60.0% (3/5) | 85.7% (6/7) | +25.7% follow-through adherence |
| **Recommendation Action Rate** | N/A | 94.1% (16/17 acted upon) | High student follow-through |

*(Note: In exploratory drafts, intermediate subsets were cited as +30.3 pts / +64.1%. The authoritative values calculated dynamically by the active engine for the full 7-student prototype cohort are **+31.71 pts average improvement** and **+69.2% relative gain**).*

---

## 6. Quick Start & Local Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
- Backend API runs at: **http://localhost:8000**
- Interactive Swagger API Docs: **http://localhost:8000/docs**
- SQLite database (`formative_feedback.db`) is initialized and seeded automatically on first startup.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend application runs at: **http://localhost:5173**

### 3. Run Automated Tests
```bash
cd backend
python -m pytest tests/ -v
```

**Verified Test Suite Status**:
```
full suite collected 79 items
tests/test_api.py ................................... [ 54%]
tests/test_engine.py .......................          [ 82%]
tests/test_experiment.py ..............               [100%]

======================== 79 passed, 1 warning in 4.68s ========================
```
- **79 total tests: 79 passed, 0 failed, 0 errors**

---

## 7. Documentation Index

- [`REQUIREMENTS.md`](./REQUIREMENTS.md): Formal user requirements, functional specifications (FR-1 through FR-8), and non-functional requirements (NFR-1 through NFR-8).
- [`REQUIREMENTS_TRACEABILITY.md`](./REQUIREMENTS_TRACEABILITY.md): 42-requirement matrix verifying implementation, live application evidence, documentation citations, and automated tests.
- [`VALIDATION.md`](./VALIDATION.md): Comprehensive validation report covering baseline conditions, prototype results, 9-class error taxonomy, accessibility, language fairness, and simulated user panels.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): Component diagrams, data models, rule execution order, and human-in-the-loop lifecycle.
- [`LIMITATIONS.md`](./LIMITATIONS.md): Candid academic and operational limitations including seed/demo data constraints, regex keyword matching boundaries, and human review requirements.
