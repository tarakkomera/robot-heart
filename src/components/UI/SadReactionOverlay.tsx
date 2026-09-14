import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { playSadSound, playClickSound } from '../../utils/sound'

interface SadReactionOverlayProps {
  isVisible: boolean
  onClose: () => void
  whatsappUrl?: string
  phoneNumber?: string
  autoSent?: boolean
  autoSentDetail?: string
}

interface SadEmojiParticle {
  id: number
  emoji: string
  left: number // percentage
  size: number // rem
  duration: number // seconds
  delay: number // seconds
  swayAmount: number // px
  rotation: number // deg
}

const SAD_EMOJIS = ['😢', '🥺', '💔', '😭', '🌧️', '🥀', '💧', '😔', '🖤', '🌧️', '🥺', '💔']

export function SadReactionOverlay({
  isVisible,
  onClose,
  whatsappUrl,
  phoneNumber,
  autoSent,
  autoSentDetail,
}: SadReactionOverlayProps) {
  useEffect(() => {
    if (isVisible) {
      playSadSound()
    }
  }, [isVisible])

  // Generate 40 falling/drifting sad & teardrop emojis
  const particles = useMemo<SadEmojiParticle[]>(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const emoji = SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)]
      const left = Math.random() * 94 + 3 // 3% to 97%
      const size = 1.6 + Math.random() * 2.2 // 1.6rem to 3.8rem
      const duration = 4 + Math.random() * 4.5 // 4s to 8.5s
      const delay = Math.random() * 3
      const swayAmount = (Math.random() - 0.5) * 60
      const rotation = (Math.random() - 0.5) * 40

      return {
        id: i,
        emoji,
        left,
        size,
        duration,
        delay,
        swayAmount,
        rotation,
      }
    })
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="sad-reaction-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Soft melancholy blue backdrop glow */}
        <div className="sad-backdrop-glow" />

        {/* Rain / Teardrops falling emojis */}
        <div className="sad-emojis-stream">
          {particles.map((p) => (
            <motion.div
              key={`sad-${p.id}`}
              className="falling-sad-emoji"
              style={{
                left: `${p.left}%`,
                fontSize: `${p.size}rem`,
              }}
              initial={{
                y: '-10vh',
                x: 0,
                opacity: 0,
                rotate: p.rotation,
              }}
              animate={{
                y: '110vh',
                x: [0, p.swayAmount, -p.swayAmount, 0],
                opacity: [0, 0.9, 0.9, 0],
                rotate: [p.rotation, p.rotation - 15, p.rotation + 15, p.rotation],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </div>

        {/* Central Sorry Text Message Box */}
        <motion.div
          className="sad-message-box"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 190 }}
        >
          <div className="sad-box-header">
            <span className="sad-badge">🌧️ RESPONSE: NOT READY</span>
            <span className="sad-hearts-line">💔 🥺 🌧️</span>
          </div>

          <h2 className="sad-title">I'M SO SORRY...</h2>

          <div className="sad-content-quote">
            <p className="sad-message-text">
              "It's completely okay. Holding this quiet moment gently in memory. The core remains open whenever you feel like coming back."
            </p>
          </div>

          <p className="sad-subhint">Your choice is respected with love and patience 🖤</p>

          {autoSent ? (
            <div className="auto-delivery-badge">
              <span>✅</span>
              <span>Response automatically dispatched to your WhatsApp {phoneNumber ? `(${phoneNumber})` : ''}!</span>
            </div>
          ) : autoSentDetail ? (
            <div className="auto-delivery-badge pending">
              <span>📲</span>
              <span>{autoSentDetail}</span>
            </div>
          ) : null}

          <div className="celebration-buttons-row">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-notify-btn sad-whatsapp-btn"
                onClick={() => playClickSound()}
              >
                📱 {autoSent ? 'OPEN IN WHATSAPP' : 'SEND TO MOBILE (WHATSAPP)'} {phoneNumber ? `· ${phoneNumber}` : ''} ➔
              </a>
            )}

            <button
              className="sad-dismiss-btn"
              onClick={() => {
                playClickSound()
                onClose()
              }}
            >
              I UNDERSTAND 💭
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
