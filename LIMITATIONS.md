# LIMITATIONS.md — Formative Feedback Assistant: Academic & Operational Limitations

This document provides a candid, academically rigorous accounting of the boundaries, constraints, and known limitations of the **Formative Feedback Assistant** prototype.

---

## 1. Prototype & Seed Data Constraints

### L-1: Seed / Demo Dataset Boundaries
All empirical observations, student essays, cohort metrics, and baseline-vs-treatment statistics in this repository are derived from seeded demonstration records (ackend/seed.py). 
- **Academic Disclaimer**: While these calculations verify the mathematical correctness of the analytics engine and the feasibility of the workflow, they **must not** be presented as findings from an unseeded, external human subject trial.
- **Sample Size**: The experiment cohort consists of 12 observations (5 Control, 7 Treatment). Large-scale statistical generalizations require testing across hundreds of unseeded submissions.

### L-2: Simulated Representative User Panel
User validation records recorded in the database reflect structured evaluations conducted with simulated representative student and mentor personas.
- No real-world university-wide student recruitment, external student consent forms, or formal IRB review protocols have been executed for this prototype.
- Usability ratings (e.g. 5.0 / 5.0) reflect persona walk-through checks and should be treated as functional interface verification rather than external statistical usability proof.

---

## 2. Rule Engine & Lexical Boundaries

### L-3: Keyword and Pattern-Based Heuristics
The core feedback engine uses deterministic keyword dictionaries, sentence structure checks, and regex matching:
- **Risk of False Negatives**: If a student expresses an advantage or concept using novel metaphors, colloquial phrasing, or technical jargon not included in the lexicon, the system may fail to detect the element.
- **Risk of False Positives**: Markdown header structures or stylistic formatting can occasionally confuse regex sentence boundaries.
- **Future Mitigation**: Integrating semantic embeddings (e.g. Sentence-BERT) or fine-tuned pedagogical natural language inference (NLI) models as a secondary verification pass while keeping the deterministic rule layer intact.

### L-4: Heuristic Proxy for Plagiarism Signals
The plagiarism trigger (RULE_PLAG_001) relies on a vocabulary diversity ratio and sentence length heuristic:
- It serves strictly as a flag to alert human instructors to review the text. It is **never** a final verdict.
- Production deployment would require integration with dedicated academic integrity services (e.g. Turnitin, CopyLeaks) rather than internal text heuristics.

---

## 3. Linguistic & Diversity Limitations

### L-5: English Language Calibration
The feedback rules and grammar checks (RULE_LANG_001) are calibrated specifically for English essays.
- The system is not currently localized or calibrated for multilingual submissions, non-Latin scripts, or code-switched text.
- While grammar notes are strictly isolated into low-priority informational cards to avoid penalizing ESL learners, severe syntax fragmentation may occasionally impair the keyword matcher's ability to identify underlying conceptual points.

---

## 4. Operational & Human Oversight Dependencies

### L-6: Mandatory Dependency on Human Mentors
The system's core safety guarantee rests on the **Human-in-the-Loop** requirement:
- When a submission receives an extreme score (<20 or >95), exhibits ambiguous context, or triggers a plagiarism warning, automated finalization is halted.
- If human mentors fail to triage the review queue promptly, student feedback for flagged items will remain in a pending state. The system is intentionally designed not to fail-open.

### L-7: Single-Assignment Scope
The current rule registry and rubric weights are tailored to an essay prompt on cloud computing.
- Extending the system to new assignments, disciplines, or project formats (e.g. coding assignments, lab reports) requires instructors or curriculum designers to define criteria, weights, minimum conditions, and keyword lexicons.

### L-8: Absence of Enterprise Authentication
The prototype uses persona dropdown switches for rapid demonstration across student and mentor roles.
- It does not implement OAuth2, SAML, or LTI (Learning Tools Interoperability) integration with Canvas, Blackboard, or Moodle. Role-based access control must be added prior to institutional rollout.

---

## 5. Summary: What This System Is and Is Not

| What It Is | What It Is Not |
|---|---|
| A formative, iterative guidance tool for students | A summative, high-stakes final grading engine |
| An explainable assistant with non-fabricated evidence | An ungrounded generative black-box |
| A triage workflow empowering human instructors | An autonomous replacement for educator judgment |
| A functional prototype verified against 42 requirements | A completed multi-institution clinical trial |
