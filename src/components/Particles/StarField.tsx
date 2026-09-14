import { Points, PointMaterial } from '@react-three/drei'
import { useMemo } from 'react'

export function StarField() {
  const positions = useMemo(() => Float32Array.from({ length: 900 }, () => (Math.random() - 0.5) * 25), [])
  return <Points positions={positions} stride={3} frustumCulled><PointMaterial transparent color="#91c7ff" size={0.025} sizeAttenuation depthWrite={false} /></Points>
}
