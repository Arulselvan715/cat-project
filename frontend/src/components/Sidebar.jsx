import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ isOpen, onClose, currentRole, onRoleChange, studentName = 'Alex Mercer' }) {
  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Sidebar Navigation">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon-box" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div className="brand-info">
              <div className="brand-title">Formative</div>
              <div className="brand-subtitle">Feedback Assistant</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav">
          <div className="nav-group-label">LEARNER WORKSPACE</div>
          <NavLink 
            to="/student" 
            end
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <NavLink 
            to="/student/assignment" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span className="nav-label">Course Rubric</span>
          </NavLink>

          <NavLink 
            to="/student/submission" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
            <span className="nav-label">Submit Draft</span>
          </NavLink>

          <NavLink 
            to="/student/revision" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </span>
            <span className="nav-label">Revisions & Timeline</span>
          </NavLink>

          <NavLink 
            to="/student/progress" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <span className="nav-label">Progress Analytics</span>
          </NavLink>

          <div className="nav-group-label" style={{ marginTop: '1.25rem' }}>MENTOR & MODERATION</div>
          
          <NavLink 
            to="/mentor" 
            end
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span className="nav-label">Overview</span>
          </NavLink>

          <NavLink 
            to="/mentor/reviews" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            <span className="nav-label">Review Queue</span>
          </NavLink>

          <NavLink 
            to="/mentor/metrics" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
            </span>
            <span className="nav-label">Cohort Metrics</span>
          </NavLink>

          <div className="nav-group-label" style={{ marginTop: '1.25rem' }}>EVALUATION & RIGOR</div>

          <NavLink 
            to="/mentor/experiment" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31L4.54 19a2 2 0 0 0 1.7 3h11.52a2 2 0 0 0 1.7-3L14 9.31V2"/>
                <line x1="8.5" y1="2" x2="15.5" y2="2"/>
                <path d="M7 16h10"/>
              </svg>
            </span>
            <span className="nav-label">A/B Experiments</span>
          </NavLink>

          <NavLink 
            to="/mentor/errors" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <circle cx="12" cy="11" r="2"/>
                <path d="M12 13v4"/>
              </svg>
            </span>
            <span className="nav-label">Error Taxonomy</span>
          </NavLink>

          <NavLink 
            to="/mentor/validation" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            <span className="nav-label">Human Validation</span>
          </NavLink>

          <div className="nav-group-label" style={{ marginTop: '1.25rem' }}>SYSTEM</div>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <span className="nav-label">Settings</span>
          </NavLink>

          <NavLink 
            to="/help" 
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <span className="nav-label">Documentation</span>
          </NavLink>
        </div>

        {/* User Profile Card & Role Switcher */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar-sm" aria-hidden="true">
              {studentName ? studentName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-meta">
              <div className="user-name">{studentName}</div>
              <div className="user-role-label">Active Learner</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
            <button 
              type="button" 
              className={`btn btn-xs ${currentRole === 'student' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
              onClick={() => onRoleChange && onRoleChange('student')}
            >
              Learner
            </button>
            <button 
              type="button" 
              className={`btn btn-xs ${currentRole === 'mentor' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
              onClick={() => onRoleChange && onRoleChange('mentor')}
            >
              Mentor
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
