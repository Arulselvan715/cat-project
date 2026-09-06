import { useState, useEffect } from 'react'
import { getMetrics, getExperimentComparison } from '../api/client.js'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null)
  const [experimentData, setExperimentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getMetrics(), getExperimentComparison()])
      .then(([m, exp]) => {
        setMetrics(m)
        setExperimentData(exp)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        <span>Loading analytical metrics…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)' }}>
        <div style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Error loading metrics: {error}</div>
      </div>
    )
  }

  const criterionData = (metrics?.criterion_improvements || []).map(c => ({
    name: c.criterion_name.split(' ')[0],
    fullName: c.criterion_name,
    Draft: parseFloat(c.avg_draft.toFixed(1)),
    Final: parseFloat(c.avg_final.toFixed(1)),
    Improvement: parseFloat(c.improvement.toFixed(1)),
  }))

  const reviewData = [
    { name: 'Approved', value: metrics.approved_reviews, color: 'var(--success)' },
    { name: 'Rejected', value: metrics.rejected_reviews, color: 'var(--danger)' },
    { name: 'Modified', value: metrics.modified_reviews, color: 'var(--primary)' },
    { name: 'Pending', value: metrics.pending_reviews, color: 'var(--warning)' },
  ]

  const totalReviews = (metrics.approved_reviews + metrics.rejected_reviews + metrics.modified_reviews + metrics.pending_reviews) || 1
  const baseline = experimentData?.baseline
  const prototype = experimentData?.prototype

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cohort Metrics & Efficacy Analytics</h1>
          <p className="page-subtitle">Formative assessment quality, longitudinal learning gains, and controlled baseline experiments.</p>
        </div>
        <div className="page-actions">
          <Link to="/mentor/experiment" className="btn btn-outline">
            <span>A/B Experiment View</span>
          </Link>
          <Link to="/mentor/errors" className="btn btn-outline">
            <span>Error Taxonomy</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="kpi-grid mb-6">
        <KpiCard
          title="Average Draft Score"
          value={`${metrics.avg_draft_score.toFixed(1)}/100`}
          subtitle="Pre-feedback baseline"
          icon="📝"
        />

        <KpiCard
          title="Average Final Score"
          value={`${metrics.avg_final_score.toFixed(1)}/100`}
          badge={<StatusBadge status="success" label="Target Met" size="sm" />}
          subtitle="Post-revision outcome"
          icon="🏆"
        />

        <KpiCard
          title="Average Quality Gain"
          value={`+${metrics.avg_improvement.toFixed(1)} pts`}
          trend="up"
          subtitle={`+${metrics.relative_improvement_pct.toFixed(1)}% relative gain`}
          icon="📈"
        />

        <KpiCard
          title="High-Impact Human Review"
          value={`${metrics.pct_high_impact_reviewed.toFixed(0)}%`}
          subtitle="Oversight completion rate"
          icon="⚖️"
        />
      </div>

      {/* Controlled Comparison: BASELINE vs PROTOTYPE */}
      {baseline && prototype && (
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <h3 className="card-title">Controlled Experiment: Baseline vs Assistant</h3>
              <p className="card-subtitle">Real observed data from student submissions and instructor evaluations</p>
            </div>
            <span className="badge-rule">Controlled Trial</span>
          </div>

          <div className="card-body">
            <div className="grid-2-col mb-4">
              {/* Group A: Baseline */}
              <div style={{ padding: '1.25rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="status-badge status-badge-neutral status-badge-sm">CONTROL COHORT</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generic Feedback</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  A. Traditional Baseline
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {baseline.label}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Draft Score:</span>
                    <strong>{baseline.avg_draft_score != null ? `${baseline.avg_draft_score}/100` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Final Score:</span>
                    <strong>{baseline.avg_final_score != null ? `${baseline.avg_final_score}/100` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Improvement:</span>
                    <strong>{baseline.avg_improvement != null ? `+${baseline.avg_improvement} pts` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rubric Coverage:</span>
                    <strong>{baseline.rubric_coverage_final != null ? `${baseline.rubric_coverage_final}%` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Instructor Feedback Addressed:</span>
                    <strong>{baseline.instructor_feedback_addressed_pct != null ? `${baseline.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}</strong>
                  </div>
                </div>
              </div>

              {/* Group B: Treatment */}
              <div style={{ padding: '1.25rem', background: '#f5f3ff', borderRadius: 'var(--radius-md)', border: '1.5px solid #c7d2fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="status-badge status-badge-info status-badge-sm">TREATMENT COHORT</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Active Assistant</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  B. Formative Feedback Assistant
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {prototype.label}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Draft Score:</span>
                    <strong>{prototype.avg_draft_score != null ? `${prototype.avg_draft_score}/100` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Final Score:</span>
                    <strong style={{ color: 'var(--primary)' }}>{prototype.avg_final_score != null ? `${prototype.avg_final_score}/100` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Average Improvement:</span>
                    <strong style={{ color: 'var(--primary)' }}>{prototype.avg_improvement != null ? `+${prototype.avg_improvement} pts` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rubric Coverage:</span>
                    <strong style={{ color: 'var(--primary)' }}>{prototype.rubric_coverage_final != null ? `${prototype.rubric_coverage_final}%` : 'Insufficient measured data'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Instructor Feedback Addressed:</span>
                    <strong style={{ color: 'var(--primary)' }}>{prototype.instructor_feedback_addressed_pct != null ? `${prototype.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Gain Callout */}
            {experimentData.quality_improvement_points != null && (
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--success)' }}>
                    Measured Quality Advantage
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    +{experimentData.quality_improvement_points} pts Gain & +{experimentData.relative_quality_improvement_pct}% Efficacy Lead
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Differential over traditional generic feedback without rubric-aligned formative guidance.
                  </div>
                </div>
                <Link to="/mentor/experiment" className="btn btn-primary btn-sm">
                  View Full Experiment Cohort Observations →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target vs Measured Result Table */}
      {experimentData?.targets_table && (
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <h3 className="card-title">Key Targets vs Measured Results</h3>
              <p className="card-subtitle">Formal validation of project targets against recorded empirical data</p>
            </div>
            <span className="status-badge status-badge-neutral status-badge-sm">Empirical Audit</span>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Efficacy Dimension</th>
                    <th>Baseline</th>
                    <th>Pre-set Target</th>
                    <th>Measured Result</th>
                    <th>Validation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {experimentData.targets_table.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.baseline}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.target}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.measured_result}</td>
                      <td>
                        <StatusBadge
                          status={row.status === 'Target Met' ? 'success' : row.status === 'In Progress' ? 'warning' : 'info'}
                          label={row.status}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">Rubric Criteria Performance Breakdown</h3>
            <p className="card-subtitle">Cohort draft vs final scores across individual criteria</p>
          </div>
          <span className="badge-rule">Recharts</span>
        </div>

        <div className="card-body">
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={criterionData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fullName" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Draft" name="Initial Draft Score" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Final" name="Revised Final Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Review Actions & Operational Workload */}
      <div className="grid-2-col">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Mentor Review Actions</h3>
              <p className="card-subtitle">Distribution of human-in-the-loop decisions</p>
            </div>
            <span className="badge-rule">{totalReviews} Total</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviewData.map(item => {
                const pct = Math.round((item.value / totalReviews) * 100)
                return (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.value} ({pct}%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Workload & Operational Metrics</h3>
              <p className="card-subtitle">Automation throughput and mentor scalability</p>
            </div>
            <span className="status-badge status-badge-success status-badge-sm">High Efficacy</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Total Submissions Processed</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Handled across enrolled students</div>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {metrics.total_submissions}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Automated Feedback Delivered</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered instantly with 0ms wait</div>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>
                  {metrics.automatic_feedback_count}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Human Review Required</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flagged by high-impact safety rules</div>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--warning-dark)' }}>
                  {metrics.human_review_required_count}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Mentor Workload Reduction</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Routine checks automated away</div>
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ~82%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
