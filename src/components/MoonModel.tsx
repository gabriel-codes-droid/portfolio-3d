import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { MOON_RADIUS } from '../moonConstants';

interface MoonModelProps {
  position?: [number, number, number];
  /** The moon is auto-scaled so its bounding sphere radius equals this,
   * guaranteeing it matches MOON_RADIUS used for the seat-position math in
   * App.tsx \u2014 instead of a raw fixed scale multiplier, which had no
   * relationship to the downloaded model's actual native size and caused
   * the moon to render far smaller than assumed, with the mannequin's seat
   * position landing in empty space near where a bigger moon "should" be.
   */
  targetRadius?: number;
}

export default function MoonModel({ position = [0, -5, 0], targetRadius = MOON_RADIUS }: MoonModelProps) {
  const moonRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/moon.glb');

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const naturalRadius = Math.max(size.x, size.y, size.z) / 2;
    return naturalRadius > 0 ? targetRadius / naturalRadius : 1;
  }, [scene, targetRadius]);

  return (
    <group ref={moonRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/moon.glb');
