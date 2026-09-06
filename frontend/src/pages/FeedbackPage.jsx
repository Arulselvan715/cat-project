import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, getStudentSubmissions, getFeedback } from '../api/client.js'
import FeedbackCard from '../components/FeedbackCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function FeedbackPage() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [selectedSub, setSelectedSub] = useState('')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStudents().then(s => {
      setStudents(s)
      if (s.length) setSelectedStudent(String(s[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    getStudentSubmissions(parseInt(selectedStudent)).then(subs => {
      setSubmissions(subs)
      if (subs.length) setSelectedSub(String(subs[0].id))
      else setSelectedSub('')
    }).catch(() => setSubmissions([]))
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedSub) {
      setFeedback([])
      return
    }
    setLoading(true)
    getFeedback(parseInt(selectedSub))
      .then(items => setFeedback(items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedSub])

  const sub = submissions.find(s => String(s.id) === selectedSub)
  const delta = (sub && sub.final_score != null && sub.draft_score != null) ? (sub.final_score - sub.draft_score) : null

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Diagnostic Feedback & Insights</h1>
          <p className="page-subtitle">Granular, explainable criterion recommendations with evidence snippets and confidence levels.</p>
        </div>
        {sub && (
          <div className="page-actions">
            <Link to="/student/revision" state={{ submissionId: sub.id }} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span>Work on Revision</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Selection Card */}
      <div className="card mb-6">
        <div className="grid-2-col">
          <div className="form-group">
            <label htmlFor="student-fb-select" className="form-label">Learner Profile</label>
            <select
              id="student-fb-select"
              className="form-control form-select"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="submission-fb-select" className="form-label">Submission Version</label>
            <select
              id="submission-fb-select"
              className="form-control form-select"
              value={selectedSub}
              onChange={e => setSelectedSub(e.target.value)}
              disabled={submissions.length === 0}
            >
              {submissions.length === 0 && <option value="">No submissions recorded yet</option>}
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  Version {s.version} — Draft Score: {s.draft_score?.toFixed(1) ?? 'N/A'}{s.final_score ? ` → Final: ${s.final_score.toFixed(1)}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score Summary Metrics */}
      {sub && (
        <div className="kpi-grid mb-6">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Initial Draft Score</span>
              <span className="kpi-icon">📝</span>
            </div>
            <div className="kpi-value-row">
              <div className="kpi-value" style={{
                color: (sub.draft_score >= 70) ? 'var(--success)' : (sub.draft_score >= 45) ? 'var(--warning)' : 'var(--danger)'
              }}>
                {sub.draft_score?.toFixed(1) ?? '—'} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <div className="kpi-footer">
              <span className="kpi-subtitle">Evaluated on submission</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Post-Revision Score</span>
              <span className="kpi-icon">🎯</span>
            </div>
            <div className="kpi-value-row">
              <div className="kpi-value" style={{
                color: (sub.final_score >= 70) ? 'var(--success)' : 'var(--text-primary)'
              }}>
                {sub.final_score != null ? `${sub.final_score.toFixed(1)}` : 'In Progress'}
                {sub.final_score != null && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / 100</span>}
              </div>
            </div>
            <div className="kpi-footer">
              <span className="kpi-subtitle">{sub.is_final ? 'Finalized grade' : 'Awaiting revision'}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Formative Improvement</span>
              <span className="kpi-icon">📈</span>
            </div>
            <div className="kpi-value-row">
              <div className="kpi-value" style={{ color: delta != null && delta >= 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                {delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts` : '—'}
              </div>
            </div>
            <div className="kpi-footer">
              <span className="kpi-subtitle">{delta != null ? 'Quality progression delta' : 'Submit revision to measure'}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Action Items</span>
              <span className="kpi-icon">💡</span>
            </div>
            <div className="kpi-value-row">
              <div className="kpi-value">{feedback.length}</div>
              <StatusBadge status={feedback.length === 0 ? 'success' : 'warning'} label={feedback.length === 0 ? 'Clean' : 'Needs Work'} size="sm" />
            </div>
            <div className="kpi-footer">
              <span className="kpi-subtitle">Targeted rubric criteria</span>
            </div>
          </div>
        </div>
      )}

      {/* Submission Draft Text Preview */}
      {sub && sub.content && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Submitted Text for Evaluation</h3>
            <span className="badge-rule">{sub.content.length} characters</span>
          </div>
          <div className="card-body">
            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {sub.content}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Items List */}
      {loading && (
        <div className="loader">
          <div className="spinner" />
          <span>Retrieving feedback analysis…</span>
        </div>
      )}

      {error && (
        <div className="error-msg mb-4" role="alert">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Formative Recommendations ({feedback.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Sorted by pedagogical impact
            </span>
          </div>

          {feedback.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No Rubric Issues Detected"
              description="Your draft demonstrates comprehensive coverage across definitions, advantages, and real-world examples."
            />
          ) : (
            <div>
              {feedback.map(fb => (
                <FeedbackCard key={fb.id} item={fb} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
