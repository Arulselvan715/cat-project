import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMetrics, getReviews } from '../api/client.js'

export default function MentorDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getMetrics(), getReviews('pending')])
      .then(([m, r]) => { setMetrics(m); setPendingReviews(r) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading mentor dashboard…</span></div>
  if (error) return <div className="container page"><div className="error-msg" role="alert">⚠ {error}</div></div>

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Mentor Dashboard</h1>
        <p>Overview of all submissions, feedback metrics, and pending human-review decisions.</p>
        <div className="demo-label mt-4" aria-label="Demo data label">
          📊 DEMO DATA — Seed Submissions
        </div>
      </div>

      {/* Stats grid */}
      {metrics && (
        <section aria-labelledby="stats-heading" className="mb-8">
          <h2 id="stats-heading" className="section-title">📈 Key Statistics</h2>
          <div className="stats-grid">
            <StatCard value={metrics.total_submissions} label="Total Submissions" />
            <StatCard value={metrics.total_students} label="Enrolled Students" />
            <StatCard value={metrics.automatic_feedback_count} label="Auto Feedback Items" />
            <StatCard value={metrics.human_review_required_count} label="Human Review Required" color="var(--color-warn)" />
            <StatCard value={metrics.pending_reviews} label="Pending Reviews" color="var(--color-danger)" />
            <StatCard value={metrics.approved_reviews} label="Approved" color="var(--color-success)" />
            <StatCard value={metrics.rejected_reviews} label="Rejected / Overridden" color="var(--color-danger)" />
            <StatCard value={metrics.modified_reviews} label="Modified" color="var(--color-primary-light)" />
          </div>
        </section>
      )}

      {/* Score metrics */}
      {metrics && (
        <section aria-labelledby="score-heading" className="card mb-6">
          <h2 id="score-heading" className="section-title">🎯 Score Metrics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
            <MetricRow label="Avg Draft Score" value={`${metrics.avg_draft_score.toFixed(1)}/100`} />
            <MetricRow label="Avg Final Score" value={`${metrics.avg_final_score.toFixed(1)}/100`} accent />
            <MetricRow label="Avg Improvement" value={`+${metrics.avg_improvement.toFixed(1)} pts`} accent />
            <MetricRow label="Relative Improvement" value={`+${metrics.relative_improvement_pct.toFixed(1)}%`} accent />
            <MetricRow label="Rubric Coverage" value={`${metrics.rubric_coverage.toFixed(0)}%`} />
            <MetricRow label="% High-Impact Reviewed" value={`${metrics.pct_high_impact_reviewed.toFixed(0)}%`} />
          </div>
        </section>
      )}

      {/* Pending reviews quick view */}
      <section aria-labelledby="pending-heading" className="card mb-6">
        <div className="flex items-center gap-3 mb-4" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 id="pending-heading" className="section-title" style={{ margin: 0 }}>⏳ Pending Reviews</h2>
          <Link to="/mentor/reviews" className="btn btn-primary btn-sm">View All Reviews →</Link>
        </div>
        {pendingReviews.length === 0 ? (
          <div className="alert alert-success">✓ No pending reviews — all high-impact decisions have been addressed.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pendingReviews.slice(0, 5).map(r => (
              <div key={r.id} className="card card-sm" style={{ background: 'var(--color-surface-2)', borderLeft: '3px solid var(--color-warn)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="badge badge-pending">Pending</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.student_name}</span>
                  <span className="text-muted text-sm">—</span>
                  <span className="text-sm">{r.criterion_name || 'General'}</span>
                  <span className={`badge badge-${r.priority}`} style={{ marginLeft: 'auto' }}>{r.priority}</span>
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {r.original_recommendation?.slice(0, 120)}…
                </p>
              </div>
            ))}
            {pendingReviews.length > 5 && (
              <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
                +{pendingReviews.length - 5} more pending reviews
              </p>
            )}
          </div>
        )}
      </section>

      {/* Navigation */}
      <div className="flex gap-4 flex-wrap">
        <Link to="/mentor/reviews" className="btn btn-primary">🔍 Open Review Queue</Link>
        <Link to="/mentor/metrics" className="btn btn-ghost">📊 Full Metrics Dashboard</Link>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={color ? { color, backgroundImage: 'none', WebkitTextFillColor: color } : {}}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function MetricRow({ label, value, accent }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div style={{
        fontSize: '1.5rem', fontWeight: 800, marginTop: 4,
        color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
      }}>
        {value}
      </div>
    </div>
  )
}
