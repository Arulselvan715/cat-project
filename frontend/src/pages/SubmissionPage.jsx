import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, getAssignments, createSubmission, generateFeedback } from '../api/client.js'
import FeedbackCard from '../components/FeedbackCard.jsx'

export default function SubmissionPage() {
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackData, setFeedbackData] = useState(null)
  const [error, setError] = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getStudents(), getAssignments()]).then(([s, a]) => {
      setStudents(s)
      setAssignments(a)
      if (s.length) setSelectedStudent(String(s[0].id))
      if (a.length) setSelectedAssignment(String(a[0].id))
    })
  }, [])

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) { setError('Submission cannot be empty.'); return }
    setError(null)
    setSubmitting(true)
    try {
      const sub = await createSubmission({
        student_id: parseInt(selectedStudent),
        assignment_id: parseInt(selectedAssignment),
        content,
      })
      const fb = await generateFeedback(sub.id)
      setFeedbackData({ submission: sub, feedback: fb })
      // Store in sessionStorage for other pages
      sessionStorage.setItem('lastSubmission', JSON.stringify(sub))
      sessionStorage.setItem('lastFeedback', JSON.stringify(fb))
    } catch (err) {
      const msg = err.response?.data?.detail
      if (Array.isArray(msg)) {
        setError(msg.map(m => m.msg).join('; '))
      } else {
        setError(msg || err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const wordCountColor = wordCount < 50 ? 'var(--color-danger)' : wordCount < 100 ? 'var(--color-warn)' : 'var(--color-success)'

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Submit Your Draft</h1>
        <p>Write your response below. You'll receive immediate, explainable feedback on each rubric criterion.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: feedbackData ? '1fr 1fr' : '1fr', gap: 'var(--space-6)' }}>
        {/* Submission form */}
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="section-title">✍️ Your Submission</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group mb-4">
              <label htmlFor="student-select" className="form-label">Student</label>
              <select
                id="student-select"
                className="form-control"
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                aria-required="true"
              >
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="assignment-select" className="form-label">Assignment</label>
              <select
                id="assignment-select"
                className="form-control"
                value={selectedAssignment}
                onChange={e => setSelectedAssignment(e.target.value)}
                aria-required="true"
              >
                {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="submission-textarea" className="form-label">
                Your Response
                <span className="text-muted text-xs" style={{ marginLeft: 8 }}>
                  (aim for 150–300 words)
                </span>
              </label>
              <textarea
                id="submission-textarea"
                className="form-control"
                rows={14}
                value={content}
                onChange={handleContentChange}
                placeholder="Write your response to the assignment here…"
                aria-describedby="word-count-hint submission-hint"
                aria-required="true"
              />
              <div id="word-count-hint" className="flex items-center gap-2 mt-2">
                <span style={{ color: wordCountColor, fontSize: '0.82rem', fontWeight: 600 }}>
                  {wordCount} words
                </span>
                {wordCount < 50 && <span className="text-xs text-muted">Too short — aim for 150+</span>}
                {wordCount >= 150 && <span style={{ color: 'var(--color-success)', fontSize: '0.78rem' }}>✓ Good length</span>}
              </div>
              <p id="submission-hint" className="form-hint mt-2">
                Include: a definition, at least 2 advantages, and 2 real-world examples.
              </p>
            </div>

            {error && (
              <div className="error-msg mb-4" role="alert" aria-live="polite">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting || !content.trim()}
              aria-busy={submitting}
            >
              {submitting ? <><div className="spinner" aria-hidden="true" /> Analysing…</> : '🚀 Submit & Get Feedback'}
            </button>
          </form>
        </section>

        {/* Feedback panel */}
        {feedbackData && (
          <section aria-labelledby="feedback-heading" aria-live="polite">
            <div className="flex items-center gap-3 mb-4">
              <h2 id="feedback-heading" className="section-title" style={{ margin: 0 }}>💡 Feedback</h2>
              <ScorePill score={feedbackData.feedback.score} />
            </div>

            {feedbackData.feedback.requires_human_review && (
              <div className="alert alert-warn mb-4" role="alert">
                <span>⚠</span>
                <div>
                  <strong>Mentor Review Required</strong>
                  <p style={{ marginTop: 4 }}>{feedbackData.feedback.high_impact_reason}</p>
                </div>
              </div>
            )}

            {feedbackData.feedback.feedback.length === 0 ? (
              <div className="alert alert-success">
                ✓ No issues found — excellent work!
              </div>
            ) : (
              <div className="feedback-list">
                {feedbackData.feedback.feedback.map(fb => (
                  <FeedbackCard key={fb.id} item={fb} />
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6 flex-wrap">
              <button
                className="btn btn-accent"
                onClick={() => navigate('/student/revision', { state: { submissionId: feedbackData.submission.id } })}
              >
                🔄 Submit Revision
              </button>
              <button className="btn btn-ghost" onClick={() => setFeedbackData(null)}>
                ✏️ Edit Draft
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ScorePill({ score }) {
  const color = score >= 70 ? 'var(--color-success)' : score >= 45 ? 'var(--color-warn)' : 'var(--color-danger)'
  return (
    <div style={{
      background: `${color}20`,
      border: `1px solid ${color}`,
      borderRadius: 'var(--radius-full)',
      padding: '4px 14px',
      fontWeight: 800,
      fontSize: '1rem',
      color,
    }} aria-label={`Score: ${score} out of 100`}>
      {score}/100
    </div>
  )
}
