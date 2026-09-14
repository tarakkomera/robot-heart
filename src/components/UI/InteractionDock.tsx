import { motion } from 'framer-motion'
import type { StoryInteraction } from '../../data/story'

interface InteractionDockProps {
  interactions: StoryInteraction[]
  onSelect: (interaction: StoryInteraction) => void
}

export function InteractionDock({ interactions, onSelect }: InteractionDockProps) {
  return <nav className="interaction-dock" aria-label="Experience interactions">
    {interactions.map((interaction) => <motion.button key={interaction.id} className="interaction" onClick={() => onSelect(interaction)} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
      <span>{interaction.label}</span><b>{interaction.title}</b><small>{interaction.description}</small>
    </motion.button>)}
  </nav>
}
