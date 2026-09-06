import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAssignments } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'

export default function AssignmentPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAssignments()
      .then(a => setAssignments(a))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" aria-hidden="true" />
        <span>Loading assignment specifications…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)' }}>
        <div style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Error loading assignment: {error}</div>
      </div>
    )
  }

  const assignment = assignments[0]
  const criteria = assignment?.rubric?.criteria || []

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="status-badge status-badge-info status-badge-sm">
              <span className="status-dot" />
              <span>Course Module 1</span>
            </span>
            <span className="badge-rule">CS 401: Cloud Computing</span>
          </div>
          <h1 className="page-title">{assignment?.title || 'Assignment Details'}</h1>
          <p className="page-subtitle">Read the assignment brief, learning objectives, and criteria breakdown before submitting your draft.</p>
        </div>
        <div className="page-actions">
          <Link to="/student/submission" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Begin Submission</span>
          </Link>
        </div>
      </div>

      <div className="grid-2-col mb-6">
        {/* Assignment Brief */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Assignment Brief</h3>
            <StatusBadge status="active" label="Open for Submissions" size="sm" />
          </div>
          <div className="card-body">
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {assignment?.description}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                Key Instructions for Learners:
              </h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li>Write a concise overview of cloud computing fundamentals.</li>
                <li>Clearly define the primary concept with core characteristics.</li>
                <li>Articulate at least <strong>two distinct advantages</strong> (e.g., elasticity, cost efficiency).</li>
                <li>Provide real-world industry examples or enterprise use cases.</li>
                <li>Organize into structured paragraphs with coherent flow.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Human-in-the-Loop Feedback Policy */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Formative Feedback Principles</h3>
            <span className="badge-rule">Automated + Mentor Oversight</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Our Formative Feedback Assistant provides real-time rubric-aligned suggestions. However, humans remain firmly in control:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>⚡ Formative, Not Punitive</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Draft feedback does not affect your permanent grade. It is designed to guide your revision.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--warning-dark)' }}>🔍 Explainable Evidence</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Every suggestion identifies exact phrases in your draft that triggered the rule.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--danger)' }}>👤 Mentor Review for Edge Cases</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Unusual scores, low confidence, or flagged passages require human mentor approval before finalization.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Rubric Breakdown */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Evaluation Rubric Matrix</h3>
            <p className="card-subtitle">Detailed criteria weights and minimum pass thresholds</p>
          </div>
          <span className="status-badge status-badge-info status-badge-sm">100% Total Weight</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Criterion</th>
                  <th style={{ width: '90px' }}>Weight</th>
                  <th>Target Standard</th>
                  <th>Minimum Conditions</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.criterion_id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    </td>
                    <td>
                      <span className="status-badge status-badge-neutral status-badge-sm">
                        {Math.round(c.weight * 100)}%
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.description}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.name.includes('Definition') && 'Clear concept statement with key properties'}
                        {c.name.includes('Advantages') && '≥ 2 distinct benefits backed by evidence'}
                        {c.name.includes('Examples') && '≥ 2 concrete enterprise use cases'}
                        {c.name.includes('Clarity') && 'Structured paragraphs, minimal typos'}
                      </span>
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
