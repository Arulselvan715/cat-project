import React, { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    highImpactFlag: true,
    plagiarismSensitivity: 'medium',
    theme: 'light',
    feedbackLanguage: 'en',
    autoSaveDrafts: true,
  })

  const [saved, setSaved] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assistant Configuration & Settings</h1>
          <p className="page-subtitle">Configure formative evaluation parameters, notifications, and accessibility preferences.</p>
        </div>
        {saved && (
          <div className="page-actions">
            <span className="status-badge status-badge-success status-badge-md">
              ✓ Preferences Saved
            </span>
          </div>
        )}
      </div>

      <div className="grid-2-col">
        {/* Formative Feedback Parameters */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Feedback & Rubric Policy</h3>
              <p className="card-subtitle">Tune automated evaluation behavior</p>
            </div>
            <span className="badge-rule">Engine v2.0</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    High-Impact Mentor Oversight
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Always queue low scores and plagiarism signals for human approval
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highImpactFlag}
                  onChange={() => handleToggle('highImpactFlag')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Auto-Save Draft Progress
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Preserve text changes in browser session automatically
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSaveDrafts}
                  onChange={() => handleToggle('autoSaveDrafts')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="plagiarism-sensitivity">Plagiarism Sensitivity Threshold</label>
                <select
                  id="plagiarism-sensitivity"
                  className="form-control form-select"
                  value={settings.plagiarismSensitivity}
                  onChange={e => handleChange('plagiarismSensitivity', e.target.value)}
                >
                  <option value="low">Low — Flag only blatant identical strings</option>
                  <option value="medium">Medium — Standard n-gram and lecture slide overlap</option>
                  <option value="high">High — Conservative threshold with high mentor routing</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility & Notifications */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Accessibility & Environment</h3>
              <p className="card-subtitle">Display preferences and notification routing</p>
            </div>
            <span className="status-badge status-badge-info status-badge-sm">Preferences</span>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Queue Notifications
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Receive alerts when new high-impact items enter mentor queue
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={() => handleToggle('emailAlerts')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="ui-theme">Visual Interface Theme</label>
                <select
                  id="ui-theme"
                  className="form-control form-select"
                  value={settings.theme}
                  onChange={e => handleChange('theme', e.target.value)}
                >
                  <option value="light">Modern SaaS Light (Default)</option>
                  <option value="high-contrast">High-Contrast Light (WCAG AAA)</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="feedback-lang">Primary Feedback Language</label>
                <select
                  id="feedback-lang"
                  className="form-control form-select"
                  value={settings.feedbackLanguage}
                  onChange={e => handleChange('feedbackLanguage', e.target.value)}
                >
                  <option value="en">English (US/UK Standard)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
