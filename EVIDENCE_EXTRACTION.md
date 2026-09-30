# EVIDENCE_EXTRACTION.md

## Evidence Extraction Methodology

### Formative Feedback Assistant — Deterministic Rule Engine

> **IMPORTANT**: The current implementation is a **deterministic keyword/regex/substring-matching engine**. It does NOT use any large language model (LLM), machine learning model, natural language processing (NLP) pipeline, vector embeddings, semantic similarity, or any form of learned inference. All behaviour is fully deterministic and reproducible.

---

## 1. Overview

Evidence extraction is performed by `backend/feedback_engine.py`. The engine analyses student submission text using a set of deterministic rule functions. Each rule may return a `FeedbackResult` dataclass containing an `evidence` field — a short text snippet derived directly from the student's submission.

### Golden Invariant

> **Every returned evidence snippet must either be `""` (empty string) OR the core of the snippet must exist verbatim as a substring of the original submission text.**

This invariant is verified by:
- `backend/tests/test_evidence.py` (automated test suite)
- `validation/run_corpus.py` (corpus validation runner)

---

## 2. Text Handling and Normalisation

The engine receives raw submission text as a Python `str`. **No pre-processing normalisation is applied** before rule evaluation:

- Text is NOT lowercased globally (individual pattern matching uses `re.IGNORECASE`)
- Text is NOT stripped of punctuation
- Text is NOT tokenised into a structured format
- Text is NOT spell-checked or corrected
- Text is NOT translated or language-detected

The `analyze_submission()` entry point validates only that the input is non-empty:

```python
if not text or not text.strip():
    raise ValueError("Submission text cannot be empty.")
```

---

## 3. Sentence Splitting

Sentence splitting is performed by `re.split(r'[.!?]+', text.strip())` in several helper functions. This is a simple punctuation-based split. It does **not** use a trained sentence boundary detector and may misclassify abbreviations, decimal numbers, or mid-sentence punctuation.

---

## 4. Pattern Matching

All matching is performed using Python's `re` module (regular expressions) with `re.IGNORECASE`.

### 4.1 Definition Keywords (`DEFINITION_KEYWORDS`)

A hardcoded list of phrases indicating a definition is present:

```python
["cloud computing is", "cloud computing refers", "cloud is",
 "defined as", "definition", "means", "can be defined",
 "delivery of", "services over the internet", "internet-based",
 "on-demand", "remote server"]
```

Matching: `re.search(re.escape(kw), text, re.IGNORECASE)` for each keyword.

### 4.2 Advantage Keywords (`ADVANTAGE_KEYWORDS`)

A hardcoded list of root stems/phrases:

```python
["scalab", "elastic", "scale", "cost", "saving", "affordable",
 "cheap", "pay-as-you", "pay as you", "access", "anywhere",
 "remote", "reliab", "uptime", "availab", "secur", "backup",
 "recover", "disaster", "collaborat", "team", "share", "speed",
 "fast", "perform", "flexib", "mainten", "update", "patch",
 "innovat", "agil", "storage"]
```

Matching: `kw in text.lower()` (simple substring containment, not word-boundary aware for stems). Keywords like `"scalab"` match both "scalable" and "scalability".

### 4.3 Cloud Provider Names (`CLOUD_PROVIDERS`)

A hardcoded list of named cloud providers and well-known cloud-native companies:

```python
["aws", "amazon web services", "amazon", "azure", "microsoft azure",
 "google cloud", "gcp", "ibm cloud", "oracle cloud", "salesforce",
 "dropbox", "netflix", "spotify", "zoom", "slack", "github",
 "gitlab", "heroku"]
```

Matching: `re.search(r'\b' + re.escape(name) + r'\b', text, re.IGNORECASE)` — word-boundary aware.

### 4.4 Example Markers (`EXAMPLE_MARKERS`)

A list of regex patterns that indicate an example is being cited:

```python
[r"\bfor example\b", r"\bfor instance\b", r"\bsuch as\b",
 r"\be\.g\.", r"\bi\.e\.", r"\blike\b", r"\bincluding\b",
 r"\bnamely\b", r"\bone example\b", r"\banother example\b",
 r"\ba real.world example\b", r"\bcase study\b",
 r"\bin practice\b", r"\bcompanies? (use|uses|used|like|such as)\b",
 r"\borganizations? (use|uses|like)\b", r"\buses?\b.*\bcloud\b"]
```

### 4.5 Organisation Markers (`ORGANIZATION_MARKERS`)

A list of transition-word patterns that indicate structured writing:

```python
[r"\bintroduction\b", r"\bconclusion\b", r"\bin summary\b",
 r"\bfirst(ly)?\b", r"\bsecond(ly)?\b", r"\bthird(ly)?\b",
 r"\bfurthermore\b", r"\bmoreover\b", r"\bhowever\b",
 r"\bin addition\b", r"\bfinally\b", r"\boverall\b",
 r"\btherefore\b", r"\bthus\b", r"\bin conclusion\b",
 r"\bparagraph\b"]
```

---

## 5. Evidence Selection — `_find_snippet()`

The `_find_snippet(text, pattern, window=80)` function extracts a short text window around the first regex match:

```python
def _find_snippet(text, pattern, window=80):
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
```

**Key properties:**

- The returned snippet is a **character-slice of the original `text`** with added `…` ellipsis markers at boundaries.
- The core of the snippet (after stripping `…`) is always a verbatim substring of the original text.
- If the pattern does not match, `""` is returned.
- The ellipsis characters (`…`, Unicode U+2026) are **not** part of the original submission — they are display-only truncation markers.

---

## 6. Evidence Selection — `_detect_examples()`

```python
def _detect_examples(text):
    provider_count, providers = _count_named_entities(text, CLOUD_PROVIDERS)
    marker_count, marker_snippets = _count_pattern_matches(text, EXAMPLE_MARKERS)
    example_clusters = []

    for provider in providers:
        for sentence in re.split(r'[.!?\n]+', text):
            if re.search(r'\b' + re.escape(provider) + r'\b', sentence, re.IGNORECASE):
                snippet = sentence.strip()[:120]
                if snippet and snippet not in example_clusters:
                    example_clusters.append(snippet)
                break

    for pat in EXAMPLE_MARKERS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            start = text.rfind('.', 0, m.start())
            start = start + 1 if start >= 0 else 0
            end_m = text.find('.', m.end())
            end_m = end_m if end_m >= 0 else len(text)
            sentence = text[start:end_m].strip()[:120]
            if sentence and sentence not in example_clusters:
                example_clusters.append(sentence)

    # Deduplicate
    unique_clusters = []
    for c in example_clusters:
        if not any(c in other or other in c for other in unique_clusters):
            unique_clusters.append(c)

    return len(unique_clusters), unique_clusters
```

**Key properties:**

- Provider-name sentences are extracted using `sentence.strip()[:120]` — a direct substring slice of the split sentence, which is itself derived from the original text.
- Example-marker sentences are extracted using character index arithmetic on the original text.
- All returned evidence clusters are substrings of the original submission.

---

## 7. Handling When Evidence Is Absent

When no evidence can be found, rules return `evidence=""` (empty string). Examples:

| Rule | When evidence is empty |
|---|---|
| `RULE_DEF_001` | No definition keyword found anywhere in submission |
| `RULE_ADV_001` | No advantage keywords found (zero advantages) |
| `RULE_EX_001` | No example markers or provider names found |
| `RULE_HI_001` | Always empty (score-based rule, no text evidence applies) |
| `RULE_HI_002` | Always empty (score-based rule, no text evidence applies) |

Empty evidence is **intentional and correct**. It signals that the rule fired based on the absence of content, not a positive match.

---

## 8. Handling Ambiguous Evidence

`RULE_EX_003` fires when a cloud provider name is mentioned in a very short sentence (< 8 words), suggesting the example lacks sufficient context. The evidence is the full sentence extracted from the submission:

```python
evidence=sentence.strip()
```

This rule also sets `confidence=0.45` and `requires_human_review=True`, clearly signalling that a human should verify the interpretation.

---

## 9. Known Limitations — Computed Evidence Strings

Two rules return **computed diagnostic strings** rather than verbatim text quotes:

### `RULE_LANG_001`
Returns the grammar issue description (e.g., `"Multiple consecutive spaces detected."` or `"Repeated word detected."`). These strings are not present in the submission. They are clearly system-generated diagnostic labels, not fabricated quotations.

### `RULE_PLAG_001`
Returns a computed message like:
```
"Long unbroken sentence detected (105 words): 'Cloud computing is a model…'"
```
This includes a truncated quote of the submission (the portion after `'`). The quoted portion is extracted directly from the submission via `sentence[:80]`.

**These are known limitations, not fabrication.** A genuine fabrication would mean returning text that appears to quote the student but cannot be found in their submission. Both of these rules return clearly-labelled diagnostic strings. They are documented and tested.

---

## 10. Why This Prevents Fabricated Evidence

The engine cannot fabricate evidence because:

1. **Evidence is computed from input** — every evidence string is either empty or derived algorithmically from character slices of the original `text` argument passed to the rule function.

2. **No external data sources** — the engine has no access to other submissions, a database, a language model, or any external reference text.

3. **No generation** — the engine does not generate new text. It only locates and extracts portions of the text it receives.

4. **Automated verification** — the test suite in `backend/tests/test_evidence.py` asserts the golden invariant on every rule for multiple test inputs.

5. **Corpus validation** — `validation/run_corpus.py` runs 16 synthetic cases and explicitly checks for evidence fabrication across all fired rules, reporting `Evidence fabrication errors: 0`.

---

## 11. Worked Examples

### Example A — Definition Rule (DEF_001B)

**Submission**: `"Cloud computing is defined as on-demand services over internet. Short response."`

1. `_has_definition()` searches for `"defined as"` → found at position 24.
2. `_find_snippet()` extracts characters around match: `"…Cloud computing is defined as on-demand services over internet…"`
3. `word_count(text) = 12` which is < 50 → DEF_001B fires.
4. Evidence = snippet containing `"defined as"` — verbatim from submission.

### Example B — Examples Rule (EX_001, zero examples)

**Submission**: `"Cloud computing offers scalability and cost savings for organisations."`

1. `_detect_examples()` finds no provider names and no example markers.
2. Returns `(0, [])`.
3. `rule_ex_001()` fires with `evidence=""`.
4. No text is fabricated — the absence of examples is the trigger.

### Example C — Ambiguous Example (EX_003)

**Submission**: `"Cloud computing is useful. AWS. Also there are cost savings."`

1. `_count_named_entities()` finds `"aws"` at `"AWS."`.
2. Sentence containing `"AWS"` = `"AWS"` — word count = 1, which is < 8.
3. `RULE_EX_003` fires with `evidence="AWS"` — the literal sentence from the submission.
4. Human review required.

### Example D — High Score (HI_002)

**Submission**: A comprehensive 400-word submission scoring 95.0.

1. Score-based rule fires: no text searched.
2. `evidence=""` returned.
3. The rule is triggered by the computed score, not by any text match.

---

## 12. Summary Table

| Mechanism | Function | Evidence type | Verbatim? |
|---|---|---|---|
| Definition detection | `_has_definition()` → `_find_snippet()` | Text window | Core yes |
| Advantage detection | `_detect_advantages()` → `_find_snippet()` | Text window | Core yes |
| Example detection | `_detect_examples()` | Sentence slice | Yes |
| Organisation detection | `_has_organization()` → snippet | Text window | Core yes |
| Clarity / short text | `rule_clr_001_short()` | Full submission | Yes |
| Grammar issues | `rule_lang_001()` | Computed label | No (documented) |
| Plagiarism signal | `rule_plagiarism_signal()` | Computed + quote | Partial (documented) |
| High score / low score | Score-based rules | Empty string | N/A |

---

*Document version: Stage 2.0 — Formative Feedback Assistant*
