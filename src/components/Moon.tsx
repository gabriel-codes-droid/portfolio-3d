import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group, Mesh } from 'three';

interface MoonProps {
  position: [number, number, number];
  size?: number;
}

// Procedurally paint a high-contrast mottled gray moon-surface texture —
// multiple octaves of noise-like patches, dark crater shadows with bright rims,
// subtle regolith color variation, and a faint warm tint.
function useMoonTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base regolith fill — not flat gray, slightly warm-tinted variation
    const baseImage = ctx.createImageData(canvas.width, canvas.height);
    const data = baseImage.data;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      // coarse noise
      const n1 = Math.sin(x * 0.03 + y * 0.07) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.07 - y * 0.04 + 1.3) * 0.5 + 0.5;
      const n3 = Math.sin((x + y) * 0.015 + 2.7) * 0.5 + 0.5;
      const blend = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      const gray = 95 + blend * 70; // range ~95..165
      const warmth = 6; // slight brown/sepia tint
      data[i]     = Math.min(255, gray + warmth);
      data[i + 1] = Math.min(255, gray + 2);
      data[i + 2] = Math.min(255, gray - warmth);
      data[i + 3] = 255;
    }
    ctx.putImageData(baseImage, 0, 0);

    // Large mottled shading patches (low-frequency albedo variation)
    for (let i = 0; i < 320; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 6 + Math.random() * 40;
      const shade = 50 + Math.random() * 80;
      const alpha = 0.08 + Math.random() * 0.18;
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 8}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Craters — dark interior ring + bright ejecta rim + offset highlight
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 3 + Math.random() * 14;
      // shadow interior
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(20,20,25,0.55)');
      grad.addColorStop(0.6, 'rgba(30,30,36,0.35)');
      grad.addColorStop(1, 'rgba(120,120,125,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // bright rim — offset slightly to fake sun direction
      const rx = x - r * 0.18;
      const ry = y - r * 0.18;
      ctx.fillStyle = `rgba(200,200,205,${0.22 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(rx, ry, r * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // tiny secondary ejecta specks around rim
      for (let j = 0; j < 6; j++) {
        const a = Math.random() * Math.PI * 2;
        const d = r * (0.9 + Math.random() * 0.5);
        ctx.fillStyle = `rgba(220,220,225,${0.1 + Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

export default function Moon({ position, size = 3 }: MoonProps) {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const moonTexture = useMoonTexture();

  // Boulders/crater-rim bumps scattered on the visible hemisphere, in local space.
  const surfaceFeatures = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(1 - Math.random() * 0.85); // bias toward top hemisphere
      const r = size * 1.0;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      return { position: [x, y, z] as [number, number, number], scale: 0.12 + Math.random() * 0.28, key: i };
    });
  }, [size]);

  // Footprint instance positions — a few clustered near the landing seat area
  const footprintPositions = useMemo(() => {
    const fps: [number, number, number][] = [];
    // cluster near top-front of moon where the mannequin lands
    const baseX = 0.6;
    const baseZ = 2.1;
    for (let i = 0; i < 6; i++) {
      const offX = (Math.random() - 0.5) * 0.9;
      const offZ = (Math.random() - 0.5) * 0.7;
      // onto sphere surface
      const dir = new Float32Array(3);
      dir[0] = baseX + offX;
      dir[1] = -size + 0.25;
      dir[2] = baseZ + offZ;
      const len = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
      const scale = size / len;
      fps.push([dir[0]*scale, dir[1]*scale, dir[2]*scale]);
    }
    return fps;
  }, [size]);

  // Simple rover — 4 wheels + body + antenna, positioned on the moon surface
  const roverPosition = useMemo(() => {
    const theta = 1.1; // radians around sphere
    const phi = Math.acos(1 - 0.45); // slightly below equator, visible side
    const r = size * 1.02;
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) - 0.15,
      r * Math.sin(phi) * Math.sin(theta),
    ] as [number, number, number];
  }, [size]);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.0008;
    }
    // Keep the ground fixed: the seated mannequin's placement is calculated
    // against this exact sphere surface.
  });

  return (
    <group ref={group} position={[position[0], position[1], position[2]]}>
      {/* Main moon sphere — high-res, with procedural texture */}
      <mesh ref={mesh}>
        <sphereGeometry args={[size, 96, 96]} />
        <meshStandardMaterial
          map={moonTexture ?? undefined}
          color={moonTexture ? '#ffffff' : '#8b93a3'}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Raised surface bumps */}
      {surfaceFeatures.map((f) => (
        <mesh key={f.key} position={f.position} scale={f.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#3b4252" roughness={1} />
        </mesh>
      ))}

      {/* Footprints — dark flat rings on the surface near landing zone */}
      {footprintPositions.map((fp, i) => (
        <mesh key={i} position={fp} rotation={[ Math.PI / 2, 0, 0 ]}>
          <ringGeometry args={[0.04, 0.07, 16]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.5} side={2} />
        </mesh>
      ))}

      {/* Rover — sits on the moon surface, faces the camera-ish */}
      <group position={roverPosition} rotation={[0, 0.6, 0]}>
        {/* body */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.55, 0.18, 0.32]} />
          <meshStandardMaterial color="#6b7280" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* solar panel top */}
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.26]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.12, 0.34, 0]}>
          <boxGeometry args={[0.18, 0.02, 0.22]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} roughness={0.2} metalness={0.5} />
        </mesh>
        {/* antenna */}
        <mesh position={[0.22, 0.4, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.01, 0.01, 0.28, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.22, 0.55, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} roughness={0.3} />
        </mesh>
        {/* 4 wheels */}
        {[
          [-0.22, 0.06, 0.18],
          [0.22, 0.06, 0.18],
          [-0.22, 0.06, -0.18],
          [0.22, 0.06, -0.18],
        ].map((wp) => (
          <mesh key={wp[0] + wp[1] + wp[2]} position={wp as [number, number, number]}>
            <cylinderGeometry args={[0.05, 0.05, 0.07, 12]} />
            <meshStandardMaterial color="#334155" roughness={0.8} metalness={0.3} />
          </mesh>
        ))}
        {/* headlight glow */}
        <pointLight position={[0.3, 0.12, 0]} color="#c7d2fe" intensity={0.4} distance={1.5} />
      </group>

      {/* Subtle fill light */}
      <pointLight position={[5, 5, 5]} intensity={0.35} color="#c7d2fe" />
    </group>
  );
}
