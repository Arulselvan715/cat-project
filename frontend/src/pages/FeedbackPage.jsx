import { useState, useEffect } from 'react'
import { getStudents, getStudentSubmissions, getFeedback } from '../api/client.js'
import FeedbackCard from '../components/FeedbackCard.jsx'

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
    }).catch(() => setSubmissions([]))
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedSub) return
    setLoading(true)
    getFeedback(parseInt(selectedSub))
      .then(items => setFeedback(items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedSub])

  const sub = submissions.find(s => String(s.id) === selectedSub)

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Feedback View</h1>
        <p>Detailed, explainable feedback for each rubric criterion. Every item shows the rule, evidence, and confidence.</p>
      </div>

      {/* Selectors */}
      <div className="card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label htmlFor="student-fb-select" className="form-label">Student</label>
            <select id="student-fb-select" className="form-control" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="submission-fb-select" className="form-label">Submission</label>
            <select id="submission-fb-select" className="form-control" value={selectedSub} onChange={e => setSelectedSub(e.target.value)}>
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  Version {s.version} — Score: {s.draft_score?.toFixed(1) ?? 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score summary */}
      {sub && (
        <div className="card mb-6" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <ScoreBlock label="Draft Score" score={sub.draft_score} />
          {sub.final_score && <ScoreBlock label="Final Score" score={sub.final_score} highlight />}
          {sub.draft_score && sub.final_score && (
            <div>
              <div className="stat-label">Improvement</div>
              <div className="improvement-badge improvement-positive" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                +{(sub.final_score - sub.draft_score).toFixed(1)} pts
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback list */}
      {loading && <div className="loader"><div className="spinner" /><span>Loading feedback…</span></div>}
      {error && <div className="error-msg" role="alert">⚠ {error}</div>}
      {!loading && !error && (
        <>
          <h2 className="section-title">💡 Feedback Items ({feedback.length})</h2>
          {feedback.length === 0 ? (
            <div className="alert alert-success">No feedback items found for this submission.</div>
          ) : (
            <div className="feedback-list">
              {feedback.map(fb => <FeedbackCard key={fb.id} item={fb} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ScoreBlock({ label, score, highlight }) {
  if (score == null) return null
  const color = score >= 70 ? 'var(--color-success)' : score >= 45 ? 'var(--color-warn)' : 'var(--color-danger)'
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: highlight ? 'var(--color-accent)' : color }}>
        {score.toFixed(1)}
        <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/100</span>
      </div>
    </div>
  )
}
