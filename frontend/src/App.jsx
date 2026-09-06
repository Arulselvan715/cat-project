import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import StudentDashboard from './pages/StudentDashboard.jsx'
import SubmissionPage from './pages/SubmissionPage.jsx'
import FeedbackPage from './pages/FeedbackPage.jsx'
import RevisionPage from './pages/RevisionPage.jsx'
import MentorDashboard from './pages/MentorDashboard.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import MetricsPage from './pages/MetricsPage.jsx'
import ExperimentDashboard from './pages/ExperimentDashboard.jsx'
import ErrorAnalysisPage from './pages/ErrorAnalysisPage.jsx'
import ValidationPage from './pages/ValidationPage.jsx'

function NavBar() {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="container nav-inner">
        <NavLink to="/" className="nav-brand" aria-label="Formative Feedback Assistant home">
          <div className="nav-brand-icon" aria-hidden="true">🎓</div>
          <span>Formative Feedback</span>
        </NavLink>

        <ul className="nav-links" role="list">
          <li>
            <NavLink
              to="/student"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Student portal"
            >
              👤 Student
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/student/submission"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Submit assignment"
            >
              📝 Submit
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/student/revision"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Revision history"
            >
              🔄 Revise
            </NavLink>
          </li>
          <div className="nav-divider" role="separator" aria-hidden="true" />
          <li>
            <NavLink
              to="/mentor"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Mentor dashboard"
            >
              🏫 Mentor
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mentor/reviews"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Review queue"
            >
              🔍 Reviews
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mentor/metrics"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Metrics dashboard"
            >
              📊 Metrics
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mentor/experiment"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Experiment and Efficacy"
            >
              🧪 Experiment
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mentor/errors"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Error analysis"
            >
              🐞 Errors
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mentor/validation"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              aria-label="Validation and Usability"
            >
              ✅ Validation
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <NavBar />
        <main className="main-content" id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/submission" element={<SubmissionPage />} />
            <Route path="/student/feedback" element={<FeedbackPage />} />
            <Route path="/student/revision" element={<RevisionPage />} />
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/reviews" element={<ReviewsPage />} />
            <Route path="/mentor/metrics" element={<MetricsPage />} />
            <Route path="/mentor/experiment" element={<ExperimentDashboard />} />
            <Route path="/mentor/errors" element={<ErrorAnalysisPage />} />
            <Route path="/mentor/validation" element={<ValidationPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
