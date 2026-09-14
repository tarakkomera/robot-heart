import { Environment, Float, Grid } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { RealisticRobot } from '../../components/Robot/RealisticRobot'
import { StarField } from '../../components/Particles/StarField'
import { CameraController } from './CameraController'
import type { InteractionId, RobotEmotion } from '../../state/experienceStore'

interface IntroSceneProps {
  emotion: RobotEmotion
  onInteraction: (id: InteractionId) => void
  isSecretUnlocked?: boolean
}

interface InteractionOrbProps { id: InteractionId; position: [number, number, number]; color: string; onSelect: (id: InteractionId) => void }

function InteractionOrb({ id, position, color, onSelect }: InteractionOrbProps) {
  return <Float speed={1.5} floatIntensity={0.5}><mesh position={position} onClick={(event) => { event.stopPropagation(); onSelect(id) }} onPointerOver={(event) => { document.body.style.cursor = 'pointer'; event.stopPropagation() }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
    <octahedronGeometry args={[0.18]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
  </mesh></Float>
}

export function IntroScene({ emotion, onInteraction, isSecretUnlocked = false }: IntroSceneProps) {
  return (
    <>
      <color attach="background" args={['#030711']} />
      <fog attach="fog" args={['#030711', 7, 18]} />
      <ambientLight intensity={0.8} color="#7898d4" />
      <directionalLight position={[5, 8, 5]} intensity={2.8} color="#dbeeff" castShadow />
      <directionalLight position={[-5, 4, -4]} intensity={1.2} color="#a688ff" />
      <pointLight position={[-4, 2, 2]} intensity={25} distance={10} color="#b145ff" />
      <Grid position={[0, -0.4, 0]} args={[22, 22]} cellSize={0.55} cellThickness={0.6} sectionSize={5} sectionThickness={1.4} cellColor="#1d4d8d" sectionColor="#5999ec" fadeDistance={16} infiniteGrid />
      <StarField />
      <RealisticRobot emotion={emotion} />
      {!isSecretUnlocked && (
        <>
          <InteractionOrb id="signal" position={[-2.5, 1.2, -1]} color="#a891ff" onSelect={onInteraction} />
          <InteractionOrb id="memory" position={[2.2, 1.7, -0.5]} color="#ff82b2" onSelect={onInteraction} />
          <InteractionOrb id="heart" position={[0.4, 2.8, -1.5]} color="#ffdc67" onSelect={onInteraction} />
        </>
      )}
      <CameraController isSecretUnlocked={isSecretUnlocked} />
      <Environment preset="night" />
      <EffectComposer>
        <Bloom luminanceThreshold={0.4} mipmapBlur intensity={1.2} />
        <Vignette darkness={0.7} offset={0.25} />
      </EffectComposer>
    </>
  )
}
