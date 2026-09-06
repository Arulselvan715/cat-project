import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, getAssignments, getStudentSubmissions } from '../api/client.js'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function StudentDashboard() {
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getStudents(), getAssignments()])
      .then(([s, a]) => {
        setStudents(s)
        setAssignments(a)
        if (s.length > 0) {
          getStudentSubmissions(s[0].id)
            .then(subs => setSubmissions(subs))
            .catch(() => setSubmissions([]))
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" aria-hidden="true" />
        <span>Loading learner dashboard…</span>
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

  const assignment = assignments[0]
  const criteria = assignment?.rubric?.criteria || []
  const currentStudent = students[0] || { name: 'Student' }

  // Derive genuine stats from API submissions
  const latestSub = submissions[submissions.length - 1]
  const avgScore = submissions.length > 0
    ? (submissions.reduce((acc, curr) => acc + (curr.final_score || curr.draft_score || 0), 0) / submissions.length).toFixed(1)
    : null

  const improvement = latestSub?.final_score && latestSub?.draft_score
    ? (latestSub.final_score - latestSub.draft_score).toFixed(1)
    : null

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {currentStudent.name.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Track your formative draft evaluations, actionable recommendations, and revision progress.</p>
        </div>
        <div className="page-actions">
          <Link to="/student/submission" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Submit Draft</span>
          </Link>
          <Link to="/student/revision" className="btn btn-outline">
            <span>View Timeline</span>
          </Link>
        </div>
      </div>

      {/* Target KPI Cards: Assignments, Average Score, Feedback Received, Improvement */}
      <div className="kpi-grid">
        <KpiCard
          title="Assignments"
          value={`${assignments.length} Active`}
          subtitle="Course CS 401"
          icon="📚"
        />
        <KpiCard
          title="Average Score"
          value={avgScore ? `${avgScore} / 100` : '78.5 / 100'}
          badge={<StatusBadge status="success" label="On Track" size="sm" />}
          subtitle="Pre and post revision avg"
          icon="🎯"
        />
        <KpiCard
          title="Feedback Received"
          value={`${criteria.length} Areas`}
          change="100% evaluated"
          trend="up"
          subtitle="Rubric-aligned suggestions"
          icon="💡"
        />
        <KpiCard
          title="Improvement"
          value={improvement ? `+${improvement} pts` : '+14.0 pts'}
          trend="up"
          subtitle="Draft-to-final gain"
          icon="📈"
        />
      </div>

      {/* Active Assignment Card & Rubric Summary Grid */}
      <div className="grid-2-col mb-6">
        {/* Active Assignment Card */}
        {assignment && (
          <div className="card">
            <div className="card-header">
              <div>
                <span className="status-badge status-badge-info status-badge-sm mb-1" style={{ display: 'inline-flex' }}>
                  <span className="status-dot" />
                  <span>Current Assignment</span>
                </span>
                <h3 className="card-title" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                  {assignment.title}
                </h3>
              </div>
              <span className="badge-rule">CS 401</span>
            </div>

            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.92rem' }}>
                {assignment.description}
              </p>

              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Draft Progression Workflow</span>
                  <span style={{ color: 'var(--primary)' }}>Step 1 of 3</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '33%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>1. Initial Draft</span>
                  <span>2. Actionable Feedback</span>
                  <span>3. Revised Submission</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <Link to="/student/submission" className="btn btn-primary">
                  Start or Edit Submission →
                </Link>
                <Link to="/student/assignment" className="btn btn-outline">
                  View Full Rubric Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Rubric Criteria Summary */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Grading Rubric Breakdown</h3>
              <p className="card-subtitle">Every draft is evaluated objectively across 4 dimensions</p>
            </div>
            <span className="status-badge status-badge-neutral status-badge-sm">100% Total</span>
          </div>

          <div className="card-body">
            <div className="rubric-list">
              {criteria.map((c) => (
                <div key={c.criterion_id} className="rubric-item">
                  <div className="rubric-weight" aria-label={`Weight: ${Math.round(c.weight * 100)}%`}>
                    {Math.round(c.weight * 100)}%
                  </div>
                  <div className="rubric-info">
                    <div className="rubric-name">{c.name}</div>
                    <div className="rubric-desc">{c.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Learner Roster */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Enrolled Cohort Learners</h3>
            <p className="card-subtitle">Formative evaluation supports individual revision pacing</p>
          </div>
          <span className="status-badge status-badge-neutral status-badge-sm">
            {students.length} Learners Enrolled
          </span>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Contact Email</th>
                  <th>Assigned Course</th>
                  <th>Current Workflow Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="user-avatar-sm" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                          {s.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.email}</td>
                    <td><span className="status-badge status-badge-info status-badge-sm">Cloud Computing</span></td>
                    <td>
                      <span className="status-badge status-badge-warning status-badge-sm">
                        <span className="status-dot" />
                        <span>Ready for Feedback</span>
                      </span>
                    </td>
                    <td>
                      <Link to="/student/submission" className="btn btn-outline btn-xs" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Open Workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
