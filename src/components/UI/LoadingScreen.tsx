import { motion } from 'framer-motion'

export function LoadingScreen() {
  return <motion.div className="loading" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="loading-mark">✦</div>
    <p className="eyebrow">ROBOTIC HEART / 01</p>
    <h1>SYSTEM INITIALIZING<span className="cursor">_</span></h1>
    <div className="progress"><i /></div>
    <p className="loading-status">Loading emotional database...</p>
  </motion.div>
}
