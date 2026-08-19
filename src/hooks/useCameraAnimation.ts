import { useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import * as THREE from 'three';

/**
 * Cinematic camera controller for the 3D portfolio.
 * - flyTo: smoothly flies the camera toward a world-space target (used when a planet is clicked)
 * - reset: smoothly moves the camera to a fixed rig position/lookAt (used for scene transitions)
 */
export function useCameraAnimation() {
  const { camera } = useThree();

  const flyTo = useCallback(
    (
      target: [number, number, number],
      distance = 4,
      onComplete?: () => void
    ) => {
      const targetVec = new THREE.Vector3(...target);
      const dir = camera.position.clone().sub(targetVec).normalize();
      const destination = targetVec.clone().add(dir.multiplyScalar(distance));

      gsap.to(camera.position, {
        x: destination.x,
        y: destination.y + 0.6,
        z: destination.z,
        duration: 1.6,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(targetVec),
        onComplete,
      });
    },
    [camera]
  );

  const reset = useCallback(
    (
      position: [number, number, number] = [0, 0, 10],
      lookAt: [number, number, number] = [0, 0, 0],
      duration = 1.6
    ) => {
      const lookAtVec = new THREE.Vector3(...lookAt);
      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(lookAtVec),
      });
    },
    [camera]
  );

  return { flyTo, reset };
}
