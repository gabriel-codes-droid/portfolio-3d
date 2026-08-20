import { useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import Moon from '../components/Moon';
import Planet from '../components/Planet';
import SketchfabPlanet from '../components/SketchfabPlanet';
import { usePlanetNavigation } from '../hooks/usePlanetNavigation';
import { useCameraAnimation } from '../hooks/useCameraAnimation';
import { projects } from '../data/projects';
import type { Project } from '../data/projects';

export interface PlanetNavAPI {
  next: () => void;
  prev: () => void;
}

interface ProjectSystemsProps {
  onProjectSelect: (project: Project) => void;
  onBack: () => void;
  onNavReady?: (api: PlanetNavAPI) => void;
}

// Planet colors
const PLANET_COLORS: Record<string, string> = {
  'healthcare-referral-system': '#00d4ff',
  dineconnect: '#ff6b35',
  kartz: '#a855f7',
  'personal-management-dashboard': '#06b6d4',
};

export default function ProjectSystems({ onProjectSelect, onNavReady }: ProjectSystemsProps) {
  // The gallery stays in its requested horizontal composition. Individual
  // planets still rotate in Planet.tsx, while buttons only browse on demand.
  const { groupRef, rotateBy } = usePlanetNavigation(0);
  const { flyTo } = useCameraAnimation();

  // A composed horizontal project line, directly in the seated mannequin's
  // field of view. Keeping a shared depth makes the project selection state
  // feel like a gallery rather than an orbit that hides planets behind moon.
  const step = Math.PI / 5;
  const spacing = 4.15;
  const planetPositions = projects.map((_, index) => {
    return [(index - (projects.length - 1) / 2) * spacing, 0.9, -5.5] as [
      number,
      number,
      number,
    ];
  });

  useEffect(() => {
    onNavReady?.({
      next: () => rotateBy(step),
      prev: () => rotateBy(-step),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlanetClick = (project: Project, localPosition: [number, number, number]) => {
    if (!groupRef.current) {
      onProjectSelect(project);
      return;
    }
    const world = groupRef.current.localToWorld(new THREE.Vector3(...localPosition));
    flyTo([world.x, world.y, world.z], 3.2, () => onProjectSelect(project));
  };

  return (
    <group>
      {/* Stars Background */}
      <Stars count={5000} saturation={0.8} factor={10} />

      {/* Ambient Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Moon */}
      <Moon position={[0, -5, 0]} size={3} />

      {/* Sketchfab planet embed — spins in place like the procedural planets.
          Positioned in the upper portion of the scene so it's visible above
          the moon without blocking the orbit group. */}
      <Suspense fallback={null}>
        <SketchfabPlanet
          position={[0, 5.5, -6]}
          size={1.4}
          modelId="a0ad382f4d6c4cf190f5537e5248b33d"
          title="Planet Reststop"
        />
      </Suspense>

      {/* Orbiting Planets — drag left/right (or use the arrow buttons) to browse, click to fly in */}
      <group ref={groupRef}>
        {projects.map((project, index) => (
          <Planet
            key={project.id}
            position={planetPositions[index]}
            size={1.2}
            color={PLANET_COLORS[project.id] || '#ffffff'}
            texture={project.texture}
            name={project.title}
            index={index}
            onSelect={() => handlePlanetClick(project, planetPositions[index])}
          />
        ))}
      </group>

      {/* Drag left/right (or use the arrow buttons) to browse planets —
          intentionally no OrbitControls here, it was fighting CameraRig's
          camera tween every frame and knocking the moon out of view. */}
    </group>
  );
}
