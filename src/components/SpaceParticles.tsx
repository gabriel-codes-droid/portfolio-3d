import { useMemo } from 'react';
import { Points } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceParticlesProps {
  count?: number;
}

export default function SpaceParticles({ count = 1000 }: SpaceParticlesProps) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 50;
      pos[i3 + 1] = (Math.random() - 0.5) * 50;
      pos[i3 + 2] = (Math.random() - 0.5) * 50;
    }
    
    return pos;
  }, [count]);

  return (
    <Points positions={positions}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation={true}
        color="#a5b4fc"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}