import React from 'react'

export default function KpiCard({ title, value, change, trend = 'neutral', subtitle, icon, badge }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {icon && <span className="kpi-icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="kpi-value-row">
        <div className="kpi-value">{value}</div>
        {badge && <span className="kpi-badge">{badge}</span>}
      </div>
      {(change !== undefined || subtitle) && (
        <div className="kpi-footer">
          {change !== undefined && (
            <span className={`kpi-trend trend-${trend}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {change}
            </span>
          )}
          {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
