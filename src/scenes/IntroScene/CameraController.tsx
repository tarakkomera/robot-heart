import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

interface CameraControllerProps {
  isSecretUnlocked?: boolean
}

export function CameraController({ isSecretUnlocked = false }: CameraControllerProps) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3())

  useFrame(({ clock, pointer }) => {
    const time = clock.elapsedTime

    if (isSecretUnlocked) {
      // API Mode: Shift camera to place 3D Robot on the LEFT side of the screen
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, -2.5 + pointer.x * 0.2, 0.04)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.35 + pointer.y * 0.12, 0.04)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.4 + Math.sin(time * 0.2) * 0.08, 0.04)

      target.current.x = THREE.MathUtils.lerp(target.current.x, 1.6, 0.04)
      target.current.y = THREE.MathUtils.lerp(target.current.y, 0.75, 0.04)
      target.current.z = THREE.MathUtils.lerp(target.current.z, 0, 0.04)
    } else {
      // Standard Centered Framing
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.4, 0.03)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.6 + pointer.y * 0.18, 0.03)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7 + Math.sin(time * 0.25) * 0.12, 0.03)

      target.current.x = THREE.MathUtils.lerp(target.current.x, 0, 0.04)
      target.current.y = THREE.MathUtils.lerp(target.current.y, 1, 0.04)
      target.current.z = THREE.MathUtils.lerp(target.current.z, 0, 0.04)
    }

    camera.lookAt(target.current)
  })

  return null
}
