import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { robotEmotionProfiles, type RobotEmotion } from '../../state/experienceStore'

interface RealisticRobotProps {
  emotion: RobotEmotion
}

export function RealisticRobot({ emotion }: RealisticRobotProps) {
  const robotGroup = useRef<THREE.Group>(null)
  const headGroup = useRef<THREE.Group>(null)
  const chestGroup = useRef<THREE.Group>(null)
  const heartRingRef = useRef<THREE.Group>(null)
  const heartCrystalRef = useRef<THREE.Mesh>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const [blink, setBlink] = useState(1)

  const profile = robotEmotionProfiles[emotion]

  // Emotion-driven motion parameters
  const motionProfiles = {
    idle: { heartPulseSpeed: 2.0, heartScale: 1.0, swayAmount: 0.15, headTilt: 0 },
    curious: { heartPulseSpeed: 3.0, heartScale: 1.25, swayAmount: 0.25, headTilt: 0.12 },
    warm: { heartPulseSpeed: 2.2, heartScale: 1.15, swayAmount: 0.18, headTilt: -0.08 },
    excited: { heartPulseSpeed: 4.8, heartScale: 1.4, swayAmount: 0.35, headTilt: 0.05 },
    nervous: { heartPulseSpeed: 5.5, heartScale: 1.3, swayAmount: 0.45, headTilt: 0.02 },
  }

  useFrame(({ clock, pointer }) => {
    const time = clock.getElapsedTime()
    const currentMotion = motionProfiles[emotion]

    // 1. Overall Body Hover & Sway
    if (robotGroup.current) {
      robotGroup.current.position.y = Math.sin(time * 1.5) * 0.08 + 0.1
      robotGroup.current.rotation.y = THREE.MathUtils.lerp(
        robotGroup.current.rotation.y,
        pointer.x * 0.2 + Math.sin(time * 0.7) * currentMotion.swayAmount * 0.5,
        0.04
      )
    }

    // 2. Head Gaze & Micro Movement
    if (headGroup.current) {
      headGroup.current.rotation.y = THREE.MathUtils.lerp(
        headGroup.current.rotation.y,
        pointer.x * 0.4 + Math.sin(time * 0.9) * 0.05,
        0.06
      )
      headGroup.current.rotation.x = THREE.MathUtils.lerp(
        headGroup.current.rotation.x,
        -pointer.y * 0.25 + currentMotion.headTilt + Math.cos(time * 1.1) * 0.03,
        0.06
      )
      headGroup.current.rotation.z = THREE.MathUtils.lerp(
        headGroup.current.rotation.z,
        pointer.x * -0.08 + currentMotion.headTilt * 0.5,
        0.05
      )
    }

    // 3. Realistic Breathing Chest Motion
    if (chestGroup.current) {
      const breath = Math.sin(time * 1.8) * 0.025
      chestGroup.current.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath * 1.2)
    }

    // 4. Beating Heart Reactor Core
    if (heartRingRef.current) {
      heartRingRef.current.rotation.z = time * 1.8
      heartRingRef.current.rotation.x = time * 1.2
    }

    if (heartCrystalRef.current) {
      const pulse = Math.pow(Math.sin(time * currentMotion.heartPulseSpeed), 4) * 0.25 + 1.0
      const targetScale = currentMotion.heartScale * pulse
      heartCrystalRef.current.scale.setScalar(targetScale)
      heartCrystalRef.current.rotation.y = time * 2.5
    }

    // 5. Arm Lifelike Balance Movement
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.15 + Math.sin(time * 1.2) * 0.05, 0.05)
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, Math.cos(time * 0.9) * 0.04, 0.05)
      
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.15 - Math.sin(time * 1.2) * 0.05, 0.05)
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.cos(time * 0.9) * 0.04, 0.05)
    }

    // 6. Occasional Eye Blinking
    if (Math.random() < 0.005) {
      setBlink(0.1)
      setTimeout(() => setBlink(1), 120)
    }
  })

  // Material Palettes
  const armorMat = <meshStandardMaterial color="#dde7f2" metalness={0.88} roughness={0.16} envMapIntensity={1.5} />
  const darkChassisMat = <meshStandardMaterial color="#121824" metalness={0.75} roughness={0.35} />
  const chromeJointMat = <meshStandardMaterial color="#c2d4e8" metalness={0.96} roughness={0.08} />
  const carbonFiberMat = <meshStandardMaterial color="#1a2232" metalness={0.6} roughness={0.5} />
  const visorMat = <meshStandardMaterial color="#050d1a" metalness={0.9} roughness={0.1} transparent opacity={0.82} />
  const glowMat = <meshStandardMaterial color={profile.glowColor} emissive={profile.glowColor} emissiveIntensity={3.5} />
  const eyeMat = <meshStandardMaterial color={profile.eyeColor} emissive={profile.glowColor} emissiveIntensity={4.5} />

  return (
    <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.1}>
      <group ref={robotGroup} position={[0, 0.2, 0]} scale={[1.1, 1.1, 1.1]}>
        
        {/* ========================================== */}
        {/* HEAD & NECK ASSEMBLY                       */}
        {/* ========================================== */}
        <group ref={headGroup} position={[0, 1.7, 0]}>
          {/* Cranium Base Shape */}
          <mesh castShadow position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.38, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
            {armorMat}
          </mesh>

          {/* Sleek Jaw & Chin Structure */}
          <mesh position={[0, -0.15, 0.05]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.18, 0.3, 16]} />
            {darkChassisMat}
          </mesh>
          <mesh position={[0, -0.26, 0.18]}>
            <boxGeometry args={[0.16, 0.08, 0.18]} />
            {armorMat}
          </mesh>

          {/* Temples & Side Ear Audio Nodes */}
          {[-0.38, 0.38].map((x, i) => (
            <group key={i} position={[x, 0.05, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
              {chromeJointMat}
              <mesh position={[x > 0 ? 0.04 : -0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <ringGeometry args={[0.04, 0.07, 16]} />
                {glowMat}
              </mesh>
            </group>
          ))}

          {/* Cybernetic Glass Visor */}
          <mesh position={[0, 0.05, 0.14]} scale={[0.36, 0.22, 0.26]}>
            <sphereGeometry args={[1, 32, 16]} />
            {visorMat}
          </mesh>

          {/* Articulated Glowing Optic Eyes (with blinking effect) */}
          <group scale={[1, blink, 1]}>
            {[-0.14, 0.14].map((x, i) => (
              <group key={i} position={[x, 0.06, 0.34]}>
                {/* Outer Lens Housing */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
                  {chromeJointMat}
                </mesh>
                {/* Glowing Pupil */}
                <mesh ref={i === 0 ? leftEyeRef : rightEyeRef} position={[0, 0, 0.02]}>
                  <sphereGeometry args={[0.045, 16, 16]} />
                  {eyeMat}
                </mesh>
                <pointLight color={profile.glowColor} intensity={2.5} distance={1.2} />
              </group>
            ))}
          </group>

          {/* Forehead Light Strip Indicator */}
          <mesh position={[0, 0.26, 0.32]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.18, 0.02, 0.04]} />
            {glowMat}
          </mesh>
        </group>

        {/* Cervical Spine & Neck Mechanism */}
        <group position={[0, 1.3, 0]}>
          {/* Main Central Spine Column */}
          <mesh>
            <cylinderGeometry args={[0.1, 0.12, 0.3, 16]} />
            {chromeJointMat}
          </mesh>
          {/* Hydraulic Neck Stabilizer Rods */}
          {[-0.1, 0.1].map((x, i) => (
            <mesh key={i} position={[x, 0, 0.06]}>
              <cylinderGeometry args={[0.025, 0.025, 0.26, 8]} />
              {carbonFiberMat}
            </mesh>
          ))}
        </group>


        {/* ========================================== */}
        {/* TORSO & ROBOTIC HEART CAVITY               */}
        {/* ========================================== */}
        <group position={[0, 0.6, 0]}>
          {/* Main Upper Chest Frame */}
          <group ref={chestGroup}>
            {/* Left & Right Sculpted Pectoral Armor */}
            {[-0.26, 0.26].map((x, i) => (
              <mesh key={i} position={[x, 0.42, 0.12]} rotation={[0, i === 0 ? 0.2 : -0.2, 0]}>
                <boxGeometry args={[0.34, 0.38, 0.22]} />
                {armorMat}
              </mesh>
            ))}

            {/* Back Collar & Upper Spine Plate */}
            <mesh position={[0, 0.45, -0.14]}>
              <boxGeometry args={[0.62, 0.4, 0.22]} />
              {darkChassisMat}
            </mesh>
            <mesh position={[0, 0.45, -0.24]}>
              <cylinderGeometry args={[0.08, 0.08, 0.38, 16]} />
              {chromeJointMat}
            </mesh>

            {/* Central Robotic Heart Chamber Glass Shell */}
            <group position={[0, 0.36, 0.18]}>
              <mesh>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial color="#081426" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
              </mesh>

              {/* Rotating Gyroscope Core Rings */}
              <group ref={heartRingRef}>
                <mesh>
                  <torusGeometry args={[0.16, 0.015, 16, 32]} />
                  {chromeJointMat}
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.13, 0.012, 16, 32]} />
                  {glowMat}
                </mesh>
              </group>

              {/* Pulsing Mechanical Heart Crystal */}
              <mesh ref={heartCrystalRef}>
                <octahedronGeometry args={[0.1, 0]} />
                {glowMat}
              </mesh>

              {/* Radiant Internal Heart Light Source */}
              <pointLight color={profile.glowColor} intensity={12} distance={3.5} />
            </group>
          </group>

          {/* Abdominal Multi-Segmented Core */}
          <group position={[0, -0.05, 0]}>
            {/* Synthetic Fiber Abdominal Plates */}
            {[0.12, 0, -0.12].map((y, i) => (
              <mesh key={i} position={[0, y, 0.08]} scale={[1 - i * 0.06, 1, 1]}>
                <boxGeometry args={[0.42, 0.08, 0.22]} />
                {carbonFiberMat}
              </mesh>
            ))}
            {/* Lumbar Spine Conduit Bar */}
            <mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.11, 0.35, 16]} />
              {chromeJointMat}
            </mesh>
          </group>
        </group>


        {/* ========================================== */}
        {/* SHOULDERS & ARTICULATED ARMS               */}
        {/* ========================================== */}
        {/* LEFT ARM */}
        <group ref={leftArmRef} position={[-0.58, 1.0, 0]}>
          {/* Shoulder Ball Joint & Deltoid Armor */}
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            {chromeJointMat}
          </mesh>
          <mesh position={[-0.06, 0.04, 0]}>
            <sphereGeometry args={[0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            {armorMat}
          </mesh>

          {/* Upper Arm / Biceps */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.1, 0.08, 0.38, 16]} />
            {darkChassisMat}
          </mesh>

          {/* Elbow Joint */}
          <mesh position={[0, -0.54, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
            {chromeJointMat}
          </mesh>

          {/* Forearm & Armor Guard */}
          <group position={[0, -0.8, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.065, 0.38, 16]} />
              {armorMat}
            </mesh>
            {/* Cyan Status LED Strip */}
            <mesh position={[-0.07, 0, 0]}>
              <boxGeometry args={[0.02, 0.26, 0.02]} />
              {glowMat}
            </mesh>
          </group>

          {/* Left Mechanical Hand */}
          <group position={[0, -1.04, 0]}>
            <mesh>
              <boxGeometry args={[0.1, 0.1, 0.06]} />
              {chromeJointMat}
            </mesh>
            {/* 5 Articulated Fingers */}
            {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
              <mesh key={i} position={[x, -0.08, 0]}>
                <cylinderGeometry args={[0.012, 0.01, 0.08, 8]} />
                {darkChassisMat}
              </mesh>
            ))}
            {/* Thumb */}
            <mesh position={[0.04, -0.04, 0.02]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.012, 0.01, 0.07, 8]} />
              {darkChassisMat}
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightArmRef} position={[0.58, 1.0, 0]}>
          {/* Shoulder Ball Joint & Deltoid Armor */}
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            {chromeJointMat}
          </mesh>
          <mesh position={[0.06, 0.04, 0]}>
            <sphereGeometry args={[0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            {armorMat}
          </mesh>

          {/* Upper Arm / Biceps */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.1, 0.08, 0.38, 16]} />
            {darkChassisMat}
          </mesh>

          {/* Elbow Joint */}
          <mesh position={[0, -0.54, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
            {chromeJointMat}
          </mesh>

          {/* Forearm & Armor Guard */}
          <group position={[0, -0.8, 0]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.065, 0.38, 16]} />
              {armorMat}
            </mesh>
            {/* Cyan Status LED Strip */}
            <mesh position={[0.07, 0, 0]}>
              <boxGeometry args={[0.02, 0.26, 0.02]} />
              {glowMat}
            </mesh>
          </group>

          {/* Right Mechanical Hand */}
          <group position={[0, -1.04, 0]}>
            <mesh>
              <boxGeometry args={[0.1, 0.1, 0.06]} />
              {chromeJointMat}
            </mesh>
            {/* 5 Articulated Fingers */}
            {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
              <mesh key={i} position={[x, -0.08, 0]}>
                <cylinderGeometry args={[0.012, 0.01, 0.08, 8]} />
                {darkChassisMat}
              </mesh>
            ))}
            {/* Thumb */}
            <mesh position={[-0.04, -0.04, 0.02]} rotation={[0, 0, 0.5]}>
              <cylinderGeometry args={[0.012, 0.01, 0.07, 8]} />
              {darkChassisMat}
            </mesh>
          </group>
        </group>


        {/* ========================================== */}
        {/* PELVIS & HUMANOID LEGS                     */}
        {/* ========================================== */}
        <group position={[0, 0.25, 0]}>
          {/* Pelvis Main Chassis Structure */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.48, 0.22, 0.26]} />
            {darkChassisMat}
          </mesh>
          <mesh position={[0, -0.06, 0.14]}>
            <boxGeometry args={[0.3, 0.1, 0.04]} />
            {armorMat}
          </mesh>

          {/* Hip Ball Joints */}
          {[-0.2, 0.2].map((x, i) => (
            <group key={i} position={[x, -0.15, 0]}>
              <mesh>
                <sphereGeometry args={[0.13, 20, 20]} />
                {chromeJointMat}
              </mesh>

              {/* Thighs (Quadriceps Armor) */}
              <group position={[0, -0.38, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.13, 0.09, 0.52, 16]} />
                  {armorMat}
                </mesh>
                <mesh position={[0, 0, 0.07]}>
                  <boxGeometry args={[0.14, 0.44, 0.04]} />
                  {carbonFiberMat}
                </mesh>

                {/* Knee Caps & Piston Joint */}
                <group position={[0, -0.32, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.085, 0.085, 0.16, 16]} />
                    {chromeJointMat}
                  </mesh>
                  <mesh position={[0, 0, 0.07]}>
                    <boxGeometry args={[0.1, 0.14, 0.05]} />
                    {armorMat}
                  </mesh>

                  {/* Calf & Shin Armor */}
                  <group position={[0, -0.38, 0]}>
                    <mesh>
                      <cylinderGeometry args={[0.09, 0.065, 0.52, 16]} />
                      {armorMat}
                    </mesh>

                    {/* Feet & Ankle Assembly */}
                    <group position={[0, -0.32, 0.06]}>
                      <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.07, 16, 16]} />
                        {chromeJointMat}
                      </mesh>
                      <mesh position={[0, -0.05, 0.08]}>
                        <boxGeometry args={[0.13, 0.06, 0.26]} />
                        {darkChassisMat}
                      </mesh>
                      <mesh position={[0, -0.07, 0.08]}>
                        <boxGeometry args={[0.14, 0.02, 0.28]} />
                        {carbonFiberMat}
                      </mesh>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          ))}
        </group>

      </group>
    </Float>
  )
}
