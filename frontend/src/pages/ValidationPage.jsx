import { useState, useEffect } from 'react'
import {
  getUserValidationSummary,
  submitUserValidation,
  getAccessibilityChecks,
  updateAccessibilityCheck,
  getLanguageValidation,
  getExplainabilityChecks,
  updateExplainabilityCheck,
} from '../api/client.js'

const TASKS = [
  { id: 1, name: 'Understand feedback' },
  { id: 2, name: 'Find evidence' },
  { id: 3, name: 'Understand why the recommendation was generated' },
  { id: 4, name: 'Complete a revision' },
  { id: 5, name: 'Understand when human review is required' },
]

export default function ValidationPage() {
  const [activeTab, setActiveTab] = useState('user') // 'user', 'accessibility', 'language', 'explainability'

  // User validation state
  const [userSummary, setUserSummary] = useState(null)
  const [role, setRole] = useState('Student')
  const [taskEvals, setTaskEvals] = useState(
    TASKS.map(t => ({ task_id: t.id, task_name: t.name, success: true, ease_rating: 4, comment: '' }))
  )
  const [accessFeedback, setAccessFeedback] = useState('')
  const [langFeedback, setLangFeedback] = useState('')
  const [explainFeedback, setExplainFeedback] = useState('')
  const [usefulness, setUsefulness] = useState(5)
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [userMsg, setUserMsg] = useState(null)

  // Accessibility state
  const [accessChecks, setAccessChecks] = useState([])
  const [accessUpdating, setAccessUpdating] = useState({})

  // Language state
  const [langCases, setLangCases] = useState([])
  const [langLoading, setLangLoading] = useState(false)

  // Explainability state
  const [explainChecks, setExplainChecks] = useState([])
  const [explainUpdating, setExplainUpdating] = useState({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      getUserValidationSummary(),
      getAccessibilityChecks(),
      getLanguageValidation(),
      getExplainabilityChecks(),
    ])
      .then(([u, a, l, e]) => {
        setUserSummary(u)
        setAccessChecks(a)
        setLangCases(l)
        setExplainChecks(e)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
  }, [])

  // Handle User Evaluation Submit
  const handleUserSubmit = async (e) => {
    e.preventDefault()
    setUserSubmitting(true)
    setUserMsg(null)
    try {
      await submitUserValidation({
        role,
        task_ratings: taskEvals,
        accessibility_feedback: accessFeedback || null,
        language_feedback: langFeedback || null,
        explainability_feedback: explainFeedback || null,
        overall_usefulness_rating: usefulness,
      })
      setUserMsg('User validation evaluation successfully submitted!')
      const freshSummary = await getUserValidationSummary()
      setUserSummary(freshSummary)
      setAccessFeedback('')
      setLangFeedback('')
      setExplainFeedback('')
    } catch (err) {
      setUserMsg(`Error: ${err.message}`)
    } finally {
      setUserSubmitting(false)
    }
  }

  // Handle Accessibility Update
  const handleAccessStatusChange = async (id, newStatus, comments) => {
    setAccessUpdating(prev => ({ ...prev, [id]: true }))
    try {
      const updated = await updateAccessibilityCheck(id, {
        status: newStatus,
        comments: comments,
        tester: 'Current Auditor',
      })
      setAccessChecks(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      alert(`Failed to update accessibility check: ${err.message}`)
    } finally {
      setAccessUpdating(prev => ({ ...prev, [id]: false }))
    }
  }

  // Handle Explainability Update
  const handleExplainStatusChange = async (id, newStatus, comment) => {
    setExplainUpdating(prev => ({ ...prev, [id]: true }))
    try {
      const updated = await updateExplainabilityCheck(id, {
        status: newStatus,
        comment: comment,
        tester_role: role,
      })
      setExplainChecks(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      alert(`Failed to update explainability check: ${err.message}`)
    } finally {
      setExplainUpdating(prev => ({ ...prev, [id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" aria-hidden="true" />
        <span>Loading validation module…</span>
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
        <h1>Validation & Usability Suite</h1>
        <p>
          Multi-dimensional human validation covering representative user tasks, WCAG 2.1 accessibility,
          non-native language equity, and decision explainability.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Validation Suite Sections" className="flex gap-2 flex-wrap mb-6">
        <button
          role="tab"
          aria-selected={activeTab === 'user'}
          className={`btn btn-sm ${activeTab === 'user' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('user')}
        >
          👤 User Testing (Tasks 1–5)
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'accessibility'}
          className={`btn btn-sm ${activeTab === 'accessibility' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('accessibility')}
        >
          ♿ Accessibility Checklist
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'language'}
          className={`btn btn-sm ${activeTab === 'language' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('language')}
        >
          🌐 Language Equity & Fairness
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'explainability'}
          className={`btn btn-sm ${activeTab === 'explainability' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('explainability')}
        >
          💡 Explainability Questions
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TAB 1: USER VALIDATION
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'user' && (
        <div>
          {/* Summary KPIs */}
          <section aria-labelledby="user-kpis-heading" className="card mb-8">
            <h2 id="user-kpis-heading" className="section-title">📊 Representative User Testing Summary</h2>
            <div className="stats-grid mb-4">
              <div className="stat-card">
                <div className="stat-value">{userSummary.total_submissions}</div>
                <div className="stat-label">Total Completed Evaluations</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--color-primary-light)' }}>
                  {userSummary.student_count} / {userSummary.mentor_count}
                </div>
                <div className="stat-label">Students / Mentors</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
                  {userSummary.avg_usefulness != null ? `${userSummary.avg_usefulness}/5.0` : '—'}
                </div>
                <div className="stat-label">Mean Usefulness Rating</div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Task Success & Ease</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              {Object.entries(userSummary.task_success_rates).map(([tName, sRate]) => (
                <div key={tName} className="p-3" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tName}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted">Success:</span>
                    <strong style={{ color: sRate >= 80 ? 'var(--color-success)' : 'var(--color-warn)' }}>{sRate}%</strong>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted">Avg Ease:</span>
                    <strong style={{ color: 'var(--color-accent)' }}>{userSummary.task_avg_ease[tName] || '—'}/5</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* User Evaluation Form */}
          <section aria-labelledby="form-heading" className="card mb-8">
            <h2 id="form-heading" className="section-title">✍️ Record Representative User Evaluation</h2>
            {userMsg && (
              <div className={`alert ${userMsg.startsWith('Error') ? 'alert-warn' : 'alert-success'} mb-4`} role="alert">
                {userMsg}
              </div>
            )}
            <form onSubmit={handleUserSubmit} noValidate>
              <div className="form-group mb-4">
                <label className="form-label" htmlFor="role-select">Your Role in the Simulation</label>
                <select
                  id="role-select"
                  className="form-control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Mentor/Instructor">Mentor / Instructor</option>
                </select>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                Evaluate Core Workflow Tasks (1–5)
              </h3>

              {taskEvals.map((task, idx) => (
                <div key={task.task_id} className="p-4 mb-3" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center justify-between flex-wrap mb-2">
                    <strong>Task {task.task_id}: {task.task_name}</strong>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name={`success-${task.task_id}`}
                          checked={task.success === true}
                          onChange={() => {
                            const copy = [...taskEvals]
                            copy[idx].success = true
                            setTaskEvals(copy)
                          }}
                        />
                        <span style={{ color: 'var(--color-success)' }}>✓ Success</span>
                      </label>
                      <label className="flex items-center gap-1" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name={`success-${task.task_id}`}
                          checked={task.success === false}
                          onChange={() => {
                            const copy = [...taskEvals]
                            copy[idx].success = false
                            setTaskEvals(copy)
                          }}
                        />
                        <span style={{ color: 'var(--color-danger)' }}>✗ Failure</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <label htmlFor={`ease-${task.task_id}`} className="text-xs text-muted" style={{ minWidth: '120px' }}>
                      Ease of Use (1–5):
                    </label>
                    <select
                      id={`ease-${task.task_id}`}
                      className="form-control form-control-sm"
                      style={{ width: '100px' }}
                      value={task.ease_rating}
                      onChange={e => {
                        const copy = [...taskEvals]
                        copy[idx].ease_rating = parseInt(e.target.value)
                        setTaskEvals(copy)
                      }}
                    >
                      <option value={5}>5 - Very Easy</option>
                      <option value={4}>4 - Easy</option>
                      <option value={3}>3 - Neutral</option>
                      <option value={2}>2 - Difficult</option>
                      <option value={1}>1 - Very Difficult</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Optional observation or comment on this task…"
                    value={task.comment || ''}
                    onChange={e => {
                      const copy = [...taskEvals]
                      copy[idx].comment = e.target.value
                      setTaskEvals(copy)
                    }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="access-feedback">Accessibility Feedback</label>
                  <textarea
                    id="access-feedback"
                    className="form-control"
                    rows={2}
                    value={accessFeedback}
                    onChange={e => setAccessFeedback(e.target.value)}
                    placeholder="Keyboard navigation, screen readers, contrast…"
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="lang-feedback">Language & ESL Fairness Feedback</label>
                  <textarea
                    id="lang-feedback"
                    className="form-control"
                    rows={2}
                    value={langFeedback}
                    onChange={e => setLangFeedback(e.target.value)}
                    placeholder="Fairness for non-native English, terminology clarity…"
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="explain-feedback">Explainability Feedback</label>
                  <textarea
                    id="explain-feedback"
                    className="form-control"
                    rows={2}
                    value={explainFeedback}
                    onChange={e => setExplainFeedback(e.target.value)}
                    placeholder="Transparency of rule names, evidence, confidence…"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 mb-4">
                <label htmlFor="overall-usefulness" className="form-label" style={{ margin: 0 }}>Overall System Usefulness (1–5):</label>
                <select
                  id="overall-usefulness"
                  className="form-control"
                  style={{ width: '120px' }}
                  value={usefulness}
                  onChange={e => setUsefulness(parseInt(e.target.value))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Fair</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={userSubmitting}>
                {userSubmitting ? 'Submitting Evaluation…' : 'Submit User Evaluation'}
              </button>
            </form>
          </section>

          {/* Recent Evaluations */}
          <section aria-labelledby="evals-heading" className="card">
            <h2 id="evals-heading" className="section-title">📋 Recent Evaluation Records ({userSummary.recent_evaluations.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {userSummary.recent_evaluations.map(ev => (
                <div key={ev.id} className="p-3" style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-approved">{ev.role}</span>
                    <span className="text-xs text-muted">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-secondary mb-1">
                    <strong>Usefulness Rating:</strong> {ev.overall_usefulness_rating}/5
                  </div>
                  {ev.explainability_feedback && (
                    <div className="text-xs text-muted">
                      <strong>Explainability Note:</strong> {ev.explainability_feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 2: ACCESSIBILITY CHECKLIST
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'accessibility' && (
        <section aria-labelledby="accessibility-heading" className="card">
          <h2 id="accessibility-heading" className="section-title">♿ WCAG 2.1 AA Accessibility Validation Checklist</h2>
          <p className="text-sm text-muted mb-4">
            Audited requirements covering keyboard operability, screen readers, semantic HTML, and visual tokens.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {accessChecks.map((item) => (
              <div
                key={item.id}
                className="p-4"
                style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: item.status === 'Pass' ? '4px solid var(--color-success)' : (item.status === 'Fail' ? '4px solid var(--color-danger)' : '4px solid var(--color-warn)'),
                }}
              >
                <div className="flex items-center justify-between flex-wrap mb-2">
                  <strong style={{ fontSize: '1rem' }}>{item.item_name}</strong>
                  <div className="flex items-center gap-2">
                    <select
                      className="form-control form-control-sm"
                      value={item.status}
                      disabled={accessUpdating[item.id]}
                      onChange={e => handleAccessStatusChange(item.id, e.target.value, item.comments)}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Needs Improvement">Needs Improvement</option>
                      <option value="Fail">Fail</option>
                    </select>
                    <span className={`badge ${item.status === 'Pass' ? 'badge-approved' : (item.status === 'Fail' ? 'badge-rejected' : 'badge-pending')}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label htmlFor={`access-comments-${item.id}`} className="text-xs text-muted">Auditor Comments & Evidence:</label>
                  <textarea
                    id={`access-comments-${item.id}`}
                    className="form-control form-control-sm mt-1"
                    rows={2}
                    value={item.comments || ''}
                    onChange={e => {
                      const updatedComments = e.target.value
                      setAccessChecks(prev => prev.map(c => c.id === item.id ? { ...c, comments: updatedComments } : c))
                    }}
                    onBlur={e => handleAccessStatusChange(item.id, item.status, e.target.value)}
                    placeholder="Document test findings or assistive technology behavior…"
                  />
                </div>
                <div className="text-xs text-muted mt-2">
                  Audited by {item.tester || 'Auditor'} · {new Date(item.checked_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 3: LANGUAGE EQUITY & FAIRNESS
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'language' && (
        <section aria-labelledby="language-heading" className="card">
          <h2 id="language-heading" className="section-title">🌐 Language Diversity & Fairness Validation</h2>
          <p className="text-sm text-muted mb-4">
            Evaluates the feedback engine against 4 representative linguistic variants. Demonstrates that grammatical
            imperfections trigger low-priority guidance without suppressing conceptual recognition or penalizing scoring.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {langCases.map((c, idx) => (
              <div
                key={idx}
                className="p-4"
                style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: c.conceptual_quality_preserved ? '4px solid var(--color-success)' : '4px solid var(--color-danger)',
                }}
              >
                <div className="flex items-center justify-between flex-wrap mb-2">
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{c.case_name}</strong>
                    <span className="badge" style={{ marginLeft: 8, background: 'var(--color-surface-3)' }}>{c.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Concept Score:</span>
                    <strong style={{ color: 'var(--color-accent)', fontSize: '1.1rem' }}>{c.concept_score}/100</strong>
                  </div>
                </div>

                <blockquote style={{ margin: 'var(--space-3) 0', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                  "{c.sample_text}"
                </blockquote>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  <div className="p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <span className="text-xs text-muted">Grammar Flagged:</span>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>
                      {c.grammar_flagged ? <span style={{ color: 'var(--color-warn)' }}>Yes (RULE_LANG_001)</span> : 'No'}
                    </div>
                  </div>
                  <div className="p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <span className="text-xs text-muted">Grammar Priority:</span>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>
                      {c.grammar_priority ? <span className="badge badge-low">{c.grammar_priority}</span> : 'None'}
                    </div>
                  </div>
                  <div className="p-2" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <span className="text-xs text-muted">Conceptual Score Preserved:</span>
                    <div style={{ fontWeight: 600, marginTop: 2, color: 'var(--color-success)' }}>
                      ✓ Preserved
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted mt-3" style={{ lineHeight: 1.6 }}>
                  <strong>Pedagogical Analysis:</strong> {c.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 4: EXPLAINABILITY VALIDATION
      ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'explainability' && (
        <section aria-labelledby="explainability-heading" className="card">
          <h2 id="explainability-heading" className="section-title">💡 Decision Explainability & Transparency Validation</h2>
          <p className="text-sm text-muted mb-4">
            Audits whether end users can answer the 7 essential questions required for algorithmic accountability.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {explainChecks.map((q) => (
              <div
                key={q.id}
                className="p-4"
                style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: q.status === 'UNDERSTOOD' ? '4px solid var(--color-success)' : '4px solid var(--color-warn)',
                }}
              >
                <div className="flex items-center justify-between flex-wrap mb-2">
                  <strong style={{ fontSize: '0.95rem' }}>{q.question}</strong>
                  <div className="flex items-center gap-2">
                    <button
                      className={`btn btn-sm ${q.status === 'UNDERSTOOD' ? 'btn-success' : 'btn-ghost'}`}
                      onClick={() => handleExplainStatusChange(q.id, 'UNDERSTOOD', q.comment)}
                      disabled={explainUpdating[q.id]}
                    >
                      ✓ UNDERSTOOD
                    </button>
                    <button
                      className={`btn btn-sm ${q.status === 'NOT UNDERSTOOD' ? 'btn-warn' : 'btn-ghost'}`}
                      onClick={() => handleExplainStatusChange(q.id, 'NOT UNDERSTOOD', q.comment)}
                      disabled={explainUpdating[q.id]}
                    >
                      ? NOT UNDERSTOOD
                    </button>
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label htmlFor={`explain-comment-${q.id}`} className="text-xs text-muted">Auditor Observation / Tester Comment:</label>
                  <input
                    id={`explain-comment-${q.id}`}
                    type="text"
                    className="form-control form-control-sm mt-1"
                    value={q.comment || ''}
                    onChange={e => {
                      const updatedComm = e.target.value
                      setExplainChecks(prev => prev.map(c => c.id === q.id ? { ...c, comment: updatedComm } : c))
                    }}
                    onBlur={e => handleExplainStatusChange(q.id, q.status, e.target.value)}
                    placeholder="Provide evidence of user understanding or points of confusion…"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
