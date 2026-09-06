import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, getStudentSubmissions } from '../api/client.js'
import KpiCard from '../components/KpiCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function ProgressPage() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStudents()
      .then(s => {
        setStudents(s)
        if (s.length) setSelectedStudent(String(s[0].id))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    getStudentSubmissions(parseInt(selectedStudent))
      .then(subs => setSubmissions(subs))
      .catch(() => setSubmissions([]))
  }, [selectedStudent])

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        <span>Loading learner analytics…</span>
      </div>
    )
  }

  // Calculate stats across submissions
  const totalSubmissions = submissions.length
  const completedSubmissions = submissions.filter(s => s.is_final)
  const avgDraft = submissions.length 
    ? (submissions.reduce((acc, s) => acc + (s.draft_score || 0), 0) / submissions.length).toFixed(1)
    : '—'
  const avgFinal = completedSubmissions.length
    ? (completedSubmissions.reduce((acc, s) => acc + (s.final_score || 0), 0) / completedSubmissions.length).toFixed(1)
    : '—'
  const avgGain = (avgDraft !== '—' && avgFinal !== '—')
    ? (parseFloat(avgFinal) - parseFloat(avgDraft)).toFixed(1)
    : '—'

  const chartData = submissions.map((s, idx) => ({
    name: `Sub #${s.id} (v${s.version})`,
    draftScore: s.draft_score || 0,
    finalScore: s.final_score || 0,
  }))

  const selectedStudentObj = students.find(s => String(s.id) === selectedStudent)

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Learner Progress & Quality Growth</h1>
          <p className="page-subtitle">Track formative score evolution, revision frequency, and mastery progress.</p>
        </div>
        <div className="page-actions">
          <Link to="/student/submission" className="btn btn-primary">
            <span>New Submission</span>
          </Link>
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <label htmlFor="progress-student-select" className="form-label" style={{ marginBottom: '0.2rem' }}>
              Select Enrolled Learner
            </label>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Viewing individualized trajectory for {selectedStudentObj?.name || 'Selected Student'}
            </div>
          </div>
          <div style={{ minWidth: '260px' }}>
            <select
              id="progress-student-select"
              className="form-control form-select"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="kpi-grid mb-6">
        <KpiCard
          title="Total Submissions"
          value={totalSubmissions}
          subtitle="Formative drafts logged"
          icon="📚"
        />
        <KpiCard
          title="Average Draft Score"
          value={avgDraft !== '—' ? `${avgDraft} / 100` : '—'}
          subtitle="Pre-feedback baseline"
          icon="📝"
        />
        <KpiCard
          title="Average Final Score"
          value={avgFinal !== '—' ? `${avgFinal} / 100` : 'Pending'}
          badge={<StatusBadge status="success" label="Target: 85+" size="sm" />}
          subtitle="Post-revision outcome"
          icon="🏆"
        />
        <KpiCard
          title="Average Point Gain"
          value={avgGain !== '—' ? `+${avgGain} pts` : '—'}
          trend={avgGain !== '—' && parseFloat(avgGain) >= 0 ? 'up' : 'neutral'}
          subtitle="Net formative growth"
          icon="📈"
        />
      </div>

      {/* Chart Section */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h3 className="card-title">Draft vs Final Score Comparison</h3>
            <p className="card-subtitle">Visualizing point progression across revisions</p>
          </div>
          <span className="badge-rule">Recharts Analytics</span>
        </div>

        <div className="card-body">
          {submissions.length === 0 ? (
            <EmptyState icon="📊" title="No Submissions to Display" description="Submit an initial draft to start visualizing your score trajectory." />
          ) : (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="draftScore" name="Draft Score" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="finalScore" name="Final Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Submission Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Submission History Breakdown</h3>
            <p className="card-subtitle">Detailed record of draft submissions, scores, and status</p>
          </div>
          <span className="status-badge status-badge-neutral status-badge-sm">
            {submissions.length} Records
          </span>
        </div>

        <div className="card-body">
          {submissions.length === 0 ? (
            <EmptyState icon="📝" title="No Records" description="No drafts submitted for this learner yet." />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Submission ID</th>
                    <th>Date Submitted</th>
                    <th>Version</th>
                    <th>Initial Score</th>
                    <th>Final Score</th>
                    <th>Score Delta</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => {
                    const diff = (s.final_score != null && s.draft_score != null) ? (s.final_score - s.draft_score) : null
                    return (
                      <tr key={s.id}>
                        <td><span className="badge-rule">#{s.id}</span></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(s.submitted_at).toLocaleDateString()} {new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td><span className="status-badge status-badge-neutral status-badge-sm">v{s.version}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.draft_score?.toFixed(1) ?? '—'}</td>
                        <td style={{ fontWeight: 600 }}>{s.final_score?.toFixed(1) ?? '—'}</td>
                        <td>
                          {diff != null ? (
                            <span className={`improvement-badge ${diff >= 0 ? 'improvement-positive' : 'improvement-negative'}`}>
                              {diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge 
                            status={s.is_final ? 'completed' : 'pending'} 
                            label={s.is_final ? 'Final' : 'Drafting'} 
                            size="sm" 
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Link to="/student/revision" state={{ submissionId: s.id }} className="btn btn-outline btn-xs">
                              Revise
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
