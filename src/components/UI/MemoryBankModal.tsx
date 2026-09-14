import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchMemories, type MemoryRecord } from '../../services/db'

interface MemoryBankModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MemoryBankModal({ isOpen, onClose }: MemoryBankModalProps) {
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchMemories().then((data) => {
        setMemories(data)
        setLoading(false)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-content memory-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="header-title">
            <span className="db-badge">SQLITE DB</span>
            <h2>MEMORY BANK</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {loading ? (
            <p className="loading-text">Accessing database records...</p>
          ) : memories.length === 0 ? (
            <div className="empty-state">
              <p>No memories logged in database yet.</p>
              <span className="hint-sub">Interact with the signal, memory, or heart orbs to log your first memory.</span>
            </div>
          ) : (
            <ul className="memory-list">
              {memories.map((mem, idx) => (
                <li key={mem.id || idx} className="memory-card">
                  <div className="memory-meta">
                    <span className="interaction-tag">{mem.label || mem.interaction_id}</span>
                    <span className="emotion-pill">{mem.emotion_triggered?.toUpperCase()}</span>
                    <span className="energy-gain">+{mem.energy_gained} PTS</span>
                  </div>
                  <time className="memory-time">
                    {mem.timestamp ? new Date(mem.timestamp).toLocaleString() : 'Just now'}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  )
}
