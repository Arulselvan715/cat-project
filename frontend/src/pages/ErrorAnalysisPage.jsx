import { useState, useEffect } from 'react'
import { getErrorAnalysis, addErrorAnalysisRecord } from '../api/client.js'

const ERROR_TYPES = [
  'False positive',
  'False negative',
  'Incorrect evidence',
  'Incorrect rule',
  'Low-confidence recommendation',
  'Language-related issue',
  'Ambiguous submission',
  'Human override',
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
      setSubmitMsg('Error record successfully added to audit trail.')
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
        <span>Loading error analysis…</span>
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

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Error Analysis & Feedback Quality</h1>
        <p>
          Systematic failure classification, accuracy auditing, and continuous improvement tracking.
          Distinguishes verified observations from those where ground truth is not yet established.
        </p>
      </div>

      {/* Accuracy & Quality KPI Overview */}
      <section aria-labelledby="accuracy-heading" className="mb-8">
        <h2 id="accuracy-heading" className="section-title">📊 Recommendation Accuracy & Reliability</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summary.total_recommendations}</div>
            <div className="stat-label">Total Evaluated Recommendations</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {summary.correct_recommendations}
            </div>
            <div className="stat-label">Verified Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
              {summary.incorrect_recommendations}
            </div>
            <div className="stat-label">Identified System Errors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
              {summary.accuracy_pct != null ? `${summary.accuracy_pct}%` : 'Pending'}
            </div>
            <div className="stat-label">
              {summary.accuracy_pct != null ? 'Ground-Truth Accuracy' : 'Ground Truth Not Available'}
            </div>
            <div className="text-xs text-muted mt-1">{summary.accuracy_display}</div>
          </div>
        </div>
      </section>

      {/* Error Breakdown Distribution */}
      <section aria-labelledby="breakdown-heading" className="card mb-8">
        <h2 id="breakdown-heading" className="section-title">🏷️ Error Taxonomy Breakdown</h2>
        <p className="text-sm text-muted mb-4">
          All recommendations are classified by failure mode to guide algorithm refinement and prompt engineering.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {Object.entries(summary.error_breakdown).map(([errType, count]) => (
            <div key={errType} className="card card-sm" style={{ background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{errType}</span>
              <span className="badge badge-modified" style={{ fontWeight: 800 }}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Add New Error Observation Button / Form */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="section-title" style={{ margin: 0 }}>🔍 Detailed Audit Log ({summary.records.length})</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setFormOpen(!formOpen)}
          aria-expanded={formOpen}
        >
          {formOpen ? '✕ Close Form' : '+ Record New Observation'}
        </button>
      </div>

      {submitMsg && (
        <div className={`alert ${submitMsg.startsWith('Error') ? 'alert-warn' : 'alert-success'} mb-6`} role="alert">
          {submitMsg}
        </div>
      )}

      {formOpen && (
        <section aria-labelledby="new-observation-heading" className="card mb-8" style={{ border: '1px solid var(--color-primary-light)' }}>
          <h3 id="new-observation-heading" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            Record New Error Observation
          </h3>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="student-name-input">Student / Submission Identifier</label>
                <input
                  id="student-name-input"
                  className="form-control"
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="e.g. Student 4 or Draft #12"
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="error-type-select">Error Classification</label>
                <select
                  id="error-type-select"
                  className="form-control"
                  value={formData.error_type}
                  onChange={e => setFormData({ ...formData, error_type: e.target.value })}
                >
                  {ERROR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label" htmlFor="recommendation-input">System Recommendation</label>
              <textarea
                id="recommendation-input"
                className="form-control"
                rows={2}
                required
                value={formData.recommendation}
                onChange={e => setFormData({ ...formData, recommendation: e.target.value })}
                placeholder="What did the system recommend to the student?"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="expected-result-input">Expected Result (if available)</label>
                <textarea
                  id="expected-result-input"
                  className="form-control"
                  rows={2}
                  value={formData.expected_result}
                  onChange={e => setFormData({ ...formData, expected_result: e.target.value })}
                  placeholder="Leave blank if ground truth not available"
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="actual-result-input">Actual Result</label>
                <textarea
                  id="actual-result-input"
                  className="form-control"
                  rows={2}
                  required
                  value={formData.actual_result}
                  onChange={e => setFormData({ ...formData, actual_result: e.target.value })}
                  placeholder="What did the system actually do?"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="impact-input">Pedagogical / System Impact</label>
                <input
                  id="impact-input"
                  className="form-control"
                  type="text"
                  required
                  value={formData.impact}
                  onChange={e => setFormData({ ...formData, impact: e.target.value })}
                  placeholder="e.g. False alarm in mentor queue"
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" htmlFor="correction-input">Correction / Improvement Action</label>
                <input
                  id="correction-input"
                  className="form-control"
                  type="text"
                  required
                  value={formData.correction_improvement}
                  onChange={e => setFormData({ ...formData, correction_improvement: e.target.value })}
                  placeholder="e.g. Update lexicon regex pattern"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center mb-4">
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.ground_truth_available}
                  onChange={e => setFormData({ ...formData, ground_truth_available: e.target.checked })}
                />
                <span className="text-sm">Ground truth available for this observation</span>
              </label>
              {formData.ground_truth_available && (
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_correct}
                    onChange={e => setFormData({ ...formData, is_correct: e.target.checked })}
                  />
                  <span className="text-sm">Recommendation was evaluated as correct</span>
                </label>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Observation…' : 'Save Error Observation'}
            </button>
          </form>
        </section>
      )}

      {/* Error Records List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {summary.records.map((rec) => (
          <article
            key={rec.id}
            className="card card-sm"
            style={{
              background: 'var(--color-surface-2)',
              borderLeft: rec.is_correct ? '4px solid var(--color-success)' : (!rec.ground_truth_available ? '4px solid var(--color-warn)' : '4px solid var(--color-danger)'),
            }}
          >
            <div className="flex items-center justify-between flex-wrap mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <strong>{rec.student_name}</strong>
                <span className="badge" style={{ background: 'var(--color-surface-3)' }}>{rec.error_type}</span>
                {rec.ground_truth_available ? (
                  <span className={`badge ${rec.is_correct ? 'badge-approved' : 'badge-rejected'}`}>
                    {rec.is_correct ? '✓ Verified Correct' : '✗ System Error'}
                  </span>
                ) : (
                  <span className="badge badge-pending">Ground Truth Not Available</span>
                )}
              </div>
              <span className="text-xs text-muted">
                {new Date(rec.created_at).toLocaleDateString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
              <div>
                <div className="text-xs text-muted mb-1">SYSTEM RECOMMENDATION</div>
                <div className="text-sm text-secondary p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  {rec.recommendation}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted mb-1">EXPECTED VS ACTUAL</div>
                <div className="text-sm text-secondary p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div><strong>Expected:</strong> {rec.expected_result || <em style={{ color: 'var(--color-warn)' }}>Ground truth not available for this observation.</em>}</div>
                  <div className="mt-1"><strong>Actual:</strong> {rec.actual_result}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted mb-1">IMPACT & MITIGATION</div>
                <div className="text-sm text-secondary p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div><strong>Impact:</strong> {rec.impact}</div>
                  <div className="mt-1"><strong>Correction:</strong> <span style={{ color: 'var(--color-accent)' }}>{rec.correction_improvement}</span></div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
