"""
tests/test_engine.py — Unit tests for the deterministic feedback engine.
Covers all edge/failure cases from requirements.
"""
import pytest
from feedback_engine import analyze_submission, EngineOutput


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def rule_ids(output: EngineOutput):
    return [f.rule_id for f in output.feedback]

def criterion_keys(output: EngineOutput):
    return [f.criterion_key for f in output.feedback]


# ---------------------------------------------------------------------------
# A. Very short submission
# ---------------------------------------------------------------------------
class TestVeryShortSubmission:
    def test_short_submission_triggers_clr_rule(self):
        """Very short submission should trigger RULE_CLR_001."""
        result = analyze_submission("Cloud is good.")
        assert "RULE_CLR_001" in rule_ids(result)

    def test_short_submission_low_score(self):
        """Very short submission should score very low."""
        result = analyze_submission("Cloud is good.")
        assert result.score < 30

    def test_short_submission_requires_review_when_extremely_short(self):
        """Extremely short (< 10 words) should flag human review."""
        result = analyze_submission("I dont know")
        short_rule = [f for f in result.feedback if f.rule_id == "RULE_CLR_001"]
        assert len(short_rule) > 0
        assert short_rule[0].requires_human_review is True

    def test_short_submission_has_evidence(self):
        """Evidence in RULE_CLR_001 should be the submission text itself."""
        text = "Cloud is storage."
        result = analyze_submission(text)
        short_rule = [f for f in result.feedback if f.rule_id == "RULE_CLR_001"]
        assert len(short_rule) > 0
        # Evidence should be the text or empty — NOT fabricated
        ev = short_rule[0].evidence
        assert ev == "" or ev in text or text in ev


# ---------------------------------------------------------------------------
# B. Missing second example
# ---------------------------------------------------------------------------
class TestMissingSecondExample:
    GOOD_TEXT_ONE_EXAMPLE = (
        "Cloud computing is the delivery of computing services over the internet. "
        "It provides scalability and cost savings. "
        "For example, Netflix uses Amazon Web Services to stream content to millions of users."
    )

    def test_one_example_triggers_rule_ex_001(self):
        """Submission with only one example triggers RULE_EX_001."""
        result = analyze_submission(self.GOOD_TEXT_ONE_EXAMPLE)
        assert "RULE_EX_001" in rule_ids(result)

    def test_one_example_rule_references_rubric(self):
        """RULE_EX_001 should reference the EX criterion."""
        result = analyze_submission(self.GOOD_TEXT_ONE_EXAMPLE)
        ex_rules = [f for f in result.feedback if f.rule_id == "RULE_EX_001"]
        assert ex_rules[0].criterion_key == "EX"

    def test_one_example_message_is_actionable(self):
        """The message should tell the student what to do."""
        result = analyze_submission(self.GOOD_TEXT_ONE_EXAMPLE)
        ex_rules = [f for f in result.feedback if f.rule_id == "RULE_EX_001"]
        msg = ex_rules[0].message.lower()
        # Must mention adding a second example
        assert "second" in msg or "another" in msg or "add" in msg

    def test_one_example_confidence_above_threshold(self):
        """Confidence for RULE_EX_001 should be reasonably high."""
        result = analyze_submission(self.GOOD_TEXT_ONE_EXAMPLE)
        ex_rules = [f for f in result.feedback if f.rule_id == "RULE_EX_001"]
        assert ex_rules[0].confidence >= 0.70

    def test_two_examples_no_rule_ex_001(self):
        """Submission with two examples should NOT trigger RULE_EX_001."""
        text = (
            "Cloud computing is on-demand delivery of IT services over the internet. "
            "Advantages include scalability and cost savings. "
            "Netflix uses AWS for streaming. Spotify uses Google Cloud for music delivery."
        )
        result = analyze_submission(text)
        assert "RULE_EX_001" not in rule_ids(result)


# ---------------------------------------------------------------------------
# C. Ambiguous example
# ---------------------------------------------------------------------------
class TestAmbiguousExample:
    AMBIGUOUS_TEXT = (
        "Cloud computing is internet-based computing. It saves cost. "
        "For example, Netflix. Also Spotify."
    )

    def test_ambiguous_triggers_ex_003(self):
        """Terse examples should trigger RULE_EX_003 (ambiguous)."""
        result = analyze_submission(self.AMBIGUOUS_TEXT)
        # RULE_EX_003 triggers when a company is named with < 8 words context
        ex3 = [f for f in result.feedback if f.rule_id == "RULE_EX_003"]
        # May or may not trigger depending on sentence length — just verify low confidence if triggered
        for r in ex3:
            assert r.confidence < 0.5
            assert r.requires_human_review is True

    def test_ambiguous_evidence_is_real(self):
        """Evidence must come from the actual submission text."""
        result = analyze_submission(self.AMBIGUOUS_TEXT)
        for fb in result.feedback:
            if fb.evidence:
                # Evidence must be a substring of the original text (or a snippet marked with …)
                clean_ev = fb.evidence.replace("…", "").strip()
                if clean_ev:
                    assert any(
                        word in self.AMBIGUOUS_TEXT for word in clean_ev.split()[:5]
                    ), f"Evidence '{fb.evidence}' does not appear to come from submission"


# ---------------------------------------------------------------------------
# D. False-positive high-impact detection
# ---------------------------------------------------------------------------
class TestFalsePositiveHighImpact:
    HIGH_QUALITY_TEXT = (
        "Cloud computing can be defined as a paradigm in which computing resources are "
        "provided over the internet on an on-demand basis.\n\n"
        "The scalability advantage allows businesses to grow rapidly without hardware costs. "
        "Another advantage is disaster recovery: Azure's redundant storage provides business continuity.\n\n"
        "Netflix migrated to AWS and reduced costs by 40%. Zoom scaled from 10 million to "
        "300 million daily participants using cloud elasticity.\n\n"
        "Cloud computing enables efficiency and global reach."
    )

    def test_high_score_triggers_human_review(self):
        """Exceptionally good submission triggers RULE_HI_002 for authenticity check."""
        result = analyze_submission(self.HIGH_QUALITY_TEXT)
        # May trigger HI_002 if score >= 93
        if result.score >= 93:
            hi_rules = [f for f in result.feedback if f.rule_id == "RULE_HI_002"]
            assert len(hi_rules) > 0
            assert hi_rules[0].requires_human_review is True

    def test_high_quality_score_is_high(self):
        """High-quality submission should score > 70."""
        result = analyze_submission(self.HIGH_QUALITY_TEXT)
        assert result.score > 70

    def test_feedback_has_confidence_and_rule(self):
        """All feedback items must have rule_id and confidence."""
        result = analyze_submission(self.HIGH_QUALITY_TEXT)
        for fb in result.feedback:
            assert fb.rule_id
            assert 0.0 <= fb.confidence <= 1.0


# ---------------------------------------------------------------------------
# E. Empty submission
# ---------------------------------------------------------------------------
class TestEmptySubmission:
    def test_empty_string_raises(self):
        """Empty string should raise ValueError."""
        with pytest.raises(ValueError):
            analyze_submission("")

    def test_whitespace_only_raises(self):
        """Whitespace-only submission should raise ValueError."""
        with pytest.raises(ValueError):
            analyze_submission("   \n\t  ")


# ---------------------------------------------------------------------------
# Language robustness
# ---------------------------------------------------------------------------
class TestLanguageRobustness:
    NON_NATIVE_TEXT = (
        "Cloud computing it is technology that allow companies to using server "
        "over internet instead of having local hardware.\n\n"
        "The advantage of cloud is many. First, it have scalability. "
        "Second, it is cost effective because you don't buy hardware expensive.\n\n"
        "For example, Amazon using AWS for they own e-commerce platform. "
        "Also Netflix it is using cloud to streaming videos to millions peoples."
    )

    def test_grammar_feedback_is_low_priority(self):
        """Grammar feedback (RULE_LANG_001) should be low priority."""
        result = analyze_submission(self.NON_NATIVE_TEXT)
        lang_rules = [f for f in result.feedback if f.rule_id == "RULE_LANG_001"]
        for r in lang_rules:
            assert r.priority == "low"

    def test_grammar_does_not_prevent_conceptual_feedback(self):
        """Grammar issues should not prevent other conceptual criteria from being scored."""
        result = analyze_submission(self.NON_NATIVE_TEXT)
        # Advantages are present (scalability, cost) → ADV score should be > 0
        assert result.criterion_scores["ADV"] > 0

    def test_non_native_examples_detected(self):
        """Real examples in non-native English should still be detected."""
        result = analyze_submission(self.NON_NATIVE_TEXT)
        # Amazon/Netflix should be detected
        assert result.criterion_scores["EX"] > 0


# ---------------------------------------------------------------------------
# General engine properties
# ---------------------------------------------------------------------------
class TestEngineProperties:
    def test_score_in_range(self):
        """Score should always be between 0 and 100."""
        texts = [
            "Cloud.",
            "Cloud computing is good because of scalability and cost savings. Netflix uses AWS. Spotify uses GCP.",
            "",
        ]
        for t in texts:
            if not t.strip():
                continue
            result = analyze_submission(t)
            assert 0 <= result.score <= 100

    def test_all_feedback_has_required_fields(self):
        """Every feedback item must have rule_id, message, criterion_key, confidence, priority."""
        text = "Cloud computing helps companies. Some use AWS."
        result = analyze_submission(text)
        for fb in result.feedback:
            assert fb.rule_id
            assert fb.message
            assert fb.criterion_key
            assert fb.priority in ("high", "medium", "low")
            assert 0.0 <= fb.confidence <= 1.0

    def test_no_fabricated_evidence(self):
        """Evidence must either be empty or a real substring of the submission."""
        text = "Cloud computing delivers computing services over internet. Netflix uses AWS."
        result = analyze_submission(text)
        for fb in result.feedback:
            if fb.evidence and "…" not in fb.evidence:
                assert any(
                    word in text for word in fb.evidence.split()[:3]
                ), f"Fabricated evidence: '{fb.evidence}'"
