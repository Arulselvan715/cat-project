import { useState, useEffect } from 'react'
import { getExperimentComparison, getExperimentObservations } from '../api/client.js'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

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
        <div className="spinner" />
        <span>Loading experiment observations…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)' }}>
        <div style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Connection Error: {error}</div>
      </div>
    )
  }

  const baseline = data.baseline
  const prototype = data.prototype

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Efficacy Experiment & Validation</h1>
          <p className="page-subtitle">
            Empirical controlled comparison evaluating student revision quality under generic feedback versus the Formative Feedback Assistant.
          </p>
        </div>
        <div className="page-actions">
          <span className="status-badge status-badge-info status-badge-md">
            🔬 {data.data_label}
          </span>
        </div>
      </div>

      {/* Baseline definition callout */}
      <div className="card mb-6" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Controlled Baseline Definition
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.55 }}>
              {data.baseline_definition}
            </p>
          </div>
        </div>
      </div>

      {/* Section A: BASELINE vs Section B: PROTOTYPE Comparison */}
      <div className="grid-2-col mb-6">
        {/* Baseline Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="status-badge status-badge-neutral status-badge-sm mb-1" style={{ display: 'inline-flex' }}>
                CONTROL GROUP
              </span>
              <h3 className="card-title" style={{ marginTop: '0.25rem' }}>A. Traditional Baseline</h3>
              <p className="card-subtitle">{baseline.label} ({baseline.count} learners)</p>
            </div>
          </div>

          <div className="card-body">
            <div className="kpi-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <KpiCard
                title="Avg Draft Score"
                value={baseline.avg_draft_score != null ? `${baseline.avg_draft_score}/100` : '—'}
              />
              <KpiCard
                title="Avg Final Score"
                value={baseline.avg_final_score != null ? `${baseline.avg_final_score}/100` : '—'}
              />
              <KpiCard
                title="Avg Point Gain"
                value={baseline.avg_improvement != null ? `+${baseline.avg_improvement} pts` : '—'}
              />
              <KpiCard
                title="Median Gain"
                value={baseline.median_improvement != null ? `+${baseline.median_improvement} pts` : '—'}
              />
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Instructor Feedback Addressed: </span>
              <strong style={{ color: (baseline.instructor_feedback_addressed_pct >= 60) ? 'var(--success)' : 'var(--warning-dark)' }}>
                {baseline.instructor_feedback_addressed_pct != null ? `${baseline.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
              </strong>
            </div>
          </div>
        </div>

        {/* Prototype Card */}
        <div className="card" style={{ border: '1.5px solid #c7d2fe', background: '#faf5ff' }}>
          <div className="card-header">
            <div>
              <span className="status-badge status-badge-info status-badge-sm mb-1" style={{ display: 'inline-flex' }}>
                TREATMENT GROUP
              </span>
              <h3 className="card-title" style={{ marginTop: '0.25rem', color: 'var(--primary)' }}>
                B. Formative Feedback Assistant
              </h3>
              <p className="card-subtitle">{prototype.label} ({prototype.count} learners)</p>
            </div>
          </div>

          <div className="card-body">
            <div className="kpi-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <KpiCard
                title="Avg Draft Score"
                value={prototype.avg_draft_score != null ? `${prototype.avg_draft_score}/100` : '—'}
              />
              <KpiCard
                title="Avg Final Score"
                value={prototype.avg_final_score != null ? `${prototype.avg_final_score}/100` : '—'}
                badge={<StatusBadge status="success" label="Optimal" size="sm" />}
              />
              <KpiCard
                title="Avg Point Gain"
                value={prototype.avg_improvement != null ? `+${prototype.avg_improvement} pts` : '—'}
                trend="up"
              />
              <KpiCard
                title="Median Gain"
                value={prototype.median_improvement != null ? `+${prototype.median_improvement} pts` : '—'}
                trend="up"
              />
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #e0e7ff', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Instructor Feedback Addressed:</span>
                <strong style={{ color: 'var(--primary)' }}>
                  {prototype.instructor_feedback_addressed_pct != null ? `${prototype.instructor_feedback_addressed_pct}%` : 'Insufficient measured data'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Recommendations Acted Upon:</span>
                <span>{prototype.recommendations_acted_upon_total} / {prototype.recommendations_generated_total} ({prototype.acted_upon_pct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Gain Banner */}
      {data.quality_improvement_points != null && (
        <div className="kpi-grid mb-6">
          <KpiCard
            title="Net Differential Over Baseline"
            value={`+${data.quality_improvement_points} pts`}
            trend="up"
            subtitle="Advantage in draft→final gain"
            icon="🏆"
          />

          <KpiCard
            title="Relative Efficacy Lead"
            value={data.relative_quality_improvement_pct != null ? `+${data.relative_quality_improvement_pct}%` : '—'}
            trend="up"
            subtitle="Normalized improvement delta"
            icon="⚡"
          />

          <KpiCard
            title="Instructor Adherence Delta"
            value={`+${((prototype.instructor_feedback_addressed_pct || 0) - (baseline.instructor_feedback_addressed_pct || 0)).toFixed(1)}%`}
            trend="up"
            subtitle="Increased human feedback follow-through"
            icon="👨‍🏫"
          />

          <KpiCard
            title="Rubric Coverage Advantage"
            value={`+${((prototype.rubric_coverage_change || 0) - (baseline.rubric_coverage_change || 0)).toFixed(1)}%`}
            trend="up"
            subtitle="More criteria mastered"
            icon="📐"
          />
        </div>
      )}

      {/* Targets Table */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">Pre-specified Targets vs Observed Results</h3>
            <p className="card-subtitle">Project benchmarks compared against empirically recorded data</p>
          </div>
          <span className="badge-rule">Verification Matrix</span>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Performance Goal</th>
                  <th>Control Baseline</th>
                  <th>Target Threshold</th>
                  <th>Measured Result</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {data.targets_table.map((row, idx) => (
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

      {/* Instructor Feedback Adherence Cards */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">Instructor Guidance Follow-Through Tracking</h3>
            <p className="card-subtitle">Verifying if revisions addressed mentor notes alongside automated recommendations</p>
          </div>
          <StatusBadge status="success" label={`Addressed: ${data.instructor_feedback_addressed_pct}%`} size="md" />
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {data.instructor_feedback_items.map((item) => (
              <div 
                key={item.id} 
                style={{
                  padding: '1rem',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  borderLeft: item.addressed ? '4px solid var(--success)' : '4px solid var(--danger)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.student_name}</span>
                  <StatusBadge status={item.addressed ? 'success' : 'danger'} label={item.status_display} size="sm" />
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Instructor Note:
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{item.instructor_feedback}"
                </div>

                {item.final_evidence && (
                  <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Revision Evidence:
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {item.final_evidence}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Observation Raw Dataset */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Empirical Observations Dataset</h3>
            <p className="card-subtitle">Detailed log of individual learner outcomes ({observations.length} records)</p>
          </div>
          <div className="filter-tabs" role="tablist">
            <button
              type="button"
              className={`filter-tab ${groupFilter === '' ? 'active' : ''}`}
              onClick={() => handleFilterChange('')}
            >
              All Cohorts
            </button>
            <button
              type="button"
              className={`filter-tab ${groupFilter === 'BASELINE' ? 'active' : ''}`}
              onClick={() => handleFilterChange('BASELINE')}
            >
              Baseline
            </button>
            <button
              type="button"
              className={`filter-tab ${groupFilter === 'PROTOTYPE' ? 'active' : ''}`}
              onClick={() => handleFilterChange('PROTOTYPE')}
            >
              Prototype
            </button>
          </div>
        </div>

        <div className="card-body">
          {observations.length === 0 ? (
            <EmptyState icon="🔍" title="No Observations" description="No records matched the selected cohort filter." />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cohort</th>
                    <th>Learner</th>
                    <th>Draft Score</th>
                    <th>Final Score</th>
                    <th>Absolute Gain</th>
                    <th>Relative Gain</th>
                    <th>Rubric Coverage</th>
                    <th>Feedback Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((obs) => (
                    <tr key={obs.id}>
                      <td>
                        <StatusBadge
                          status={obs.group === 'PROTOTYPE' ? 'info' : 'neutral'}
                          label={obs.group}
                          size="sm"
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{obs.student_name}</td>
                      <td>{obs.draft_score.toFixed(1)}</td>
                      <td style={{ fontWeight: 700 }}>{obs.final_score.toFixed(1)}</td>
                      <td>
                        <span className="improvement-badge improvement-positive">
                          +{obs.improvement_points.toFixed(1)} pts
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>+{obs.relative_improvement.toFixed(1)}%</td>
                      <td>{obs.rubric_coverage_draft}% → {obs.rubric_coverage_final}%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {obs.feedback_used}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
