import { IntroScene } from './IntroScene/IntroScene'
import type { InteractionId, RobotEmotion } from '../state/experienceStore'

export type SceneName = 'intro' | 'story' | 'memory' | 'hyper' | 'confession'

interface SceneManagerProps {
  activeScene?: SceneName
  emotion: RobotEmotion
  onInteraction: (id: InteractionId) => void
  isSecretUnlocked?: boolean
}

export function SceneManager({ activeScene = 'intro', emotion, onInteraction, isSecretUnlocked = false }: SceneManagerProps) {
  switch (activeScene) {
    case 'intro':
    default:
      return <IntroScene emotion={emotion} onInteraction={onInteraction} isSecretUnlocked={isSecretUnlocked} />
  }
}
