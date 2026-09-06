import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getStudents, getStudentSubmissions, getRevisions, submitRevision, generateFeedback } from '../api/client.js'
import RevisionTimeline from '../components/RevisionTimeline.jsx'
import FeedbackCard from '../components/FeedbackCard.jsx'

export default function RevisionPage() {
  const location = useLocation()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [selectedSub, setSelectedSub] = useState(location.state?.submissionId ? String(location.state.submissionId) : '')
  const [revisions, setRevisions] = useState([])
  const [revisionContent, setRevisionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newFeedback, setNewFeedback] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getStudents().then(s => {
      setStudents(s)
      if (s.length && !selectedStudent) setSelectedStudent(String(s[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    getStudentSubmissions(parseInt(selectedStudent)).then(subs => {
      setSubmissions(subs)
      if (subs.length && !selectedSub) setSelectedSub(String(subs[0].id))
    })
  }, [selectedStudent])

  useEffect(() => {
    if (!selectedSub) return
    getRevisions(parseInt(selectedSub))
      .then(r => setRevisions(r))
      .catch(() => setRevisions([]))
  }, [selectedSub])

  const submission = submissions.find(s => String(s.id) === selectedSub)

  const handleSubmitRevision = async (e) => {
    e.preventDefault()
    if (!revisionContent.trim()) { setError('Revision cannot be empty.'); return }
    setError(null)
    setSubmitting(true)
    try {
      await submitRevision({ original_submission_id: parseInt(selectedSub), content: revisionContent })
      const freshRevisions = await getRevisions(parseInt(selectedSub))
      setRevisions(freshRevisions)
      const fb = await generateFeedback(parseInt(selectedSub))
      setNewFeedback(fb)
      setSuccess(true)
      // Refresh submissions to get updated scores
      const subs = await getStudentSubmissions(parseInt(selectedStudent))
      setSubmissions(subs)
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(Array.isArray(msg) ? msg.map(m => m.msg).join('; ') : (msg || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const latestRevision = revisions[revisions.length - 1]
  const improvement = submission?.final_score && submission?.draft_score
    ? (submission.final_score - submission.draft_score).toFixed(1)
    : null
  const relativeImprovement = submission?.draft_score && improvement
    ? ((parseFloat(improvement) / submission.draft_score) * 100).toFixed(1)
    : null

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Revision History</h1>
        <p>Track your progress across drafts. Submit a revision and see how your score improves.</p>
      </div>

      {/* Selectors */}
      <div className="card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label htmlFor="rev-student" className="form-label">Student</label>
            <select id="rev-student" className="form-control" value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setSelectedSub(''); setRevisions([]) }}>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rev-submission" className="form-label">Original Submission</label>
            <select id="rev-submission" className="form-control" value={selectedSub} onChange={e => setSelectedSub(e.target.value)}>
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  v{s.version} — {new Date(s.submitted_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      {submission && (
        <div className="card mb-6">
          <h2 className="section-title">📈 Quality Improvement</h2>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'center' }}>
            <ScoreCompare label="Draft Score" score={submission.draft_score} color="var(--color-warn)" />
            {submission.final_score && (
              <>
                <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>→</div>
                <ScoreCompare label="Final Score" score={submission.final_score} color="var(--color-success)" />
                <div>
                  <div className="stat-label">Absolute Improvement</div>
                  <div className="improvement-badge improvement-positive" style={{ fontSize: '1.2rem', marginTop: 4 }}>
                    +{improvement} pts
                  </div>
                </div>
                {relativeImprovement && (
                  <div>
                    <div className="stat-label">Relative Improvement</div>
                    <div className="improvement-badge improvement-positive" style={{ fontSize: '1.2rem', marginTop: 4 }}>
                      +{relativeImprovement}%
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {(submission || revisions.length > 0) && (
        <div className="card mb-6">
          <h2 className="section-title">📅 Revision Timeline</h2>
          <RevisionTimeline submission={submission} revisions={revisions} />
        </div>
      )}

      {/* Submit revision form */}
      {selectedSub && (
        <div className="card mb-6">
          <h2 className="section-title">✍️ Submit Revision</h2>
          {success && (
            <div className="alert alert-success mb-4" role="status" aria-live="polite">
              ✓ Revision submitted! Scroll down to see updated feedback.
            </div>
          )}
          <form onSubmit={handleSubmitRevision} noValidate>
            <div className="form-group mb-4">
              <label htmlFor="revision-textarea" className="form-label">
                Revised Response
                <span className="text-muted text-xs" style={{ marginLeft: 8 }}>
                  (version {(revisions.length + 2)})
                </span>
              </label>
              <textarea
                id="revision-textarea"
                className="form-control"
                rows={12}
                value={revisionContent}
                onChange={e => setRevisionContent(e.target.value)}
                placeholder="Paste or type your improved response here…"
                aria-required="true"
              />
            </div>
            {error && <div className="error-msg mb-4" role="alert">⚠ {error}</div>}
            <button type="submit" className="btn btn-accent" disabled={submitting || !revisionContent.trim()} aria-busy={submitting}>
              {submitting ? <><div className="spinner" /> Submitting…</> : '🚀 Submit Revision'}
            </button>
          </form>
        </div>
      )}

      {/* New feedback after revision */}
      {newFeedback && (
        <div className="card" aria-live="polite">
          <h2 className="section-title">💡 Updated Feedback (v{revisions.length + 1})</h2>
          <div className="mb-4 flex items-center gap-3">
            <span className="stat-label">New Score:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
              {newFeedback.score}/100
            </span>
          </div>
          {newFeedback.feedback.length === 0 ? (
            <div className="alert alert-success">🎉 Excellent — no issues found in your revision!</div>
          ) : (
            <div className="feedback-list">
              {newFeedback.feedback.map(fb => <FeedbackCard key={fb.id} item={fb} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreCompare({ label, score, color }) {
  if (!score) return null
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1 }}>
        {score.toFixed(1)}
        <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/100</span>
      </div>
    </div>
  )
}
