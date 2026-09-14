import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { playUnlockSound, playHeartPulseSound, playClickSound } from '../../utils/sound'

interface LoveCelebrationOverlayProps {
  isVisible: boolean
  onClose?: () => void
  whatsappUrl?: string
  phoneNumber?: string
  autoSent?: boolean
  autoSentDetail?: string
}

interface FloatingEmoji {
  id: number
  emoji: string
  left: number // percentage 0-100
  size: number // rem
  duration: number // seconds
  delay: number // seconds
  swayAmount: number // px
  rotation: number // deg
}

interface GridEmoji {
  id: number
  emoji: string
  xPercent: number
  yPercent: number
  scale: number
  delay: number
}

// Blushing happy face emojis and love emojis as requested by user
const FLOATING_EMOJIS = ['😊', '🥰', '☺️', '🥹', '😳', '😍', '💖', '💕', '💗', '💓', '💘', '🌹', '✨']
const BURST_LOVE_EMOJIS = ['💖', '💕', '❤️', '💗', '💓', '💞', '💘', '🌹', '✨', '😍', '🥰']

export function LoveCelebrationOverlay({
  isVisible,
  onClose,
  whatsappUrl,
  phoneNumber,
  autoSent,
  autoSentDetail,
}: LoveCelebrationOverlayProps) {
  const [showFullGridBurst, setShowFullGridBurst] = useState(true)

  useEffect(() => {
    if (isVisible) {
      setShowFullGridBurst(true)
      // Play celebratory sound effects
      playUnlockSound()
      setTimeout(() => playHeartPulseSound(), 400)
      setTimeout(() => playUnlockSound(), 800)

      // Initial full-screen love emoji grid burst displays for 3s
      const burstTimer = setTimeout(() => {
        setShowFullGridBurst(false)
      }, 3000)

      return () => clearTimeout(burstTimer)
    }
  }, [isVisible])

  // Generate full-screen love emoji grid/burst positions
  const gridEmojis = useMemo<GridEmoji[]>(() => {
    const items: GridEmoji[] = []
    const cols = 8
    const rows = 6
    let count = 0

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xPercent = (c / (cols - 1)) * 90 + (Math.random() * 8 - 4) + 5
        const yPercent = (r / (rows - 1)) * 88 + (Math.random() * 8 - 4) + 6
        const emoji = BURST_LOVE_EMOJIS[Math.floor(Math.random() * BURST_LOVE_EMOJIS.length)]
        const scale = 1.2 + Math.random() * 1.6
        const delay = Math.random() * 0.4

        items.push({ id: count++, emoji, xPercent, yPercent, scale, delay })
      }
    }
    return items
  }, [])

  // Generate 50 floating blushing faces moving upward from bottom to top
  const floatingEmojis = useMemo<FloatingEmoji[]>(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const emoji = FLOATING_EMOJIS[Math.floor(Math.random() * FLOATING_EMOJIS.length)]
      const left = Math.random() * 94 + 3 // 3% to 97%
      const size = 1.8 + Math.random() * 2.2 // 1.8rem to 4rem
      const duration = 3.8 + Math.random() * 4.2 // 3.8s to 8s
      const delay = Math.random() * 3.5 // 0s to 3.5s delay
      const swayAmount = (Math.random() - 0.5) * 80 // -40px to +40px horizontal sway
      const rotation = (Math.random() - 0.5) * 45 // -22.5 deg to +22.5 deg

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
        className="love-celebration-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Warm romantic backdrop radial glow */}
        <div className="love-backdrop-glow" />

        {/* PHASE 1: Full Screen Love Emoji Burst */}
        <AnimatePresence>
          {showFullGridBurst && (
            <motion.div
              className="love-grid-burst-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
              transition={{ duration: 0.8 }}
            >
              {gridEmojis.map((item) => (
                <motion.div
                  key={`grid-${item.id}`}
                  className="grid-love-emoji"
                  style={{
                    left: `${item.xPercent}%`,
                    top: `${item.yPercent}%`,
                    fontSize: `${item.scale}rem`,
                  }}
                  initial={{ scale: 0, opacity: 0, rotate: (Math.random() - 0.5) * 60 }}
                  animate={{
                    scale: [0, item.scale * 1.35, item.scale],
                    opacity: [0, 1, 0.95],
                    rotate: [0, (Math.random() - 0.5) * 30, 0],
                  }}
                  transition={{
                    duration: 0.7,
                    delay: item.delay,
                    ease: 'backOut',
                  }}
                >
                  {item.emoji}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 2: Floating Happy Faces with Blushing Emojis Rising from Down to Top */}
        <div className="floating-emojis-stream">
          {floatingEmojis.map((item) => (
            <motion.div
              key={`float-${item.id}`}
              className="floating-blushing-emoji"
              style={{
                left: `${item.left}%`,
                fontSize: `${item.size}rem`,
              }}
              initial={{
                y: '105vh',
                x: 0,
                opacity: 0,
                rotate: item.rotation,
              }}
              animate={{
                y: '-115vh',
                x: [0, item.swayAmount, -item.swayAmount, 0],
                opacity: [0, 1, 1, 0.9, 0],
                rotate: [item.rotation, item.rotation + 20, item.rotation - 20, item.rotation],
              }}
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </div>

        {/* CENTRAL LOVE MESSAGE BOX */}
        <motion.div
          className="love-message-box"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 190 }}
        >
          <div className="love-box-header">
            <span className="love-badge">💖 CONNECTION ACCEPTED</span>
            <span className="love-hearts-line">🥰 💖 🌸 ✨ 💖 😊</span>
          </div>

          <h2 className="love-title">OUR HEARTS ARE SYNCHRONIZED!</h2>

          <div className="love-content-quote">
            <p className="love-message-text">
              "Thank you for accepting this connection! Every beat of this robotic heart now belongs to you. Our souls are forever synchronized in perfect harmony."
            </p>
          </div>

          <p className="love-subhint">Heart energy levels reached maximum 100% capacity! ✨💖</p>

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
                className="whatsapp-notify-btn"
                onClick={() => playClickSound()}
              >
                📱 {autoSent ? 'OPEN IN WHATSAPP' : 'SEND TO MOBILE (WHATSAPP)'} {phoneNumber ? `· ${phoneNumber}` : ''} ➔
              </a>
            )}

            {onClose && (
              <button
                className="love-dismiss-btn"
                onClick={() => {
                  playClickSound()
                  onClose()
                }}
              >
                KEEP SYNCHRONIZED 💖
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
