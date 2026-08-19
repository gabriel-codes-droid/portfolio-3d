import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, useGLTF } from '@react-three/drei';
import type { Group } from 'three';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import FloatingCube from '../components/FloatingCube';

interface IntroSceneProps {
  onCubeTopsReady?: (points: [number, number, number][]) => void;
}

function CyberCubeBackdrop() {
  const { scene } = useGLTF('/models/cyber-cubes.glb');
  const model = useMemo(() => clone(scene), [scene]);

  // The supplied cube asset is a visual anchor behind the playable hopping
  // lane, while the individual cube components remain the exact platforms.
  return <primitive object={model} position={[0, -2.5, -10]} scale={1.2} dispose={null} />;
}

useGLTF.preload('/models/cyber-cubes.glb');

export default function IntroScene({ onCubeTopsReady }: IntroSceneProps) {
  const cubeCount = 40;
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

  const cubes = useMemo(
    () =>
      Array.from({ length: cubeCount }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
        ] as [number, number, number],
        size: 0.5 + Math.random() * 1.5,
        color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
        speed: 0.5 + Math.random() * 1.5,
        index: i,
      })),
    []
  );

  // A handful of cube-top waypoints (near the camera) for the mannequin to hop across
  const hopWaypoints = useMemo<[number, number, number][]>(() => {
    return cubes
      .filter((c) => c.position[2] > -4 && c.position[2] < 10)
      .slice(0, 6)
      .map((c) => [c.position[0], c.position[1] + c.size / 2 + 0.2, c.position[2]]);
  }, [cubes]);

  useEffect(() => {
    if (hopWaypoints.length > 0 && !notified.current) {
      notified.current = true;
      onCubeTopsReady?.(hopWaypoints);
    }
  }, [hopWaypoints, onCubeTopsReady]);

  const orbCount = 5;
  const orbs = useMemo(
    () =>
      Array.from({ length: orbCount }, () => ({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
        ] as [number, number, number],
        size: 0.2 + Math.random() * 0.3,
        color: `hsl(${Math.random() * 60 + 180}, 80%, 60%)`,
      })),
    []
  );

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

      {/* Floating Cubes */}
      <CyberCubeBackdrop />
      {cubes.map((cube) => (
        <FloatingCube
          key={cube.index}
          position={cube.position}
          size={cube.size}
          color={cube.color}
          speed={cube.speed}
          index={cube.index}
        />
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
