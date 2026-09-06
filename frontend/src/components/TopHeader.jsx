import React from 'react'

export default function TopHeader({ 
  onMenuToggle, 
  title, 
  subtitle, 
  students = [], 
  selectedStudentId, 
  onStudentChange,
  actions 
}) {
  return (
    <header className="top-header" role="banner">
      <div className="header-left">
        <button 
          type="button" 
          className="mobile-menu-toggle" 
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div>
          <h1 className="header-page-title">{title || 'Formative Feedback Assistant'}</h1>
          {subtitle && <div className="header-page-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header-right">
        {students && students.length > 0 && onStudentChange && (
          <div className="header-student-select-wrapper">
            <label htmlFor="topStudentSelector" className="visually-hidden">Active Learner</label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Learner:</span>
            <select
              id="topStudentSelector"
              className="header-student-select form-select"
              value={selectedStudentId || ''}
              onChange={(e) => onStudentChange(Number(e.target.value))}
              aria-label="Select active student"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {actions && <div className="header-actions">{actions}</div>}

        <div className="header-status-indicator" title="System Operational · SQLite Ready">
          <span className="live-indicator-dot" />
          <span className="live-indicator-label">AI Engine Ready</span>
        </div>
      </div>
    </header>
  )
}
