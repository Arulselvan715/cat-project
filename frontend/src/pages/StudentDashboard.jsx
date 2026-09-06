import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, getAssignments } from '../api/client.js'

export default function StudentDashboard() {
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getStudents(), getAssignments()])
      .then(([s, a]) => { setStudents(s); setAssignments(a) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" aria-hidden="true" /><span>Loading course data…</span></div>
  if (error) return <div className="container page"><div className="error-msg" role="alert">⚠ {error}</div></div>

  const assignment = assignments[0]
  const criteria = assignment?.rubric?.criteria || []

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Welcome to your learning portal. Review the assignment and rubric before submitting your work.</p>
      </div>

      {/* Assignment Card */}
      {assignment && (
        <section aria-labelledby="assignment-heading" className="card mb-6">
          <h2 id="assignment-heading" className="section-title">📋 Assignment</h2>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
            {assignment.title}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            {assignment.description}
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link to="/student/submission" className="btn btn-primary">
              📝 Submit Your Draft
            </Link>
            <Link to="/student/revision" className="btn btn-ghost">
              🔄 View Revision History
            </Link>
          </div>
        </section>
      )}

      {/* Rubric */}
      {criteria.length > 0 && (
        <section aria-labelledby="rubric-heading" className="card mb-6">
          <h2 id="rubric-heading" className="section-title">📐 Grading Rubric</h2>
          <p className="text-sm text-muted mb-4">
            Each criterion is evaluated independently. Feedback is generated for each area.
          </p>
          <ul className="rubric-list" role="list">
            {criteria.map(c => (
              <li key={c.criterion_id} className="rubric-item">
                <div className="rubric-weight" aria-label={`Weight: ${Math.round(c.weight * 100)}%`}>
                  {Math.round(c.weight * 100)}%
                </div>
                <div className="rubric-info">
                  <div className="rubric-name">{c.name}</div>
                  <div className="rubric-desc">{c.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Students list */}
      <section aria-labelledby="students-heading" className="card">
        <h2 id="students-heading" className="section-title">👤 Enrolled Students</h2>
        <p className="text-sm text-muted mb-4">
          Select your name when submitting to track your progress.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {students.map(s => (
            <div key={s.id} className="card card-sm" style={{ background: 'var(--color-surface-2)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
              <div className="text-xs text-muted mt-2">{s.email}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
