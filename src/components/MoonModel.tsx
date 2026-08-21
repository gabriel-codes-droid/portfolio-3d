import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

export default function MoonModel({ position = [0, -5, 0], scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  const moonRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/moon.glb');

  return (
    <group ref={moonRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/moon.glb');
