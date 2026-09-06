import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMetrics, getReviews } from '../api/client.js'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

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

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        <span>Loading mentor dashboard…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)' }}>
        <div style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Error loading dashboard: {error}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Instructor & Mentor Overview</h1>
          <p className="page-subtitle">Oversight console for formative feedback operations, automated rule efficacy, and human-in-the-loop review queues.</p>
        </div>
        <div className="page-actions">
          <Link to="/mentor/reviews" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Review Queue ({pendingReviews.length})</span>
          </Link>
          <Link to="/mentor/metrics" className="btn btn-outline">
            <span>Cohort Analytics</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards */}
      {metrics && (
        <div className="kpi-grid mb-6">
          <KpiCard
            title="Total Submissions"
            value={metrics.total_submissions}
            subtitle={`From ${metrics.total_students} active learners`}
            icon="📑"
          />

          <KpiCard
            title="Pending Human Reviews"
            value={metrics.pending_reviews}
            badge={<StatusBadge status={metrics.pending_reviews > 0 ? 'warning' : 'success'} label={metrics.pending_reviews > 0 ? 'Needs Action' : 'All Clear'} size="sm" />}
            subtitle="Flagged by high-impact rules"
            icon="⚖️"
          />

          <KpiCard
            title="Average Quality Delta"
            value={`+${metrics.avg_improvement?.toFixed(1) || 0} pts`}
            trend="up"
            subtitle={`+${metrics.relative_improvement_pct?.toFixed(1) || 0}% relative growth`}
            icon="📈"
          />

          <KpiCard
            title="Rubric Coverage"
            value={`${metrics.rubric_coverage?.toFixed(0) || 0}%`}
            subtitle="Criteria actively addressed"
            icon="🎯"
          />
        </div>
      )}

      {/* Quality Score Metrics Card */}
      {metrics && (
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <h3 className="card-title">Formative Assessment Outcomes</h3>
              <p className="card-subtitle">Cohort draft vs final performance indicators</p>
            </div>
            <span className="status-badge status-badge-info status-badge-sm">Active Cohort</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Draft Score</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                  {metrics.avg_draft_score?.toFixed(1) || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Pre-feedback baseline</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Final Score</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.3rem' }}>
                  {metrics.avg_final_score?.toFixed(1) || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Post-revision average</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>High Impact Reviewed</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.3rem' }}>
                  {metrics.pct_high_impact_reviewed?.toFixed(0) || 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Target: 100% human oversight</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Auto Feedback Issued</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                  {metrics.automatic_feedback_count || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Generated recommendations</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Queue Preview */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">Priority Human Review Queue</h3>
            <p className="card-subtitle">Flagged suggestions requiring mentor intervention or override</p>
          </div>
          <Link to="/mentor/reviews" className="btn btn-outline btn-sm">
            View All ({pendingReviews.length}) →
          </Link>
        </div>

        <div className="card-body">
          {pendingReviews.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Review Queue is Clear"
              description="All high-impact automated suggestions have been reviewed and approved by instructors."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingReviews.slice(0, 5).map(r => (
                <div 
                  key={r.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-light)',
                    borderLeft: '4px solid var(--warning)',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <StatusBadge status="pending" label="Awaiting Decision" size="sm" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.student_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>•</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.criterion_name || 'General'}</span>
                    <span className="badge-rule">{r.rule_id}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`status-badge status-badge-${r.priority === 'high' ? 'danger' : 'warning'} status-badge-sm`}>
                      {r.priority}
                    </span>
                    <Link to="/mentor/reviews" className="btn btn-primary btn-xs" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Moderate →
                    </Link>
                  </div>
                </div>
              ))}

              {pendingReviews.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <Link to="/mentor/reviews" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                    + {pendingReviews.length - 5} additional submissions awaiting review in queue →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Link to="/mentor/reviews" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>🔍 Review Queue Console</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Approve, edit, or reject automated feedback with audit logging.
          </div>
        </Link>

        <Link to="/mentor/metrics" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>📊 Analytical Metrics</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Inspect criterion distribution, score gains, and coverage.
          </div>
        </Link>

        <Link to="/mentor/experiment" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>🧪 A/B Experiments</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Compare baseline vs prototype formative feedback cohorts.
          </div>
        </Link>

        <Link to="/mentor/errors" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>🐞 Error Taxonomy</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Rigorous classification across hallucination, false triggers, etc.
          </div>
        </Link>
      </div>
    </div>
  )
}
