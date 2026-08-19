import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Mesh } from 'three';

// RoundedBoxGeometry ships with three.js itself (three/examples), so this
// needs zero new npm installs — it just isn't a JSX tag by default until
// we register it once here.
extend({ RoundedBoxGeometry });

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

interface FloatingCubeProps {
  position: [number, number, number];
  size: number;
  color: string;
  speed: number;
  index: number;
}

export default function FloatingCube({ 
  position, 
  size, 
  color, 
  speed, 
  index 
}: FloatingCubeProps) {
  const mesh = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const randomFactor = Math.random() * 0.1 + 0.05;

  useFrame((state) => {
    if (mesh.current) {
      // Rotate
      mesh.current.rotation.x += speed * 0.01;
      mesh.current.rotation.y += speed * 0.015;
      
      // Floating motion
      const time = state.clock.getElapsedTime();
      mesh.current.position.x = position[0] + Math.sin(time * speed + index) * randomFactor;
      mesh.current.position.y = position[1] + Math.cos(time * speed * 0.7 + index) * randomFactor;
      mesh.current.position.z = position[2] + Math.sin(time * speed * 0.5 + index) * randomFactor;
      
      // Pulsing effect
      const scale = 1 + Math.sin(time * 2 + index) * 0.05;
      mesh.current.scale.setScalar(scale);

      // Glowing core counter-rotates and pulses on its own for a
      // "trapped energy" look, like the reference crystal cubes
      if (core.current) {
        core.current.rotation.x -= speed * 0.02;
        core.current.rotation.y -= speed * 0.025;
        const pulse = 0.55 + Math.sin(time * 3 + index * 2) * 0.15;
        core.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <mesh ref={mesh}>
      {/* Beveled edges (segments, corner radius) instead of a sharp box —
          reads as a machined/game-asset crystal rather than a raw primitive */}
      <roundedBoxGeometry args={[size, size, size, 4, size * 0.08]} />
      <meshPhysicalMaterial 
        color={color}
        transparent
        opacity={0.35}
        roughness={0.05}
        metalness={0.1}
        envMapIntensity={1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transmission={0.6}
        thickness={0.5}
        emissive={color}
        emissiveIntensity={0.15}
      />

      {/* Glowing energy core trapped inside the glass shell */}
      <mesh ref={core}>
        <octahedronGeometry args={[size * 0.4, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <pointLight color={color} intensity={0.6} distance={size * 4} />
    </mesh>
  );
}
