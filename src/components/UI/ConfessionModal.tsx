import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchConfessions, saveConfession, type ConfessionRecord } from '../../services/db'

interface ConfessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfessionSubmitted: (message: string) => void
}

export function ConfessionModal({ isOpen, onClose, onConfessionSubmitted }: ConfessionModalProps) {
  const [author, setAuthor] = useState('')
  const [message, setMessage] = useState('')
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConfessions().then(setConfessions)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    const updated = await saveConfession({
      author: author.trim() || 'Anonymous',
      message: message.trim(),
      resonance_score: Math.floor(Math.random() * 30) + 70,
    })

    setConfessions(updated)
    onConfessionSubmitted(message.trim())
    setMessage('')
    setIsSubmitting(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-content confession-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="header-title">
            <span className="db-badge">HEART DATABASE</span>
            <h2>SPEAK TO THE HEART</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="confession-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Type a message or thought to store in the robotic heart..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
              className="textarea-field"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'SAVING TO DB...' : 'TRANSMIT TO HEART ➔'}
          </button>
        </form>

        <div className="previous-confessions">
          <h3>RECENT CONFESSIONS IN DATABASE</h3>
          <div className="confession-scroll">
            {confessions.length === 0 ? (
              <p className="empty-text">No messages recorded in database yet.</p>
            ) : (
              confessions.map((c, i) => (
                <div key={c.id || i} className="confession-item">
                  <div className="confession-author-row">
                    <span className="author-name">{c.author}</span>
                    <span className="resonance-badge">Resonance {c.resonance_score}%</span>
                  </div>
                  <p className="confession-body">"{c.message}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
