import React from 'react'
import { Link } from 'react-router-dom'

export default function HelpPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentation & System Architecture</h1>
          <p className="page-subtitle">Learn how the Formative Feedback Assistant works, rubric rules, and how mentors retain control.</p>
        </div>
        <div className="page-actions">
          <Link to="/student/submission" className="btn btn-primary">
            Try Submission Workspace →
          </Link>
        </div>
      </div>

      <div className="grid-2-col mb-6">
        {/* Core Principles */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Formative Feedback Philosophy</h3>
              <p className="card-subtitle">Scaffolding learning before high-stakes evaluation</p>
            </div>
            <span className="badge-rule">Core Pillars</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. Real-Time Feedback During Drafting:</strong>
                <p style={{ marginTop: '0.2rem' }}>
                  Traditional online learning delays grading until after submission. Our assistant analyzes drafts immediately, providing specific suggestions on definitions, advantages, and examples.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Explainability & Evidence:</strong>
                <p style={{ marginTop: '0.2rem' }}>
                  Every suggestion identifies the exact passage in the submission that triggered the rule, paired with a confidence rating and plain-language pedagogical rationale.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Human-in-the-Loop Safeguards:</strong>
                <p style={{ marginTop: '0.2rem' }}>
                  The assistant never replaces human instructors. High-impact scenarios (potential plagiarism, outlier scores, or low confidence) are routed directly to mentor moderation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Complete Workflow Lifecycle</h3>
              <p className="card-subtitle">From initial draft to verified final grade</p>
            </div>
            <span className="status-badge status-badge-info status-badge-sm">Lifecycle</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>Step 1: Student Draft</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Learner composes response against the CS 401 Cloud Computing rubric.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Step 2: Rubric & Evidence Engine</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  FastAPI backend processes text with pattern matching and criteria extractors.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--warning-dark)' }}>Step 3: High-Impact Gate</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Safety thresholds evaluate whether human mentor review is required.
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--success)' }}>Step 4: Revision & Improvement</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Learner incorporates feedback, resubmits, and measures quantitative score gains.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Reference Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Automated Rule Index</h3>
            <p className="card-subtitle">Complete registry of active evaluation rules</p>
          </div>
          <span className="status-badge status-badge-neutral status-badge-sm">13 Rules Active</span>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Human-Readable Rule Name</th>
                  <th>Target Rubric Area</th>
                  <th>Pedagogical Priority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge-rule">RULE_DEF_001</span></td>
                  <td style={{ fontWeight: 600 }}>Definition Missing or Too Brief</td>
                  <td>Concept Definition</td>
                  <td><span className="status-badge status-badge-danger status-badge-sm">High</span></td>
                </tr>
                <tr>
                  <td><span className="badge-rule">RULE_ADV_001</span></td>
                  <td style={{ fontWeight: 600 }}>Insufficient Advantages</td>
                  <td>Advantages & Benefits</td>
                  <td><span className="status-badge status-badge-warning status-badge-sm">Medium</span></td>
                </tr>
                <tr>
                  <td><span className="badge-rule">RULE_EX_001</span></td>
                  <td style={{ fontWeight: 600 }}>Insufficient Real-World Examples</td>
                  <td>Real-World Examples</td>
                  <td><span className="status-badge status-badge-warning status-badge-sm">Medium</span></td>
                </tr>
                <tr>
                  <td><span className="badge-rule">RULE_ORG_001</span></td>
                  <td style={{ fontWeight: 600 }}>Weak Organization</td>
                  <td>Clarity & Organization</td>
                  <td><span className="status-badge status-badge-neutral status-badge-sm">Low</span></td>
                </tr>
                <tr>
                  <td><span className="badge-rule">RULE_HI_001</span></td>
                  <td style={{ fontWeight: 600 }}>Extremely Low Score</td>
                  <td>Safety Threshold</td>
                  <td><span className="status-badge status-badge-danger status-badge-sm">High Impact</span></td>
                </tr>
                <tr>
                  <td><span className="badge-rule">RULE_PLAG_001</span></td>
                  <td style={{ fontWeight: 600 }}>Possible Plagiarism Signal</td>
                  <td>Authenticity</td>
                  <td><span className="status-badge status-badge-danger status-badge-sm">High Impact</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
