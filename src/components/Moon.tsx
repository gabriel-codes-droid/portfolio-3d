import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Object3D } from 'three';

interface MoonProps {
  position: [number, number, number];
  size?: number;
}

/**
 * Tweaks the moon GLB materials so they catch the HDRI and look like
 * real lunar regolith (non-metallic, slightly rough, full env reflection).
 */
function applyMoonMaterials(root: Object3D) {
  root.traverse((child) => {
    if ((child as any).isMesh) {
      const mat = (child as any).material;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach((m: any) => {
            m.metalness = 0.0;
            m.roughness = Math.max(m.roughness ?? 0.9, 0.82);
            m.envMapIntensity = 1.2;
            m.needsUpdate = true;
          });
        } else {
          mat.metalness = 0.0;
          mat.roughness = Math.max(mat.roughness ?? 0.9, 0.82);
          mat.envMapIntensity = 1.2;
          mat.needsUpdate = true;
        }
      }
    }
  });
}

export default function Moon({ position, size = 3 }: MoonProps) {
  const group = useRef<Group>(null);
  const moonGroup = useRef<Group>(null);

  // Load the real moon model from the 3D Models folder.
  const { scene: moonGltfScene } = useGLTF('/models/moon.glb') as any;
  // Clone so we don't share object references across instances.
  const moonModel = useMemo(() => {
    const cloned = moonGltfScene.clone(true);
    applyMoonMaterials(cloned);
    return cloned;
  }, [moonGltfScene]);

  // Slow, natural spin in place.
  useFrame(() => {
    if (moonGroup.current) {
      moonGroup.current.rotation.y += 0.0008;
    }
  });

  return (
    <group ref={group} position={[position[0], position[1], position[2]]}>
      {/* Main moon — real GLB model with HDRI lighting, scaled to size */}
      <group ref={moonGroup}>
        <primitive
          object={moonModel}
          scale={size}
          dispose={null}
        />
      </group>

      {/* Fill light so the moon's near side is evenly lit by the HDRI */}
      <ambientLight intensity={0.4} color="#c7d2fe" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.6}
        color="#ffffff"
        castShadow
      />
    </group>
  );
}

useGLTF.preload('/models/moon.glb');
