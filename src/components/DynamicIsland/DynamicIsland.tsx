import { motion } from 'framer-motion'
import { robotEmotionProfiles, type IslandMode, type RobotEmotion } from '../../state/experienceStore'

interface DynamicIslandProps { mode: IslandMode; emotion: RobotEmotion; emotionLevel: number; onToggle: () => void }

export function DynamicIsland({ mode, emotion, emotionLevel, onToggle }: DynamicIslandProps) {
  const expanded = mode === 'expanded'
  const profile = robotEmotionProfiles[emotion]
  return <motion.button className="island" onClick={onToggle} animate={{ width: expanded ? 310 : 196, height: expanded ? 105 : 48 }} transition={{ type: 'spring', stiffness: 280, damping: 25 }}>
    <span className="island-orb" style={{ background: profile.eyeColor, boxShadow: `0 0 13px ${profile.glowColor}` }} />
    <span className="island-copy"><b>{expanded ? `EMOTION / ${profile.label}` : 'SYSTEM ACTIVE'}</b>{expanded && <small>{profile.systemMessage}</small>}</span>
    {expanded && <span className="island-meter"><i style={{ width: `${emotionLevel}%`, background: profile.glowColor }} /></span>}
    <span className="island-expand">{expanded ? '×' : '+'}</span>
  </motion.button>
}
