import { useState, useEffect } from 'react'
import { getErrorAnalysis, addErrorAnalysisRecord } from '../api/client.js'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

const ERROR_TYPES = [
  'False positive',
  'False negative',
  'Incorrect evidence',
  'Incorrect rule',
  'Low-confidence recommendation',
  'Language-related issue',
  'Ambiguous submission',
  'Human override',
  'Ground truth not available',
]

export default function ErrorAnalysisPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    student_name: '',
    recommendation: '',
    expected_result: '',
    actual_result: '',
    error_type: ERROR_TYPES[0],
    impact: '',
    correction_improvement: '',
    ground_truth_available: true,
    is_correct: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)

  const loadData = () => {
    setLoading(true)
    getErrorAnalysis()
      .then(res => setSummary(res))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      await addErrorAnalysisRecord(formData)
      setSubmitMsg('Observation recorded in immutable error audit log.')
      setFormData({
        student_name: '',
        recommendation: '',
        expected_result: '',
        actual_result: '',
        error_type: ERROR_TYPES[0],
        impact: '',
        correction_improvement: '',
        ground_truth_available: true,
        is_correct: false,
      })
      setFormOpen(false)
      loadData()
    } catch (err) {
      setSubmitMsg(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" aria-hidden="true" />
        <span>Loading failure analysis and error taxonomy…</span>
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

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Error Analysis & Recommendation Reliability</h1>
          <p className="page-subtitle">
            Systematic failure classification, accuracy auditing, and continuous improvement tracking with ground-truth verification.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormOpen(!formOpen)}
            aria-expanded={formOpen}
          >
            {formOpen ? '✕ Close Form' : '+ Record New Observation'}
          </button>
        </div>
      </div>

      {/* Accuracy & Quality KPI Overview */}
      <div className="kpi-grid mb-6">
        <KpiCard
          title="Total Evaluated Recommendations"
          value={summary.total_recommendations}
          subtitle="Formative items in dataset"
          icon="📊"
        />

        <KpiCard
          title="Verified Correct"
          value={summary.correct_recommendations}
          badge={<StatusBadge status="success" label="Verified" size="sm" />}
          subtitle="Conforms to instructor ground truth"
          icon="✓"
        />

        <KpiCard
          title="System Errors Identified"
          value={summary.incorrect_recommendations}
          badge={<StatusBadge status="danger" label="Identified" size="sm" />}
          subtitle="Failure modes logged"
          icon="🐞"
        />

        <KpiCard
          title="Ground-Truth Accuracy"
          value={summary.accuracy_pct != null ? `${summary.accuracy_pct}%` : 'Pending'}
          trend={summary.accuracy_pct != null && summary.accuracy_pct >= 80 ? 'up' : 'neutral'}
          subtitle={summary.accuracy_display || 'Measured against verified labels'}
          icon="🎯"
        />
      </div>

      {/* Error Breakdown Distribution */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">9-Class Error Taxonomy Distribution</h3>
            <p className="card-subtitle">Recommendations classified by specific failure mode to direct rule optimization</p>
          </div>
          <span className="badge-rule">Taxonomy Map</span>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(summary.error_breakdown).map(([errType, count]) => (
              <div 
                key={errType} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{errType}</span>
                <span className="status-badge status-badge-neutral status-badge-sm">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Feedback Message */}
      {submitMsg && (
        <div className={`alert ${submitMsg.startsWith('Error') ? 'alert-warn' : 'alert-success'} mb-6`} role="alert">
          {submitMsg}
        </div>
      )}

      {/* Add New Error Observation Form */}
      {formOpen && (
        <div className="card mb-6" style={{ border: '1.5px solid var(--primary)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Log New Quality / Error Observation</h3>
              <p className="card-subtitle">Record a false positive, hallucination, or rule misfire for regression tracking</p>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid-2-col mb-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="student-name-input">Learner / Submission Identifier</label>
                  <input
                    id="student-name-input"
                    className="form-control"
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="e.g., Student 4 or Draft #12"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="error-type-select">Error Classification</label>
                  <select
                    id="error-type-select"
                    className="form-control form-select"
                    value={formData.error_type}
                    onChange={e => setFormData({ ...formData, error_type: e.target.value })}
                  >
                    {ERROR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" htmlFor="recommendation-input">Generated Recommendation</label>
                <textarea
                  id="recommendation-input"
                  className="form-control"
                  rows={2}
                  required
                  value={formData.recommendation}
                  onChange={e => setFormData({ ...formData, recommendation: e.target.value })}
                  placeholder="What suggestion was generated by the system?"
                />
              </div>

              <div className="grid-2-col mb-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="expected-result-input">Expected Pedagogical Result</label>
                  <textarea
                    id="expected-result-input"
                    className="form-control"
                    rows={2}
                    value={formData.expected_result}
                    onChange={e => setFormData({ ...formData, expected_result: e.target.value })}
                    placeholder="Leave blank if ground truth is not available"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="actual-result-input">Actual System Output</label>
                  <textarea
                    id="actual-result-input"
                    className="form-control"
                    rows={2}
                    required
                    value={formData.actual_result}
                    onChange={e => setFormData({ ...formData, actual_result: e.target.value })}
                    placeholder="What did the rule or feedback engine actually produce?"
                  />
                </div>
              </div>

              <div className="grid-2-col mb-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="impact-input">Pedagogical or Queue Impact</label>
                  <input
                    id="impact-input"
                    className="form-control"
                    type="text"
                    required
                    value={formData.impact}
                    onChange={e => setFormData({ ...formData, impact: e.target.value })}
                    placeholder="e.g., False alarm in mentor review queue"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="correction-input">Correction / Improvement Action</label>
                  <input
                    id="correction-input"
                    className="form-control"
                    type="text"
                    required
                    value={formData.correction_improvement}
                    onChange={e => setFormData({ ...formData, correction_improvement: e.target.value })}
                    placeholder="e.g., Expand cloud regex pattern to support multi-cloud"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.ground_truth_available}
                    onChange={e => setFormData({ ...formData, ground_truth_available: e.target.checked })}
                  />
                  <span>Ground truth available for this observation</span>
                </label>
                {formData.ground_truth_available && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_correct}
                      onChange={e => setFormData({ ...formData, is_correct: e.target.checked })}
                    />
                    <span>Recommendation evaluated as correct</span>
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Recording Observation…' : 'Save Error Observation'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Table / Cards */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Detailed Audit Log & Observations ({summary.records.length})</h3>
            <p className="card-subtitle">Transparent record of audited recommendations, failure causes, and mitigation plans</p>
          </div>
          <span className="status-badge status-badge-neutral status-badge-sm">
            {summary.records.length} Audit Entries
          </span>
        </div>

        <div className="card-body">
          {summary.records.length === 0 ? (
            <EmptyState icon="📝" title="No Records" description="No error observations logged." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summary.records.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '1.1rem 1.25rem',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    borderLeft: rec.is_correct
                      ? '4px solid var(--success)'
                      : (!rec.ground_truth_available ? '4px solid var(--warning)' : '4px solid var(--danger)'),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{rec.student_name}</span>
                      <span className="badge-rule">{rec.error_type}</span>
                      {rec.ground_truth_available ? (
                        <StatusBadge
                          status={rec.is_correct ? 'success' : 'danger'}
                          label={rec.is_correct ? '✓ Verified Correct' : '✗ System Error'}
                          size="sm"
                        />
                      ) : (
                        <StatusBadge status="warning" label="Ground Truth Not Available" size="sm" />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid-2-col" style={{ gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        System Recommendation
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', lineHeight: 1.5 }}>
                        {rec.recommendation}
                      </div>

                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.6rem', marginBottom: '0.25rem' }}>
                        Expected vs Actual
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', lineHeight: 1.5 }}>
                        <div><strong>Expected:</strong> {rec.expected_result || <em style={{ color: 'var(--warning-dark)' }}>Ground truth not available for this observation.</em>}</div>
                        <div style={{ marginTop: '0.25rem' }}><strong>Actual:</strong> {rec.actual_result}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        System Impact
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', lineHeight: 1.5 }}>
                        {rec.impact}
                      </div>

                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.6rem', marginBottom: '0.25rem' }}>
                        Correction Action
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 600, background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', lineHeight: 1.5 }}>
                        {rec.correction_improvement}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
