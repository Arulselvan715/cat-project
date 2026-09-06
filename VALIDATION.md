# VALIDATION.md — Formative Feedback Assistant: Experimentation & Validation Report

> **CRITICAL SCIENTIFIC & ACADEMIC DISCLAIMER**  
> All empirical observations, scores, rater evaluations, and participant records in this prototype are derived from **DEMO SEED DATA** and **SIMULATED VALIDATION RECORDS** curated for reproducible functional verification.  
> Important: Experimental metrics and validation observations shown in this prototype are based on seeded/demo data and simulated validation records. They demonstrate the evaluation workflow and should not be presented as results from a real-world external participant study.  
> Do **NOT** claim that real external students or mentors participated in these trials. No external human subjects were recruited.

---

## 1. Purpose & Overview

The validation framework for the **Formative Feedback Assistant** establishes a measurable, reproducible baseline to verify whether immediate, explainable, rule-grounded formative feedback improves student draft quality and facilitates meaningful revision compared to traditional feedback mechanisms.

The system evaluates:
1. Student submission draft vs final revision quality gains.
2. Rubric criteria coverage across drafts.
3. Student follow-through on instructor notes.
4. Error taxonomy and classification of failure modes.
5. Simulated user usability, WCAG 2.1 AA accessibility, non-native language fairness, and explainability comprehension.

---

## 2. Validation Methodology

The evaluation uses a between-subjects experimental comparison across two conditions:
- **Control Group (Baseline)**: Students write a draft essay and receive delayed, generic end-of-assignment comments without granular rubric breakdown or extracted quotes.
- **Treatment Group (Prototype)**: Students write a draft essay and receive immediate, explainable, rule-grounded formative feedback featuring extracted evidence quotes, rule explanations, and revision diff tracking. High-impact or low-confidence recommendations are routed to a human mentor review queue.

`
Student Draft Submission
          │
          ├── [BASELINE CONTROL] ──► Generic Delayed Comment ──► Revision ──► Measure Quality Delta
          │
          └── [PROTOTYPE TREATMENT] ──► Rule Breakdown + Evidence Quotes + Why Fired ──► Revision
                                                  │
                                                  └── (High-Impact?) ──► Mentor Review Queue
`

Both groups are evaluated against identical 5-criterion rubric weights:
1. **Definition (DEF)**: 20%
2. **Advantages (ADV)**: 30%
3. **Real-World Examples (EX)**: 30%
4. **Organization (ORG)**: 10%
5. **Clarity (CLR)**: 10%

---

## 3. Baseline Condition (Control Group)

* **Condition Name**: BASELINE / DEMO EXPERIMENT
* **Definition**: Generic delayed comments (e.g. *"Good start. Please expand definition and add more examples."*) delivered after draft submission without automated rule breakdown or text quotes.
* **Dataset Size**: 5 student observations (Student A (Control) through Student E (Control)).
* **Measured Baseline Statistics**:
  * **Average Draft Score**: 49.20 / 100
  * **Average Final Score**: 61.00 / 100
  * **Average Quality Improvement**: **+11.80 points**
  * **Relative Improvement**: **+24.0%**
  * **Median Improvement**: +12.00 points
  * **Rubric Coverage (Final)**: 62.0% (initial draft was 45.0%, net change: +17.0%)
  * **Instructor Feedback Addressed Rate**: 60.0% (3 of 5 addressed)
  * **Average Revision Count**: 1.0 revision

---

## 4. Prototype Condition (Treatment Group)

* **Condition Name**: FORMATIVE FEEDBACK ASSISTANT (Treatment)
* **Definition**: Immediate deterministic feedback (<2 seconds) detailing rubric criteria, human-readable rules, extracted text quotes, plain-language "WHY THIS RULE FIRED" analyses, and revision timeline diffs. High-impact signals route to human mentors.
* **Dataset Size**: 7 student observations (Carla Mendes, David Chen, Elan Goldberg, Hannah Park, George Osei, Ivan Petrov, Julia Martinez).
* **Measured Prototype Statistics**:
  * **Average Draft Score**: 45.86 / 100
  * **Average Final Score**: 77.57 / 100
  * **Average Quality Improvement**: **+31.71 points**
  * **Relative Improvement**: **+69.2%**
  * **Median Improvement**: +32.00 points
  * **Rubric Coverage (Final)**: 89.0% (initial draft was 42.9%, net change: +46.1%)
  * **Instructor Feedback Addressed Rate**: 85.7% (6 of 7 addressed)
  * **Average Revision Count**: 2.0 revisions
  * **Recommendations Acted Upon**: 16 / 17 (94.1%)

---

## 5. Metrics & Calculation Formulas

1. **Absolute Improvement Gain**:
   \text{Improvement Points} = \text{Final Score} - \text{Draft Score}

2. **Relative Improvement Gain**:
   \text{Relative Gain (\%)} = \left(\frac{\text{Final Score} - \text{Draft Score}}{\text{Draft Score}}\right) \times 100

3. **Rubric Coverage**:
   \text{Rubric Coverage (\%)} = \left(\frac{\text{Criteria Addressed}}{\text{Total Criteria (5)}}\right) \times 100

4. **Instructor Feedback Addressed Rate**:
   \text{Addressed Rate (\%)} = \left(\frac{\text{Revisions Incorporating Instructor Feedback}}{\text{Total Observations with Instructor Feedback}}\right) \times 100

5. **Net Quality Improvement Over Baseline**:
   \text{Net Point Differential} = \text{Prototype Avg Improvement} - \text{Baseline Avg Improvement} = 31.71 - 11.80 = +19.91\text{ pts}

6. **Relative Efficacy Lead**:
   \text{Relative Lead (\%)} = \left(\frac{31.71 - 11.80}{11.80}\right) \times 100 = +168.7\%

---

## 6. Baseline vs Prototype Comparison

| Dimension | Baseline (Control, n=5) | Prototype (Treatment, n=7) | Comparative Delta |
|---|---|---|---|
| **Average Draft Score** | 49.20 / 100 | 45.86 / 100 | Comparable initial baseline (-3.34 pts) |
| **Average Final Score** | 61.00 / 100 | 77.57 / 100 | **+16.57 pts higher achievement** |
| **Average Improvement** | **+11.80 pts** | **+31.71 pts** | **+19.91 pts higher gain** |
| **Relative Improvement** | **+24.0%** | **+69.2%** | **+168.7% relative efficacy lead** |
| **Median Improvement** | +12.00 pts | +32.00 pts | +20.00 pts median gain |
| **Final Rubric Coverage** | 62.0% | 89.0% | +27.0% criteria coverage lead |
| **Rubric Coverage Growth** | +17.0% | +46.1% | +29.1% faster rubric mastery |
| **Instructor Notes Followed** | 60.0% (3/5) | 85.7% (6/7) | +25.7% follow-through rate |
| **Average Revisions** | 1.0 | 2.0 | +1.0 revision iteration |

---

## 7. Target vs Measured Results

The application dynamically computes and renders pre-specified targets against measured values:

| Performance Benchmark | Baseline (Control) | Target Threshold | Measured Result (Prototype) | Status |
|---|---|---|---|---|
| **Draft → Final Quality Improvement** | +11.8 pts | ≥ +35% relative gain | **+31.71 pts (+69.2% gain)** | **Target Met** |
| **Rubric Coverage** | 62.0% | ≥ 85% of criteria addressed | **89.0%** | **Target Met** |
| **Feedback Usefulness** | 3.1 / 5.0 (survey) | ≥ 4.0 / 5.0 (survey) | **5.0 / 5.0 (simulated panel)** | **Target Met** |
| **Recommendation Accuracy** | 68.0% (unassisted heuristic) | ≥ 85% rater agreement | **50.0% (4/8 verified GT)** | **In Progress** |
| **Human Review of High-Impact Decisions** | N/A (no human check) | 100% mentor sign-off required | **25.0% (3/12 completed)** | **In Progress** |

*Note on In-Progress Metrics*:
- **Recommendation Accuracy**: 4 of 8 evaluated ground-truth records were verified as fully accurate. 4 records document specific failure modes (false positive, false negative, incorrect evidence, incorrect rule) which serve as regression benchmarks for rule calibration.
- **Human Review of High-Impact Decisions**: In the current active seeded state, 3 high-impact reviews have been finalized (Dr. Sarah Kim and demo mentor) while 9 remain in pending state awaiting mentor review in the triage queue, strictly upholding the safety rule that no high-impact item is auto-finalized.

---

## 8. 9-Class Error Taxonomy Distribution

The system logs all feedback failures and edge cases into an explicit **9-Class Error Taxonomy**:

| Error Class | Example from Audit Record | Impact | Corrective Improvement Action | Ground Truth Available |
|---|---|---|---|---|
| **1. False positive** | RULE_HI_002 flagged strong authentic submission (score 96) | Unnecessary mentor queue burden | Cross-reference revision delta and word diversity before flagging | Yes (Incorrect) |
| **2. False negative** | RULE_ADV_001 missed *"drastically cuts server bills"* | Student prompted for advantage already present | Expand keyword lexicon in _detect_advantages for colloquial/ESL variants | Yes (Incorrect) |
| **3. Incorrect evidence** | Evidence snippet captured preceding period ". \n\nFor example..." | Cluttered UI quote reducing explainability | Normalize regex sentence boundary slicing in extract_evidence | Yes (Incorrect) |
| **4. Incorrect rule** | RULE_DEF_001 fired because text had markdown header "### Concept" | Incorrect advice given to structured essay | Strip markdown header syntax before AST pattern matching | Yes (Incorrect) |
| **5. Low-confidence recommendation** | Ambiguous reference to *"Amazon"* without cloud context (RULE_EX_003) | Correctly routed to mentor queue (confidence 0.45) | Mentor approved recommendation after inspecting cloud context | Yes (Correct) |
| **6. Language-related issue** | RULE_LANG_001 provided non-native grammar tip | Protected learner from unfair concept point penalty | Continue strict separation between language and rubric scoring | Yes (Correct) |
| **7. Ambiguous submission** | Single unbroken 250-word paragraph (RULE_ORG_001) | Prompted student to introduce paragraph structure | Student revised with distinct paragraphs, increasing score | Yes (Correct) |
| **8. Human override** | Mentor rejected plagiarism flag matching course slide definition | Human-in-the-loop prevented unfair penalty | Add course lecture slides and reference syllabus to whitelist | Yes (Correct) |
| **9. Ground truth not available** | Unverified draft pending secondary expert annotation | Accuracy metric cannot be imputed | Mark observation explicitly: "Ground truth not available for this observation." | No (Unverified) |

---

## 9. Ground-Truth Availability & Missing Data Handling

A core design requirement is absolute data integrity:
- **No Fabricated Evidence**: Extracted quotes are matched directly to student submission characters.
- **Explicit Ground-Truth Status**: The error analysis API strictly differentiates records where ground-truth exists from unannotated drafts. If ground truth is missing, the system outputs: "Ground truth not available for this observation." rather than assuming 100% or 0% accuracy.
- **Missing Metric Handling**: When experiment groups or observations lack data, the UI and API return "Insufficient measured data" rather than displaying NaN or imputed averages.

---

## 10. Representative User Validation (Simulated Panel)

Usability was evaluated across 5 core workflows using structured Likert ratings and task evaluations:

* **Panel Designation**: **Simulated Representative User Validation** (3 recorded sessions: 2 Student personas, 1 Mentor persona).
* **Core Tasks Evaluated**:
  1. **Task 1 — Understand feedback**: 100% completion (Average ease: 4.33 / 5.0).
  2. **Task 2 — Find evidence**: 100% completion (Average ease: 4.33 / 5.0).
  3. **Task 3 — Understand why recommendation was generated**: 100% completion (Average ease: 4.67 / 5.0).
  4. **Task 4 — Complete a revision**: 100% completion (Average ease: 4.00 / 5.0).
  5. **Task 5 — Understand when human review is required**: 100% completion (Average ease: 4.67 / 5.0).
* **Overall Usefulness Rating**: **5.0 / 5.0** across recorded panel reviews.
* **Panel Qualitative Feedback**:
  - *Student Persona*: "Knowing the exact rule gave me confidence in revising. Helpful that minor grammar mistakes did not penalize my concept score."
  - *Mentor Persona*: "The 'WHY THIS RULE FIRED' section saves review time. High-impact queue ensures plagiarism and extreme scores are never auto-finalized."

---

## 11. Accessibility Validation (WCAG 2.1 AA)

All 8 accessibility criteria were audited and recorded in the database:

1. **Keyboard Navigation** (Pass): All buttons, inputs, tabs, and collapsible cards are reachable via Tab/Shift+Tab and operable via Enter/Space.
2. **Visible Focus Indicators** (Pass): 2px solid focus rings styled with --color-primary across all interactive controls.
3. **Semantic Labels** (Pass): Proper heading hierarchy (h1, h2, h3), ole="navigation", ole="alert", and aria-live regions.
4. **Form Labels** (Pass): Every form input has an explicitly associated <label htmlFor="..."> element.
5. **Readable Text** (Pass): High-contrast typography meeting WCAG 2.1 AA (≥4.5:1 ratio for normal text on dark theme).
6. **Color-Independent Status Indicators** (Pass): Status badges combine icons (✓, ✗, ⚠), distinct text labels (Approved, Rejected, Modified), and borders alongside color.
7. **Error Messages** (Pass): Inline error alerts with ole="alert" and descriptive instructional text.
8. **Screen-Reader Compatibility Check** (Pass): Descriptive ria-label attributes on review actions, meters, and score pills; no silent icon-only controls.

---

## 12. Language Diversity & Fairness Validation

The feedback engine was audited against 4 linguistic variants:
1. **Standard Academic English**: Scored 89.0/100, zero grammar flags.
2. **Non-Native / Grammatically Imperfect English** (Ivan Petrov): Scored 58.0/100 on draft. Despite ESL verb agreement and preposition irregularities, advantages and examples were recognized. RULE_LANG_001 fired strictly as an **informational low-priority recommendation** without reducing conceptual points.
3. **Short / Simple English**: Scored 44.0/100 due to brevity and missing elaboration; evaluated solely on rubric completeness without linguistic bias.
4. **Ambiguous Context** (George Osei): Fired RULE_EX_003 with low confidence (0.45) and routed to human mentor review rather than penalizing the student.

---

## 13. Explainability Validation

A structured review audited the 7 mandatory explainability questions:
1. *What recommendation was made?* — **UNDERSTOOD** (Clear actionable imperative text).
2. *What evidence caused it?* — **UNDERSTOOD** (Direct excerpted student quote rendered in dedicated card).
3. *Which rubric criterion was involved?* — **UNDERSTOOD** (Criterion name + weight clearly stated).
4. *Which rule was applied?* — **UNDERSTOOD** (Human-readable rule name shown alongside technical rule ID).
5. *What does the rule mean?* — **UNDERSTOOD** (Plain-English pedagogical explanation provided for all 13 rules).
6. *What is the confidence?* — **UNDERSTOOD** (Percentage meter with explicit helper text explaining it measures rule certainty, not student quality).
7. *Why was human review required?* — **UNDERSTOOD** (Prominent high-impact banner detailing trigger: extreme score, plagiarism, or low confidence).

---

## 14. Automated Testing Suite

The system is validated by **79 automated pytest tests** covering unit engine rules, API endpoints, explainability fields, and experiment calculations:
- ackend/tests/test_engine.py (22 tests): Edge cases (A through E), language robustness, non-fabricated evidence invariants.
- ackend/tests/test_api.py (43 tests): Submissions, feedback, revisions, mentor reviews, override justifications, explainability fields.
- ackend/tests/test_experiment.py (14 tests): Group stats calculation, missing data handling, relative improvements, instructor feedback adherence, error taxonomy, user validation, WCAG checklist, language fairness.

**Result**: 79 passed, 0 failures, 1 warning (deprecation notice) in 5.64s.

---

## 15. Operational Limitations

1. **Simulated Validation Panel**: The user panel consists of 3 simulated records (2 students, 1 mentor) rather than an external IRB-approved cohort.
2. **Heuristic Keyword Lexicons**: Rule detection relies on regex and keyword clusters. Synonyms not present in the lexicon may trigger false negatives.
3. **Single Assignment Rubric**: Built for the "Cloud Computing Essay" rubric; multi-course deployment requires creating criteria configurations for new assignments.
4. **No Direct Production LMS Single-Sign-On**: Authentication uses persona selection dropdowns suitable for standalone demonstration.
5. **No Production Plagiarism Verification**: RULE_PLAG_001 is a heuristic proxy (word-frequency ratio and sentence length); real deployment requires integration with an enterprise plagiarism API.

---

## 16. Scientific & Academic Disclaimer

This report details the architectural verification of the Formative Feedback Assistant prototype. While empirical calculations reflect real data generated by the running system, all participants and submissions are synthetic seed data. No claim is made regarding statistical generalizability to diverse university-wide populations until a randomized controlled trial with human students is conducted.
