import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { playHeartPulseSound, playClickSound } from '../../utils/sound'

interface SecretUnlockedPanelProps {
  userName: string
  secretMessage: string
  onRespondYes: () => void
  onRespondNo: () => void
  onClose: () => void
}

export function SecretUnlockedPanel({
  userName,
  secretMessage,
  onRespondYes,
  onRespondNo,
  onClose,
}: SecretUnlockedPanelProps) {
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)

  // Separate letter paragraphs from the proposal question
  const { letterParagraphs } = useMemo(() => {
    if (!secretMessage) {
      return { letterParagraphs: [] }
    }

    const raw = secretMessage.trim()
    const marryRegex = /will\s+you\s+marry\s+me[\s\S]*$/i
    const match = raw.match(marryRegex)
    const letterBody = match ? raw.replace(marryRegex, '').trim() : raw

    const paragraphs = letterBody
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    return { letterParagraphs: paragraphs }
  }, [secretMessage])

  const handleYes = () => {
    setResponse('yes')
    playHeartPulseSound()
    onRespondYes()
  }

  const handleNo = () => {
    setResponse('no')
    playClickSound()
    onRespondNo()
  }

  return (
    <motion.div
      className="secret-right-panel"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
    >
      <div className="panel-header">
        <span className="unlocked-badge">💌 SECRET CONFESSION UNLOCKED</span>
        <h2>FOR {userName.toUpperCase()} 💖</h2>
      </div>

      <div className="message-content-box">
        <div className="letter-header-tag">
          <span className="quill-icon">🖋️</span>
          <span>WRITTEN DIRECTLY FROM THE HEART</span>
          <span className="scroll-indicator-pill">📜 SCROLL TO READ FULL LETTER 👇</span>
        </div>

        <div className="letter-paragraphs-wrapper">
          {letterParagraphs.map((para, idx) => (
            <p key={idx} className="confession-letter-para">
              {para}
            </p>
          ))}
        </div>

        {/* Prominently Highlighted 'Will You Marry Me?' Card */}
        <div className="proposal-highlight-card">
          <div className="ring-sparkle-container">
            <span className="sparkle-ring">💍</span>
          </div>
          <div className="proposal-badge-line">
            <span>✨ AN ETERNAL QUESTION ✨</span>
          </div>
          <h1 className="proposal-highlight-heading">
            Will you marry me?
          </h1>
          <p className="proposal-highlight-subtext">
            Nee decision edhi aina sare I respect that completely. Will you hold my hand through this journey?
          </p>
        </div>
      </div>

      {!response ? (
        <div className="response-section">
          <p className="response-prompt">Choose your answer from the heart:</p>
          <div className="response-buttons">
            <button className="response-btn yes-btn" onClick={handleYes}>
              YES, I WILL! 💖 💍
            </button>
            <button className="response-btn no-btn" onClick={handleNo}>
              NO 💭
            </button>
          </div>
        </div>
      ) : (
        <div className={`response-result ${response}`}>
          {response === 'yes' ? (
            <div className="yes-confirmation">
              <span className="confirm-badge yes-badge">💖 RESPONSE: YES! 💍</span>
              <p className="confirm-msg">
                Our hearts are now synchronized in perfect harmony. Every heartbeat in this world was created just for you. I will cherish you forever.
              </p>
            </div>
          ) : (
            <div className="no-confirmation">
              <span className="confirm-badge no-badge">💭 RESPONSE: NO</span>
              <p className="confirm-msg">
                Nee decision edhi aina sare I respect that completely. Thank you for reading my confession with patience and grace.
              </p>
            </div>
          )}
        </div>
      )}

      <button className="close-panel-btn" onClick={() => { playClickSound(); onClose(); }}>
        RETURN TO EXPERIENCE ➔
      </button>
    </motion.div>
  )
}
