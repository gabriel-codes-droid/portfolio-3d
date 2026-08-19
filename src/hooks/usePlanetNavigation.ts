import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import type { Group } from 'three';

/**
 * Drag-to-rotate world navigation with inertia, resembling browsing
 * planets/worlds in a game. Attach the returned groupRef to the
 * <group> that wraps the orbiting planets.
 */
export function usePlanetNavigation(idleSpeed = 0.0015) {
  const groupRef = useRef<Group>(null);
  const { gl } = useThree();
  const dragging = useRef(false);
  const lastX = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      lastX.current = e.clientX;
      velocity.current = 0;
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current || !groupRef.current) return;
      const delta = (e.clientX - lastX.current) * 0.005;
      lastX.current = e.clientX;
      groupRef.current.rotation.y += delta;
      velocity.current = delta;
    };

    const onPointerUp = () => {
      dragging.current = false;
      el.style.cursor = 'grab';
    };

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.style.cursor = 'default';
    };
  }, [gl]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (dragging.current) return;

    if (Math.abs(velocity.current) > 0.0002) {
      // Inertia: keep spinning and decay the drag velocity
      groupRef.current.rotation.y += velocity.current;
      velocity.current *= 0.94;
    } else {
      // Gentle idle drift when nothing is happening
      groupRef.current.rotation.y += idleSpeed;
    }
  });

  const rotateBy = (delta: number) => {
    if (!groupRef.current) return;
    velocity.current = 0;
    gsap.to(groupRef.current.rotation, {
      y: groupRef.current.rotation.y + delta,
      duration: 0.8,
      ease: 'power2.out',
    });
  };

  return { groupRef, dragging, rotateBy };
}
