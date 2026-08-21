import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface JetpackProps {
  position: [number, number, number];
  visible: boolean;
}

/**
 * The jetpack the mannequin ditches once it lands and sits on the moon.
 * Appears with a small settle animation and rests beside the seat.
 */
export default function Jetpack({ position, visible }: JetpackProps) {
  const group = useRef<Group>(null);
  const appearedAt = useRef<number | null>(null);

  useFrame((state) => {
    if (!group.current) return;

    if (!visible) {
      appearedAt.current = null;
      group.current.scale.setScalar(0);
      return;
    }

    if (appearedAt.current === null) appearedAt.current = state.clock.getElapsedTime();
    const t = state.clock.getElapsedTime() - appearedAt.current;
    const settle = Math.min(t / 0.5, 1);
    const overshoot = settle < 1 ? 1 + Math.sin(settle * Math.PI) * 0.15 : 1;
    group.current.scale.setScalar(settle * overshoot);
  });

  const { scene } = useGLTF('/models/jetpack/Jetpack.glb');
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group ref={group} position={position} rotation={[0, Math.PI / 2, 0]}>
      <primitive object={model} scale={0.42} dispose={null} />
    </group>
  );
}

useGLTF.preload('/models/jetpack/Jetpack.glb');
