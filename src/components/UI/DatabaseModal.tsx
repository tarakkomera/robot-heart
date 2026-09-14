import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { fetchDatabaseOverview, clearDatabaseTable, type DatabaseOverview } from '../../services/db'

interface DatabaseModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenMemoryBank: () => void
  onOpenSettings: () => void
}

type TabType = 'overview' | 'memories' | 'auth_settings' | 'responses' | 'confessions' | 'robot_state' | 'raw'

export function DatabaseModal({
  isOpen,
  onClose,
  onOpenMemoryBank,
  onOpenSettings,
}: DatabaseModalProps) {
  const [data, setData] = useState<DatabaseOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [clearing, setClearing] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchDatabaseOverview()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
      setSearchQuery('')
    }
  }, [isOpen])

  const handleCopyJson = () => {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = async (table: 'memories' | 'confessions' | 'proposal_responses') => {
    if (!confirm(`Are you sure you want to delete all records from '${table}'?`)) return
    setClearing(table)
    try {
      await clearDatabaseTable(table)
      await loadData()
    } finally {
      setClearing(null)
    }
  }

  // Filtered rows for current tab
  const filteredMemories = useMemo(() => {
    if (!data?.tables?.memories) return []
    if (!searchQuery.trim()) return data.tables.memories
    const q = searchQuery.toLowerCase()
    return data.tables.memories.filter((m: any) =>
      (m.label || '').toLowerCase().includes(q) ||
      (m.interaction_id || '').toLowerCase().includes(q) ||
      (m.emotion_triggered || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const filteredConfessions = useMemo(() => {
    if (!data?.tables?.confessions) return []
    if (!searchQuery.trim()) return data.tables.confessions
    const q = searchQuery.toLowerCase()
    return data.tables.confessions.filter((c: any) =>
      (c.author || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const filteredResponses = useMemo(() => {
    if (!data?.tables?.proposal_responses) return []
    if (!searchQuery.trim()) return data.tables.proposal_responses
    const q = searchQuery.toLowerCase()
    return data.tables.proposal_responses.filter((r: any) =>
      (r.user_name || '').toLowerCase().includes(q) ||
      (r.response || '').toLowerCase().includes(q) ||
      (r.delivery_status || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const filteredAuth = useMemo(() => {
    if (!data?.tables?.auth_settings) return []
    if (!searchQuery.trim()) return data.tables.auth_settings
    const q = searchQuery.toLowerCase()
    return data.tables.auth_settings.filter((a: any) =>
      (a.authorized_name || '').toLowerCase().includes(q) ||
      (a.phone_number || '').toLowerCase().includes(q) ||
      (a.secret_message || '').toLowerCase().includes(q) ||
      (a.whatsapp_provider || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const totalRecords = data
    ? (data.counts.memories || 0) +
      (data.counts.confessions || 0) +
      (data.counts.proposal_responses || 0) +
      (data.counts.auth_settings || 0) +
      (data.counts.robot_state || 0)
    : 0

  if (!isOpen) return null

  return (
    <div className="modal-backdrop database-backdrop" onClick={onClose}>
      <motion.div
        className="modal-content database-modal"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="modal-header db-inspector-header">
          <div className="header-title">
            <span className="db-badge live-db-badge">
              <span className="db-pulse-dot" /> SQLITE 3 / LIVE
            </span>
            <div>
              <h2>DATABASE OPERATIONS</h2>
              <span className="db-subinfo">
                FILE: <code className="db-code-chip">{data?.databaseFile || 'robot_heart.db'}</code> • {totalRecords} TOTAL ROWS
              </span>
            </div>
          </div>

          <div className="db-header-actions">
            <button
              className="db-quick-nav-btn"
              title="Open full interactive Memory Bank"
              onClick={onOpenMemoryBank}
            >
              🗄️ Memory Bank ↗
            </button>
            <button
              className="db-quick-nav-btn"
              title="Configure Mobile Alerts & WhatsApp Dispatch"
              onClick={onOpenSettings}
            >
              📱 Mobile Alerts ↗
            </button>
            <button
              className="db-refresh-btn"
              onClick={loadData}
              disabled={loading}
              title="Refresh database records"
            >
              🔄 {loading ? 'Syncing...' : 'Refresh'}
            </button>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="db-nav-tabs">
          <button
            className={`db-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'memories' ? 'active' : ''}`}
            onClick={() => setActiveTab('memories')}
          >
            🗄️ Memories <span className="tab-badge">{data?.counts.memories ?? 0}</span>
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'auth_settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth_settings')}
          >
            📱 Mobile & Auth <span className="tab-badge">{data?.counts.auth_settings ?? 0}</span>
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'responses' ? 'active' : ''}`}
            onClick={() => setActiveTab('responses')}
          >
            💍 Responses <span className="tab-badge">{data?.counts.proposal_responses ?? 0}</span>
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'confessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('confessions')}
          >
            💬 Confessions <span className="tab-badge">{data?.counts.confessions ?? 0}</span>
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'robot_state' ? 'active' : ''}`}
            onClick={() => setActiveTab('robot_state')}
          >
            🤖 Robot State <span className="tab-badge">{data?.counts.robot_state ?? 0}</span>
          </button>
          <button
            className={`db-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            💻 Raw JSON
          </button>
        </nav>

        {/* Tab Content */}
        <div className="db-modal-body">
          {loading && !data ? (
            <div className="db-loading-state">
              <p className="loading-text">Connecting to SQLite database...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="db-overview-grid">
                  <div className="db-stat-card">
                    <span className="stat-label">SQLite Engine</span>
                    <span className="stat-value highlight-cyan">DatabaseSync</span>
                    <span className="stat-sub">node:sqlite persistent local storage</span>
                  </div>

                  <div className="db-stat-card" onClick={() => setActiveTab('memories')}>
                    <span className="stat-label">Logged Memories</span>
                    <span className="stat-value highlight-yellow">{data?.counts.memories ?? 0}</span>
                    <span className="stat-sub">Click to inspect table rows →</span>
                  </div>

                  <div className="db-stat-card" onClick={() => setActiveTab('responses')}>
                    <span className="stat-label">Proposal Answers</span>
                    <span className="stat-value highlight-pink">{data?.counts.proposal_responses ?? 0}</span>
                    <span className="stat-sub">User responses recorded →</span>
                  </div>

                  <div className="db-stat-card" onClick={() => setActiveTab('auth_settings')}>
                    <span className="stat-label">Mobile Dispatch Target</span>
                    <span className="stat-value highlight-green">
                      {data?.tables.auth_settings?.[0]?.phone_number ? `+${data.tables.auth_settings[0].phone_number}` : 'None Set'}
                    </span>
                    <span className="stat-sub">
                      Provider: {data?.tables.auth_settings?.[0]?.whatsapp_provider?.toUpperCase() || 'CALLMEBOT'}
                    </span>
                  </div>

                  {/* Relocated Quick Launchers */}
                  <div className="db-features-launcher">
                    <div className="launcher-box">
                      <div className="launcher-info">
                        <h3>🗄️ Interactive Memory Bank</h3>
                        <p>
                          Explore robot memory logs, interaction points, energy levels, and timeline cards.
                        </p>
                      </div>
                      <button className="db-launcher-btn" onClick={onOpenMemoryBank}>
                        Launch Memory Bank ↗
                      </button>
                    </div>

                    <div className="launcher-box">
                      <div className="launcher-info">
                        <h3>📱 Mobile Alerts & WhatsApp Dispatch</h3>
                        <p>
                          Configure recipient phone numbers, instant automated WhatsApp notifications (CallMeBot, Twilio, Webhook), and test delivery.
                        </p>
                      </div>
                      <button className="db-launcher-btn highlight" onClick={onOpenSettings}>
                        Configure Mobile Alerts ↗
                      </button>
                    </div>
                  </div>

                  {/* Latest Robot State Preview */}
                  {data?.tables.robot_state?.[0] && (
                    <div className="db-state-summary-banner">
                      <span className="state-pill">CURRENT ROBOT EMOTION: {data.tables.robot_state[0].emotion?.toUpperCase()}</span>
                      <p className="state-message-quote">"{data.tables.robot_state[0].message}"</p>
                      <span className="state-time">Last update: {data.tables.robot_state[0].updated_at}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEMORIES */}
              {activeTab === 'memories' && (
                <div className="db-table-view">
                  <div className="db-table-toolbar">
                    <input
                      type="text"
                      className="db-search-input"
                      placeholder="Search memories by label, interaction, emotion..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="db-table-actions">
                      <button className="db-inline-action-btn" onClick={onOpenMemoryBank}>
                        🗄️ Full Memory Modal ↗
                      </button>
                      <button
                        className="db-inline-danger-btn"
                        onClick={() => handleClear('memories')}
                        disabled={clearing === 'memories' || filteredMemories.length === 0}
                      >
                        {clearing === 'memories' ? 'Clearing...' : 'Clear Table'}
                      </button>
                    </div>
                  </div>

                  {filteredMemories.length === 0 ? (
                    <div className="db-empty-notice">No matching memories found in database.</div>
                  ) : (
                    <div className="db-table-wrapper">
                      <table className="db-data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>INTERACTION</th>
                            <th>LABEL</th>
                            <th>EMOTION</th>
                            <th>ENERGY</th>
                            <th>TIMESTAMP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMemories.map((row: any) => (
                            <tr key={row.id}>
                              <td className="mono-cell">#{row.id}</td>
                              <td><span className="interaction-tag">{row.interaction_id}</span></td>
                              <td className="bold-cell">{row.label}</td>
                              <td><span className="emotion-pill">{row.emotion_triggered?.toUpperCase()}</span></td>
                              <td className="mono-cell highlight-yellow">+{row.energy_gained}</td>
                              <td className="time-cell">{row.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AUTH & MOBILE ALERTS */}
              {activeTab === 'auth_settings' && (
                <div className="db-table-view">
                  <div className="db-table-toolbar">
                    <input
                      type="text"
                      className="db-search-input"
                      placeholder="Search auth configs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="db-inline-action-btn" onClick={onOpenSettings}>
                      📱 Configure Mobile Alerts ↗
                    </button>
                  </div>

                  {filteredAuth.length === 0 ? (
                    <div className="db-empty-notice">No auth settings found.</div>
                  ) : (
                    <div className="db-table-wrapper">
                      <table className="db-data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>AUTHORIZED NAME</th>
                            <th>PHONE NUMBER</th>
                            <th>PROVIDER</th>
                            <th>SECRET MESSAGE PREVIEW</th>
                            <th>WEBHOOK / API DETAILS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAuth.map((row: any) => (
                            <tr key={row.id}>
                              <td className="mono-cell">#{row.id}</td>
                              <td className="bold-cell highlight-cyan">{row.authorized_name}</td>
                              <td className="mono-cell highlight-green">{row.phone_number ? `+${row.phone_number}` : 'None'}</td>
                              <td><span className="provider-tag">{(row.whatsapp_provider || 'callmebot').toUpperCase()}</span></td>
                              <td className="preview-cell" title={row.secret_message}>
                                {row.secret_message ? (row.secret_message.length > 55 ? row.secret_message.substring(0, 55) + '...' : row.secret_message) : 'None'}
                              </td>
                              <td className="mono-cell sub-cell">
                                {row.webhook_url ? `Webhook: ${row.webhook_url.substring(0, 25)}...` : (row.whatsapp_api_key ? `API Key: ${row.whatsapp_api_key.substring(0, 10)}...` : 'Default')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PROPOSAL RESPONSES */}
              {activeTab === 'responses' && (
                <div className="db-table-view">
                  <div className="db-table-toolbar">
                    <input
                      type="text"
                      className="db-search-input"
                      placeholder="Search proposal responses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      className="db-inline-danger-btn"
                      onClick={() => handleClear('proposal_responses')}
                      disabled={clearing === 'proposal_responses' || filteredResponses.length === 0}
                    >
                      {clearing === 'proposal_responses' ? 'Clearing...' : 'Clear Table'}
                    </button>
                  </div>

                  {filteredResponses.length === 0 ? (
                    <div className="db-empty-notice">No proposal responses recorded yet. When the user responds YES/NO, it logs here immediately.</div>
                  ) : (
                    <div className="db-table-wrapper">
                      <table className="db-data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>USER NAME</th>
                            <th>RESPONSE</th>
                            <th>DELIVERY STATUS</th>
                            <th>TIMESTAMP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResponses.map((row: any) => (
                            <tr key={row.id}>
                              <td className="mono-cell">#{row.id}</td>
                              <td className="bold-cell">{row.user_name}</td>
                              <td>
                                <span className={`response-pill ${row.response === 'yes' ? 'yes' : 'no'}`}>
                                  {row.response === 'yes' ? '💖 YES' : '💔 NO'}
                                </span>
                              </td>
                              <td className="mono-cell sub-cell">
                                {row.delivery_status || 'Pending / Legacy'}
                              </td>
                              <td className="time-cell">{row.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CONFESSIONS */}
              {activeTab === 'confessions' && (
                <div className="db-table-view">
                  <div className="db-table-toolbar">
                    <input
                      type="text"
                      className="db-search-input"
                      placeholder="Search confessions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      className="db-inline-danger-btn"
                      onClick={() => handleClear('confessions')}
                      disabled={clearing === 'confessions' || filteredConfessions.length === 0}
                    >
                      {clearing === 'confessions' ? 'Clearing...' : 'Clear Table'}
                    </button>
                  </div>

                  {filteredConfessions.length === 0 ? (
                    <div className="db-empty-notice">No confessions submitted yet. Use 'Speak to Heart' to add one.</div>
                  ) : (
                    <div className="db-table-wrapper">
                      <table className="db-data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>AUTHOR</th>
                            <th>CONFESSION</th>
                            <th>RESONANCE</th>
                            <th>CREATED AT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredConfessions.map((row: any) => (
                            <tr key={row.id}>
                              <td className="mono-cell">#{row.id}</td>
                              <td className="bold-cell highlight-pink">{row.author}</td>
                              <td className="quote-cell">"{row.message}"</td>
                              <td className="mono-cell highlight-yellow">{row.resonance_score}%</td>
                              <td className="time-cell">{row.created_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: ROBOT STATE */}
              {activeTab === 'robot_state' && (
                <div className="db-table-view">
                  <div className="db-table-wrapper">
                    <table className="db-data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>EMOTION</th>
                          <th>ENERGY LEVEL</th>
                          <th>MESSAGE</th>
                          <th>UPDATED AT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.tables?.robot_state || []).map((row: any) => (
                          <tr key={row.id}>
                            <td className="mono-cell">#{row.id}</td>
                            <td><span className="emotion-pill">{row.emotion?.toUpperCase()}</span></td>
                            <td className="mono-cell highlight-cyan">{row.energy_level}%</td>
                            <td className="preview-cell">{row.message}</td>
                            <td className="time-cell">{row.updated_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: RAW JSON */}
              {activeTab === 'raw' && (
                <div className="db-raw-view">
                  <div className="db-raw-toolbar">
                    <span className="raw-stats-tag">{totalRecords} records rendered in JSON</span>
                    <button className="db-copy-btn" onClick={handleCopyJson}>
                      {copied ? '✓ Copied to Clipboard!' : '📋 Copy Entire Database JSON'}
                    </button>
                  </div>
                  <pre className="db-json-block">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
