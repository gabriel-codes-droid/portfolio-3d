import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, useGLTF, useFBX } from '@react-three/drei';
import type { Group } from 'three';
import * as THREE from 'three';
import FloatingCube from '../components/FloatingCube';

interface IntroSceneProps {
  onCubeTopsReady?: (points: [number, number, number][]) => void;
}

type CubeSpec = {
  position: [number, number, number];
  size: number;
  color: string;
  speed: number;
  index: number;
};

// The route is deliberately separate from the decorative formation. The
// character always moves left-to-right across these platforms in view.
// Gaps widened noticeably from the original tighter spacing (~2 units apart)
// so each hop reads as a clear jump across a visible gap, not a small step.
const HOP_WAYPOINTS: [number, number, number][] = [
  [-6.5, -2.1, 3.2],
  [-3.3, -1.45, 1.6],
  [-0.1, -2.05, 0.3],
  [3.1, -1.4, -1.1],
  [6.4, -1.9, -2.7],
];

const HOP_CUBES: CubeSpec[] = HOP_WAYPOINTS.map((point, index) => ({
  position: [point[0], point[1] - 0.8, point[2]],
  size: 1.6,
  color: index % 2 === 0 ? '#8b5cf6' : '#22d3ee',
  speed: 0.34 + index * 0.05,
  index: 100 + index,
}));

// A hand-composed, balanced frame around the route. No random placement.
// Spread out further from the route so the backdrop cubes don't crowd the
// hopping platforms visually.
const CUBE_FORMATION: CubeSpec[] = [
  { position: [-9.5, 4.6, -7.5], size: 2.6, color: '#7c3aed', speed: 0.24, index: 1 },
  { position: [-6.4, 2.5, -8.3], size: 1.25, color: '#a855f7', speed: 0.31, index: 2 },
  { position: [-3.4, 5.3, -10.6], size: 1.75, color: '#6366f1', speed: 0.27, index: 3 },
  { position: [3.5, 5.1, -11.0], size: 1.9, color: '#8b5cf6', speed: 0.29, index: 4 },
  { position: [8.5, 3.9, -7.9], size: 2.35, color: '#22d3ee', speed: 0.23, index: 5 },
  { position: [9.6, -2.2, -9.6], size: 1.35, color: '#818cf8', speed: 0.32, index: 6 },
  { position: [-9.8, -2.6, -10.1], size: 1.45, color: '#a855f7', speed: 0.3, index: 7 },
  { position: [6.2, 0.4, -6.9], size: 1.05, color: '#67e8f9', speed: 0.36, index: 8 },
  { position: [-6.1, -0.1, -7.4], size: 0.95, color: '#c084fc', speed: 0.38, index: 9 },
];

// Start loading all Mixamo animation FBX files at app startup so there's
// zero delay the moment the mannequin needs them during launch. Paths must
// match useMixamoAnimations.ts exactly (that hook is the source of truth).
useFBX.preload('/models/idle.fbx');
useFBX.preload('/models/jump.fbx');
useFBX.preload('/models/flying.fbx');
useFBX.preload('/models/landing.fbx');
useFBX.preload('/models/sitting.fbx');

export default function IntroScene({ onCubeTopsReady }: IntroSceneProps) {
  const sceneGroup = useRef<Group>(null);
  const notified = useRef(false);
  const { gl } = useThree();

  // Click-and-drag scene rotation (with inertia)
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      velocityX.current = 0;
      velocityY.current = 0;
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current || !sceneGroup.current) return;
      const deltaX = (e.clientX - lastX.current) * 0.004;
      const deltaY = (e.clientY - lastY.current) * 0.004;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      sceneGroup.current.rotation.y += deltaX;
      sceneGroup.current.rotation.x += deltaY;
      velocityX.current = deltaX;
      velocityY.current = deltaY;
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

  useEffect(() => {
    if (!notified.current) {
      notified.current = true;
      onCubeTopsReady?.(HOP_WAYPOINTS);
    }
  }, [onCubeTopsReady]);

  const orbs = [
    { position: [-5.8, 0.6, -4.5] as [number, number, number], size: 0.28, color: '#a855f7' },
    { position: [5.6, 1.1, -4.8] as [number, number, number], size: 0.24, color: '#22d3ee' },
    { position: [0, 3.6, -7.2] as [number, number, number], size: 0.2, color: '#818cf8' },
  ];

  useFrame((state) => {
    if (!sceneGroup.current) return;

    if (dragging.current) return;

    if (Math.abs(velocityX.current) > 0.0002 || Math.abs(velocityY.current) > 0.0002) {
      // Inertia after releasing a drag
      sceneGroup.current.rotation.y += velocityX.current;
      sceneGroup.current.rotation.x += velocityY.current;
      velocityX.current *= 0.94;
      velocityY.current *= 0.94;
    } else {
      // Idle: subtle mouse parallax lean
      const { x, y } = state.pointer;
      sceneGroup.current.rotation.y += (x * 0.15 - sceneGroup.current.rotation.y) * 0.03;
      sceneGroup.current.rotation.x += (-y * 0.1 - sceneGroup.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={sceneGroup}>
      {/* Stars Background */}
      <Stars count={2000} saturation={1} factor={10} />

      {/* Ambient Light Fields */}
      <pointLight position={[0, 10, 10]} intensity={0.5} color="#a5b4fc" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#f59e0b" />

      {HOP_CUBES.map((cube) => (
        <FloatingCube key={`hop-${cube.index}`} {...cube} />
      ))}
      {CUBE_FORMATION.map((cube) => (
        <FloatingCube key={cube.index} {...cube} />
      ))}

      {/* Energy Orbs */}
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.size, 6, 6]} />
          <meshBasicMaterial color={orb.color} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}
