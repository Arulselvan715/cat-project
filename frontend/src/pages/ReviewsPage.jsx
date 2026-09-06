import { useState, useEffect, useCallback } from 'react'
import { getReviews, actionReview } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

/* ═══════════════════════════════════════════════════════════════════════════
   RULE REGISTRY
   Every rule gets: name, explanation, generateWhyFired(), mentorCheck.
   Keeps all explainability and rule ID fidelity intact.
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

function parseHighImpactReason(reason) {
  if (!reason) return null
  const r = reason.toLowerCase()
  if (r.includes('plagiarism') || r.includes('copy'))
    return { label: 'Possible Plagiarism', icon: '🔎', color: 'var(--danger)' }
  if (r.includes('very low') || r.includes('low performance') || r.includes('low score'))
    return { label: 'Extremely Low Score', icon: '⬇', color: 'var(--danger)' }
  if (r.includes('exceptionally high') || r.includes('high score') || r.includes('authenticity'))
    return { label: 'Exceptionally High Score', icon: '⬆', color: 'var(--warning-dark)' }
  if (r.includes('low confidence') || r.includes('ambiguous') || r.includes('confidence'))
    return { label: 'Low Confidence', icon: '❓', color: 'var(--warning)' }
  if (r.includes('insufficient evidence') || r.includes('too short'))
    return { label: 'Insufficient Evidence', icon: '📏', color: 'var(--warning)' }
  return { label: 'Human Review Required', icon: '👤', color: 'var(--warning)' }
}

function RulePanel({ ruleId, evidence, submissionContent, submissionScore }) {
  if (!ruleId) return null
  const rule = getRule(ruleId)
  const whyFired = rule.generateWhyFired(evidence, submissionContent, submissionScore)

  return (
    <div style={{
      background: 'var(--bg-app)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'rgba(79, 70, 229, 0.06)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge-rule">{ruleId}</span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            {rule.name}
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Rule Logic
        </span>
      </div>

      <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {rule.explanation}
        </p>

        {/* WHY THIS RULE FIRED */}
        <div style={{
          background: 'rgba(79, 70, 229, 0.04)',
          border: '1px solid rgba(79, 70, 229, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: '0.2rem' }}>
            Why This Rule Fired
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {whyFired}
          </div>
        </div>

        {/* WHAT THE MENTOR SHOULD CHECK */}
        <div style={{
          background: 'var(--warning-light)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--warning-dark)', marginBottom: '0.2rem' }}>
            What the Mentor Should Verify
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {rule.mentorCheck}
          </div>
        </div>
      </div>
    </div>
  )
}

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
        ...prev, [reviewId]: { ...state, error: 'Override reason is required when rejecting or modifying recommendations.' },
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
    { label: 'Pending Review',  value: 'pending'  },
    { label: 'Approved',        value: 'approved' },
    { label: 'Rejected',        value: 'rejected' },
    { label: 'Modified',        value: 'modified' },
    { label: 'All Records',     value: ''         },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mentor Review Queue & Moderation</h1>
          <p className="page-subtitle">
            High-impact recommendations require explicit human sign-off. Review full student submissions, audit rule triggers, and record decision overrides.
          </p>
        </div>
      </div>

      {/* Human Oversight Policy Banner */}
      <div className="card mb-6" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem' }}>⚖️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.92rem' }}>
              Human-in-the-Loop Oversight Policy
            </div>
            <p style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '0.2rem', lineHeight: 1.55 }}>
              Decisions flagged as high impact (possible plagiarism, extreme scores, or low pattern confidence) are never dispatched automatically. Rejections and modifications require a mandatory written justification recorded in the immutable audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs mb-6" role="tablist" aria-label="Review status filters">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            className={`filter-tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loader">
          <div className="spinner" />
          <span>Loading queue entries…</span>
        </div>
      )}

      {error && (
        <div className="error-msg mb-6" role="alert">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <EmptyState
          icon="✅"
          title="No Reviews Found"
          description={`There are currently no reviews matching the '${filter || 'all'}' status.`}
        />
      )}

      {/* Review Cards */}
      {!loading && reviews.map(review => {
        const state = actionState[review.id] || {}
        const isPending = review.status === 'pending'
        const hiInfo = parseHighImpactReason(review.high_impact_reason)
        const isSubExpanded = expandedSubs[review.id]

        return (
          <div 
            key={review.id} 
            className="card mb-6" 
            style={{ borderLeft: hiInfo ? `5px solid ${hiInfo.color}` : '1px solid var(--border-light)' }}
          >
            {/* 1. Header */}
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="user-avatar-sm" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                  {review.student_name ? review.student_name.charAt(0) : 'S'}
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {review.student_name || 'Unknown Learner'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{review.assignment_title}</span>
                <StatusBadge status={review.status} size="sm" />
                {review.priority && (
                  <span className={`status-badge status-badge-${review.priority === 'high' ? 'danger' : 'warning'} status-badge-sm`}>
                    {review.priority}
                  </span>
                )}
              </div>
              <span className="badge-rule">Review #{review.id}</span>
            </div>

            <div className="card-body">
              {/* 2. High Impact Alert Banner */}
              {hiInfo && (
                <div 
                  className="human-review-banner mb-5"
                  role="alert"
                  style={{ background: '#fef2f2', borderColor: '#fca5a5' }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{hiInfo.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#991b1b' }}>
                      HIGH IMPACT — HUMAN REVIEW REQUIRED
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '0.15rem' }}>
                      <strong>Trigger Category:</strong> {hiInfo.label}
                    </div>
                    {review.high_impact_reason && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#7f1d1d', background: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                        <strong>Diagnostic Detail:</strong> {review.high_impact_reason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Student Submission (Full Context) */}
              <div className="mb-5">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Complete Student Submission
                    {review.submission_score != null && (
                      <span style={{ marginLeft: '0.75rem', color: review.submission_score >= 70 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        Score: {review.submission_score.toFixed(1)}/100
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => toggleSub(review.id)}
                    aria-expanded={isSubExpanded}
                    style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                  >
                    {isSubExpanded ? '▲ Collapse' : '▼ Expand Full Draft'}
                  </button>
                </div>

                <div
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem 1.1rem',
                    fontSize: '0.86rem',
                    lineHeight: 1.65,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: isSubExpanded ? 'none' : '100px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {review.submission_content || '(no submission text available)'}
                  {!isSubExpanded && review.submission_content && review.submission_content.length > 250 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40px',
                      background: 'linear-gradient(transparent, var(--bg-app))',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              </div>

              {/* 4. Recommendation & Evidence Side-by-Side */}
              <div className="grid-2-col mb-5">
                {/* Recommendation */}
                <div style={{ padding: '0.9rem 1.1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                    Proposed Recommendation
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    {review.original_recommendation}
                  </p>
                </div>

                {/* Evidence */}
                <div style={{ padding: '0.9rem 1.1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Evidence from Submission
                  </div>
                  {review.evidence ? (
                    <div className="evidence-text" style={{ margin: 0, fontSize: '0.84rem' }}>
                      "{review.evidence}"
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No isolated text passage — rule evaluated overall draft context.
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Rule Explainability Panel */}
              <div className="mb-5">
                <RulePanel
                  ruleId={review.rule_id}
                  evidence={review.evidence}
                  submissionContent={review.submission_content}
                  submissionScore={review.submission_score}
                />
              </div>

              {/* 6. Rule Confidence Meter */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Rule Confidence
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {review.confidence != null ? `${(review.confidence * 100).toFixed(0)}%` : '—'}
                  </div>
                </div>

                {review.confidence != null && (
                  <div className="progress-bar" style={{ marginTop: '0.4rem', height: '6px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${review.confidence * 100}%`,
                        background: review.confidence < 0.5 ? 'var(--warning)' : 'var(--primary)'
                      }} 
                    />
                  </div>
                )}
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Rule confidence indicates pattern match certainty, not the student's quality or grade.
                </div>
              </div>

              {/* 7. Action Controls (If Pending) OR Audit Decision (If Actioned) */}
              {isPending ? (
                <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                  <div className="form-group mb-3">
                    <label htmlFor={`reason-${review.id}`} className="form-label">
                      Override Reason
                      <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginLeft: '0.4rem' }}>
                        (Required if Rejecting or Modifying)
                      </span>
                    </label>
                    <textarea
                      id={`reason-${review.id}`}
                      className="form-control"
                      rows={2}
                      value={state.reason || ''}
                      onChange={e => updateAction(review.id, 'reason', e.target.value)}
                      placeholder="Explain pedagogical rationale for overriding this automated suggestion…"
                    />
                    <p className="form-hint">Logged permanently into the audit trail for accreditation compliance.</p>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor={`decision-${review.id}`} className="form-label">
                      Instructor Decision Note <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <input
                      id={`decision-${review.id}`}
                      type="text"
                      className="form-control"
                      value={state.finalDecision || ''}
                      onChange={e => updateAction(review.id, 'finalDecision', e.target.value)}
                      placeholder="e.g., 'Advised student to incorporate AWS Lambda use case during office hours'"
                    />
                  </div>

                  {state.error && (
                    <div className="error-msg mb-3" role="alert">⚠️ {state.error}</div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleAction(review.id, 'approved')}
                      disabled={state.loading}
                    >
                      ✓ Approve Recommendation
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleAction(review.id, 'modified')}
                      disabled={state.loading}
                    >
                      ✏️ Modify Recommendation
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      onClick={() => handleAction(review.id, 'rejected')}
                      disabled={state.loading}
                    >
                      ✕ Reject Recommendation
                    </button>
                    {state.loading && (
                      <div className="spinner" aria-label="Processing action…" />
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      Moderation Audit Record
                    </span>
                    <StatusBadge status={review.status} label={review.status} size="sm" />
                  </div>

                  {review.override_reason && (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <strong>Override Rationale:</strong> {review.override_reason}
                    </div>
                  )}

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Moderated by <strong>{review.reviewer || 'Instructor'}</strong>
                    {review.reviewed_at && ` on ${new Date(review.reviewed_at).toLocaleString()}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
