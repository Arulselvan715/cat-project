import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getStudents } from './api/client.js'

// Navigation & Layout Components
import Sidebar from './components/Sidebar.jsx'
import TopHeader from './components/TopHeader.jsx'

// Student Workspace Pages
import StudentDashboard from './pages/StudentDashboard.jsx'
import AssignmentPage from './pages/AssignmentPage.jsx'
import SubmissionPage from './pages/SubmissionPage.jsx'
import FeedbackPage from './pages/FeedbackPage.jsx'
import RevisionPage from './pages/RevisionPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'

// Mentor & Rigor Pages
import MentorDashboard from './pages/MentorDashboard.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import MetricsPage from './pages/MetricsPage.jsx'
import ExperimentDashboard from './pages/ExperimentDashboard.jsx'
import ErrorAnalysisPage from './pages/ErrorAnalysisPage.jsx'
import ValidationPage from './pages/ValidationPage.jsx'

// System Pages
import SettingsPage from './pages/SettingsPage.jsx'
import HelpPage from './pages/HelpPage.jsx'

function ShellLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState('student')
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const location = useLocation()

  useEffect(() => {
    getStudents()
      .then(data => {
        setStudents(data)
        if (data.length > 0) {
          setSelectedStudentId(data[0].id)
        }
      })
      .catch(err => console.error('Failed to load students in shell:', err))
  }, [])

  // Auto-detect role from path
  useEffect(() => {
    if (location.pathname.startsWith('/mentor')) {
      setCurrentRole('mentor')
    } else if (location.pathname.startsWith('/student')) {
      setCurrentRole('student')
    }
  }, [location.pathname])

  const activeStudent = students.find(s => s.id === selectedStudentId)

  // Map route to top header title and subtitle
  const getHeaderDetails = () => {
    const p = location.pathname
    if (p === '/student') return { title: 'Learner Dashboard', subtitle: 'Course progress and active draft status' }
    if (p === '/student/assignment') return { title: 'Course Rubric & Specs', subtitle: 'Learning outcomes and evaluation criteria' }
    if (p === '/student/submission') return { title: 'Draft Submission Studio', subtitle: 'Formative AI evaluation before final scoring' }
    if (p === '/student/feedback') return { title: 'Criterion Feedback & Insights', subtitle: 'Explainable guidance with evidence quotes' }
    if (p === '/student/revision') return { title: 'Revision Studio & Timeline', subtitle: 'Refine drafts and track measured improvements' }
    if (p === '/student/progress') return { title: 'Progress Analytics', subtitle: 'Longitudinal quality growth across revisions' }
    if (p === '/mentor') return { title: 'Mentor Operations Center', subtitle: 'Overview of submissions, feedback, and queues' }
    if (p === '/mentor/reviews') return { title: 'Human Review Queue', subtitle: 'Moderate high-impact automated recommendations' }
    if (p === '/mentor/metrics') return { title: 'Cohort Performance Analytics', subtitle: 'Longitudinal score gains and rubric coverage' }
    if (p === '/mentor/experiment') return { title: 'A/B Experimentation & Efficacy', subtitle: 'Controlled baseline vs assistant trial' }
    if (p === '/mentor/errors') return { title: 'Error Analysis & Taxonomy', subtitle: 'Systematic failure tracking and accuracy auditing' }
    if (p === '/mentor/validation') return { title: 'Human Validation & Usability', subtitle: 'Task success, WCAG accessibility, and explainability' }
    if (p === '/settings') return { title: 'System Settings', subtitle: 'Configuration and accessibility preferences' }
    if (p === '/help') return { title: 'Architecture & Documentation', subtitle: 'Formative feedback workflow guidelines' }
    return { title: 'Formative Feedback Assistant', subtitle: 'Human-centered learning scaffolding' }
  }

  const { title, subtitle } = getHeaderDetails()

  return (
    <div className="app-shell">
      {/* Dark Modern Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        studentName={activeStudent ? activeStudent.name : 'Active Learner'}
      />

      {/* Main Content Area with Header */}
      <div className="app-main">
        <TopHeader
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          title={title}
          subtitle={subtitle}
          students={students}
          selectedStudentId={selectedStudentId}
          onStudentChange={(id) => setSelectedStudentId(id)}
        />

        <main className="content-container" id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            
            {/* Student Workspace */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/assignment" element={<AssignmentPage />} />
            <Route path="/student/submission" element={<SubmissionPage />} />
            <Route path="/student/feedback" element={<FeedbackPage />} />
            <Route path="/student/revision" element={<RevisionPage />} />
            <Route path="/student/progress" element={<ProgressPage />} />

            {/* Mentor & Rigor Workspace */}
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/reviews" element={<ReviewsPage />} />
            <Route path="/mentor/metrics" element={<MetricsPage />} />
            <Route path="/mentor/experiment" element={<ExperimentDashboard />} />
            <Route path="/mentor/errors" element={<ErrorAnalysisPage />} />
            <Route path="/mentor/validation" element={<ValidationPage />} />

            {/* System */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ShellLayout />
    </BrowserRouter>
  )
}
