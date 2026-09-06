import React from 'react'

/**
 * FeedbackCard.jsx
 * Displays a single feedback item with full explainability:
 * criterion, rule, evidence, confidence, priority, and why.
 * Redesigned with modern SaaS aesthetic.
 */
export default function FeedbackCard({ item }) {
  const priorityClass = `priority-${item.priority}`
  const confidencePct = Math.round(item.confidence * 100)

  return (
    <article
      className={`card feedback-card ${priorityClass}`}
      aria-labelledby={`fb-${item.id}-criterion`}
      tabIndex={0}
      style={{ marginBottom: '1.25rem' }}
    >
      {/* Header */}
      <div className="feedback-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span
            id={`fb-${item.id}-criterion`}
            style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}
          >
            {item.criterion_name || 'General Criterion'}
          </span>
          <span className={`status-badge status-badge-${item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'} status-badge-sm`}>
            <span className="status-dot" />
            <span className="status-text">{item.priority} priority</span>
          </span>
          {item.requires_human_review && (
            <span className="status-badge status-badge-danger status-badge-sm" style={{ fontWeight: 600 }}>
              <span className="status-dot" />
              <span>👤 Mentor Review Required</span>
            </span>
          )}
        </div>
        <span
          className="badge-rule"
          style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}
          aria-label={`Rule: ${item.rule_id}`}
        >
          {item.rule_id}
        </span>
      </div>

      {/* Message — Actionable Guidance */}
      <div className="feedback-message" role="text" style={{ marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
          Actionable Guidance
        </div>
        <p style={{ marginTop: '0.35rem', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {item.message}
        </p>
      </div>

      {/* Human review notice */}
      {item.requires_human_review && (
        <div className="human-review-banner" role="note" aria-label="This item requires mentor review" style={{ marginTop: '0.85rem' }}>
          <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span style={{ fontSize: '0.85rem' }}>This recommendation triggered safety thresholds and has been forwarded for mentor review.</span>
        </div>
      )}

      {/* Meta grid — explainability */}
      <div className="feedback-meta" role="group" aria-label="Feedback details" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        {/* Evidence */}
        <div className="feedback-meta-item feedback-evidence">
          <div className="feedback-meta-label">Evidence Detected in Submission</div>
          {item.evidence ? (
            <div className="evidence-text" aria-label={`Evidence: ${item.evidence}`}>
              "{item.evidence}"
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
              No specific text passage — rule evaluated overall draft context.
            </div>
          )}
        </div>

        {/* Rule explanation */}
        <div className="feedback-meta-item">
          <div className="feedback-meta-label">Rule Applied</div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {ruleDescription(item.rule_id)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
            Code: {item.rule_id}
          </div>
        </div>

        {/* Confidence */}
        <div className="feedback-meta-item">
          <div className="feedback-meta-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Rule Confidence</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{confidencePct}%</span>
          </div>
          <div
            className="confidence-bar mt-2"
            role="meter"
            aria-valuenow={confidencePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Rule Confidence: ${confidencePct}%`}
            style={{ marginTop: '0.4rem' }}
          >
            <div
              className="confidence-fill"
              style={{ width: `${confidencePct}%`, background: confidencePct < 50 ? 'var(--warning)' : 'var(--primary)' }}
            />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.3 }}>
            Confidence indicates pattern match certainty, not student performance.
          </div>
        </div>
      </div>
    </article>
  )
}

function ruleDescription(ruleId) {
  const descriptions = {
    RULE_DEF_001:  'Missing definition of cloud computing',
    RULE_DEF_001B: 'Definition present but too brief',
    RULE_ADV_001:  'Fewer than 2 advantages detected',
    RULE_ADV_002:  'Advantages mentioned but not elaborated',
    RULE_EX_001:   'Fewer than 2 real-world examples',
    RULE_EX_002:   'Examples not linked to advantages',
    RULE_EX_003:   'Ambiguous example — low context',
    RULE_ORG_001:  'No clear paragraph structure',
    RULE_CLR_001:  'Submission too short to evaluate',
    RULE_LANG_001: 'Grammar issues noted (informational only)',
    RULE_HI_001:   'Very low score — possible need for support',
    RULE_HI_002:   'Exceptionally high score — authenticity check',
    RULE_PLAG_001: 'Possible plagiarism signal detected',
  }
  return descriptions[ruleId] || 'Rubric compliance rule'
}
