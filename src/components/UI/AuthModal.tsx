import { motion } from 'framer-motion'
import { useState } from 'react'
import { authenticateUser, type AuthResponse } from '../../services/db'
import { playUnlockSound, playClickSound } from '../../utils/sound'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (secretMessage: string, name: string) => void
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [name, setName] = useState('')
  const [result, setResult] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    const response = await authenticateUser(name.trim())
    setResult(response)
    setIsLoading(false)

    if (response.authenticated && response.secretMessage) {
      playUnlockSound()
      onAuthSuccess(response.secretMessage, response.authorizedName || name)
    } else {
      playClickSound()
    }
  }

  const handleReset = () => {
    playClickSound()
    setName('')
    setResult(null)
  }

  return (
    <div className="modal-backdrop api-backdrop" onClick={onClose}>
      <motion.div
        className="modal-content auth-modal"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="header-title">
            <span className="db-badge auth-badge secret-modal-badge">💌 SPECIAL FOR YOU</span>
            <h2>UNLOCK SECRET MESSAGE</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {!result ? (
          <form onSubmit={handleAuth} className="auth-form">
            <p className="auth-instruction">
              Someone special left an encrypted romantic confession in this robot's heart. Enter your name below to unlock and reveal it:
            </p>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter your name (e.g. HimaVarshini)..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="input-field auth-input secret-name-input"
              />
            </div>
            <button type="submit" disabled={isLoading} className="submit-btn auth-submit-btn secret-reveal-btn">
              {isLoading ? 'UNLOCKING SECRET MESSAGE...' : 'REVEAL SECRET MESSAGE 💌 ➔'}
            </button>
          </form>
        ) : (
          <div className={`auth-result-container ${result.authenticated ? 'success' : 'denied'}`}>
            {result.authenticated ? (
              <div className="unlocked-box">
                <div className="auth-status-badge success-badge">
                  🔓 SECRET MESSAGE UNLOCKED · IDENTITY VERIFIED
                </div>
                <h3>SECRET CORE MESSAGE UNLOCKED</h3>
                <blockquote className="secret-quote">
                  "{result.secretMessage}"
                </blockquote>
                <button className="submit-btn" onClick={onClose}>
                  CONTINUE TO EXPERIENCE ➔
                </button>
              </div>
            ) : (
              <div className="denied-box">
                <div className="auth-status-badge denied-badge">
                  🔒 ENCRYPTED MESSAGE · NAME MISMATCH
                </div>
                <p className="status-text">{result.statusMessage || 'This secret message was written for someone special. Try your first name or nickname.'}</p>
                <div className="default-regular-box">
                  <span className="default-label">DEFAULT REGULAR MESSAGE:</span>
                  <p className="default-msg">
                    "A quiet world is ready to be explored. Enter the authorized name to reveal the secret confession."
                  </p>
                </div>
                <button className="db-btn" onClick={handleReset}>
                  TRY ANOTHER NAME ↺
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
