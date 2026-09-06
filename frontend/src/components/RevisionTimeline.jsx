import React from 'react'

/**
 * RevisionTimeline.jsx
 * Visual timeline showing original draft + all revisions with scores,
 * deltas, and expandable content preview.
 */
export default function RevisionTimeline({ submission, revisions = [] }) {
  if (!submission) return null

  const entries = [
    {
      version: 1,
      label: 'Initial Draft',
      date: submission.submitted_at,
      score: submission.draft_score,
      content: submission.content,
      isFinal: false,
    },
    ...revisions.map((r) => ({
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
      {entries.map((entry, idx) => {
        const prevScore = idx > 0 ? entries[idx - 1].score : null
        const delta = (entry.score != null && prevScore != null) ? (entry.score - prevScore) : null

        return (
          <div key={idx} className="timeline-item" role="listitem">
            <div className={`timeline-dot ${entry.isFinal ? 'final' : ''}`} aria-hidden="true" />
            
            <div className="timeline-date" aria-label={`Submitted: ${new Date(entry.date).toLocaleString()}`}>
              {new Date(entry.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>

            <div className="timeline-content">
              <div className="timeline-version" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {entry.label}
                </span>
                {entry.isFinal && (
                  <span className="status-badge status-badge-success status-badge-sm">
                    <span className="status-dot" />
                    <span>Final Submission</span>
                  </span>
                )}
              </div>

              {entry.score != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Assessed Score:</span>
                  <span 
                    style={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: entry.score >= 70 ? 'var(--success)' : entry.score >= 45 ? 'var(--warning)' : 'var(--danger)',
                    }} 
                    aria-label={`Score: ${entry.score.toFixed(1)} out of 100`}
                  >
                    {entry.score.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
                  </span>

                  {delta != null && (
                    <span className={`improvement-badge ${delta >= 0 ? 'improvement-positive' : 'improvement-negative'}`}>
                      {delta >= 0 ? `+${delta.toFixed(1)} pts` : `${delta.toFixed(1)} pts`}
                    </span>
                  )}
                </div>
              )}

              <details style={{ marginTop: '0.5rem' }}>
                <summary
                  style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 500, userSelect: 'none' }}
                  aria-label={`View submission text for ${entry.label}`}
                >
                  View submission draft text ({entry.content?.length || 0} chars)
                </summary>
                <div 
                  style={{
                    marginTop: '0.5rem',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {entry.content}
                </div>
              </details>
            </div>
          </div>
        )
      })}
    </div>
  )
}
