import React from 'react'

export default function StatusBadge({ status, label, size = 'md' }) {
  const norm = (status || label || '').toLowerCase().replace(/\s+/g, '_')
  
  let variant = 'neutral'
  if (['approved', 'success', 'pass', 'passed', 'high', 'completed'].includes(norm)) {
    variant = 'success'
  } else if (['pending', 'in_progress', 'draft', 'medium', 'warning', 'needs_review'].includes(norm)) {
    variant = 'warning'
  } else if (['rejected', 'error', 'danger', 'fail', 'failed', 'high_impact', 'flagged'].includes(norm)) {
    variant = 'danger'
  } else if (['modified', 'info', 'active', 'low'].includes(norm)) {
    variant = 'info'
  }

  const displayText = label || (status ? status.replace(/_/g, ' ') : '')

  return (
    <span className={`status-badge status-badge-${variant} status-badge-${size}`}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-text">{displayText}</span>
    </span>
  )
}
