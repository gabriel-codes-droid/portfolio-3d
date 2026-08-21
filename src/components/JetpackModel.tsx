import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

interface JetpackModelProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

export default function JetpackModel({ 
  position = [0, 0, 0], 
  scale = 1,
  rotation = [0, 0, 0]
}: JetpackModelProps) {
  const jetpackRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/jetpack/Jetpack.glb');

  return (
    <group ref={jetpackRef} position={position} scale={scale} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/jetpack/Jetpack.glb');
