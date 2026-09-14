import type { InteractionId, RobotEmotion } from '../state/experienceStore'

export interface StoryInteraction {
  id: InteractionId
  label: string
  title: string
  description: string
  emotion: RobotEmotion
  energy: number
}

export const introInteractions: StoryInteraction[] = [
  { id: 'signal', label: '01', title: 'A signal', description: 'Something unusual has been detected.', emotion: 'curious', energy: 12 },
  { id: 'memory', label: '02', title: 'A memory', description: 'A small moment, stored longer than expected.', emotion: 'warm', energy: 22 },
  { id: 'heart', label: '03', title: 'A feeling', description: 'This variable has no logical explanation.', emotion: 'excited', energy: 34 },
]

export const openingLines: Record<InteractionId, string> = {
  signal: 'The robot noticed you. It is trying to understand why.',
  memory: 'A memory archive has opened — there is warmth in the data.',
  heart: 'Heart protocol is online. The system is no longer quite calm.',
}
