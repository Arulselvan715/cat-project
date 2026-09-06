import { useState, useEffect } from 'react'
import { getExperimentComparison, getExperimentObservations } from '../api/client.js'

export default function ExperimentDashboard() {
  const [data, setData] = useState(null)
  const [observations, setObservations] = useState([])
  const [groupFilter, setGroupFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getExperimentComparison(), getExperimentObservations()])
      .then(([comp, obs]) => {
        setData(comp)
        setObservations(obs)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleFilterChange = (grp) => {
    setGroupFilter(grp)
    getExperimentObservations(grp || undefined)
      .then(obs => setObservations(obs))
      .catch(e => setError(e.message))
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" aria-hidden="true" />
        <span>Loading experiment data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container page">
        <div className="error-msg" role="alert">⚠ {error}</div>
      </div>
    )
  }

  const baseline = data.baseline
  const prototype = data.prototype

  return (
    <div className="container page">
      {/* Page Header */}
      <div className="page-header">
        <h1>Efficacy Experiment & Validation</h1>
        <p>
          Controlled evaluation comparing student revision outcomes under traditional generic delayed feedback
          versus the Formative Feedback Assistant.
        </p>
        <div className="demo-label mt-4" role="note" aria-label="Demo baseline disclaimer">
          🔬 {data.data_label}
        </div>
      </div>

      {/* Baseline definition callout */}
      <div className="alert alert-info mb-6" role="note">
        <span aria-hidden="true">ℹ️</span>
        <div>
          <strong>Baseline Condition Definition:</strong>
          <p style={{ marginTop: 4 }}>{data.baseline_definition}</p>
        </div>
      </div>

      {/* Section A: BASELINE vs Section B: PROTOTYPE Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        
        {/* Section A: BASELINE */}
        <section aria-labelledby="section-a-heading" className="card" style={{ borderTop: '4px solid var(--color-text-muted)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}>CONTROL</span>
            <h2 id="section-a-heading" className="section-title" style={{ margin: 0 }}>A. BASELINE</h2>
          </div>
          <p className="text-sm text-muted mb-4">{baseline.label} ({baseline.count} learners)</p>
          
          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <MetricBlock label="Avg Draft Score" value={baseline.avg_draft_score != null ? `${baseline.avg_draft_score}/100` : 'Insufficient measured data'} />
            <MetricBlock label="Avg Final Score" value={baseline.avg_final_score != null ? `${baseline.avg_final_score}/100` : 'Insufficient measured data'} />
            <MetricBlock label="Draft → Final Gain" value={baseline.avg_improvement != null ? `+${baseline.avg_improvement} pts` : 'Insufficient measured data'} />
            <MetricBlock label="Median Improvement" value={baseline.median_improvement != null ? `+${baseline.median_improvement} pts` : 'Insufficient measured data'} />
            <MetricBlock label="Rubric Coverage Gain" value={baseline.rubric_coverage_change != null ? `+${baseline.rubric_coverage_change}%` : 'Insufficient measured data'} />
            <MetricBlock label="Avg Revisions" value={baseline.avg_revisions != null ? `${baseline.avg_revisions}` : 'Insufficient measured data'} />
          </div>

          <div className="mt-4 p-3" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
            <span className="text-muted">Instructor Feedback Addressed: </span>
            <strong style={{ color: baseline.instructor_feedback_addressed_pct >= 60 ? 'var(--color-success)' : 'var(--color-warn)' }}>
              {baseline.instructor_feedback_addressed_pct != null ? `${baseline.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
            </strong>
          </div>
        </section>

        {/* Section B: FORMATIVE FEEDBACK ASSISTANT */}
        <section aria-labelledby="section-b-heading" className="card" style={{ borderTop: '4px solid var(--color-accent)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-approved">TREATMENT</span>
            <h2 id="section-b-heading" className="section-title" style={{ margin: 0 }}>B. FORMATIVE FEEDBACK ASSISTANT</h2>
          </div>
          <p className="text-sm text-muted mb-4">{prototype.label} ({prototype.count} learners)</p>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <MetricBlock label="Avg Draft Score" value={prototype.avg_draft_score != null ? `${prototype.avg_draft_score}/100` : 'Insufficient measured data'} />
            <MetricBlock label="Avg Final Score" value={prototype.avg_final_score != null ? `${prototype.avg_final_score}/100` : 'Insufficient measured data'} highlight />
            <MetricBlock label="Draft → Final Gain" value={prototype.avg_improvement != null ? `+${prototype.avg_improvement} pts` : 'Insufficient measured data'} highlight />
            <MetricBlock label="Median Improvement" value={prototype.median_improvement != null ? `+${prototype.median_improvement} pts` : 'Insufficient measured data'} highlight />
            <MetricBlock label="Rubric Coverage Gain" value={prototype.rubric_coverage_change != null ? `+${prototype.rubric_coverage_change}%` : 'Insufficient measured data'} highlight />
            <MetricBlock label="Avg Revisions" value={prototype.avg_revisions != null ? `${prototype.avg_revisions}` : 'Insufficient measured data'} />
          </div>

          <div className="mt-4 p-3" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
            <div className="flex items-center justify-between">
              <span>Instructor Feedback Addressed:</span>
              <strong style={{ color: 'var(--color-accent)' }}>
                {prototype.instructor_feedback_addressed_pct != null ? `${prototype.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
              </strong>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted">Recommendations Acted Upon:</span>
              <span>{prototype.recommendations_acted_upon_total} / {prototype.recommendations_generated_total} ({prototype.acted_upon_pct}%)</span>
            </div>
          </div>
        </section>
      </div>

      {/* Quality Improvement Summary Banner */}
      {data.quality_improvement_points != null && (
        <section aria-labelledby="improvement-delta-heading" className="card mb-8" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,170,0.12))', border: '1px solid rgba(0,212,170,0.3)' }}>
          <h2 id="improvement-delta-heading" className="section-title">📈 Quality Improvement Measurement (Prototype vs Baseline)</h2>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Net Score Gain over Baseline</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                +{data.quality_improvement_points} pts
              </div>
              <div className="text-xs text-muted mt-1">Difference in draft→final score gains</div>
            </div>
            {data.relative_quality_improvement_pct != null && (
              <div>
                <div className="stat-label">Relative Efficacy Advantage</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                  +{data.relative_quality_improvement_pct}%
                </div>
                <div className="text-xs text-muted mt-1">((Prototype Gain - Baseline Gain) / Baseline Gain) × 100</div>
              </div>
            )}
            <div>
              <div className="stat-label">Instructor Feedback Adherence Delta</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                +{((prototype.instructor_feedback_addressed_pct || 0) - (baseline.instructor_feedback_addressed_pct || 0)).toFixed(1)}%
              </div>
              <div className="text-xs text-muted mt-1">Higher student follow-through on human guidance</div>
            </div>
          </div>
        </section>
      )}

      {/* Part 6: Baseline / Target / Measured Result Table */}
      <section aria-labelledby="targets-heading" className="card mb-8">
        <h2 id="targets-heading" className="section-title">🎯 Baseline vs Target vs Measured Result</h2>
        <p className="text-sm text-muted mb-4">
          Project performance goals compared against reproducible baseline data and actual prototype observations.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table w-full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px' }}>Metric</th>
                <th style={{ padding: '12px' }}>Baseline</th>
                <th style={{ padding: '12px' }}>Target</th>
                <th style={{ padding: '12px' }}>Measured Result</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.targets_table.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{row.metric}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>{row.baseline}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>{row.target}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>{row.measured_result}</td>
                  <td style={{ padding: '12px' }}>
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

      {/* Part 4: Instructor Feedback Adherence Tracking */}
      <section aria-labelledby="instructor-feedback-heading" className="card mb-8">
        <div className="flex items-center justify-between flex-wrap mb-4">
          <div>
            <h2 id="instructor-feedback-heading" className="section-title" style={{ margin: 0 }}>
              👨‍🏫 Instructor Feedback Adherence
            </h2>
            <p className="text-sm text-muted mt-1">
              Tracks whether revision submissions explicitly address instructor notes alongside automated rubric feedback.
            </p>
          </div>
          <div className="badge badge-approved" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
            Addressed Rate: {data.instructor_feedback_addressed_pct != null ? `${data.instructor_feedback_addressed_pct}%` : 'Insufficient data'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {data.instructor_feedback_items.map((item) => (
            <div key={item.id} className="card card-sm" style={{ background: 'var(--color-surface-2)', borderLeft: item.addressed ? '3px solid var(--color-success)' : '3px solid var(--color-danger)' }}>
              <div className="flex items-center justify-between mb-2">
                <strong>{item.student_name}</strong>
                <span className={`badge ${item.addressed ? 'badge-approved' : 'badge-rejected'}`}>
                  {item.status_display}
                </span>
              </div>
              <div className="text-xs text-muted mb-1">INSTRUCTOR FEEDBACK</div>
              <blockquote style={{ margin: 0, fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-primary)', borderLeft: '2px solid var(--color-primary)', paddingLeft: '8px' }}>
                "{item.instructor_feedback}"
              </blockquote>
              {item.final_evidence && (
                <div className="mt-3">
                  <div className="text-xs text-muted mb-1">FINAL SUBMISSION EVIDENCE</div>
                  <div className="text-xs text-secondary p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    {item.final_evidence}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Observation Raw Dataset */}
      <section aria-labelledby="observations-heading" className="card">
        <div className="flex items-center justify-between flex-wrap mb-4">
          <h2 id="observations-heading" className="section-title" style={{ margin: 0 }}>
            📋 Experiment Observations ({observations.length})
          </h2>
          <div role="group" aria-label="Filter observations by group" className="flex gap-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`btn btn-sm ${groupFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={groupFilter === ''}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('BASELINE')}
              className={`btn btn-sm ${groupFilter === 'BASELINE' ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={groupFilter === 'BASELINE'}
            >
              Baseline Only
            </button>
            <button
              onClick={() => handleFilterChange('PROTOTYPE')}
              className={`btn btn-sm ${groupFilter === 'PROTOTYPE' ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={groupFilter === 'PROTOTYPE'}
            >
              Prototype Only
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table w-full" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '8px' }}>Group</th>
                <th style={{ padding: '8px' }}>Student</th>
                <th style={{ padding: '8px' }}>Draft Score</th>
                <th style={{ padding: '8px' }}>Final Score</th>
                <th style={{ padding: '8px' }}>Gain (pts)</th>
                <th style={{ padding: '8px' }}>Relative Gain</th>
                <th style={{ padding: '8px' }}>Rubric Coverage</th>
                <th style={{ padding: '8px' }}>Feedback Delivered</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((obs) => (
                <tr key={obs.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px' }}>
                    <span className={`badge ${obs.group === 'PROTOTYPE' ? 'badge-approved' : 'badge-modified'}`}>
                      {obs.group}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{obs.student_name}</td>
                  <td style={{ padding: '8px' }}>{obs.draft_score.toFixed(1)}</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{obs.final_score.toFixed(1)}</td>
                  <td style={{ padding: '8px', color: 'var(--color-accent)', fontWeight: 700 }}>
                    +{obs.improvement_points.toFixed(1)}
                  </td>
                  <td style={{ padding: '8px' }}>+{obs.relative_improvement.toFixed(1)}%</td>
                  <td style={{ padding: '8px' }}>{obs.rubric_coverage_draft}% → {obs.rubric_coverage_final}%</td>
                  <td style={{ padding: '8px', color: 'var(--color-text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {obs.feedback_used}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricBlock({ label, value, highlight }) {
  return (
    <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: highlight ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
        {value}
      </div>
      <div className="stat-label mt-1">{label}</div>
    </div>
  )
}
