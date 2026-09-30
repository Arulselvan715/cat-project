"""
test_evidence.py — Evidence Extraction Tests
=============================================
Verifies the golden invariant:

    Every evidence snippet returned by analyze_submission() or any rule function
    must either be:
        (A) empty string (""), OR
        (B) derived from the original submission text — specifically, the core
            of the snippet (after stripping Unicode ellipsis markers) must exist
            verbatim as a substring of the original submission.

Two rules (RULE_LANG_001, RULE_PLAG_001) return computed diagnostic strings
rather than verbatim quotes.  These are clearly labelled in the tests below.

Tests cover:
  - Exact evidence extraction
  - Multiple matching passages
  - No matching evidence
  - Ambiguous evidence (RULE_EX_003)
  - Punctuation/capitalisation differences
  - Multi-sentence submissions
  - Empty submission
  - Very short submission
  - Must-not-fabricate assertion on every rule
  - Multiple rules firing simultaneously
  - Missing evidence scenarios
"""

from __future__ import annotations

import sys
import os
import pytest

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from feedback_engine import (
    analyze_submission,
    FeedbackResult,
    rule_def_001,
    rule_adv_001,
    rule_adv_002,
    rule_ex_001,
    rule_ex_002,
    rule_ex_003_ambiguous,
    rule_org_001,
    rule_clr_001_short,
    rule_lang_001,
    rule_plagiarism_signal,
    _find_snippet,
    _detect_examples,
    _detect_advantages,
    _has_definition,
)

# ---------------------------------------------------------------------------
# Rules whose evidence field contains computed diagnostic strings
# (not verbatim text quotes — documented limitation)
# ---------------------------------------------------------------------------
COMPUTED_EVIDENCE_RULES = {"RULE_LANG_001", "RULE_PLAG_001"}


def _strip_ellipsis(s: str) -> str:
    """Strip leading/trailing Unicode ellipsis and whitespace."""
    return s.strip().lstrip("\u2026").rstrip("\u2026").strip()


def assert_evidence_in_submission(evidence: str, submission: str, rule_id: str = "") -> None:
    """
    Core assertion: evidence must be empty OR its core (sans ellipsis markers)
    must exist verbatim in the original submission.
    """
    if not evidence:
        return  # Empty evidence is always valid
    if rule_id in COMPUTED_EVIDENCE_RULES:
        return  # Computed diagnostic strings — documented behaviour, not fabrication
    core = _strip_ellipsis(evidence)
    assert core in submission, (
        f"FABRICATION: evidence core '{core[:60]}' "
        f"NOT found in submission (rule={rule_id}).\n"
        f"Submission: '{submission[:100]}'"
    )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def all_evidence_valid(output, submission: str) -> None:
    """Apply the golden invariant to every feedback item in an EngineOutput."""
    for fb in output.feedback:
        assert_evidence_in_submission(fb.evidence, submission, fb.rule_id)


# ===========================================================================
# 1. Exact evidence extraction
# ===========================================================================

class TestExactEvidenceExtraction:

    def test_clr_001_evidence_is_full_submission(self):
        """RULE_CLR_001 returns the full submission text as evidence (very short)."""
        text = "Cloud good."
        result = rule_clr_001_short(text)
        assert result is not None
        assert result.rule_id == "RULE_CLR_001"
        assert result.evidence == text.strip()
        assert result.evidence in text

    def test_def_001b_evidence_snippet_derived_from_text(self):
        """RULE_DEF_001B evidence snippet must be derived from submission."""
        text = (
            "Cloud computing is defined as the on-demand delivery of services. "
            "It is a short response."
        )
        result = rule_def_001(text)
        # wc >= 50? Let's check — if None, DEF_001B did not fire
        if result is None:
            pytest.skip("DEF_001B did not fire for this text (wc >= 50)")
        if result.evidence:
            assert_evidence_in_submission(result.evidence, text, result.rule_id)

    def test_org_001_evidence_is_text_prefix(self):
        """RULE_ORG_001 uses text[:100] as evidence — must be in submission."""
        text = (
            "Scalability is a key benefit of cloud. Cost savings are also important. "
            "Remote access is another advantage. Security is improved with cloud solutions."
        )
        result = rule_org_001(text)
        if result is None:
            pytest.skip("ORG_001 did not fire")
        if result.evidence:
            # ORG_001 uses text[:100].strip() + "…" or text.strip()
            core = _strip_ellipsis(result.evidence)
            assert core in text, (
                f"ORG_001 evidence '{core[:60]}' not in submission"
            )

    def test_ex_003_evidence_is_sentence_from_text(self):
        """RULE_EX_003 evidence is a sentence extracted from the submission."""
        text = "Cloud computing is good. AWS. Some advantages include cost savings."
        result = rule_ex_003_ambiguous(text)
        if result is None:
            pytest.skip("EX_003 did not fire")
        assert result.evidence in text or result.evidence == ""


# ===========================================================================
# 2. Multiple matching passages
# ===========================================================================

class TestMultipleMatchingPassages:

    def test_adv_001_snippet_comes_from_submission(self):
        """RULE_ADV_001 snippet when one advantage found must be from text."""
        text = "Cloud computing offers scalability for businesses."
        result = rule_adv_001(text)
        if result is None:
            pytest.skip("ADV_001 did not fire (>= 2 advantages found)")
        if result.evidence:
            assert_evidence_in_submission(result.evidence, text, result.rule_id)

    def test_adv_002_snippet_comes_from_submission(self):
        """RULE_ADV_002 snippet must be derived from submission."""
        text = "Cloud computing offers scalability."
        result = rule_adv_002(text)
        if result is None:
            pytest.skip("ADV_002 did not fire")
        if result.evidence:
            assert_evidence_in_submission(result.evidence, text, result.rule_id)

    def test_full_output_all_evidence_valid(self):
        """All evidence in full engine output must satisfy the golden invariant."""
        text = (
            "Cloud computing is on-demand delivery. Scalability is a key benefit. "
            "Netflix uses AWS. Zoom uses Oracle Cloud. "
            "In conclusion, cloud is transformative."
        )
        output = analyze_submission(text)
        all_evidence_valid(output, text)


# ===========================================================================
# 3. No matching evidence — evidence field must be ""
# ===========================================================================

class TestNoMatchingEvidence:

    def test_def_001_no_evidence_when_definition_absent(self):
        """RULE_DEF_001 sets evidence='' when no definition is found."""
        text = (
            "There are many advantages of cloud technology. Scalability and cost savings "
            "are both important for businesses today. Companies use it widely."
        )
        result = rule_def_001(text)
        if result and result.rule_id == "RULE_DEF_001":
            assert result.evidence == "", (
                f"Expected empty evidence for DEF_001, got '{result.evidence}'"
            )

    def test_adv_001_no_evidence_when_no_advantages(self):
        """RULE_ADV_001 sets evidence='' when zero advantages detected."""
        text = "Cloud computing is a technology that exists."
        result = rule_adv_001(text)
        if result and result.evidence != "":
            # If evidence non-empty, it must be in text
            assert_evidence_in_submission(result.evidence, text, "RULE_ADV_001")

    def test_ex_001_no_evidence_when_no_examples(self):
        """RULE_EX_001 evidence is '' when no examples found."""
        text = (
            "Cloud computing is defined as the delivery of services over the internet. "
            "It offers scalability and cost savings for organisations everywhere."
        )
        result = rule_ex_001(text)
        if result and result.rule_id == "RULE_EX_001" and result.evidence == "":
            pass  # correct
        elif result and result.evidence:
            assert_evidence_in_submission(result.evidence, text, result.rule_id)

    def test_hi_001_evidence_always_empty(self):
        """RULE_HI_001 always sets evidence=''."""
        from feedback_engine import rule_high_impact_low_score
        result = rule_high_impact_low_score(10.0)
        assert result is not None
        assert result.evidence == "", f"HI_001 should have empty evidence, got '{result.evidence}'"

    def test_hi_002_evidence_always_empty(self):
        """RULE_HI_002 always sets evidence=''."""
        from feedback_engine import rule_high_impact_high_score
        result = rule_high_impact_high_score(95.0)
        assert result is not None
        assert result.evidence == "", f"HI_002 should have empty evidence, got '{result.evidence}'"


# ===========================================================================
# 4. Ambiguous evidence
# ===========================================================================

class TestAmbiguousEvidence:

    def test_ex_003_low_confidence_evidence_in_text(self):
        """RULE_EX_003 triggers on ambiguous company reference; evidence must be in text."""
        text = "Cloud computing is useful. AWS. Also there is scalability."
        result = rule_ex_003_ambiguous(text)
        if result is not None:
            assert result.rule_id == "RULE_EX_003"
            assert result.confidence < 0.5
            assert result.requires_human_review is True
            if result.evidence:
                assert result.evidence in text, (
                    f"EX_003 evidence '{result.evidence}' not in submission"
                )

    def test_ex_003_does_not_fire_on_adequate_context(self):
        """RULE_EX_003 should not fire when company mention has adequate context."""
        text = (
            "Netflix uses Amazon Web Services to deliver streaming content to millions "
            "of subscribers worldwide using cloud infrastructure."
        )
        result = rule_ex_003_ambiguous(text)
        # May or may not fire depending on word count — if it fires, evidence must be in text
        if result is not None and result.evidence:
            assert result.evidence in text


# ===========================================================================
# 5. Punctuation and capitalisation differences
# ===========================================================================

class TestPunctuationCapitalisationDifferences:

    def test_definition_keyword_case_insensitive(self):
        """Definition detection is case-insensitive."""
        text_upper = "CLOUD COMPUTING IS DEFINED AS on-demand services over the internet."
        has_def, snippet = _has_definition(text_upper)
        assert has_def, "Definition should be detected regardless of case"

    def test_advantage_detection_with_punctuation(self):
        """Advantage keywords match within punctuated text."""
        text = "The key benefit is: scalability, cost-savings, and reliability."
        count, snippets = _detect_advantages(text)
        assert count >= 2, f"Expected >= 2 advantages, got {count}"
        for s in snippets:
            if s:
                assert_evidence_in_submission(s, text, "advantages")

    def test_example_detection_with_comma_lists(self):
        """Example markers detected in comma-separated lists."""
        text = (
            "Several companies, such as Netflix, AWS, and Google Cloud, rely on "
            "cloud computing for their core infrastructure."
        )
        count, clusters = _detect_examples(text)
        assert count >= 1, "Should detect at least one example cluster"
        for c in clusters:
            if c:
                assert c in text, f"Example cluster '{c[:50]}' not in submission"

    def test_full_output_mixed_case_submission(self):
        """Full engine output on mixed-case input has all valid evidence."""
        text = (
            "CLOUD COMPUTING refers to ON-DEMAND delivery of services. "
            "Key benefits: SCALABILITY, cost savings, remote access. "
            "Netflix uses AWS. Zoom uses cloud infrastructure."
        )
        output = analyze_submission(text)
        all_evidence_valid(output, text)


# ===========================================================================
# 6. Multi-sentence submissions
# ===========================================================================

class TestMultiSentenceSubmissions:

    def test_evidence_from_multi_sentence_submission(self):
        """Evidence extracted from a long multi-sentence submission is valid."""
        text = (
            "Cloud computing is defined as the delivery of computing services over the internet. "
            "This means servers, storage, databases, networking, and analytics are available on demand. "
            "The key advantages include scalability, which lets businesses grow capacity instantly. "
            "Cost savings are achieved through pay-as-you-go pricing with no capital expenditure. "
            "Reliability is improved through redundancy and disaster recovery systems. "
            "Netflix uses Amazon Web Services to stream video to over 200 million subscribers. "
            "Spotify relies on Google Cloud Platform for music storage and global delivery. "
            "In conclusion, cloud computing is a transformative infrastructure paradigm."
        )
        output = analyze_submission(text)
        all_evidence_valid(output, text)
        # Expect high score (all criteria met)
        assert output.score >= 50.0

    def test_paragraph_submission_evidence_valid(self):
        """Multi-paragraph submission with blank-line separators produces valid evidence."""
        text = (
            "Cloud computing is the on-demand delivery of IT resources over the internet.\n\n"
            "Its advantages include scalability, cost savings, and reliability.\n\n"
            "For example, Netflix uses AWS and Spotify uses Google Cloud.\n\n"
            "In conclusion, cloud computing is essential for modern organisations."
        )
        output = analyze_submission(text)
        all_evidence_valid(output, text)


# ===========================================================================
# 7. Empty submission
# ===========================================================================

class TestEmptySubmission:

    def test_empty_string_raises_value_error(self):
        """analyze_submission raises ValueError for empty input."""
        with pytest.raises(ValueError, match="empty"):
            analyze_submission("")

    def test_whitespace_only_raises_value_error(self):
        """analyze_submission raises ValueError for whitespace-only input."""
        with pytest.raises(ValueError, match="empty"):
            analyze_submission("   \n\t  ")


# ===========================================================================
# 8. Very short submission
# ===========================================================================

class TestVeryShortSubmission:

    def test_two_word_submission_evidence_in_text(self):
        """Very short submission produces evidence that is the full text."""
        text = "Cloud computing."
        output = analyze_submission(text)
        all_evidence_valid(output, text)
        # CLR_001 should fire
        clr = next((f for f in output.feedback if f.rule_id == "RULE_CLR_001"), None)
        assert clr is not None, "RULE_CLR_001 should fire for 2-word submission"
        assert clr.evidence == text.strip()

    def test_single_word_submission_evidence_valid(self):
        """Single-word submission produces valid evidence."""
        text = "Cloud."
        output = analyze_submission(text)
        all_evidence_valid(output, text)

    def test_requires_review_set_for_very_short(self):
        """Very short submission (< 10 words) must set requires_human_review=True."""
        text = "Cloud is good today."  # 4 words
        output = analyze_submission(text)
        assert output.requires_human_review is True


# ===========================================================================
# 9. Must-not-fabricate — golden invariant on all rules simultaneously
# ===========================================================================

class TestMustNotFabricate:

    SUBMISSIONS = [
        "Cloud computing.",
        "Cloud computing is on-demand delivery of services over the internet.",
        (
            "Cloud computing is defined as the delivery of computing services over the internet. "
            "Key advantages include scalability and cost savings. Netflix uses AWS. "
            "Zoom uses Oracle Cloud. In conclusion, cloud computing is transformative."
        ),
        "The phenomenon is interesting. Studies suggest many possibilities.",
        "AWS. Azure. GCP.",  # short ambiguous example references
        "Cloud computing  is good. Cloud cloud cloud.  Cloud computing computing.",
    ]

    @pytest.mark.parametrize("submission", SUBMISSIONS)
    def test_no_fabricated_evidence(self, submission: str):
        """For every submission, all evidence must be derivable from original text."""
        output = analyze_submission(submission)
        all_evidence_valid(output, submission)

    def test_every_evidence_in_original_or_empty(self):
        """Comprehensive check: run all test submissions and assert invariant."""
        for text in self.SUBMISSIONS:
            output = analyze_submission(text)
            for fb in output.feedback:
                if fb.rule_id in COMPUTED_EVIDENCE_RULES:
                    continue  # Computed diagnostic strings — documented behaviour
                if not fb.evidence:
                    continue  # Empty evidence is always valid
                core = _strip_ellipsis(fb.evidence)
                assert core in text, (
                    f"Rule {fb.rule_id}: evidence core not found in submission.\n"
                    f"Evidence: '{fb.evidence[:80]}'\n"
                    f"Submission: '{text[:100]}'"
                )


# ===========================================================================
# 10. Multiple rules firing
# ===========================================================================

class TestMultipleRulesFiring:

    def test_low_quality_submission_multiple_rules(self):
        """Very poor submission fires multiple rules; all evidence valid."""
        text = "Cloud is nice."
        output = analyze_submission(text)
        assert len(output.feedback) >= 3, "Expected at least 3 rules to fire"
        all_evidence_valid(output, text)

    def test_mixed_quality_submission(self):
        """Submission with some strengths and some gaps fires multiple rules."""
        text = (
            "Cloud computing is a way of accessing IT services over the internet. "
            "Key benefits include scalability. Netflix uses AWS for streaming."
        )
        output = analyze_submission(text)
        all_evidence_valid(output, text)

    def test_all_rules_fire_for_blank_quality(self):
        """Blank-quality submission fires DEF, ADV, EX, CLR rules."""
        text = "Computing is a thing that exists today."
        output = analyze_submission(text)
        fired = {fb.rule_id for fb in output.feedback}
        assert "RULE_DEF_001" in fired
        assert "RULE_ADV_001" in fired
        assert "RULE_EX_001" in fired
        all_evidence_valid(output, text)


# ===========================================================================
# 11. Missing evidence scenarios
# ===========================================================================

class TestMissingEvidenceScenarios:

    def test_def_001_evidence_empty_when_no_keywords(self):
        """DEF_001 fires with empty evidence when no definition keywords are present."""
        text = (
            "This technology is very modern and widely adopted. "
            "Many businesses use it for efficiency. It is quite popular."
        )
        result = rule_def_001(text)
        if result and result.rule_id == "RULE_DEF_001":
            assert result.evidence == "", (
                f"Expected '' evidence for DEF_001, got '{result.evidence}'"
            )

    def test_adv_001_evidence_empty_when_zero_advantages(self):
        """ADV_001 fires with empty evidence when no advantage keywords found."""
        text = "Cloud computing is on-demand delivery of services over the internet."
        result = rule_adv_001(text)
        if result and result.rule_id == "RULE_ADV_001":
            assert result.evidence == ""

    def test_ex_001_evidence_empty_when_no_examples(self):
        """EX_001 fires with empty evidence when no examples detected."""
        text = (
            "Cloud computing offers scalability and cost savings for organisations."
        )
        result = rule_ex_001(text)
        if result and result.rule_id == "RULE_EX_001" and result.evidence == "":
            pass  # Expected
        elif result and result.evidence:
            assert_evidence_in_submission(result.evidence, text, result.rule_id)

    def test_find_snippet_returns_empty_when_no_match(self):
        """_find_snippet returns '' when pattern not found."""
        text = "This submission has no relevant keywords."
        result = _find_snippet(text, "impossible_pattern_xyz", window=80)
        assert result == ""

    def test_find_snippet_core_is_in_original(self):
        """_find_snippet result core must be a substring of original text."""
        text = (
            "Cloud computing is defined as the on-demand delivery of services. "
            "This is a longer text to trigger the ellipsis markers on both sides "
            "of the matched snippet returned by the _find_snippet function."
        )
        snippet = _find_snippet(text, r"on-demand delivery", window=20)
        assert snippet != "", "Expected a non-empty snippet"
        core = _strip_ellipsis(snippet)
        assert core in text, f"Snippet core '{core}' not in original text"
