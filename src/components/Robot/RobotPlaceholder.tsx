import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { robotEmotionProfiles, type RobotEmotion } from '../../state/experienceStore'

interface RobotPlaceholderProps { emotion: RobotEmotion }

const emotionMotion: Record<RobotEmotion, { bob: number; sway: number; tilt: number }> = {
  idle: { bob: 0.05, sway: 0.18, tilt: 0.05 },
  curious: { bob: 0.08, sway: 0.35, tilt: 0.16 },
  warm: { bob: 0.12, sway: 0.2, tilt: -0.1 },
  excited: { bob: 0.18, sway: 0.55, tilt: 0.1 },
  nervous: { bob: 0.07, sway: 0.75, tilt: 0.04 },
}

export function RobotPlaceholder({ emotion }: RobotPlaceholderProps) {
  const group = useRef<THREE.Group>(null)
  const profile = robotEmotionProfiles[emotion]
  useFrame(({ clock, pointer }) => {
    if (!group.current) return
    const motion = emotionMotion[emotion]
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.25 + Math.sin(clock.elapsedTime * 0.8) * motion.sway, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.08 + motion.tilt, 0.04)
    group.current.position.y = Math.sin(clock.elapsedTime * (emotion === 'excited' ? 3.2 : 1.4)) * motion.bob
  })
  return <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.12}>
    <group ref={group} position={[0, 0.75, 0]}>
      <mesh castShadow><capsuleGeometry args={[0.75, 1.2, 8, 16]} /><meshStandardMaterial color="#b9c9df" metalness={0.85} roughness={0.23} /></mesh>
      <mesh position={[0, 1.42, 0.08]}><sphereGeometry args={[0.82, 32, 32]} /><meshStandardMaterial color="#d6e7fa" metalness={0.9} roughness={0.18} /></mesh>
      <mesh position={[0, 1.42, 0.74]} scale={[0.72, 0.36, 0.12]}><sphereGeometry args={[1, 32, 16]} /><meshStandardMaterial color="#07101d" emissive={profile.glowColor} emissiveIntensity={1.4} /></mesh>
      {[-0.28, 0.28].map((x) => <mesh key={x} position={[x, 1.44, 0.87]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={profile.eyeColor} emissive={profile.glowColor} emissiveIntensity={4} /></mesh>)}
      <mesh position={[0, 0.5, 0.72]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.2, 0]} /><meshStandardMaterial color="#ff7eae" emissive={profile.glowColor} emissiveIntensity={2.5} /></mesh>
      <pointLight color={profile.glowColor} intensity={8} distance={4} position={[0, 1.5, 1.3]} />
    </group>
  </Float>
}
