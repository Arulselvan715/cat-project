/**
 * FeedbackCard.jsx
 * Displays a single feedback item with full explainability:
 * criterion, rule, evidence, confidence, priority, and why.
 */
export default function FeedbackCard({ item }) {
  const priorityClass = `priority-${item.priority}`
  const confidencePct = Math.round(item.confidence * 100)

  return (
    <article
      className={`feedback-card ${priorityClass}`}
      aria-labelledby={`fb-${item.id}-criterion`}
      tabIndex={0}
    >
      {/* Header */}
      <div className="feedback-header">
        <span
          id={`fb-${item.id}-criterion`}
          style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}
        >
          {item.criterion_name || 'General'}
        </span>
        <span className={`badge badge-${item.priority}`} aria-label={`Priority: ${item.priority}`}>
          {item.priority}
        </span>
        {item.requires_human_review && (
          <span className="badge badge-human" aria-label="Requires human review">
            👤 Human Review
          </span>
        )}
        <span
          className="text-xs text-mono"
          style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}
          aria-label={`Rule: ${item.rule_id}`}
        >
          {item.rule_id}
        </span>
      </div>

      {/* Message — WHY */}
      <div className="feedback-message" role="text">
        <strong style={{ color: 'var(--color-warn-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recommendation:
        </strong>
        <p style={{ marginTop: 4 }}>{item.message}</p>
      </div>

      {/* Human review banner */}
      {item.requires_human_review && (
        <div className="human-review-banner" role="note" aria-label="This item requires mentor review">
          <span aria-hidden="true">⚠</span>
          <span>This recommendation is flagged for mentor review before any action is taken.</span>
        </div>
      )}

      {/* Meta grid — explainability */}
      <div className="feedback-meta" role="group" aria-label="Feedback details">
        {/* Evidence */}
        <div className="feedback-meta-item feedback-evidence">
          <div className="feedback-meta-label">Evidence from Your Submission</div>
          {item.evidence ? (
            <div className="evidence-text" aria-label={`Evidence: ${item.evidence}`}>
              "{item.evidence}"
            </div>
          ) : (
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>
              No specific text passage — rule applied to overall submission.
            </div>
          )}
        </div>

        {/* Rule used */}
        <div className="feedback-meta-item">
          <div className="feedback-meta-label">Rule Applied</div>
          <div className="feedback-meta-value" aria-label={`Rule: ${item.rule_id}`}>{item.rule_id}</div>
          <div className="text-xs text-muted mt-1">
            {ruleDescription(item.rule_id)}
          </div>
        </div>

        {/* Confidence */}
        <div className="feedback-meta-item">
          <div className="feedback-meta-label">
            Confidence
            <span className="text-xs text-muted" style={{ marginLeft: 6 }}>
              ({confidencePct}%)
            </span>
          </div>
          <div
            className="confidence-bar mt-2"
            role="meter"
            aria-valuenow={confidencePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confidence: ${confidencePct}%`}
          >
            <div
              className="confidence-fill"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          {confidencePct < 50 && (
            <div className="text-xs mt-1" style={{ color: 'var(--color-warn)' }}>
              Low confidence — mentor review recommended.
            </div>
          )}
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
  return descriptions[ruleId] || 'Rubric rule'
}
