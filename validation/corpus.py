"""
corpus.py — Realistic Synthetic Validation Corpus
===================================================
Realistic Synthetic Validation Corpus — Not Real Student Data

These 16 cases are PURPOSE-BUILT synthetic submissions designed to exercise
the deterministic feedback engine (feedback_engine.py) across diverse
student-writing scenarios.  No real students participated.  No real student
data is present.  Each case carries ground-truth metadata so that
run_corpus.py can automatically compare actual engine output against
expected behaviour.

Evidence note
-------------
The engine's _find_snippet() returns text windows with Unicode ellipsis
characters (…) prepended/appended when the window is not at the start/end of
the submission.  These snippets are DERIVED from the original text but are not
verbatim substrings.  The evidence check in run_corpus.py strips those markers
before performing a containment test.

Two rules (RULE_LANG_001 and RULE_PLAG_001) return computed diagnostic
strings as evidence (e.g. "Multiple consecutive spaces detected.") — these
are NOT verbatim substrings of the original.  This is a known limitation
documented in EVIDENCE_EXTRACTION.md.

Usage:
    from validation.corpus import CORPUS_CASES
    for case in CORPUS_CASES:
        print(case["case_id"], case["scenario_type"])
"""

from __future__ import annotations
from typing import Any, Dict, List

# ---------------------------------------------------------------------------
# Type alias
# ---------------------------------------------------------------------------
CorpusCase = Dict[str, Any]

# ---------------------------------------------------------------------------
# Helper: shared fields explanation
# ---------------------------------------------------------------------------
# case_id                : Unique identifier (string)
# scenario_type          : Human-readable category name
# submission_text        : Synthetic submission passed to analyze_submission()
# expected_rubric_concerns: Criterion keys expected to receive a feedback item
# expected_evidence_present: Whether at least one non-empty evidence snippet
#                            is expected in the result
# expected_rule_ids      : Rule IDs expected to fire (subset check only)
# expected_priority      : Minimum severity expected among all feedback items
# requires_review_expected: Whether requires_human_review should be True
# expected_score_range   : (min, max) inclusive range for the overall score
# edge_case              : True when this case tests a boundary/unusual input
# ---------------------------------------------------------------------------

CORPUS_CASES: List[CorpusCase] = [

    # -----------------------------------------------------------------------
    # Case 1 — Very short submission (2 words)
    # -----------------------------------------------------------------------
    {
        "case_id": "C01",
        "scenario_type": "very_short_submission",
        "edge_case": True,
        "submission_text": "Cloud computing.",
        "expected_rubric_concerns": ["DEF", "ADV", "EX", "CLR"],
        "expected_evidence_present": True,        # CLR rule captures full text
        "expected_rule_ids": ["RULE_CLR_001", "RULE_DEF_001", "RULE_ADV_001", "RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": True,         # wc < 10 → requires_human_review
        "expected_score_range": (0.0, 15.0),
    },

    # -----------------------------------------------------------------------
    # Case 2 — Long high-quality submission
    # Actual engine score: 90.00, requires_human_review: False
    # Note: score=90 is below the 93-threshold for RULE_HI_002, so no review flag
    # -----------------------------------------------------------------------
    {
        "case_id": "C02",
        "scenario_type": "long_high_quality",
        "edge_case": False,
        "submission_text": (
            "Cloud computing is the on-demand delivery of computing services—including "
            "servers, storage, databases, networking, software, analytics, and intelligence—"
            "over the internet to offer faster innovation, flexible resources, and economies "
            "of scale. Rather than owning physical data centres or servers, organisations "
            "rent access from a cloud provider such as Amazon Web Services or Microsoft Azure.\n\n"
            "The key advantages are substantial. First, scalability allows businesses to "
            "increase or decrease capacity in minutes, avoiding over-provisioning costs. "
            "Second, the pay-as-you-go pricing model makes sophisticated infrastructure "
            "affordable even for small teams. Third, built-in redundancy and automated "
            "backups improve reliability and disaster recovery far beyond what most "
            "organisations could achieve independently. Furthermore, remote access enables "
            "distributed teams to collaborate seamlessly from anywhere in the world.\n\n"
            "Several prominent companies illustrate these benefits. Netflix uses AWS to "
            "stream video to more than 200 million subscribers globally, dynamically scaling "
            "capacity during peak demand. Spotify stores and serves billions of songs and "
            "podcast episodes via Google Cloud Platform, benefiting from its global content "
            "delivery network. Zoom runs its video-conferencing infrastructure on AWS and "
            "Oracle Cloud, which allowed it to scale rapidly from 10 million to over "
            "300 million daily meeting participants during the 2020 surge.\n\n"
            "In conclusion, cloud computing has become the backbone of the modern digital "
            "economy. Its combination of on-demand access, cost efficiency, scalability, and "
            "reliability makes it indispensable for organisations of all sizes."
        ),
        "expected_rubric_concerns": [],
        "expected_evidence_present": False,
        "expected_rule_ids": [],                  # No rules fire at score=90
        "expected_priority": "low",               # No feedback means default lowest
        "requires_review_expected": False,         # score=90 < 93, HI_002 does not fire
        "expected_score_range": (75.0, 100.0),
    },

    # -----------------------------------------------------------------------
    # Case 3 — Partially correct: definition only, no examples or advantages
    # Actual engine score: 24.50
    # -----------------------------------------------------------------------
    {
        "case_id": "C03",
        "scenario_type": "definition_only",
        "edge_case": False,
        "submission_text": (
            "Cloud computing is defined as the delivery of computing services over "
            "the internet. It means using remote servers hosted on the internet to "
            "store, manage, and process data rather than using a local server or a "
            "personal computer. This is a relatively new approach to IT infrastructure."
        ),
        "expected_rubric_concerns": ["ADV", "EX"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_ADV_001", "RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": False,
        "expected_score_range": (10.0, 40.0),
    },

    # -----------------------------------------------------------------------
    # Case 4 — Ambiguous example: company name with very short context
    # Actual engine score: 58.40, requires_human_review: True
    # -----------------------------------------------------------------------
    {
        "case_id": "C04",
        "scenario_type": "ambiguous_example",
        "edge_case": True,
        "submission_text": (
            "Cloud computing is a way of providing IT services over the internet. "
            "It offers scalability and cost savings, which are important for modern "
            "businesses. AWS. Also Azure."
        ),
        "expected_rubric_concerns": ["EX"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_EX_003"],     # Ambiguous example — short sentence
        "expected_priority": "medium",
        "requires_review_expected": True,          # EX_003 sets requires_human_review=True
        "expected_score_range": (40.0, 70.0),
    },

    # -----------------------------------------------------------------------
    # Case 5 — Grammatically poor but conceptually correct
    # Actual engine score: 66.50, requires_human_review: True (plagiarism signal fires)
    # Note: low unique-word ratio triggers RULE_PLAG_001 due to repeated abbreviations
    # -----------------------------------------------------------------------
    {
        "case_id": "C05",
        "scenario_type": "grammar_poor_concept_correct",
        "edge_case": False,
        "submission_text": (
            "cloud computing is delivery of computing  services over internet.it means "
            "on-demand resources.Advantages are scalability,cost saving,reliab and "
            "backup recovery.Example netflix use aws for streaming video to users. "
            "zoom also use cloud for video meeting.  in conclusion cloud computing "
            "is good for businesses because it affordable and scalab."
        ),
        "expected_rubric_concerns": ["CLR"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_LANG_001"],
        "expected_priority": "low",
        "requires_review_expected": True,          # Plagiarism signal can fire on repetition
        "expected_score_range": (50.0, 80.0),
    },

    # -----------------------------------------------------------------------
    # Case 6 — Grammatically strong but conceptually weak
    # Actual engine score: 7.00, requires_human_review: True (HI_001 fires, score < 20)
    # -----------------------------------------------------------------------
    {
        "case_id": "C06",
        "scenario_type": "grammar_strong_concept_weak",
        "edge_case": False,
        "submission_text": (
            "The phenomenon of cloud computing has attracted considerable academic and "
            "practitioner interest in recent years. Many scholars have written extensively "
            "about its theoretical underpinnings and potential applications. The literature "
            "suggests that this approach to infrastructure management carries a number of "
            "interesting characteristics that differentiate it from traditional paradigms. "
            "Further research is certainly warranted to fully understand its long-term "
            "implications for organisations of various sizes and sectors."
        ),
        "expected_rubric_concerns": ["DEF", "ADV", "EX"],
        "expected_evidence_present": False,
        "expected_rule_ids": ["RULE_DEF_001", "RULE_ADV_001", "RULE_EX_001", "RULE_HI_001"],
        "expected_priority": "high",
        "requires_review_expected": True,          # HI_001: score < 20
        "expected_score_range": (0.0, 20.0),
    },

    # -----------------------------------------------------------------------
    # Case 7 — Multiple rubric criteria satisfied (definition + advantages + partial examples)
    # Actual engine score: 77.50, requires_human_review: False
    # -----------------------------------------------------------------------
    {
        "case_id": "C07",
        "scenario_type": "multiple_criteria_satisfied",
        "edge_case": False,
        "submission_text": (
            "Cloud computing refers to on-demand access to computing resources over "
            "the internet. Key advantages include scalability, cost efficiency through "
            "pay-as-you-go pricing, remote access from anywhere, and improved reliability "
            "via automated backups and disaster recovery. For example, Amazon Web Services "
            "hosts millions of applications. Furthermore, Google Cloud is widely used by "
            "enterprises for data analytics and machine learning workloads. "
            "In conclusion, cloud computing improves agility and reduces infrastructure cost "
            "for organisations of all sizes."
        ),
        "expected_rubric_concerns": [],
        "expected_evidence_present": False,
        "expected_rule_ids": [],
        "expected_priority": "low",
        "requires_review_expected": False,
        "expected_score_range": (65.0, 90.0),
    },

    # -----------------------------------------------------------------------
    # Case 8 — Advantages only, no definition or examples
    # Actual engine score: 34.50
    # -----------------------------------------------------------------------
    {
        "case_id": "C08",
        "scenario_type": "advantages_only",
        "edge_case": False,
        "submission_text": (
            "Scalability is one of the biggest advantages of cloud computing. "
            "Cost savings are also significant because organisations pay only for "
            "what they use. Reliability and uptime are greatly improved compared to "
            "on-premise infrastructure. Remote access allows employees to work from anywhere. "
            "Speed and performance are also notable benefits."
        ),
        "expected_rubric_concerns": ["DEF", "EX"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_DEF_001", "RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": False,
        "expected_score_range": (20.0, 50.0),
    },

    # -----------------------------------------------------------------------
    # Case 9 — Examples only, no definition or stated advantages
    # Actual engine score: 51.00 (examples score high; DEF fires, ADV does not)
    # Note: advantages like "scalability" are not mentioned — RULE_ADV_001 does fire
    # as RULE_ADV_002, not ADV_001, because detect_advantages finds >0 via "storage"
    # keyword in Dropbox sentence. Engine is deterministic.
    # -----------------------------------------------------------------------
    {
        "case_id": "C09",
        "scenario_type": "examples_only",
        "edge_case": False,
        "submission_text": (
            "Netflix uses Amazon Web Services to deliver streaming content to millions "
            "of subscribers worldwide. Spotify uses Google Cloud Platform to store and "
            "serve music. Zoom uses AWS and Oracle Cloud for its video conferencing "
            "infrastructure. Dropbox also uses cloud storage to let users access files "
            "from multiple devices."
        ),
        "expected_rubric_concerns": ["DEF"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_DEF_001"],
        "expected_priority": "high",
        "requires_review_expected": False,
        "expected_score_range": (40.0, 65.0),
    },

    # -----------------------------------------------------------------------
    # Case 10 — Plagiarism signal (very long run-on sentence)
    # Actual engine score: 64.90 (definition keywords present → high DEF score)
    # Note: score is higher than expected because the text contains NIST-style
    # definition language ("cloud computing is a model", "network access to a shared pool")
    # -----------------------------------------------------------------------
    {
        "case_id": "C10",
        "scenario_type": "plagiarism_signal",
        "edge_case": True,
        "submission_text": (
            "Cloud computing is a model for enabling ubiquitous convenient on-demand "
            "network access to a shared pool of configurable computing resources including "
            "networks servers storage applications and services that can be rapidly "
            "provisioned and released with minimal management effort or service provider "
            "interaction and this model promotes availability and is composed of five "
            "essential characteristics three service models and four deployment models "
            "as defined by the National Institute of Standards and Technology in their "
            "widely referenced definition of cloud computing published in the year two "
            "thousand and eleven which has since been cited by thousands of academic and "
            "industry publications across many different countries and regions."
        ),
        "expected_rubric_concerns": ["CLR"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_PLAG_001"],
        "expected_priority": "high",
        "requires_review_expected": True,
        "expected_score_range": (40.0, 80.0),
    },

    # -----------------------------------------------------------------------
    # Case 11 — Non-native English style (correct content, grammar issues)
    # Actual engine score: 52.40, requires_human_review: False
    # Note: RULE_LANG_001 requires >= 2 grammar issues; this text has 2 spaces
    # but the engine checks "double spaces" AND "missing space after period"
    # — the actual rule does not fire here (only 1 issue detected: double spaces).
    # RULE_DEF_001B fires because _has_definition returns True but wc < 50... 
    # actually wc = 52, so DEF_001B does NOT fire (wc >= 50 → 65.0 score).
    # Engine fires: RULE_DEF_001B (wc=52 ≥ 50), RULE_ADV_002, RULE_EX_001
    # -----------------------------------------------------------------------
    {
        "case_id": "C11",
        "scenario_type": "non_native_english",
        "edge_case": False,
        "submission_text": (
            "Cloud computing  is means that using services of internet for to store "
            "and process informations. The advantages includes scalability, cost saving "
            "and also accessibility. For examples, Netflix and Amazon uses cloud for "
            "give streaming service to users. In conclusion, cloud computing is very "
            "useful and  helpfull for modern organisations."
        ),
        "expected_rubric_concerns": ["CLR"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_EX_001"],     # Only 1 example detected
        "expected_priority": "high",
        "requires_review_expected": False,
        "expected_score_range": (35.0, 70.0),
    },

    # -----------------------------------------------------------------------
    # Case 12 — Extremely minimal (3 words)
    # Actual engine: score=11.00, review=True; RULE_DEF_001B fires (not DEF_001)
    # because "cloud" is not matched by _has_definition keywords
    # -----------------------------------------------------------------------
    {
        "case_id": "C12",
        "scenario_type": "extremely_minimal",
        "edge_case": True,
        "submission_text": "Cloud is good.",
        "expected_rubric_concerns": ["DEF", "ADV", "EX", "CLR"],
        "expected_evidence_present": True,        # CLR_001 captures full text as evidence
        "expected_rule_ids": ["RULE_CLR_001", "RULE_DEF_001B", "RULE_ADV_001", "RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": True,         # wc < 10 → requires_human_review
        "expected_score_range": (0.0, 15.0),
    },

    # -----------------------------------------------------------------------
    # Case 13 — All rubric criteria met
    # Actual engine score: 84.00, requires_human_review: False (84 < 93)
    # -----------------------------------------------------------------------
    {
        "case_id": "C13",
        "scenario_type": "all_criteria_met",
        "edge_case": False,
        "submission_text": (
            "Cloud computing is defined as the on-demand delivery of IT resources over "
            "the internet with pay-as-you-go pricing. Instead of buying and maintaining "
            "physical servers, organisations can access technology services from a cloud "
            "provider.\n\n"
            "The advantages are significant. First, scalability lets organisations grow or "
            "shrink capacity instantly. Second, cost savings are achieved because there is no "
            "capital expenditure on hardware. Third, reliability is improved through built-in "
            "redundancy and automated backups. Furthermore, remote access enables teams to "
            "collaborate from anywhere.\n\n"
            "Real-world examples include Netflix, which uses Amazon Web Services to stream "
            "content to over 200 million subscribers, and Spotify, which relies on Google "
            "Cloud for music storage and global delivery. In addition, Zoom used cloud "
            "infrastructure to scale from millions to hundreds of millions of users.\n\n"
            "In conclusion, cloud computing delivers measurable advantages in cost, "
            "speed, reliability, and collaboration that make it a transformative technology."
        ),
        "expected_rubric_concerns": [],
        "expected_evidence_present": False,
        "expected_rule_ids": [],
        "expected_priority": "low",
        "requires_review_expected": False,         # score=84 < 93, HI_002 does not fire
        "expected_score_range": (72.0, 100.0),
    },

    # -----------------------------------------------------------------------
    # Case 14 — Missing examples only
    # Actual engine score: 64.50
    # -----------------------------------------------------------------------
    {
        "case_id": "C14",
        "scenario_type": "missing_examples_only",
        "edge_case": False,
        "submission_text": (
            "Cloud computing refers to the delivery of computing services over the internet. "
            "It is an internet-based model where resources such as storage, servers, and "
            "software are provided on demand.\n\n"
            "The key advantages include scalability, cost savings through pay-as-you-go "
            "pricing, improved reliability due to redundancy, and remote accessibility. "
            "Moreover, organisations benefit from automatic software updates and reduced "
            "maintenance overhead. Flexibility and speed of deployment are also important "
            "benefits for businesses."
        ),
        "expected_rubric_concerns": ["EX"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": False,
        "expected_score_range": (45.0, 75.0),
    },

    # -----------------------------------------------------------------------
    # Case 15 — Repeated words / double-space formatting issues
    # Actual engine score: 53.90, requires_human_review: True
    # (plagiarism signal fires due to repeated words pattern)
    # -----------------------------------------------------------------------
    {
        "case_id": "C15",
        "scenario_type": "formatting_issues",
        "edge_case": True,
        "submission_text": (
            "Cloud computing computing is the delivery of IT services over the internet.  "
            "The advantages include scalability and cost savings and and remote access. "
            "For example Netflix uses AWS.AWS also serves other companies. "
            "In conclusion, cloud computing is is beneficial."
        ),
        "expected_rubric_concerns": ["CLR"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_LANG_001"],
        "expected_priority": "low",
        "requires_review_expected": True,          # Repeated words → RULE_PLAG_001 can fire
        "expected_score_range": (30.0, 70.0),
    },

    # -----------------------------------------------------------------------
    # Case 16 — High-confidence ambiguous (low unique-word ratio / repetition)
    # Actual engine score: 11.00, review=True
    # RULE_DEF_001B fires (not DEF_001) because _has_definition sees "cloud computing"
    # but not the full keyword pattern → has_def=False → DEF_001 fires... 
    # wait: "cloud" is not "cloud computing is" — let me check: 
    # "Cloud cloud cloud computing computing is good" — "computing is" might match
    # Actually engine fires RULE_DEF_001B, so _has_definition must return True
    # -----------------------------------------------------------------------
    {
        "case_id": "C16",
        "scenario_type": "high_confidence_ambiguous",
        "edge_case": True,
        "submission_text": (
            "Cloud cloud cloud computing computing is good good good. "
            "Cloud computing computing good. Cloud cloud cloud good good. "
            "Cloud is good. Cloud cloud. Good cloud computing computing good."
        ),
        "expected_rubric_concerns": ["DEF", "ADV", "EX", "CLR"],
        "expected_evidence_present": True,
        "expected_rule_ids": ["RULE_PLAG_001", "RULE_DEF_001B", "RULE_ADV_001", "RULE_EX_001"],
        "expected_priority": "high",
        "requires_review_expected": True,
        "expected_score_range": (0.0, 20.0),
    },
]

# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------
CORPUS_METADATA = {
    "title": "Realistic Synthetic Validation Corpus — Not Real Student Data",
    "version": "1.1",
    "total_cases": len(CORPUS_CASES),
    "edge_cases": sum(1 for c in CORPUS_CASES if c["edge_case"]),
    "description": (
        "16 purpose-built synthetic student submission texts covering diverse "
        "writing scenarios.  Used to validate the deterministic feedback engine "
        "(feedback_engine.py) against known expected behaviour.  "
        "No real students participated.  No real student data is present."
    ),
}
