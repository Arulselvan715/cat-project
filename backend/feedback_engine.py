"""
feedback_engine.py
==================
Deterministic, transparent, rule-based formative feedback engine.

Design goals
------------
* Every feedback item is fully explainable: rule_id + evidence + confidence.
* Evidence MUST be text that actually exists in the submission.
* Language/grammar problems are treated separately from conceptual problems.
* High-impact triggers always produce requires_human_review=True.
* An LLM can be added later as an ADDITIONAL evidence source without
  replacing this rule layer.

Architecture
------------
Each rule is a pure function:
    def rule_XXX(text: str, ctx: dict) -> Optional[FeedbackResult]

The engine iterates all active rules and collects results.
Scoring is done per-criterion based on rule hits.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FeedbackResult:
    rule_id: str
    criterion_key: str          # matches RubricCriterion.criterion_id
    message: str
    evidence: str               # exact substring from submission, or "" if none
    confidence: float           # 0.0 – 1.0
    priority: str               # "high" | "medium" | "low"
    requires_human_review: bool = False
    high_impact_reason: Optional[str] = None


@dataclass
class EngineOutput:
    score: float                          # 0 – 100
    criterion_scores: Dict[str, float]    # criterion_key → 0-100
    feedback: List[FeedbackResult] = field(default_factory=list)
    requires_human_review: bool = False
    high_impact_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Text utilities
# ---------------------------------------------------------------------------

CLOUD_PROVIDERS = [
    "aws", "amazon web services", "amazon",
    "azure", "microsoft azure",
    "google cloud", "gcp",
    "ibm cloud",
    "oracle cloud",
    "salesforce",
    "dropbox",
    "netflix",
    "spotify",
    "zoom",
    "slack",
    "github",
    "gitlab",
    "heroku",
]

ADVANTAGE_KEYWORDS = [
    "scalab", "elastic", "scale",
    "cost", "saving", "affordable", "cheap", "pay-as-you", "pay as you",
    "access", "anywhere", "remote",
    "reliab", "uptime", "availab",
    "secur", "backup", "recover", "disaster",
    "collaborat", "team", "share",
    "speed", "fast", "perform",
    "flexib",
    "mainten", "update", "patch",
    "innovat", "agil",
    "storage",
]

DEFINITION_KEYWORDS = [
    "cloud computing is", "cloud computing refers", "cloud is",
    "defined as", "definition", "means", "can be defined",
    "delivery of", "services over the internet", "internet-based",
    "on-demand", "remote server",
]

EXAMPLE_MARKERS = [
    r"\bfor example\b", r"\bfor instance\b", r"\bsuch as\b",
    r"\be\.g\.", r"\bi\.e\.", r"\blike\b",
    r"\bincluding\b", r"\bnamely\b",
    r"\bone example\b", r"\banother example\b",
    r"\ba real.world example\b",
    r"\bcase study\b",
    r"\bin practice\b",
    r"\bcompanies? (use|uses|used|like|such as)\b",
    r"\borganizations? (use|uses|like)\b",
    r"\buses?\b.*\bcloud\b",
]

ORGANIZATION_MARKERS = [
    r"\bintroduction\b", r"\bconclusion\b", r"\bin summary\b",
    r"\bfirst(ly)?\b", r"\bsecond(ly)?\b", r"\bthird(ly)?\b",
    r"\bfurthermore\b", r"\bmoreover\b", r"\bhowever\b",
    r"\bin addition\b", r"\bfinally\b", r"\boverall\b",
    r"\btherefore\b", r"\bthus\b", r"\bin conclusion\b",
    r"\bparagraph\b",
]

# Suspicious copy-paste patterns (very long identical sentences)
PLAGIARISM_THRESHOLD_WORDS = 50


def word_count(text: str) -> int:
    return len(text.split())


def sentence_count(text: str) -> int:
    return len(re.split(r'[.!?]+', text.strip()))


def _find_snippet(text: str, pattern: str, window: int = 80) -> str:
    """Return a short snippet of text around the first match of pattern."""
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return ""
    start = max(0, m.start() - 20)
    end = min(len(text), m.end() + window)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet


def _count_pattern_matches(text: str, patterns: List[str]) -> Tuple[int, List[str]]:
    """Count distinct pattern matches and return snippets."""
    count = 0
    snippets = []
    for pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            count += 1
            s = _find_snippet(text, pat)
            if s:
                snippets.append(s)
    return count, snippets


def _count_named_entities(text: str, names: List[str]) -> Tuple[int, List[str]]:
    """Count how many named entities appear in text."""
    found = []
    for name in names:
        if re.search(r'\b' + re.escape(name) + r'\b', text, re.IGNORECASE):
            found.append(name)
    return len(found), found


def _detect_examples(text: str) -> Tuple[int, List[str]]:
    """
    Heuristic: count distinct real-world example references.
    Strategy:
    1. Look for named cloud providers.
    2. Look for example markers followed by a proper-noun-like phrase.
    Returns (count, list_of_evidence_snippets).
    """
    provider_count, providers = _count_named_entities(text, CLOUD_PROVIDERS)
    marker_count, marker_snippets = _count_pattern_matches(text, EXAMPLE_MARKERS)

    # Combine: at least one marker OR named provider counts as an example cluster
    # We cap at the number of distinct evidence points found
    example_clusters: List[str] = []

    for provider in providers:
        # Find sentence containing this provider
        for sentence in re.split(r'[.!?\n]+', text):
            if re.search(r'\b' + re.escape(provider) + r'\b', sentence, re.IGNORECASE):
                snippet = sentence.strip()[:120]
                if snippet and snippet not in example_clusters:
                    example_clusters.append(snippet)
                break

    # Also look for example-marker sentences not already covered
    for pat in EXAMPLE_MARKERS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            # get the sentence
            start = text.rfind('.', 0, m.start())
            start = start + 1 if start >= 0 else 0
            end_m = text.find('.', m.end())
            end_m = end_m if end_m >= 0 else len(text)
            sentence = text[start:end_m].strip()[:120]
            if sentence and sentence not in example_clusters:
                example_clusters.append(sentence)

    # Deduplicate clusters that are substrings of each other
    unique_clusters: List[str] = []
    for c in example_clusters:
        if not any(c in other or other in c for other in unique_clusters):
            unique_clusters.append(c)

    return len(unique_clusters), unique_clusters


def _detect_advantages(text: str) -> Tuple[int, List[str]]:
    """Count distinct advantage keywords found."""
    found_groups: Dict[str, str] = {}
    for kw in ADVANTAGE_KEYWORDS:
        if kw in text.lower():
            # group similar keywords (e.g. "scalab" covers "scalable", "scalability")
            root = kw[:5]
            if root not in found_groups:
                snippet = _find_snippet(text, re.escape(kw), 60)
                found_groups[root] = snippet
    return len(found_groups), list(found_groups.values())


def _has_definition(text: str) -> Tuple[bool, str]:
    for kw in DEFINITION_KEYWORDS:
        m = re.search(re.escape(kw), text, re.IGNORECASE)
        if m:
            snippet = _find_snippet(text, re.escape(kw), 80)
            return True, snippet
    return False, ""


def _has_organization(text: str) -> Tuple[bool, str]:
    count, snippets = _count_pattern_matches(text, ORGANIZATION_MARKERS)
    return count >= 2, snippets[0] if snippets else ""


def _check_plagiarism_signal(text: str) -> Tuple[bool, str]:
    """
    Very simple heuristic: if any single sentence is >= PLAGIARISM_THRESHOLD_WORDS
    and the text has very few unique words relative to total words, flag it.
    This is a signal only — always requires human review.
    """
    sentences = re.split(r'[.!?]+', text.strip())
    for sentence in sentences:
        wc = word_count(sentence)
        if wc >= PLAGIARISM_THRESHOLD_WORDS:
            return True, f"Long unbroken sentence detected ({wc} words): '{sentence[:80]}…'"
    total_words = text.lower().split()
    if len(total_words) > 20:
        unique_ratio = len(set(total_words)) / len(total_words)
        if unique_ratio < 0.35:
            return True, f"Very low unique-word ratio ({unique_ratio:.2f}) — possible copy-paste."
    return False, ""


def _count_grammar_issues(text: str) -> Tuple[int, List[str]]:
    """
    Minimal, non-punitive grammar check.
    Checks only the most clear-cut mechanical patterns.
    Grammar issues do NOT reduce conceptual score — they are flagged separately.
    """
    issues = []
    # Double spaces
    if re.search(r'  +', text):
        issues.append("Multiple consecutive spaces detected.")
    # Missing space after period
    if re.search(r'\.[A-Z]', text):
        issues.append("Possible missing space after full stop.")
    # Repeated words
    if re.search(r'\b(\w+)\s+\1\b', text, re.IGNORECASE):
        issues.append("Repeated word detected.")
    return len(issues), issues


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

WEIGHTS = {
    "DEF": 0.20,
    "ADV": 0.30,
    "EX":  0.30,
    "ORG": 0.10,
    "CLR": 0.10,
}


def _score_definition(text: str) -> float:
    """0–100 score for the Definition criterion."""
    has_def, _ = _has_definition(text)
    if not has_def:
        return 0.0
    wc = word_count(text)
    # Reward some elaboration
    if wc >= 100:
        return 85.0
    elif wc >= 50:
        return 65.0
    else:
        return 40.0


def _score_advantages(text: str) -> float:
    """0–100 score for the Advantages criterion."""
    count, _ = _detect_advantages(text)
    if count == 0:
        return 0.0
    elif count == 1:
        return 35.0
    elif count == 2:
        return 60.0
    elif count == 3:
        return 78.0
    else:
        return min(95.0, 78.0 + (count - 3) * 5)


def _score_examples(text: str) -> float:
    """0–100 score for the Real-World Examples criterion."""
    count, _ = _detect_examples(text)
    if count == 0:
        return 0.0
    elif count == 1:
        return 45.0
    elif count == 2:
        return 80.0
    else:
        return min(95.0, 80.0 + (count - 2) * 5)


def _score_organization(text: str) -> float:
    """0–100 score for the Organization criterion."""
    has_org, _ = _has_organization(text)
    wc = word_count(text)
    if wc < 50:
        return 20.0
    if has_org:
        return 80.0
    # Partial: multiple paragraphs
    paragraphs = [p for p in text.split('\n\n') if p.strip()]
    if len(paragraphs) >= 2:
        return 55.0
    return 30.0


def _score_clarity(text: str) -> float:
    """0–100 score for Clarity (word count proxy + sentence variety)."""
    wc = word_count(text)
    if wc < 30:
        return 10.0
    elif wc < 80:
        return 40.0
    elif wc < 150:
        return 65.0
    elif wc < 250:
        return 80.0
    else:
        return 90.0


def _compute_criterion_scores(text: str) -> Dict[str, float]:
    return {
        "DEF": _score_definition(text),
        "ADV": _score_advantages(text),
        "EX":  _score_examples(text),
        "ORG": _score_organization(text),
        "CLR": _score_clarity(text),
    }


def _compute_total_score(criterion_scores: Dict[str, float]) -> float:
    return sum(criterion_scores[k] * WEIGHTS[k] for k in WEIGHTS)


# ---------------------------------------------------------------------------
# Rules — each returns Optional[FeedbackResult]
# ---------------------------------------------------------------------------

def rule_def_001(text: str) -> Optional[FeedbackResult]:
    """RULE_DEF_001: Missing or very thin definition of cloud computing."""
    has_def, snippet = _has_definition(text)
    if not has_def:
        return FeedbackResult(
            rule_id="RULE_DEF_001",
            criterion_key="DEF",
            message=(
                "Your response does not appear to include a definition of cloud computing. "
                "Start by clearly defining what cloud computing is before listing advantages."
            ),
            evidence="",
            confidence=0.85,
            priority="high",
        )
    wc = word_count(text)
    if wc < 50:
        return FeedbackResult(
            rule_id="RULE_DEF_001B",
            criterion_key="DEF",
            message=(
                "Your definition is present but very brief. "
                "Expand it to explain what cloud computing means and how it works."
            ),
            evidence=snippet,
            confidence=0.75,
            priority="medium",
        )
    return None


def rule_adv_001(text: str) -> Optional[FeedbackResult]:
    """RULE_ADV_001: Fewer than 2 distinct advantages mentioned."""
    count, snippets = _detect_advantages(text)
    if count == 0:
        return FeedbackResult(
            rule_id="RULE_ADV_001",
            criterion_key="ADV",
            message=(
                "No advantages of cloud computing were identified in your response. "
                "Discuss at least two specific benefits such as scalability, cost savings, "
                "accessibility, or disaster recovery."
            ),
            evidence="",
            confidence=0.88,
            priority="high",
        )
    elif count == 1:
        return FeedbackResult(
            rule_id="RULE_ADV_001",
            criterion_key="ADV",
            message=(
                "Only one advantage was detected. The rubric requires at least two distinct "
                "advantages. Add another benefit and briefly explain why it matters."
            ),
            evidence=snippets[0] if snippets else "",
            confidence=0.80,
            priority="high",
        )
    return None


def rule_adv_002(text: str) -> Optional[FeedbackResult]:
    """RULE_ADV_002: Advantages mentioned but not explained or quantified."""
    count, snippets = _detect_advantages(text)
    if count >= 1:
        avg_sentence_len = word_count(text) / max(sentence_count(text), 1)
        if avg_sentence_len < 12:
            return FeedbackResult(
                rule_id="RULE_ADV_002",
                criterion_key="ADV",
                message=(
                    "You mention advantages but your sentences are quite short. "
                    "Explain each advantage with a bit more detail — for example, "
                    "why cost savings occur or what kind of scalability is possible."
                ),
                evidence=snippets[0] if snippets else "",
                confidence=0.60,
                priority="medium",
            )
    return None


def rule_ex_001(text: str) -> Optional[FeedbackResult]:
    """RULE_EX_001: Fewer than 2 real-world examples provided (REQUIRED ≥ 2)."""
    count, snippets = _detect_examples(text)
    if count == 0:
        return FeedbackResult(
            rule_id="RULE_EX_001",
            criterion_key="EX",
            message=(
                "No real-world examples were found in your response. "
                "The assignment requires at least two specific examples "
                "(e.g., 'Netflix uses AWS to stream video to millions of users'). "
                "Name a company or service and explain how they use cloud computing."
            ),
            evidence="",
            confidence=0.90,
            priority="high",
        )
    elif count == 1:
        return FeedbackResult(
            rule_id="RULE_EX_001",
            criterion_key="EX",
            message=(
                f"Only one real-world example was detected. "
                f"The assignment requires at least two. "
                f"Add a second specific company or service that uses cloud computing "
                f"and briefly explain how they benefit from it."
            ),
            evidence=snippets[0] if snippets else "",
            confidence=0.85,
            priority="high",
        )
    return None


def rule_ex_002(text: str) -> Optional[FeedbackResult]:
    """RULE_EX_002: Examples present but not linked to an advantage."""
    count, ex_snippets = _detect_examples(text)
    adv_count, _ = _detect_advantages(text)
    if count >= 2 and adv_count < 1:
        return FeedbackResult(
            rule_id="RULE_EX_002",
            criterion_key="EX",
            message=(
                "You have examples but they are not connected to any stated advantage. "
                "Explain what advantage each company gains from using cloud computing "
                "(e.g., scalability, cost reduction)."
            ),
            evidence=ex_snippets[0] if ex_snippets else "",
            confidence=0.70,
            priority="medium",
        )
    return None


def rule_ex_003_ambiguous(text: str) -> Optional[FeedbackResult]:
    """
    RULE_EX_003: Ambiguous example — mentions a company name but no context.
    Triggers low-confidence human review.
    """
    count, ex_snippets = _detect_examples(text)
    _, providers = _count_named_entities(text, CLOUD_PROVIDERS)
    if providers and count >= 1:
        # Check if the snippet has fewer than 8 words around the provider
        for provider in providers:
            for sentence in re.split(r'[.!?\n]+', text):
                if re.search(r'\b' + re.escape(provider) + r'\b', sentence, re.IGNORECASE):
                    wc = word_count(sentence)
                    if wc < 8:
                        return FeedbackResult(
                            rule_id="RULE_EX_003",
                            criterion_key="EX",
                            message=(
                                f"'{provider}' is mentioned as an example but without enough "
                                f"context. Explain specifically how {provider} uses cloud "
                                f"computing and what benefit they gain."
                            ),
                            evidence=sentence.strip(),
                            confidence=0.45,
                            priority="medium",
                            requires_human_review=True,
                            high_impact_reason="Ambiguous example — low confidence. Mentor should verify whether this counts as a valid example.",
                        )
    return None


def rule_org_001(text: str) -> Optional[FeedbackResult]:
    """RULE_ORG_001: No clear structural organization."""
    has_org, snippet = _has_organization(text)
    paragraphs = [p for p in text.split('\n\n') if p.strip()]
    wc = word_count(text)
    if wc >= 80 and not has_org and len(paragraphs) < 2:
        return FeedbackResult(
            rule_id="RULE_ORG_001",
            criterion_key="ORG",
            message=(
                "Your response reads as a single block of text with no clear structure. "
                "Organize your answer with distinct paragraphs: "
                "(1) definition, (2) advantages, (3) real-world examples, (4) conclusion."
            ),
            evidence=text[:100].strip() + "…" if len(text) > 100 else text.strip(),
            confidence=0.78,
            priority="medium",
        )
    return None


def rule_clr_001_short(text: str) -> Optional[FeedbackResult]:
    """RULE_CLR_001: Submission is too short to evaluate properly."""
    wc = word_count(text)
    if wc < 30:
        return FeedbackResult(
            rule_id="RULE_CLR_001",
            criterion_key="CLR",
            message=(
                f"Your submission is very short ({wc} words). "
                "A thorough response should be at least 150–200 words to adequately "
                "cover the definition, advantages, and examples."
            ),
            evidence=text.strip(),
            confidence=0.95,
            priority="high",
            requires_human_review=(wc < 10),
            high_impact_reason="Extremely short submission — automated feedback may be insufficient." if wc < 10 else None,
        )
    return None


def rule_lang_001(text: str) -> Optional[FeedbackResult]:
    """
    RULE_LANG_001: Language quality note — grammatical issues detected.
    This does NOT affect conceptual score. It is informational only.
    Non-native English speakers should not be penalized for grammar in conceptual rubrics.
    """
    count, issues = _count_grammar_issues(text)
    if count >= 2:
        return FeedbackResult(
            rule_id="RULE_LANG_001",
            criterion_key="CLR",
            message=(
                "Some minor language/formatting issues were noticed. "
                "Note: this feedback is informational only and does not affect your "
                "conceptual score. Issues: " + "; ".join(issues)
            ),
            evidence=issues[0] if issues else "",
            confidence=0.65,
            priority="low",
        )
    return None


def rule_high_impact_low_score(score: float) -> Optional[FeedbackResult]:
    """RULE_HI_001: Very low score — flag for mentor review."""
    if score < 20.0:
        return FeedbackResult(
            rule_id="RULE_HI_001",
            criterion_key="CLR",
            message=(
                "This submission scored very low overall. "
                "A mentor should review to determine if additional support is needed."
            ),
            evidence="",
            confidence=1.0,
            priority="high",
            requires_human_review=True,
            high_impact_reason=f"Very low performance (score={score:.1f}). May indicate the student needs targeted support.",
        )
    return None


def rule_high_impact_high_score(score: float) -> Optional[FeedbackResult]:
    """RULE_HI_002: Very high score — flag for authenticity check."""
    if score >= 93.0:
        return FeedbackResult(
            rule_id="RULE_HI_002",
            criterion_key="CLR",
            message=(
                "This submission scored exceptionally high. "
                "A mentor should verify authenticity before confirming the final grade."
            ),
            evidence="",
            confidence=0.75,
            priority="medium",
            requires_human_review=True,
            high_impact_reason=f"Exceptionally high score ({score:.1f}). Mentor should verify authenticity.",
        )
    return None


def rule_plagiarism_signal(text: str) -> Optional[FeedbackResult]:
    """RULE_PLAG_001: Possible plagiarism signal — always requires human review."""
    flagged, reason = _check_plagiarism_signal(text)
    if flagged:
        return FeedbackResult(
            rule_id="RULE_PLAG_001",
            criterion_key="CLR",
            message=(
                "A possible copy-paste or plagiarism signal was detected. "
                "A mentor must review this submission before any feedback is finalized."
            ),
            evidence=reason,
            confidence=0.55,
            priority="high",
            requires_human_review=True,
            high_impact_reason="Possible plagiarism signal. Human review required before finalizing feedback.",
        )
    return None


# ---------------------------------------------------------------------------
# Engine entry point
# ---------------------------------------------------------------------------

ALL_TEXT_RULES = [
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
]


def analyze_submission(text: str) -> EngineOutput:
    """
    Main entry point.
    Takes raw submission text, returns EngineOutput with score and feedback.
    """
    if not text or not text.strip():
        raise ValueError("Submission text cannot be empty.")

    # 1. Compute per-criterion scores
    criterion_scores = _compute_criterion_scores(text)
    total_score = _compute_total_score(criterion_scores)

    # 2. Apply all text-based rules
    feedback: List[FeedbackResult] = []
    for rule_fn in ALL_TEXT_RULES:
        result = rule_fn(text)
        if result is not None:
            feedback.append(result)

    # 3. Apply score-based high-impact rules
    for rule_fn in [rule_high_impact_low_score, rule_high_impact_high_score]:
        result = rule_fn(total_score)
        if result is not None:
            feedback.append(result)

    # 4. Determine overall human-review flag
    requires_review = any(f.requires_human_review for f in feedback)
    high_impact_reasons = [f.high_impact_reason for f in feedback if f.high_impact_reason]
    combined_reason = " | ".join(high_impact_reasons) if high_impact_reasons else None

    return EngineOutput(
        score=round(total_score, 2),
        criterion_scores={k: round(v, 2) for k, v in criterion_scores.items()},
        feedback=feedback,
        requires_human_review=requires_review,
        high_impact_reason=combined_reason,
    )
