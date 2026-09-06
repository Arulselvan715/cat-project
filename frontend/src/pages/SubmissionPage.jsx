import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents, getAssignments, createSubmission, generateFeedback } from '../api/client.js'
import FeedbackCard from '../components/FeedbackCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

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
  const [charCount, setCharCount] = useState(0)
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
    const val = e.target.value
    setContent(val)
    setCharCount(val.length)
    setWordCount(val.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) { setError('Submission draft cannot be empty.'); return }
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

  const wordCountColor = wordCount < 50 ? 'var(--danger)' : wordCount < 100 ? 'var(--warning)' : 'var(--success)'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Assignment Draft</h1>
          <p className="page-subtitle">Receive immediate, actionable formative feedback aligned with the course rubric.</p>
        </div>
        {feedbackData && (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/student/revision', { state: { submissionId: feedbackData.submission.id } })}
            >
              Proceed to Revision →
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: feedbackData ? '1.1fr 1fr' : '1.3fr 0.7fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left column: Editor */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Draft Composition</h3>
              <p className="card-subtitle">Formative evaluation helps you improve before final submission</p>
            </div>
            <span className="badge-rule">Interactive Editor</span>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid-2-col mb-4">
                <div className="form-group">
                  <label htmlFor="student-select" className="form-label">Learner Profile</label>
                  <select
                    id="student-select"
                    className="form-control form-select"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    aria-required="true"
                  >
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="assignment-select" className="form-label">Target Assignment</label>
                  <select
                    id="assignment-select"
                    className="form-control form-select"
                    value={selectedAssignment}
                    onChange={e => setSelectedAssignment(e.target.value)}
                    aria-required="true"
                  >
                    {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <label htmlFor="submission-textarea" className="form-label" style={{ margin: 0 }}>
                    Submission Content
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Target: 150 – 300 words
                  </span>
                </div>
                
                <textarea
                  id="submission-textarea"
                  className="form-control"
                  rows={13}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Draft your essay here. E.g., Cloud computing is the on-demand delivery of IT resources over the internet with pay-as-you-go pricing..."
                  aria-describedby="word-count-hint"
                  aria-required="true"
                  style={{ fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: 1.6 }}
                />

                <div id="word-count-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: wordCountColor, fontSize: '0.82rem', fontWeight: 700 }}>
                      {wordCount} words
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {charCount} characters
                    </span>
                  </div>
                  <div>
                    {wordCount < 50 && <span style={{ color: 'var(--danger)', fontSize: '0.76rem', fontWeight: 600 }}>Draft too brief (aim for 150+)</span>}
                    {wordCount >= 50 && wordCount < 150 && <span style={{ color: 'var(--warning)', fontSize: '0.76rem' }}>Approaching target length</span>}
                    {wordCount >= 150 && <span style={{ color: 'var(--success)', fontSize: '0.76rem', fontWeight: 600 }}>✓ Optimal essay length</span>}
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-msg mb-4" role="alert" aria-live="polite">
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  disabled={submitting || !content.trim()}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" aria-hidden="true" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                      <span>Evaluating Against Rubric…</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span>Analyze Draft & Generate Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Feedback Results OR Rubric Helper */}
        {feedbackData ? (
          <div aria-live="polite">
            <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Initial Evaluation Result</h3>
                  <p className="card-subtitle">Formative rubric assessment for Draft 1</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Draft Score</div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: feedbackData.feedback.score >= 70 ? 'var(--success)' : feedbackData.feedback.score >= 45 ? 'var(--warning)' : 'var(--danger)',
                  }}>
                    {feedbackData.feedback.score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {feedbackData.feedback.requires_human_review && (
                  <div className="human-review-banner mb-4" role="alert">
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>HIGH IMPACT — MENTOR REVIEW REQUIRED</div>
                      <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        Reason: {feedbackData.feedback.high_impact_reason}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Action Items ({feedbackData.feedback.feedback?.length || 0})
                  </span>
                  <StatusBadge 
                    status={feedbackData.feedback.feedback?.length === 0 ? 'success' : 'warning'} 
                    label={feedbackData.feedback.feedback?.length === 0 ? 'Exemplary' : 'Needs Revision'} 
                    size="sm" 
                  />
                </div>

                {feedbackData.feedback.feedback?.length === 0 ? (
                  <div className="alert alert-success">
                    ✓ Outstanding submission! All rubric criteria met with robust evidence and examples.
                  </div>
                ) : (
                  <div>
                    {feedbackData.feedback.feedback.map(fb => (
                      <FeedbackCard key={fb.id} item={fb} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/student/revision', { state: { submissionId: feedbackData.submission.id } })}
                  >
                    Open Revision Editor →
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setFeedbackData(null)}
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Rubric Readiness Checklist</h3>
              <span className="badge-rule">Pre-flight Tips</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>1. Clear Definition</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Define cloud computing explicitly, noting characteristics such as on-demand provisioning and resource pooling.
                  </p>
                </div>

                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>2. At Least Two Advantages</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Articulate specific benefits (e.g., rapid elasticity, OPEX cost savings, fault tolerance).
                  </p>
                </div>

                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>3. Concrete Real-World Examples</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Reference tangible providers or implementations (e.g., AWS EC2, Netflix streaming architecture, Google Cloud).
                  </p>
                </div>

                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>4. Coherent Paragraph Flow</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Ensure paragraphs flow logically with standard transitions and clear sentence structure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
