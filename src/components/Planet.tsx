import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group, Mesh } from 'three';
import { Html } from '@react-three/drei';

interface PlanetProps {
  position: [number, number, number];
  size: number;
  color: string;
  texture: string;
  name: string;
  index: number;
  onSelect?: () => void;
}

// Blend a hex color toward black/white to get lighter/darker continent tones
function shade(hex: string, amount: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `rgb(${r},${g},${b})`;
}

// Procedurally paints a mottled "continents" texture in the planet's own
// color palette — no external image assets needed, so it can never 404.
function usePlanetTexture(color: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = shade(color, -40);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 90; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 10 + Math.random() * 45;
      const lighten = Math.random() > 0.5;
      ctx.fillStyle = shade(color, lighten ? 40 + Math.random() * 40 : -20 - Math.random() * 30);
      ctx.globalAlpha = 0.5 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [color]);
}

export default function Planet({
  position,
  size,
  color,
  name,
  onSelect,
}: PlanetProps) {
  const mesh = useRef<Mesh>(null);
  const particlesGroup = useRef<Group>(null);
  const [hovered, setHover] = useState(false);
  const rotationSpeed = useMemo(() => 0.01 + Math.random() * 0.02, []);
  const planetTexture = usePlanetTexture(color);

  const orbitParticles = useMemo(() => {
    const count = 14;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = size * 1.6 + Math.random() * 0.3;
      return { angle, radius, speed: 0.3 + Math.random() * 0.4, y: (Math.random() - 0.5) * size * 0.6 };
    });
  }, [size]);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += rotationSpeed;

      const targetScale = hovered ? 1.15 : 1;
      const currentScale = mesh.current.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * Math.min(delta * 6, 1);
      mesh.current.scale.setScalar(nextScale);
    }

    if (particlesGroup.current) {
      particlesGroup.current.rotation.y += delta * 0.15;
      const time = state.clock.getElapsedTime();
      particlesGroup.current.children.forEach((child, i) => {
        const p = orbitParticles[i];
        if (!p) return;
        const a = p.angle + time * p.speed;
        child.position.set(Math.cos(a) * p.radius, p.y, Math.sin(a) * p.radius);
      });
    }
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* Planet body — procedurally textured, not a flat color sphere */}
      <mesh ref={mesh}>
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          map={planetTexture ?? undefined}
          color={planetTexture ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.22}
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>

      {/* Persistent soft glow shell (works without a postprocessing bloom pass) */}
      <mesh scale={1.4}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.22 : 0.12} />
      </mesh>
      <mesh scale={1.9}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.1 : 0.05} />
      </mesh>

      {/* Orbiting particles */}
      <group ref={particlesGroup}>
        {orbitParticles.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[size * 0.05, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      <pointLight color={color} intensity={hovered ? 1.2 : 0.5} distance={size * 6} />

      {/* Label */}
      {hovered && (
        <Html position={[0, size + 1.3, 0]} center distanceFactor={12}>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap backdrop-blur border"
            style={{ background: 'rgba(0,0,0,0.75)', borderColor: color, boxShadow: `0 0 12px ${color}` }}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}
