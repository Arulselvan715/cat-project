"""
run_corpus.py — Corpus Validation Runner
=========================================
Runs every case in the Realistic Synthetic Validation Corpus through the
ACTUAL analyze_submission() implementation and compares results against
expected metadata.

Usage (from repo root):
    python validation/run_corpus.py

Or with verbose output:
    python validation/run_corpus.py --verbose

Evidence check note
-------------------
The engine's _find_snippet() appends/prepends Unicode ellipsis (…) markers
when the snippet window does not reach the start or end of the text.  These
snippets are DERIVED from the original text but are not verbatim substrings.

The evidence check strips leading/trailing "…" characters and whitespace
before testing containment in the original submission.  This is correct
behaviour: the snippet core must exist in the submission.

Two rules (RULE_LANG_001, RULE_PLAG_001) return computed diagnostic strings
as evidence — e.g. "Multiple consecutive spaces detected." and
"Long unbroken sentence detected (N words): '...'" — these are NOT verbatim
substrings but ARE clearly labelled diagnostic messages, not fabricated quotes.
We flag these as KNOWN_COMPUTED_EVIDENCE rather than fabrication errors.

FABRICATION is defined as: returning text that appears to quote the student
but which does not appear anywhere in the submission.  The computed diagnostic
strings do not pose this risk because they are obviously not quotations.

This script DOES NOT modify the engine or expected values to force passes.
Discrepancies are reported as failures with a clear explanation.
"""

from __future__ import annotations

import argparse
import sys
import os
import re

# Allow importing backend modules when run from repo root
_repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_backend_path = os.path.join(_repo_root, "backend")
sys.path.insert(0, _backend_path)

from feedback_engine import analyze_submission  # noqa: E402

# Allow importing corpus from validation/
_val_path = os.path.join(_repo_root, "validation")
sys.path.insert(0, _val_path)

from corpus import CORPUS_CASES, CORPUS_METADATA  # noqa: E402


# ---------------------------------------------------------------------------
# Rules that are known to return computed (non-verbatim) diagnostic strings
# ---------------------------------------------------------------------------
KNOWN_COMPUTED_EVIDENCE_RULES = {
    "RULE_LANG_001",   # returns grammar issue descriptions, not text quotes
    "RULE_PLAG_001",   # returns computed ratio/length message with truncated quote
    "RULE_HI_001",     # evidence="" (empty) — already handled
    "RULE_HI_002",     # evidence="" (empty) — already handled
}


def _strip_ellipsis(s: str) -> str:
    """Strip leading/trailing ellipsis characters and whitespace."""
    return s.strip().lstrip("…").rstrip("…").strip()


def _evidence_is_in_submission(evidence: str, submission_text: str) -> bool:
    """
    True if evidence is empty, or if the core of the evidence snippet
    (after stripping ellipsis markers) appears as a substring of the original text.
    """
    if not evidence:
        return True
    core = _strip_ellipsis(evidence)
    if not core:
        return True
    return core in submission_text


# ---------------------------------------------------------------------------
# Colour helpers (graceful fallback on Windows without ANSI)
# ---------------------------------------------------------------------------

def _green(s: str) -> str:
    return s


def _red(s: str) -> str:
    return s


def _yellow(s: str) -> str:
    return s


def _bold(s: str) -> str:
    return s


# ---------------------------------------------------------------------------
# Check helpers
# ---------------------------------------------------------------------------

def _check_score_range(case_id: str, score: float, expected_range: tuple) -> list:
    lo, hi = expected_range
    if lo <= score <= hi:
        return []
    return [
        f"[{case_id}] Score out of expected range: "
        f"actual={score:.2f}, expected=[{lo}, {hi}]"
    ]


def _check_requires_review(case_id: str, actual: bool, expected: bool) -> list:
    if actual == expected:
        return []
    return [
        f"[{case_id}] requires_human_review mismatch: "
        f"actual={actual}, expected={expected}"
    ]


def _check_rule_ids(case_id: str, fired_ids: set, expected_ids: list) -> list:
    """Check that every expected rule_id was fired (subset check only)."""
    missing = [rid for rid in expected_ids if rid not in fired_ids]
    if not missing:
        return []
    return [
        f"[{case_id}] Expected rule(s) did not fire: {missing} "
        f"(fired: {sorted(fired_ids)})"
    ]


def _check_priority(case_id: str, priorities: list, expected_min: str) -> list:
    """Check that at least one feedback item has the expected (or higher) priority."""
    order = {"high": 3, "medium": 2, "low": 1}
    if not priorities:
        if order.get(expected_min, 0) <= 1:
            return []
        return [
            f"[{case_id}] No feedback items produced; expected priority '{expected_min}'"
        ]
    max_actual = max(order.get(p, 0) for p in priorities)
    if max_actual >= order.get(expected_min, 0):
        return []
    return [
        f"[{case_id}] Priority mismatch: "
        f"highest actual={max(priorities, key=lambda p: order.get(p, 0))}, "
        f"expected at least '{expected_min}'"
    ]


def _check_evidence(case_id: str, output, submission_text: str) -> tuple:
    """
    Returns (fabrication_errors, computed_evidence_notes).

    fabrication_errors: evidence that appears to quote the student but is NOT in the submission
    computed_evidence_notes: evidence from known-computed rules (not fabrication, but documented)
    """
    fabrication_errors = []
    computed_notes = []

    for fb in output.feedback:
        if not fb.evidence:
            continue  # empty evidence is always fine

        if fb.rule_id in KNOWN_COMPUTED_EVIDENCE_RULES:
            # Computed diagnostic strings — not verbatim quotes, but also not fabrication
            # Only flag if the string LOOKS like a student quote (starts/ends with quote chars)
            if fb.evidence.startswith("'") or fb.evidence.startswith('"'):
                # The PLAG_001 rule includes a truncated quote of the submission
                # Verify the quoted portion exists in the submission
                inner = fb.evidence.strip("'\"").strip()
                if inner and inner not in submission_text:
                    # It's a truncated quote — check if beginning matches
                    short = inner[:30]
                    if short and short not in submission_text:
                        fabrication_errors.append(
                            f"[{case_id}] RULE {fb.rule_id}: computed evidence "
                            f"contains apparent quote not found in submission: "
                            f"{repr(fb.evidence[:60])}"
                        )
                else:
                    computed_notes.append(
                        f"[{case_id}] RULE {fb.rule_id}: computed diagnostic string "
                        f"(not a verbatim quote): {repr(fb.evidence[:60])}"
                    )
            else:
                computed_notes.append(
                    f"[{case_id}] RULE {fb.rule_id}: computed diagnostic string "
                    f"(not a verbatim quote): {repr(fb.evidence[:60])}"
                )
            continue

        # For all other rules: evidence must be derived from submission text
        if not _evidence_is_in_submission(fb.evidence, submission_text):
            fabrication_errors.append(
                f"[{case_id}] EVIDENCE FABRICATION — rule {fb.rule_id}: "
                f"evidence core '{_strip_ellipsis(fb.evidence)[:50]}' "
                f"NOT found in submission."
            )

    return fabrication_errors, computed_notes


def _check_evidence_present(case_id: str, output, expected: bool) -> list:
    """Check whether any non-empty evidence is present."""
    has_evidence = any(bool(fb.evidence) for fb in output.feedback)
    if has_evidence == expected:
        return []
    if not expected and has_evidence:
        return []  # Evidence present but not expected — acceptable variance
    if expected and not has_evidence:
        return [
            f"[{case_id}] Expected at least one evidence snippet but got none."
        ]
    return []


# ---------------------------------------------------------------------------
# Single-case runner
# ---------------------------------------------------------------------------

def run_case(case: dict, verbose: bool = False) -> dict:
    """Run a single corpus case. Returns result dict."""
    cid = case["case_id"]
    text = case["submission_text"]
    failures = []
    warnings = []
    computed_notes = []

    if not text or not text.strip():
        failures.append(f"[{cid}] submission_text is empty — should not occur in corpus.")
        return {
            "case_id": cid,
            "scenario_type": case["scenario_type"],
            "edge_case": case["edge_case"],
            "passed": False,
            "failures": failures,
            "warnings": warnings,
            "computed_notes": [],
            "actual_score": None,
            "actual_review": None,
            "fired_rule_ids": [],
        }

    try:
        output = analyze_submission(text)
    except ValueError as exc:
        failures.append(f"[{cid}] Engine raised ValueError: {exc}")
        return {
            "case_id": cid,
            "scenario_type": case["scenario_type"],
            "edge_case": case["edge_case"],
            "passed": False,
            "failures": failures,
            "warnings": warnings,
            "computed_notes": [],
            "actual_score": None,
            "actual_review": None,
            "fired_rule_ids": [],
        }

    fired_ids = {fb.rule_id for fb in output.feedback}
    priorities = [fb.priority for fb in output.feedback]

    # Evidence checks
    fab_errors, cn = _check_evidence(cid, output, text)
    failures.extend(fab_errors)
    computed_notes.extend(cn)

    # Score range
    failures.extend(_check_score_range(cid, output.score, case["expected_score_range"]))

    # requires_human_review
    failures.extend(_check_requires_review(cid, output.requires_human_review, case["requires_review_expected"]))

    # Expected rules fired (subset check)
    failures.extend(_check_rule_ids(cid, fired_ids, case["expected_rule_ids"]))

    # Priority
    failures.extend(_check_priority(cid, priorities, case["expected_priority"]))

    # Evidence present
    failures.extend(_check_evidence_present(cid, output, case["expected_evidence_present"]))

    if verbose:
        status = "PASS" if not failures else "FAIL"
        print(f"  [{status}] {cid} ({case['scenario_type']}) | "
              f"score={output.score:.2f} | "
              f"rules={sorted(fired_ids)} | "
              f"review={output.requires_human_review}")
        for f in failures:
            print(f"       FAIL: {f}")
        for n in computed_notes:
            print(f"       NOTE: {n}")

    return {
        "case_id": cid,
        "scenario_type": case["scenario_type"],
        "edge_case": case["edge_case"],
        "passed": len(failures) == 0,
        "failures": failures,
        "warnings": warnings,
        "computed_notes": computed_notes,
        "actual_score": output.score,
        "actual_review": output.requires_human_review,
        "fired_rule_ids": sorted(fired_ids),
    }


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

def main(verbose: bool = False) -> int:
    print()
    print("=" * 65)
    print(f"  {CORPUS_METADATA['title']}")
    print("=" * 65)
    print(f"  Version     : {CORPUS_METADATA['version']}")
    print(f"  Total cases : {CORPUS_METADATA['total_cases']}")
    print(f"  Edge cases  : {CORPUS_METADATA['edge_cases']}")
    print()

    results = []
    for case in CORPUS_CASES:
        result = run_case(case, verbose=verbose)
        results.append(result)

    passed = [r for r in results if r["passed"]]
    failed = [r for r in results if not r["passed"]]
    edge_cases = [r for r in results if r["edge_case"]]
    all_computed_notes = []
    for r in results:
        all_computed_notes.extend(r.get("computed_notes", []))

    all_failures = []
    for r in failed:
        all_failures.extend(r["failures"])

    evidence_errors = [f for f in all_failures if "EVIDENCE FABRICATION" in f]
    score_errors = [f for f in all_failures if "Score out" in f]
    review_errors = [f for f in all_failures if "requires_human_review" in f]
    rule_errors = [f for f in all_failures if "rule" in f.lower() and "EVIDENCE" not in f]
    priority_errors = [f for f in all_failures if "Priority" in f]

    print()
    print("-" * 65)
    print("  CORPUS VALIDATION RESULTS")
    print("-" * 65)
    print(f"  Total cases         : {len(results)}")
    print(f"  Edge cases          : {len(edge_cases)}")
    print(f"  Passed              : {len(passed)}")
    print(f"  Failed              : {len(failed)}")
    print()
    print(f"  Evidence fabrication errors : {len(evidence_errors)}")
    print(f"  Computed diagnostic notes   : {len(all_computed_notes)}")
    print(f"  Score-range errors          : {len(score_errors)}")
    print(f"  Review-flag errors          : {len(review_errors)}")
    print(f"  Rule-match errors           : {len(rule_errors)}")
    print(f"  Priority errors             : {len(priority_errors)}")
    print()

    if not verbose and failed:
        print("  FAILURE DETAILS")
        print("-" * 65)
        for r in failed:
            print(f"  [FAIL] {r['case_id']} ({r['scenario_type']})")
            print(f"         actual_score={r['actual_score']}, review={r['actual_review']}")
            print(f"         fired={r['fired_rule_ids']}")
            for f in r["failures"]:
                print(f"         {f}")
        print()

    if all_computed_notes and verbose:
        print("  COMPUTED EVIDENCE NOTES (not fabrication — diagnostic strings)")
        print("-" * 65)
        for n in all_computed_notes:
            print(f"  {n}")
        print()

    # Per-case summary table
    print("  PER-CASE SUMMARY")
    print("-" * 65)
    print(f"  {'ID':<5} {'Scenario':<35} {'Score':>7} {'Review':>7} {'Status'}")
    print(f"  {'-'*5} {'-'*35} {'-'*7} {'-'*7} {'-'*6}")
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        score_str = f"{r['actual_score']:.2f}" if r['actual_score'] is not None else "  N/A"
        review_str = str(r['actual_review']) if r['actual_review'] is not None else "  N/A"
        print(f"  {r['case_id']:<5} {r['scenario_type']:<35} {score_str:>7} {review_str:>7}   {status}")

    print()
    if evidence_errors:
        print("  *** CRITICAL: Evidence fabrication detected — see details above ***")
        print()

    if not failed:
        print(f"  ALL {len(results)} CASES PASSED")
    else:
        print(f"  {len(failed)} OF {len(results)} CASES FAILED")
    print("=" * 65)
    print()

    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Formative Feedback Assistant — Corpus Validation Runner"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Print per-case details including rules fired and notes"
    )
    args = parser.parse_args()
    sys.exit(main(verbose=args.verbose))
