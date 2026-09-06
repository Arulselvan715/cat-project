# LIMITATIONS.md — Formative Feedback Assistant

## Known Limitations

### L-1: Heuristic-Based Detection
The feedback engine uses keyword matching and pattern detection, not deep semantic understanding.
- Example detection may miss unusual phrasing of real-world examples
- Advantage detection depends on keyword vocabulary; domain-specific synonyms may be missed
- Mitigation: rules are documented and testable; vocabulary can be extended

### L-2: Scoring Approximation
Criterion scores are approximate heuristics, not validated against human rubric ratings.
These scores correlate with rubric intent but have not been calibrated against expert human graders.
- Mitigation: store human-graded scores alongside automated scores for future calibration

### L-3: Language Scope
The feedback engine is calibrated for English. Non-English or code-switched submissions
may receive incorrect feedback.
- Mitigation: RULE_LANG_001 is informational and never reduces concept score

### L-4: Single Assignment
The current rubric and feedback rules are built for one assignment ("cloud computing essay").
Supporting multiple assignment types requires new rule sets per rubric.

### L-5: No Authentication
The prototype uses dropdown selection for student/mentor identity — no login system.
A production system would require authentication and role-based access control.

### L-6: Demo Metrics
All metric values in the dashboard are derived from seed data.
Feedback accuracy, usefulness, and calibration require a real controlled experiment.
These values are clearly labeled "DEMO DATA" throughout the interface and API responses.

### L-7: Plagiarism Detection
The plagiarism signal (RULE_PLAG_001) is a simple heuristic (long sentences, low unique-word ratio).
It should be treated as a signal for human review — not as a verdict.
A production system would integrate a dedicated plagiarism detection service.

### L-8: No LLM Integration
This prototype is entirely rule-based by design. An LLM can be added as an additional evidence
source (see ARCHITECTURE.md for the integration point) without replacing the rule layer.

## What This Is Not
- This is **not** a grading system. Scores are formative guides, not final grades.
- Feedback is **not** a replacement for instructor interaction.
- High-impact decisions are **never** final without human approval.
