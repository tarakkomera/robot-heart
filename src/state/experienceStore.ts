export type ExperiencePhase = 'loading' | 'ready'
export type IslandMode = 'collapsed' | 'expanded'
export type RobotEmotion = 'idle' | 'curious' | 'warm' | 'excited' | 'nervous'
export type InteractionId = 'signal' | 'memory' | 'heart'

export interface ExperienceState {
  phase: ExperiencePhase
  islandMode: IslandMode
  message: string
}

export interface RobotEmotionProfile {
  label: string
  systemMessage: string
  eyeColor: string
  glowColor: string
}

export const robotEmotionProfiles: Record<RobotEmotion, RobotEmotionProfile> = {
  idle: { label: 'CALIBRATED', systemMessage: 'Emotional core is standing by.', eyeColor: '#9deeff', glowColor: '#42c9ff' },
  curious: { label: 'CURIOUS', systemMessage: 'An unfamiliar signal has been detected.', eyeColor: '#bba7ff', glowColor: '#8d7dff' },
  warm: { label: 'WARM', systemMessage: 'Memory pattern recognized. Holding it gently.', eyeColor: '#ffb7d2', glowColor: '#ff5d9c' },
  excited: { label: 'ELEVATED', systemMessage: 'Emotion level increasing beyond normal range.', eyeColor: '#fff1a6', glowColor: '#ffd447' },
  nervous: { label: 'UNSTEADY', systemMessage: 'Preparing a message. Please remain nearby.', eyeColor: '#ffb4a0', glowColor: '#ff715b' },
}

const emotionTransitions: Record<RobotEmotion, Record<InteractionId, RobotEmotion>> = {
  idle: { signal: 'curious', memory: 'warm', heart: 'excited' },
  curious: { signal: 'curious', memory: 'warm', heart: 'nervous' },
  warm: { signal: 'curious', memory: 'warm', heart: 'excited' },
  excited: { signal: 'curious', memory: 'warm', heart: 'excited' },
  nervous: { signal: 'curious', memory: 'warm', heart: 'nervous' },
}

export function transitionRobotEmotion(current: RobotEmotion, interaction: InteractionId): RobotEmotion {
  return emotionTransitions[current][interaction]
}
