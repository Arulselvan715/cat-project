import { useState, useEffect, useCallback } from 'react'
import { getReviews, actionReview } from '../api/client.js'

/* ═══════════════════════════════════════════════════════════════════════════
   RULE REGISTRY
   Every rule gets: name, explanation, generateWhyFired(), mentorCheck.
   generateWhyFired(evidence, submissionContent) returns a plain-language
   sentence explaining why the specific submission triggered this rule.
   Keep rule IDs — they are useful for technical auditing.
═══════════════════════════════════════════════════════════════════════════ */

const RULE_REGISTRY = {
  RULE_DEF_001: {
    name: 'Definition Missing or Too Brief',
    explanation:
      'The submission does not provide a sufficiently clear definition of the main concept.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The system could not find a recognisable definition phrase near "${evidence}". A definition typically starts with phrasing such as "Cloud computing is…" or "Cloud computing refers to…".`
        : 'The system scanned the entire submission and could not find any text that introduces or defines the main concept being discussed.',
    mentorCheck:
      'Does the submission contain a genuine definition — even in different words? If so, the student should not be penalised.',
  },

  RULE_DEF_001B: {
    name: 'Definition Present but Too Brief',
    explanation:
      'A definition was found, but it is so short that it does not adequately explain the concept.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The phrase "${evidence}" was detected as a definition, but the surrounding text is too brief to constitute a clear explanation.`
        : 'The submission includes something resembling a definition, but the overall length is too short to provide meaningful context.',
    mentorCheck:
      'Read the definition in context. Does it convey enough meaning to show the student understands the concept, even if concisely stated?',
  },

  RULE_ADV_001: {
    name: 'Insufficient Advantages',
    explanation:
      'Fewer than the required number of distinct advantages were identified in the submission.',
    generateWhyFired: (evidence) =>
      evidence
        ? `Only one advantage was detected near "${evidence}". The rubric requires at least two distinct advantages.`
        : 'The system could not detect two or more distinct advantage concepts. The rubric requires at least two (e.g. scalability AND cost savings).',
    mentorCheck:
      'Are there advantages present that the rule may have missed due to unusual phrasing? Count distinct benefits the student actually discusses.',
  },

  RULE_ADV_002: {
    name: 'Advantages Need Specific Support',
    explanation:
      'The submission mentions benefits but does not provide enough specific or quantified support.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The advantage near "${evidence}" was detected, but the surrounding sentences are short and do not elaborate why or how this benefit occurs.`
        : 'Advantage keywords were found, but the average sentence length suggests the student has not explained any advantage in detail.',
    mentorCheck:
      'Does the student explain the "why" behind each advantage, even briefly? A one-line mention is different from a genuine explanation.',
  },

  RULE_EX_001: {
    name: 'Insufficient Real-World Examples',
    explanation:
      'The submission contains fewer real-world examples than required by the rubric.',
    generateWhyFired: (evidence) =>
      evidence
        ? `One example was found (near "${evidence}"), but the rubric requires at least two. A second named company or service with an explanation is needed.`
        : 'No recognisable real-world examples were found. The rubric expects at least two named companies or services with an explanation of how they use cloud computing.',
    mentorCheck:
      'Does the student name any real companies, services, or case studies — even with informal phrasing? Count any that genuinely illustrate the concept.',
  },

  RULE_EX_002: {
    name: 'Examples Not Connected to Advantages',
    explanation:
      'Examples are present but are not clearly connected to the advantages they demonstrate.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The example near "${evidence}" appears in the submission, but the surrounding text does not explain which advantage this example demonstrates.`
        : 'The submission includes examples and advantages, but they appear in separate sections without an explicit link between them.',
    mentorCheck:
      'Does the student implicitly connect examples to benefits (e.g. "Netflix uses AWS for scalability")? If the link is reasonably clear, this flag may be a false positive.',
  },

  RULE_EX_003: {
    name: 'Ambiguous Example Context',
    explanation:
      'An example appears to be present, but there is insufficient context to confidently determine whether it satisfies the rubric.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The submission mentions "${evidence}" as an example, but does not explain how it uses cloud computing or what benefit it gains. Without that context, the system cannot confidently count it as a valid example.`
        : 'A company or service name was detected, but the surrounding text does not explain how it relates to cloud computing or what advantage it demonstrates.',
    mentorCheck:
      'Verify whether the example satisfies the rubric requirement. If the student clearly knows what the company does in relation to cloud computing, even if briefly stated, the example may be valid.',
  },

  RULE_ORG_001: {
    name: 'Weak Organization',
    explanation:
      'The response lacks a clear structure or organization.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The submission appears to start as "${evidence.slice(0, 80)}…" without any structural markers such as paragraph breaks, headings, or transition phrases.`
        : 'The submission reads as a single block of text with no identifiable structural markers (paragraph breaks, transitions such as "firstly", "in conclusion", etc.).',
    mentorCheck:
      'Does the submission have an implicit structure even without explicit markers? If the content flows logically (definition → advantages → examples → conclusion), the student should not be penalised for missing formatting.',
  },

  RULE_CLR_001: {
    name: 'Submission Too Short',
    explanation:
      'The submission is too short to adequately evaluate the required concepts.',
    generateWhyFired: (evidence, submissionContent) => {
      const wc = submissionContent ? submissionContent.trim().split(/\s+/).filter(Boolean).length : 0
      return wc > 0
        ? `The submission is ${wc} words long. The rubric expects a response of at least 150–200 words to adequately cover a definition, two advantages, and two examples.`
        : 'The submission is extremely short. It is not possible to evaluate all required rubric criteria with this level of content.'
    },
    mentorCheck:
      'Is this a genuine attempt that happens to be concise, or did the student not engage with the task? This distinction matters for the type of support offered.',
  },

  RULE_LANG_001: {
    name: 'Language / Grammar Feedback',
    explanation:
      'Language or grammar may need improvement. This feedback must remain separate from conceptual scoring.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The following issue was detected: "${evidence}". This is informational only — it does not reduce the student's conceptual score.`
        : 'Minor language or formatting issues were detected. These are noted for the mentor and student but do not affect the conceptual rubric score.',
    mentorCheck:
      'Is this student a non-native English speaker? If so, grammar issues should not reduce their conceptual mark. Provide language support separately from rubric feedback.',
  },

  RULE_HI_001: {
    name: 'Extremely Low Score — Support Recommended',
    explanation:
      'The overall automated score is extremely low, suggesting the student may need targeted academic support.',
    generateWhyFired: (evidence, submissionContent, score) => {
      const s = score != null ? score.toFixed(1) : 'unknown'
      return `The submission received an overall score of ${s}/100, which is below the threshold for normal automated feedback. This may indicate the student did not understand the task or is significantly behind the expected level.`
    },
    mentorCheck:
      'Review the full submission above. Determine whether this is a language barrier, a misunderstanding of the task, or a genuine knowledge gap — then choose the appropriate support action.',
  },

  RULE_HI_002: {
    name: 'Exceptionally High Score — Authenticity Check',
    explanation:
      'The overall automated score is exceptionally high. Mentor verification of authenticity is required before the grade is finalised.',
    generateWhyFired: (evidence, submissionContent, score) => {
      const s = score != null ? score.toFixed(1) : 'unknown'
      return `The submission scored ${s}/100 — unusually high for this task. The system requires a human to confirm this is the student's own original work before the score is accepted.`
    },
    mentorCheck:
      'Read the full submission. Does the quality and vocabulary match what you would expect from this student? If so, approve. If authenticity is in doubt, investigate further before approving.',
  },

  RULE_PLAG_001: {
    name: 'Possible Plagiarism Signal',
    explanation:
      'A pattern in the submission is consistent with copy-paste or plagiarism. This is a signal only — a human must make the final determination.',
    generateWhyFired: (evidence) =>
      evidence
        ? `The following signal was detected: "${evidence}". This may be a false positive (e.g. text influenced by lecture slides). A mentor must decide before any feedback is finalised.`
        : 'The submission contains structural patterns (e.g. unusually long unbroken sentences or very low word variety) that may indicate copy-paste. This requires human review.',
    mentorCheck:
      'Compare the flagged passage against likely sources. If this is the student\'s own phrasing or a reasonable paraphrase, reject the flag and document your reasoning.',
  },
}

/* Helper: look up a rule or return a safe fallback */
function getRule(ruleId) {
  return (
    RULE_REGISTRY[ruleId] || {
      name: 'Rubric Evaluation Rule',
      explanation: 'This rule checks whether the submission meets a rubric criterion.',
      generateWhyFired: () => 'The rule was triggered based on the content of this submission.',
      mentorCheck: 'Review the submission against the relevant rubric criterion.',
    }
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH-IMPACT REASON → human-readable label + category
═══════════════════════════════════════════════════════════════════════════ */
function parseHighImpactReason(reason) {
  if (!reason) return null
  const r = reason.toLowerCase()
  if (r.includes('plagiarism') || r.includes('copy'))
    return { label: 'Possible Plagiarism', icon: '🔎', color: 'var(--color-danger)' }
  if (r.includes('very low') || r.includes('low performance') || r.includes('low score'))
    return { label: 'Extremely Low Score', icon: '⬇', color: 'var(--color-danger)' }
  if (r.includes('exceptionally high') || r.includes('high score') || r.includes('authenticity'))
    return { label: 'Exceptionally High Score', icon: '⬆', color: 'var(--color-warn)' }
  if (r.includes('low confidence') || r.includes('ambiguous') || r.includes('confidence'))
    return { label: 'Low Confidence', icon: '❓', color: 'var(--color-warn)' }
  if (r.includes('insufficient evidence') || r.includes('too short'))
    return { label: 'Insufficient Evidence', icon: '📏', color: 'var(--color-warn)' }
  return { label: 'Human Review Required', icon: '👤', color: 'var(--color-warn)' }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Score colour helper
═══════════════════════════════════════════════════════════════════════════ */
function scoreColor(score) {
  if (score == null) return 'var(--color-text-muted)'
  if (score >= 70) return 'var(--color-success)'
  if (score >= 45) return 'var(--color-warn)'
  return 'var(--color-danger)'
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-component: Rule Panel
   Shows: [Rule ID] — [Name], Explanation, WHY THIS RULE FIRED, MENTOR CHECK
═══════════════════════════════════════════════════════════════════════════ */
function RulePanel({ ruleId, evidence, submissionContent, submissionScore }) {
  if (!ruleId) return null
  const rule = getRule(ruleId)
  const whyFired = rule.generateWhyFired(evidence, submissionContent, submissionScore)

  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* ── Rule name header ── */}
      <div style={{
        background: 'rgba(108,99,255,0.10)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-3) var(--space-4)',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          RULE APPLIED
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <code style={{
            fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
            color: 'var(--color-primary-light)',
            background: 'rgba(108,99,255,0.12)',
            padding: '2px 8px', borderRadius: 4,
          }}>
            {ruleId}
          </code>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
            — {rule.name}
          </span>
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)' }}>
        {/* Rule explanation */}
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-4)' }}>
          {rule.explanation}
        </p>

        {/* WHY THIS RULE FIRED */}
        <section aria-label="Why this rule fired">
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-accent)', marginBottom: 6,
          }}>
            WHY THIS RULE FIRED
          </div>
          <div style={{
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.18)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: '0.84rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
          }}>
            {whyFired}
          </div>
        </section>

        {/* WHAT THE MENTOR SHOULD CHECK */}
        <section aria-label="What the mentor should check" style={{ marginTop: 'var(--space-4)' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-warn)', marginBottom: 6,
          }}>
            WHAT THE MENTOR SHOULD CHECK
          </div>
          <div style={{
            background: 'var(--color-warn-bg)',
            border: '1px solid rgba(245,166,35,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: '0.84rem',
            color: 'var(--color-warn-light)',
            lineHeight: 1.65,
          }}>
            {rule.mentorCheck}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionState, setActionState] = useState({})
  const [expandedSubs, setExpandedSubs] = useState({})

  const fetchReviews = useCallback(() => {
    setLoading(true)
    getReviews(filter || undefined)
      .then(r => setReviews(r))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const toggleSub = (id) =>
    setExpandedSubs(prev => ({ ...prev, [id]: !prev[id] }))

  const handleAction = async (reviewId, status) => {
    const state = actionState[reviewId] || {}
    if ((status === 'rejected' || status === 'modified') && !state.reason) {
      setActionState(prev => ({
        ...prev, [reviewId]: { ...state, error: 'Override reason is required when rejecting or modifying.' },
      }))
      return
    }
    setActionState(prev => ({ ...prev, [reviewId]: { ...state, loading: true, error: null } }))
    try {
      await actionReview(reviewId, {
        status,
        reviewer: 'Dr. Mentor (Demo)',
        override_reason: state.reason || null,
        final_decision: state.finalDecision || null,
      })
      fetchReviews()
    } catch (err) {
      const msg = err.response?.data?.detail
      setActionState(prev => ({
        ...prev, [reviewId]: {
          ...state, loading: false,
          error: Array.isArray(msg) ? msg.map(m => m.msg).join('; ') : (msg || err.message),
        },
      }))
    }
  }

  const updateAction = (reviewId, field, value) =>
    setActionState(prev => ({ ...prev, [reviewId]: { ...(prev[reviewId] || {}), [field]: value } }))

  const FILTERS = [
    { label: 'Pending',  value: 'pending'  },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Modified', value: 'modified' },
    { label: 'All',      value: ''         },
  ]

  return (
    <div className="container page">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1>Mentor Review Queue</h1>
        <p>
          High-impact feedback decisions are never finalised automatically. For each flagged
          item, read the student's full submission, understand why the rule fired, then
          Approve, Modify, or Reject with a documented reason.
        </p>
      </div>

      {/* ── Human oversight policy ── */}
      <div className="alert alert-warn mb-6" role="note">
        <span aria-hidden="true">⚖️</span>
        <div>
          <strong>Human Oversight Policy</strong>
          <p style={{ marginTop: 4 }}>
            Recommendations flagged for human review (possible plagiarism, very low/high scores,
            low-confidence rules) are <em>never</em> acted on automatically. Rejecting or
            modifying a recommendation requires a written override reason permanently recorded
            in the audit log.
          </p>
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div role="group" aria-label="Filter reviews by status" className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner" aria-hidden="true" />
          <span>Loading reviews…</span>
        </div>
      )}
      {error && <div className="error-msg" role="alert">⚠ {error}</div>}
      {!loading && !error && reviews.length === 0 && (
        <div className="alert alert-success">No reviews found for this filter.</div>
      )}

      {/* ── Review cards ── */}
      {!loading && reviews.map(review => {
        const state = actionState[review.id] || {}
        const isPending = review.status === 'pending'
        const hiInfo = parseHighImpactReason(review.high_impact_reason)
        const isSubExpanded = expandedSubs[review.id]

        return (
          <article
            key={review.id}
            className="card mb-6"
            aria-labelledby={`review-${review.id}-title`}
            style={{ borderLeft: hiInfo ? `4px solid ${hiInfo.color}` : undefined }}
          >

            {/* ── 1. Card header ── */}
            <div className="flex items-center gap-3 flex-wrap mb-5"
              style={{ justifyContent: 'space-between' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <span id={`review-${review.id}-title`}
                  style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {review.student_name || 'Unknown Student'}
                </span>
                <span className="text-muted">·</span>
                <span className="text-sm">{review.assignment_title}</span>
                <span className={`badge badge-${review.status}`}>{review.status}</span>
                {review.priority && (
                  <span className={`badge badge-${review.priority}`}>{review.priority}</span>
                )}
              </div>
              <span className="text-xs text-mono" style={{ color: 'var(--color-text-muted)' }}>
                Review #{review.id}
              </span>
            </div>

            {/* ── 2. HIGH IMPACT banner ── */}
            {hiInfo && (
              <div
                role="alert"
                aria-label="High-impact review required"
                className="mb-5"
                style={{
                  background: `${hiInfo.color}15`,
                  border: `1.5px solid ${hiInfo.color}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4) var(--space-5)',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  fontWeight: 800, fontSize: '0.9rem', color: hiInfo.color,
                  marginBottom: 'var(--space-2)',
                }}>
                  <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{hiInfo.icon}</span>
                  HIGH IMPACT — HUMAN REVIEW REQUIRED
                </div>
                <div style={{ fontSize: '0.85rem', color: hiInfo.color, opacity: 0.9 }}>
                  <strong>Trigger category:</strong> {hiInfo.label}
                </div>
                {review.high_impact_reason && (
                  <div style={{
                    marginTop: 'var(--space-2)', fontSize: '0.82rem',
                    color: 'var(--color-text-secondary)',
                    background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-3)',
                  }}>
                    <strong>Reason recorded by the system:</strong>
                    <div style={{ marginTop: 4, fontStyle: 'italic' }}>{review.high_impact_reason}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. STUDENT SUBMISSION (full text) ── */}
            <div className="mb-5">
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}>
                <div className="feedback-meta-label" style={{ fontSize: '0.75rem' }}>
                  STUDENT SUBMISSION
                  {review.submission_score != null && (
                    <span style={{
                      marginLeft: 12, fontWeight: 800,
                      color: scoreColor(review.submission_score),
                    }}>
                      Draft Score: {review.submission_score.toFixed(1)}/100
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => toggleSub(review.id)}
                  aria-expanded={isSubExpanded}
                  aria-controls={`sub-text-${review.id}`}
                >
                  {isSubExpanded ? '▲ Collapse' : '▼ Show full submission'}
                </button>
              </div>
              <div
                id={`sub-text-${review.id}`}
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  fontSize: '0.85rem', lineHeight: 1.75,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: isSubExpanded ? 'none' : '110px',
                  overflow: 'hidden', position: 'relative',
                }}
                aria-label={`Full submission by ${review.student_name}`}
              >
                {review.submission_content || '(no submission text available)'}
                {!isSubExpanded && review.submission_content &&
                  review.submission_content.length > 300 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                      background: 'linear-gradient(transparent, var(--color-surface-2))',
                      pointerEvents: 'none',
                    }} aria-hidden="true" />
                  )}
              </div>
            </div>

            {/* ── 4. Recommendation ── */}
            <div className="feedback-meta-item mb-5" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div className="feedback-meta-label">RECOMMENDATION FROM SYSTEM</div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--color-text-primary)', marginTop: 6 }}>
                {review.original_recommendation}
              </p>
            </div>

            {/* ── 5. EVIDENCE FROM SUBMISSION (separate, clearly labelled) ── */}
            <div className="mb-5">
              <div className="feedback-meta-label mb-2">EVIDENCE FROM SUBMISSION</div>
              <p className="text-xs text-muted" style={{ marginBottom: 8 }}>
                The specific passage that triggered this recommendation. Shown separately from
                the full submission so you can see exactly what the system analysed.
              </p>
              {review.evidence ? (
                <div className="evidence-text" aria-label={`Evidence: ${review.evidence}`}>
                  "{review.evidence}"
                </div>
              ) : (
                <div style={{
                  fontSize: '0.82rem', color: 'var(--color-text-muted)',
                  fontStyle: 'italic', padding: 'var(--space-2)',
                }}>
                  No specific passage — this rule applies to the overall submission structure.
                </div>
              )}
            </div>

            {/* ── 6. RULE PANEL (replaces the old rule ID + description) ── */}
            <div className="mb-5">
              <RulePanel
                ruleId={review.rule_id}
                evidence={review.evidence}
                submissionContent={review.submission_content}
                submissionScore={review.submission_score}
              />
            </div>

            {/* ── 7. RULE CONFIDENCE + helper text ── */}
            <div className="feedback-meta-item mb-5" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div className="feedback-meta-label">RULE CONFIDENCE</div>
              {review.confidence != null ? (
                <>
                  <div style={{
                    fontSize: '1.3rem', fontWeight: 800, marginTop: 4,
                    color: review.confidence < 0.5 ? 'var(--color-warn)' : 'var(--color-text-primary)',
                  }}>
                    {(review.confidence * 100).toFixed(0)}%
                  </div>
                  <div
                    className="confidence-bar mt-2"
                    role="meter"
                    aria-valuenow={Math.round(review.confidence * 100)}
                    aria-valuemin={0} aria-valuemax={100}
                    aria-label={`Rule confidence: ${Math.round(review.confidence * 100)}%`}
                  >
                    <div className="confidence-fill"
                      style={{ width: `${review.confidence * 100}%` }} />
                  </div>
                </>
              ) : (
                <div className="text-muted text-sm mt-2">—</div>
              )}
              <p className="text-xs text-muted mt-2" style={{ lineHeight: 1.5 }}>
                Rule confidence indicates how certain the system is that this rule applies.
                It does <strong>not</strong> represent the student's quality or score.
              </p>
              {review.confidence != null && review.confidence < 0.5 && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-warn)' }}>
                  ⚠ Low confidence — your judgement as a mentor is especially important here.
                </div>
              )}
            </div>

            {/* ── 8. Rubric criterion ── */}
            <div className="feedback-meta-item mb-5" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div className="feedback-meta-label">RUBRIC CRITERION</div>
              <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                {review.criterion_name || '—'}
              </div>
            </div>

            {/* ── 9. Final decision (if already actioned) ── */}
            {!isPending && (
              <div className="mb-4">
                <div className="feedback-meta-label">FINAL DECISION</div>
                <div className={`alert ${
                  review.status === 'approved' ? 'alert-success' :
                  review.status === 'rejected' ? 'alert-warn' : 'alert-info'} mt-2`}>
                  {review.final_decision || '(no decision note)'}
                </div>
                {review.override_reason && (
                  <div className="mt-3">
                    <div className="feedback-meta-label">OVERRIDE REASON (AUDIT LOG)</div>
                    <div className="text-sm mt-1"
                      style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {review.override_reason}
                    </div>
                  </div>
                )}
                {review.reviewer && (
                  <div className="text-xs text-muted mt-3">
                    Reviewed by <strong>{review.reviewer}</strong>
                    {review.reviewed_at
                      ? ` · ${new Date(review.reviewed_at).toLocaleString()}` : ''}
                  </div>
                )}
              </div>
            )}

            {/* ── 10. Action panel (pending only) ── */}
            {isPending && (
              <div style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-5)',
                marginTop: 'var(--space-2)',
              }}>
                <div className="form-group mb-3">
                  <label htmlFor={`reason-${review.id}`} className="form-label">
                    Override Reason
                    <span className="text-muted text-xs" style={{ marginLeft: 8 }}>
                      (required when rejecting or modifying)
                    </span>
                  </label>
                  <textarea
                    id={`reason-${review.id}`}
                    className="form-control"
                    rows={2}
                    value={state.reason || ''}
                    onChange={e => updateAction(review.id, 'reason', e.target.value)}
                    placeholder="Explain why you are overriding this recommendation…"
                    aria-describedby={`reason-hint-${review.id}`}
                  />
                  <p id={`reason-hint-${review.id}`} className="form-hint">
                    Permanently logged in the audit trail for accountability.
                  </p>
                </div>

                <div className="form-group mb-4">
                  <label htmlFor={`decision-${review.id}`} className="form-label">
                    Final Decision Note
                    <span className="text-muted text-xs" style={{ marginLeft: 8 }}>(optional)</span>
                  </label>
                  <input
                    id={`decision-${review.id}`}
                    type="text"
                    className="form-control"
                    value={state.finalDecision || ''}
                    onChange={e => updateAction(review.id, 'finalDecision', e.target.value)}
                    placeholder="E.g. 'Schedule a support session.' or 'No action needed.'"
                  />
                </div>

                {state.error && (
                  <div className="error-msg mb-3" role="alert">⚠ {state.error}</div>
                )}

                <div className="flex gap-3 flex-wrap items-center">
                  <button
                    className="btn btn-success"
                    onClick={() => handleAction(review.id, 'approved')}
                    disabled={state.loading}
                    aria-label={`Approve recommendation for ${review.student_name}`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn btn-warn"
                    onClick={() => handleAction(review.id, 'modified')}
                    disabled={state.loading}
                    aria-label={`Modify recommendation for ${review.student_name}`}
                  >
                    ✏️ Modify
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleAction(review.id, 'rejected')}
                    disabled={state.loading}
                    aria-label={`Reject recommendation for ${review.student_name}`}
                  >
                    ✕ Reject
                  </button>
                  {state.loading && (
                    <div className="spinner" aria-label="Processing review action…" />
                  )}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
