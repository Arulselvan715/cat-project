import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getStudents, getStudentSubmissions, getRevisions, submitRevision, generateFeedback } from '../api/client.js'
import RevisionTimeline from '../components/RevisionTimeline.jsx'
import FeedbackCard from '../components/FeedbackCard.jsx'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'

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
    if (!revisionContent.trim()) { setError('Revision text cannot be empty.'); return }
    setError(null)
    setSubmitting(true)
    try {
      await submitRevision({ original_submission_id: parseInt(selectedSub), content: revisionContent })
      const freshRevisions = await getRevisions(parseInt(selectedSub))
      setRevisions(freshRevisions)
      const fb = await generateFeedback(parseInt(selectedSub))
      setNewFeedback(fb)
      setSuccess(true)
      const subs = await getStudentSubmissions(parseInt(selectedStudent))
      setSubmissions(subs)
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(Array.isArray(msg) ? msg.map(m => m.msg).join('; ') : (msg || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const improvement = submission?.final_score && submission?.draft_score
    ? (submission.final_score - submission.draft_score).toFixed(1)
    : null
  const relativeImprovement = submission?.draft_score && improvement
    ? ((parseFloat(improvement) / submission.draft_score) * 100).toFixed(1)
    : null

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Revision History & Progress</h1>
          <p className="page-subtitle">Track iterative draft progression, measure score deltas, and submit updated drafts.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="card mb-6">
        <div className="grid-2-col">
          <div className="form-group">
            <label htmlFor="rev-student" className="form-label">Active Learner</label>
            <select
              id="rev-student"
              className="form-control form-select"
              value={selectedStudent}
              onChange={e => { setSelectedStudent(e.target.value); setSelectedSub(''); setRevisions([]) }}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rev-submission" className="form-label">Submission Thread</label>
            <select
              id="rev-submission"
              className="form-control form-select"
              value={selectedSub}
              onChange={e => setSelectedSub(e.target.value)}
              disabled={submissions.length === 0}
            >
              {submissions.length === 0 && <option value="">No submissions recorded</option>}
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  Submission #{s.id} (v{s.version}) — {new Date(s.submitted_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score Comparison KPI Cards */}
      {submission && (
        <div className="kpi-grid mb-6">
          <KpiCard
            title="Initial Draft Score"
            value={submission.draft_score != null ? `${submission.draft_score.toFixed(1)}/100` : '—'}
            subtitle="Baseline assessment"
            icon="📝"
          />

          <KpiCard
            title="Final Assessed Score"
            value={submission.final_score != null ? `${submission.final_score.toFixed(1)}/100` : 'In Review'}
            badge={<StatusBadge status={submission.is_final ? 'completed' : 'pending'} label={submission.is_final ? 'Finalized' : 'Iterating'} size="sm" />}
            subtitle={submission.is_final ? 'Evaluation concluded' : 'Further revisions allowed'}
            icon="🏆"
          />

          <KpiCard
            title="Absolute Delta"
            value={improvement != null ? `+${improvement} pts` : '—'}
            trend={improvement != null && parseFloat(improvement) >= 0 ? 'up' : 'neutral'}
            subtitle="Net point gain"
            icon="📈"
          />

          <KpiCard
            title="Relative Growth"
            value={relativeImprovement != null ? `+${relativeImprovement}%` : '—'}
            trend="up"
            subtitle="Percentage quality gain"
            icon="⚡"
          />
        </div>
      )}

      {/* Main Grid: Timeline on left, revision editor on right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSub ? '1.1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Timeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Progression Timeline</h3>
              <p className="card-subtitle">Complete chronological sequence of submitted drafts</p>
            </div>
            <span className="badge-rule">{revisions.length + 1} Iterations</span>
          </div>

          <div className="card-body">
            {!submission ? (
              <EmptyState icon="⏳" title="Select a Submission" description="Choose a learner and submission above to view the timeline." />
            ) : (
              <RevisionTimeline submission={submission} revisions={revisions} />
            )}
          </div>
        </div>

        {/* Submit Revision Form */}
        {selectedSub && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Compose Revision (Iteration {revisions.length + 2})</h3>
                <p className="card-subtitle">Address the formative suggestions and improve your score</p>
              </div>
              <span className="status-badge status-badge-info status-badge-sm">Formative Loop</span>
            </div>

            <div className="card-body">
              {success && (
                <div className="alert alert-success mb-4" role="status" aria-live="polite">
                  ✓ Revision received and re-evaluated! Check the updated feedback below.
                </div>
              )}

              <form onSubmit={handleSubmitRevision} noValidate>
                <div className="form-group mb-4">
                  <label htmlFor="revision-textarea" className="form-label">
                    Revised Response
                  </label>
                  <textarea
                    id="revision-textarea"
                    className="form-control"
                    rows={12}
                    value={revisionContent}
                    onChange={e => setRevisionContent(e.target.value)}
                    placeholder="Enter your refined draft here, incorporating previous feedback on definitions, advantages, and real-world examples…"
                    aria-required="true"
                    style={{ fontSize: '0.92rem', lineHeight: 1.6 }}
                  />
                  <p className="form-hint" style={{ marginTop: '0.4rem' }}>
                    Tip: Ensure you explicitly address each feedback card generated on your previous draft.
                  </p>
                </div>

                {error && (
                  <div className="error-msg mb-4" role="alert">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={submitting || !revisionContent.trim()}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" aria-hidden="true" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                      <span>Re-evaluating Rubric Criteria…</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Submit Revision for Assessment</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* New feedback after revision */}
      {newFeedback && (
        <div className="card mt-6" aria-live="polite">
          <div className="card-header">
            <div>
              <h3 className="card-title">Updated Formative Feedback (v{revisions.length + 1})</h3>
              <p className="card-subtitle">Real-time rubric evaluation of your latest revision</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assessed Score</div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: newFeedback.score >= 70 ? 'var(--success)' : newFeedback.score >= 45 ? 'var(--warning)' : 'var(--danger)'
              }}>
                {newFeedback.score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            {newFeedback.feedback.length === 0 ? (
              <div className="alert alert-success">
                🎉 Outstanding work! All rubric criteria are fully satisfied in this revision.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                  Remaining feedback items ({newFeedback.feedback.length}):
                </div>
                {newFeedback.feedback.map(fb => (
                  <FeedbackCard key={fb.id} item={fb} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
