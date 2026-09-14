import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { DynamicIsland } from './components/DynamicIsland/DynamicIsland'
import { InteractionDock } from './components/UI/InteractionDock'
import { LoadingScreen } from './components/UI/LoadingScreen'
import { MemoryBankModal } from './components/UI/MemoryBankModal'
import { ConfessionModal } from './components/UI/ConfessionModal'
import { AuthModal } from './components/UI/AuthModal'
import { SecretUnlockedPanel } from './components/UI/SecretUnlockedPanel'
import { LoveCelebrationOverlay } from './components/UI/LoveCelebrationOverlay'
import { SadReactionOverlay } from './components/UI/SadReactionOverlay'
import { SettingsModal } from './components/UI/SettingsModal'
import { DatabaseModal } from './components/UI/DatabaseModal'
import { introInteractions, openingLines, type StoryInteraction } from './data/story'
import { SceneManager } from './scenes/SceneManager'
import { transitionRobotEmotion, type InteractionId, type IslandMode, type RobotEmotion } from './state/experienceStore'
import { fetchRobotState, saveRobotState, saveMemory, recordProposalResponse } from './services/db'

export default function App() {
  const [ready, setReady] = useState(false)
  const [islandMode, setIslandMode] = useState<IslandMode>('collapsed')
  const [emotion, setEmotion] = useState<RobotEmotion>('idle')
  const [emotionLevel, setEmotionLevel] = useState(0)
  const [message, setMessage] = useState('A quiet world is ready to be explored.')
  
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false)
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false)
  const [isConfessionModalOpen, setIsConfessionModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [showLoveCelebration, setShowLoveCelebration] = useState(false)
  const [showSadReaction, setShowSadReaction] = useState(false)
  const [notificationData, setNotificationData] = useState<{
    whatsappUrl: string
    phoneNumber: string
    autoSent?: boolean
    autoSentDetail?: string
  } | null>(null)

  // Current Session Authentication State (Resets on page refresh)
  const [sessionAuth, setSessionAuth] = useState<{
    isAuthenticated: boolean
    userName: string
    secretMessage: string
  } | null>(null)

  // Tracks whether the unlocked secret panel is currently visible on screen
  const [isSecretViewOpen, setIsSecretViewOpen] = useState(false)

  // Load initial state from Database
  useEffect(() => {
    fetchRobotState().then((dbState) => {
      if (dbState) {
        setEmotion((dbState.emotion as RobotEmotion) || 'idle')
        setEmotionLevel(dbState.energy_level || 0)
        if (dbState.message) setMessage(dbState.message)
      }
    })
    const timer = window.setTimeout(() => setReady(true), 2100)
    return () => window.clearTimeout(timer)
  }, [])

  const selectInteraction = useCallback((interaction: StoryInteraction) => {
    const nextEmotion = transitionRobotEmotion(emotion, interaction.id)
    const nextLevel = Math.min(100, emotionLevel + interaction.energy)
    const nextMessage = openingLines[interaction.id]

    setEmotion(nextEmotion)
    setEmotionLevel(nextLevel)
    setMessage(nextMessage)
    setIslandMode('expanded')

    saveRobotState({
      emotion: nextEmotion,
      energy_level: nextLevel,
      message: nextMessage,
    })

    saveMemory({
      interaction_id: interaction.id,
      label: interaction.label,
      emotion_triggered: nextEmotion,
      energy_gained: interaction.energy,
    })
  }, [emotion, emotionLevel])

  const selectInteractionById = useCallback((id: InteractionId) => {
    const interaction = introInteractions.find((item) => item.id === id)
    if (interaction) selectInteraction(interaction)
  }, [selectInteraction])

  const handleConfessionSubmitted = useCallback((text: string) => {
    setMessage(`"${text}"`)
    setEmotion('warm')
    setEmotionLevel((prev) => Math.min(100, prev + 25))
    setIslandMode('expanded')
  }, [])

  const handleAuthSuccess = useCallback((secretMessage: string, userName: string) => {
    setSessionAuth({
      isAuthenticated: true,
      userName,
      secretMessage,
    })
    setIsSecretViewOpen(true)
    setIsAuthModalOpen(false)
    setEmotion('excited')
    setEmotionLevel(100)
    setMessage(`Welcome, ${userName}. Your presence has awakened the heart.`)
  }, [])

  const handleOpenAuthOrSecret = useCallback(() => {
    if (sessionAuth?.isAuthenticated) {
      setIsSecretViewOpen(true)
    } else {
      setIsAuthModalOpen(true)
    }
  }, [sessionAuth])

  const handleRespondYes = useCallback(() => {
    const nextEmotion: RobotEmotion = 'warm'
    const nextLevel = 100
    const msg = 'Our hearts are now synchronized in perfect harmony. Every beat is yours.'
    const userName = sessionAuth?.userName || 'Alex'

    setEmotion(nextEmotion)
    setEmotionLevel(nextLevel)
    setMessage(msg)
    setShowLoveCelebration(true)
    setShowSadReaction(false)

    // Prepare window reference synchronously to prevent popup blocker
    let popup: Window | null = null
    try {
      popup = window.open('about:blank', '_blank')
    } catch {}

    // Save to Database and dispatch WhatsApp / Mobile notification automatically
    recordProposalResponse(userName, 'yes').then((res) => {
      setNotificationData({
        whatsappUrl: res.whatsappUrl,
        phoneNumber: res.phoneNumber,
        autoSent: res.autoSent,
        autoSentDetail: res.autoSentDetail,
      })
      if (res.autoSent) {
        popup?.close()
      } else if (res.whatsappUrl && res.phoneNumber && popup) {
        popup.location.href = res.whatsappUrl
      }
    })

    saveRobotState({
      emotion: nextEmotion,
      energy_level: nextLevel,
      message: msg,
    })

    saveMemory({
      interaction_id: 'heart',
      label: 'RESPONSE: YES 💖',
      emotion_triggered: nextEmotion,
      energy_gained: 50,
    })
  }, [sessionAuth])

  const handleRespondNo = useCallback(() => {
    const nextEmotion: RobotEmotion = 'curious'
    const nextLevel = Math.min(100, emotionLevel + 15)
    const msg = 'Holding this moment gently in memory. The core remains open whenever you return.'
    const userName = sessionAuth?.userName || 'Alex'

    setEmotion(nextEmotion)
    setEmotionLevel(nextLevel)
    setMessage(msg)
    setShowLoveCelebration(false)
    setShowSadReaction(true)

    // Prepare window reference synchronously to prevent popup blocker
    let popup: Window | null = null
    try {
      popup = window.open('about:blank', '_blank')
    } catch {}

    // Save to Database and dispatch WhatsApp / Mobile notification automatically
    recordProposalResponse(userName, 'no').then((res) => {
      setNotificationData({
        whatsappUrl: res.whatsappUrl,
        phoneNumber: res.phoneNumber,
        autoSent: res.autoSent,
        autoSentDetail: res.autoSentDetail,
      })
      if (res.autoSent) {
        popup?.close()
      } else if (res.whatsappUrl && res.phoneNumber && popup) {
        popup.location.href = res.whatsappUrl
      }
    })

    saveRobotState({
      emotion: nextEmotion,
      energy_level: nextLevel,
      message: msg,
    })

    saveMemory({
      interaction_id: 'memory',
      label: 'RESPONSE: NO 💭',
      emotion_triggered: nextEmotion,
      energy_gained: 15,
    })
  }, [emotionLevel, sessionAuth])

  const isApiActive = isSecretViewOpen || isAuthModalOpen

  return (
    <main className="experience">
      <Canvas shadows camera={{ position: [0, 1.6, 7], fov: 42 }} dpr={[1, 1.75]}>
        <SceneManager
          emotion={emotion}
          onInteraction={selectInteractionById}
          isSecretUnlocked={isApiActive}
        />
      </Canvas>

      <div className="overlay">
        <DynamicIsland
          mode={islandMode}
          emotion={emotion}
          emotionLevel={emotionLevel}
          onToggle={() => setIslandMode((mode) => (mode === 'collapsed' ? 'expanded' : 'collapsed'))}
        />

        {!isApiActive && (
          <section className="intro-copy">
            <p className="eyebrow">A SMALL WORLD, BUILT FOR YOU</p>
            <h1>
              MY<br />
              <em>ROBOTIC</em> HEART.
            </h1>
            <p className="hint">{message}</p>
          </section>
        )}

        {!isApiActive && (
          <InteractionDock interactions={introInteractions} onSelect={selectInteraction} />
        )}

        {!isApiActive && !sessionAuth?.isAuthenticated && (
          <div className="secret-hero-callout" onClick={handleOpenAuthOrSecret} role="button" tabIndex={0}>
            <div className="callout-sparkle-ring" />
            <div className="callout-icon-box">💌</div>
            <div className="callout-text-container">
              <div className="callout-header">
                <span className="callout-live-indicator">
                  <span className="live-pulse" /> CONFIDENTIAL
                </span>
                <span className="callout-click-pill">CLICK TO OPEN ✨</span>
              </div>
              <h4 className="callout-heading">A Secret Message is Waiting For You</h4>
              <p className="callout-description">
                Someone special encrypted a romantic confession in this robot's heart. Tap here to unlock it.
              </p>
            </div>
            <div className="callout-action-arrow">
              <span>REVEAL</span>
              <span className="arrow-icon">➔</span>
            </div>
          </div>
        )}

        {/* Database & Authentication Controls Toolbar */}
        <div className="db-toolbar">
          <button className="db-btn primary secret-toolbar-btn" onClick={handleOpenAuthOrSecret}>
            <span className="secret-toolbar-dot" />
            <span className="secret-toolbar-badge">✨ FOR YOU</span>
            <span className="secret-toolbar-text">
              {sessionAuth?.isAuthenticated ? '💖 SECRET MESSAGE (UNLOCKED)' : '💌 SECRET MESSAGE'}
            </span>
          </button>
          <button className="db-btn" onClick={() => setIsConfessionModalOpen(true)}>
            💖 SPEAK TO HEART
          </button>
          <button className="db-btn db-database-btn" onClick={() => setIsDatabaseModalOpen(true)}>
            <span className="db-btn-dot" /> 🗄️ DATABASE
          </button>
        </div>

        <p className="corner-label">01 / SECRET MESSAGE ACTIVE</p>
        <button className="enter" onClick={() => setIslandMode('expanded')}>
          ENTER EXPERIENCE <span>↗</span>
        </button>
      </div>

      {/* Love Celebration Overlay (Triggers on YES click with Mobile Dispatch) */}
      <LoveCelebrationOverlay
        isVisible={showLoveCelebration}
        onClose={() => setShowLoveCelebration(false)}
        whatsappUrl={notificationData?.whatsappUrl}
        phoneNumber={notificationData?.phoneNumber}
        autoSent={notificationData?.autoSent}
        autoSentDetail={notificationData?.autoSentDetail}
      />

      {/* Sad Reaction Overlay (Triggers on NO click with Mobile Dispatch) */}
      <SadReactionOverlay
        isVisible={showSadReaction}
        onClose={() => setShowSadReaction(false)}
        whatsappUrl={notificationData?.whatsappUrl}
        phoneNumber={notificationData?.phoneNumber}
        autoSent={notificationData?.autoSent}
        autoSentDetail={notificationData?.autoSentDetail}
      />

      {/* Secret Right Panel (Rendered when unlocked & view is open) */}
      <AnimatePresence>
        {isSecretViewOpen && sessionAuth?.isAuthenticated && (
          <SecretUnlockedPanel
            userName={sessionAuth.userName}
            secretMessage={sessionAuth.secretMessage}
            onRespondYes={handleRespondYes}
            onRespondNo={handleRespondNo}
            onClose={() => {
              setIsSecretViewOpen(false)
              setShowLoveCelebration(false)
              setShowSadReaction(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Database Modals */}
      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onOpenMemoryBank={() => {
          setIsDatabaseModalOpen(false)
          setIsMemoryModalOpen(true)
        }}
        onOpenSettings={() => {
          setIsDatabaseModalOpen(false)
          setIsSettingsModalOpen(true)
        }}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <MemoryBankModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} />
      <ConfessionModal
        isOpen={isConfessionModalOpen}
        onClose={() => setIsConfessionModalOpen(false)}
        onConfessionSubmitted={handleConfessionSubmitted}
      />

      <AnimatePresence>{!ready && <LoadingScreen />}</AnimatePresence>
    </main>
  )
}
