import { useState, useEffect } from 'react'
import { getMetrics, getExperimentComparison } from '../api/client.js'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts'

const CHART_COLORS = { draft: '#6c63ff', final: '#00d4aa' }

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

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading metrics…</span></div>
  if (error) return <div className="container page"><div className="error-msg" role="alert">⚠ {error}</div></div>

  const criterionData = metrics.criterion_improvements.map(c => ({
    name: c.criterion_name.split(' ')[0],  // short label
    fullName: c.criterion_name,
    Draft: parseFloat(c.avg_draft.toFixed(1)),
    Final: parseFloat(c.avg_final.toFixed(1)),
    Improvement: parseFloat(c.improvement.toFixed(1)),
  }))

  const reviewData = [
    { name: 'Approved', value: metrics.approved_reviews },
    { name: 'Rejected', value: metrics.rejected_reviews },
    { name: 'Modified', value: metrics.modified_reviews },
    { name: 'Pending', value: metrics.pending_reviews },
  ]

  const baseline = experimentData?.baseline
  const prototype = experimentData?.prototype

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Metrics & Efficacy Dashboard</h1>
        <p>System performance, feedback quality, learning improvement metrics, and baseline experiment validation.</p>
        <div className="demo-label mt-4" aria-label="Demo data warning">
          📊 {metrics.data_label}
        </div>
      </div>

      {/* Quick Links to Specialized Auditing Dashboards */}
      <div className="flex gap-3 flex-wrap mb-8">
        <Link to="/mentor/experiment" className="btn btn-sm btn-primary">
          🧪 Detailed Experiment & Instructor Feedback →
        </Link>
        <Link to="/mentor/errors" className="btn btn-sm btn-ghost">
          🐞 Error Analysis & Taxonomy →
        </Link>
        <Link to="/mentor/validation" className="btn btn-sm btn-ghost">
          ✅ User & Accessibility Validation →
        </Link>
      </div>

      {/* Top KPIs */}
      <section aria-labelledby="kpi-heading" className="mb-8">
        <h2 id="kpi-heading" className="section-title">🎯 Key Performance Indicators</h2>
        <div className="stats-grid">
          <KpiCard label="Avg Draft Score" value={`${metrics.avg_draft_score.toFixed(1)}`} unit="/100" sub="Baseline — before feedback" />
          <KpiCard label="Avg Final Score" value={`${metrics.avg_final_score.toFixed(1)}`} unit="/100" sub="After revision" accent />
          <KpiCard label="Avg Improvement" value={`+${metrics.avg_improvement.toFixed(1)}`} unit=" pts" sub="Absolute gain" accent />
          <KpiCard label="Relative Improvement" value={`+${metrics.relative_improvement_pct.toFixed(1)}`} unit="%" sub="((final-draft)/draft)×100" accent />
          <KpiCard label="Rubric Coverage" value={`${metrics.rubric_coverage.toFixed(0)}`} unit="%" sub="Criteria appearing in feedback" />
          <KpiCard label="% High-Impact Reviewed" value={`${metrics.pct_high_impact_reviewed.toFixed(0)}`} unit="%" sub="By human mentors" />
          <KpiCard label="Feedback Accuracy" value={metrics.feedback_accuracy != null ? `${(metrics.feedback_accuracy*100).toFixed(0)}%` : '—'} sub="See Error Analysis page for audit" warn />
          <KpiCard label="Feedback Usefulness" value={metrics.feedback_usefulness != null ? `${(metrics.feedback_usefulness*100).toFixed(0)}%` : '—'} sub="See User Validation page for survey" warn />
        </div>
      </section>

      {/* PART 5: Two sections: A. BASELINE and B. FORMATIVE FEEDBACK ASSISTANT */}
      {baseline && prototype && (
        <section aria-labelledby="comparison-heading" className="mb-8">
          <div className="flex items-center justify-between flex-wrap mb-4">
            <h2 id="comparison-heading" className="section-title" style={{ margin: 0 }}>
              ⚖️ Controlled Comparison: BASELINE vs PROTOTYPE
            </h2>
            <span className="text-xs text-muted">Clearly Labeled: BASELINE / DEMO EXPERIMENT</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            
            {/* Section A: BASELINE */}
            <div className="card" style={{ borderTop: '4px solid var(--color-text-muted)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge" style={{ background: 'var(--color-surface-3)' }}>CONTROL</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>A. BASELINE</h3>
              </div>
              <p className="text-xs text-muted mb-4">{baseline.label}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Average Draft Score:</span>
                  <strong>{baseline.avg_draft_score != null ? `${baseline.avg_draft_score}/100` : 'Insufficient measured data'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Average Final Score:</span>
                  <strong>{baseline.avg_final_score != null ? `${baseline.avg_final_score}/100` : 'Insufficient measured data'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Draft → Final Improvement:</span>
                  <strong>{baseline.avg_improvement != null ? `+${baseline.avg_improvement} pts` : 'Insufficient measured data'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Rubric Coverage:</span>
                  <strong>{baseline.rubric_coverage_final != null ? `${baseline.rubric_coverage_final}%` : 'Insufficient measured data'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Instructor Feedback Addressed:</span>
                  <strong style={{ color: baseline.instructor_feedback_addressed_pct >= 60 ? 'var(--color-success)' : 'var(--color-warn)' }}>
                    {baseline.instructor_feedback_addressed_pct != null ? `${baseline.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Average Revisions:</span>
                  <strong>{baseline.avg_revisions != null ? `${baseline.avg_revisions}` : 'Insufficient measured data'}</strong>
                </div>
              </div>
            </div>

            {/* Section B: FORMATIVE FEEDBACK ASSISTANT */}
            <div className="card" style={{ borderTop: '4px solid var(--color-accent)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-approved">TREATMENT</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>B. FORMATIVE FEEDBACK ASSISTANT</h3>
              </div>
              <p className="text-xs text-muted mb-4">{prototype.label}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Average Draft Score:</span>
                  <strong>{prototype.avg_draft_score != null ? `${prototype.avg_draft_score}/100` : 'Insufficient measured data'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Average Final Score:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>
                    {prototype.avg_final_score != null ? `${prototype.avg_final_score}/100` : 'Insufficient measured data'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Draft → Final Improvement:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>
                    {prototype.avg_improvement != null ? `+${prototype.avg_improvement} pts` : 'Insufficient measured data'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Rubric Coverage:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>
                    {prototype.rubric_coverage_final != null ? `${prototype.rubric_coverage_final}%` : 'Insufficient measured data'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted">Instructor Feedback Addressed:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>
                    {prototype.instructor_feedback_addressed_pct != null ? `${prototype.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Average Revisions:</span>
                  <strong>{prototype.avg_revisions != null ? `${prototype.avg_revisions}` : 'Insufficient measured data'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Net Quality Improvement Banner */}
          {experimentData.quality_improvement_points != null && (
            <div className="card mt-4 p-4" style={{ background: 'var(--color-surface-2)', border: '1px solid rgba(0,212,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <span className="badge badge-approved mb-1">QUALITY IMPROVEMENT</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  +{experimentData.quality_improvement_points} pts Gain & +{experimentData.relative_quality_improvement_pct}% Efficacy Advantage
                </div>
                <div className="text-xs text-muted">Measured differential of formative assistant over traditional generic feedback</div>
              </div>
              <Link to="/mentor/experiment" className="btn btn-sm btn-ghost mt-2">
                View Full Breakdown →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* PART 6: Baseline / Target / Measured Result Table */}
      {experimentData?.targets_table && (
        <section aria-labelledby="target-measured-heading" className="card mb-8">
          <h2 id="target-measured-heading" className="section-title">🎯 Baseline | Target | Measured Result</h2>
          <p className="text-sm text-muted mb-4">
            Targets are project goals. Measured results come directly from actual recorded system data.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table w-full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '10px' }}>Metric</th>
                  <th style={{ padding: '10px' }}>Baseline</th>
                  <th style={{ padding: '10px' }}>Target</th>
                  <th style={{ padding: '10px' }}>Measured Result</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {experimentData.targets_table.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{row.metric}</td>
                    <td style={{ padding: '10px', color: 'var(--color-text-secondary)' }}>{row.baseline}</td>
                    <td style={{ padding: '10px', color: 'var(--color-text-muted)' }}>{row.target}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--color-accent)' }}>{row.measured_result}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${
                        row.status === 'Target Met' ? 'badge-approved' :
                        row.status === 'In Progress' ? 'badge-pending' : 'badge-modified'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Criterion improvement bar chart */}
      <section aria-labelledby="criterion-chart-heading" className="card mb-6">
        <h2 id="criterion-chart-heading" className="section-title">📊 Score by Criterion — Draft vs Final</h2>
        <p className="text-sm text-muted mb-4">
          Comparison of average draft and final scores per rubric criterion. <span className="demo-label" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>DEMO DATA</span>
        </p>
        <ResponsiveContainer width="100%" height={300} aria-label="Bar chart showing draft and final scores per criterion">
          <BarChart data={criterionData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#6b7394" tick={{ fill: '#9ba3bf', fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#6b7394" tick={{ fill: '#9ba3bf', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#f0f2ff', fontWeight: 700 }}
              formatter={(value, name) => [`${value}`, name]}
            />
            <Legend wrapperStyle={{ color: '#9ba3bf' }} />
            <Bar dataKey="Draft" fill={CHART_COLORS.draft} radius={[4, 4, 0, 0]} name="Draft Score" />
            <Bar dataKey="Final" fill={CHART_COLORS.final} radius={[4, 4, 0, 0]} name="Final Score" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Mentor review distribution */}
        <section aria-labelledby="review-dist-heading" className="card">
          <h2 id="review-dist-heading" className="section-title">⚖️ Mentor Review Actions</h2>
          <p className="text-sm text-muted mb-4">Distribution of human-in-the-loop review decisions.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {reviewData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-3">
                  <div style={{ width: 120, height: 8, background: 'var(--color-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${metrics.automatic_feedback_count + metrics.human_review_required_count > 0
                          ? (item.value / (metrics.approved_reviews + metrics.rejected_reviews + metrics.modified_reviews + metrics.pending_reviews || 1)) * 100
                          : 0}%`,
                        height: '100%',
                        background:
                          item.name === 'Approved' ? 'var(--color-success)' :
                          item.name === 'Rejected' ? 'var(--color-danger)' :
                          item.name === 'Modified' ? 'var(--color-warn)' : 'var(--color-text-muted)',
                      }}
                    />
                  </div>
                  <span className="text-sm text-mono" style={{ width: 24, textAlign: 'right' }}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workload and throughput */}
        <section aria-labelledby="workload-heading" className="card">
          <h2 id="workload-heading" className="section-title">⏱️ Workload & Operational Metrics</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <WorkloadRow label="Total Submissions Processed" value={`${metrics.total_submissions}`} sub="Across all students" />
            <WorkloadRow label="Automatic Feedback Items" value={`${metrics.automatic_feedback_count}`} sub="Delivered instantly with no human intervention" />
            <WorkloadRow label="Human Review Required" value={`${metrics.human_review_required_count}`} sub="Flagged by high-impact rules for mentor oversight" />
            <WorkloadRow label="Mentor Reviews per Reviewer" value={`${metrics.mentor_workload.toFixed(1)}`} sub="Average reviews assigned per mentor" />
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({ label, value, unit = '', sub, accent, warn }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: accent ? 'var(--color-accent)' : warn ? 'var(--color-warn)' : 'var(--color-text-primary)' }}>
        {value}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>{unit}</span>
      </div>
      <div className="stat-label mt-1">{label}</div>
      {sub && <div className="text-xs text-muted mt-2">{sub}</div>}
    </div>
  )
}

function WorkloadRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</div>
        <div className="text-xs text-muted mt-1">{sub}</div>
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
    </div>
  )
}
