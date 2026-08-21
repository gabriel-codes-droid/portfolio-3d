import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';

interface SketchfabPlanetProps {
  position: [number, number, number];
  size?: number;
  modelId?: string;
  title?: string;
}

/**
 * Renders a Sketchfab embed as an HTML overlay at a 3D position in the scene.
 * Spins slowly in place like the other planets. The iframe is sized to the
 * `size` prop and positioned so the visible planet fills the frame.
 */
export default function SketchfabPlanet({
  position,
  size = 1,
  modelId = 'a0ad382f4d6c4cf190f5537e5248b33d',
  title = 'Planet Reststop',
}: SketchfabPlanetProps) {
  const group = useRef<Group>(null);

  // Slow, natural spin in place — matches the procedural Planet component
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  // iframe pixel size — big enough to see detail
  const iframeSize = Math.round(size * 420);
  const shadowColor = 'rgba(139, 92, 246, 0.5)';

  return (
    <group ref={group} position={position}>
      {/* Glow shell behind the embed, like the procedural planets have */}
      <mesh scale={size * 1.4}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={size * 1.9}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Sketchfab iframe rendered as HTML overlay at the 3D position */}
      <Html
        transform
        distanceFactor={size * 6}
        position={[0, 0, 0]}
        style={{ width: iframeSize, height: iframeSize, pointerEvents: 'auto' }}
      >
        <div
          className="sketchfab-embed-wrapper"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: `0 0 30px ${shadowColor}`,
          }}
        >
          <iframe
            title={title}
            frameBorder="0"
            allowFullScreen
            mozAllowFullScreen="true"
            webkitAllowFullScreen="true"
            allow="autoplay; fullscreen; xr-spatial-tracking; xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share"
            src={`https://sketchfab.com/models/${modelId}/embed`}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </Html>

      <pointLight color="#8b5cf6" intensity={0.8} distance={size * 8} />
    </group>
  );
}
