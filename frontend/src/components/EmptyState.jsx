import React from 'react'

export default function EmptyState({ icon = '📭', title = 'No Data Found', description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: '0.75rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
