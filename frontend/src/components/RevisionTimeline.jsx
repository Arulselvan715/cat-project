/**
 * RevisionTimeline.jsx
 * Visual timeline showing original draft + all revisions with scores.
 */
export default function RevisionTimeline({ submission, revisions }) {
  if (!submission) return null

  const entries = [
    {
      version: 1,
      label: 'Draft Submitted',
      date: submission.submitted_at,
      score: submission.draft_score,
      content: submission.content,
      isFinal: false,
    },
    ...revisions.map(r => ({
      version: r.version,
      label: r.version === 2 ? 'Revision 1' : `Revision ${r.version - 1}`,
      date: r.submitted_at,
      score: r.score,
      content: r.content,
      isFinal: submission.is_final && r.id === revisions[revisions.length - 1]?.id,
    })),
  ]

  return (
    <div className="timeline" role="list" aria-label="Submission history timeline">
      {entries.map((entry, idx) => (
        <div key={idx} className="timeline-item" role="listitem">
          <div className={`timeline-dot ${entry.isFinal ? 'final' : ''}`} aria-hidden="true" />
          <div className="timeline-date" aria-label={`Submitted: ${new Date(entry.date).toLocaleString()}`}>
            {new Date(entry.date).toLocaleString()}
          </div>
          <div className="timeline-content">
            <div className="timeline-version">
              {entry.label}
              {entry.isFinal && (
                <span className="badge badge-approved" style={{ marginLeft: 8 }}>✓ Final</span>
              )}
            </div>
            {entry.score != null && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-muted">Score:</span>
                <span style={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: entry.score >= 70 ? 'var(--color-success)' : entry.score >= 45 ? 'var(--color-warn)' : 'var(--color-danger)',
                }} aria-label={`Score: ${entry.score.toFixed(1)} out of 100`}>
                  {entry.score.toFixed(1)}/100
                </span>
                {idx > 0 && entries[idx - 1].score && (
                  <span className={`improvement-badge ${entry.score >= entries[idx - 1].score ? 'improvement-positive' : 'improvement-negative'}`}>
                    {entry.score >= entries[idx - 1].score ? '+' : ''}{(entry.score - entries[idx - 1].score).toFixed(1)} pts
                  </span>
                )}
              </div>
            )}
            <details>
              <summary
                style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-text-muted)', userSelect: 'none' }}
                aria-label={`View submission text for ${entry.label}`}
              >
                View submission text…
              </summary>
              <div style={{
                marginTop: 'var(--space-3)',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                fontSize: '0.82rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                maxHeight: '200px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-sans)',
              }}>
                {entry.content}
              </div>
            </details>
          </div>
        </div>
      ))}
    </div>
  )
}
