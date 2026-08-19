import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useAnimations, useFBX, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type MannequinPhase = 'idle' | 'hopping' | 'launching' | 'flying' | 'seated';

interface MannequinProps {
  phase: MannequinPhase;
  /** Waypoints (cube tops) the mannequin hops between during the intro. */
  hopPoints: [number, number, number][];
  /** Latest local cube-top location, handed to the flight wrapper on launch. */
  hopPositionRef: MutableRefObject<THREE.Vector3>;
}

const BODY_COLOR = '#e2e8f0';
const SUIT_COLOR = '#a78bfa';
const VISOR_COLOR = '#22d3ee';
const HOP_DURATION = 1.9; // seconds per hop — slow, deliberate hops

const CHARACTER_URL = '/models/character.glb';

function AnimatedCharacter({ phase }: Pick<MannequinProps, 'phase'>) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CHARACTER_URL);
  const idle = useFBX('/models/idle.fbx');
  const jumping = useFBX('/models/jump.fbx');
  const flying = useFBX('/models/flying.fbx');
  const landing = useFBX('/models/landing.fbx');
  const sitting = useFBX('/models/sitting.fbx');

  const character = useMemo(() => clone(scene), [scene]);
  // FBX exports commonly reuse a clip name (for example, "mixamo.com").
  // Clone and name each one here so useAnimations keeps every phase instead
  // of silently replacing earlier actions with the last-loaded file.
  const clipsByPhase = useMemo(() => {
    const namedClip = (asset: THREE.Group, name: string) => {
      const clip = asset.animations[0]?.clone();
      if (clip) clip.name = name;
      return clip;
    };
    return {
      idle: namedClip(idle, 'portfolio-idle'),
      hopping: namedClip(jumping, 'portfolio-hop'),
      launching: namedClip(flying, 'portfolio-launch'),
      flying: namedClip(flying, 'portfolio-flying'),
      seated: namedClip(sitting, 'portfolio-seated') ?? namedClip(landing, 'portfolio-landing'),
    };
  }, [idle, jumping, flying, landing, sitting]);
  const clips = useMemo(
    () => Object.values(clipsByPhase).filter((clip): clip is THREE.AnimationClip => Boolean(clip)),
    [clipsByPhase]
  );
  const { actions } = useAnimations(clips, root);

  useEffect(() => {
    const name = clipsByPhase[phase]?.name;
    const action = name ? actions[name] : undefined;
    action?.reset().fadeIn(0.22).play();
    return () => {
      action?.fadeOut(0.18);
    };
  }, [actions, clipsByPhase, phase]);

  return (
    <group ref={root} scale={0.78}>
      <primitive object={character} dispose={null} />
    </group>
  );
}

useGLTF.preload(CHARACTER_URL);

/**
 * A simple low-poly astronaut/mannequin built entirely from primitives
 * (no external model assets required). Stands still until the journey
 * starts, hops across the floating cube field, then ignites its jetpack
 * and flies down to the moon scene where it "sits" to watch the projects.
 */
export default function Mannequin({ phase, hopPoints, hopPositionRef }: MannequinProps) {
  const group = useRef<THREE.Group>(null);
  const flameL = useRef<THREE.Mesh>(null);
  const flameR = useRef<THREE.Mesh>(null);
  const hopIndex = useRef(0);
  const hopStart = useRef<number | null>(null);
  const previousPhase = useRef<MannequinPhase>(phase);

  const points = useMemo(
    () => (hopPoints.length > 0 ? hopPoints : [[0, 0, 0] as [number, number, number]]),
    [hopPoints]
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    if (phase === 'idle') {
      hopStart.current = null;
      hopIndex.current = 0;
      // Stand on the first waypoint with a gentle idle breathing bob
      const p0 = points[0];
      group.current.position.set(p0[0], p0[1] + Math.sin(t * 1.5) * 0.03, p0[2]);
      group.current.rotation.z = 0;
      hopPositionRef.current.copy(group.current.position);
      return;
    }

    if (phase === 'hopping') {
      if (hopStart.current === null) hopStart.current = t;
      const cycle = (t - hopStart.current) / HOP_DURATION;
      if (cycle >= 1) {
        hopStart.current = t;
        hopIndex.current = (hopIndex.current + 1) % points.length;
      }
      const progress = Math.min(Math.max(((t - hopStart.current) / HOP_DURATION) % 1, 0), 1);

      const from = points[hopIndex.current];
      const to = points[(hopIndex.current + 1) % points.length];
      const arc = Math.sin(progress * Math.PI) * 1.0;

      group.current.position.set(
        THREE.MathUtils.lerp(from[0], to[0], progress),
        THREE.MathUtils.lerp(from[1], to[1], progress) + arc,
        THREE.MathUtils.lerp(from[2], to[2], progress)
      );

      const dx = to[0] - from[0];
      const dz = to[2] - from[2];
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        group.current.rotation.y = Math.atan2(dx, dz);
      }
      group.current.rotation.z = Math.sin(progress * Math.PI) * 0.12;
      hopPositionRef.current.copy(group.current.position);
    }

    // Jetpack flame flicker during launch/flight
    if ((phase === 'launching' || phase === 'flying') && flameL.current && flameR.current) {
      const flicker = 0.7 + Math.sin(t * 30) * 0.2 + Math.random() * 0.1;
      flameL.current.scale.set(1, flicker, 1);
      flameR.current.scale.set(1, flicker, 1);
    }
  });

  useEffect(() => {
    // Once the parent wrapper takes over for flight, clear the local cube
    // offset so the moon landing resolves exactly at the computed seat point.
    if (previousPhase.current === 'hopping' && phase !== 'hopping') {
      group.current?.position.set(0, 0, 0);
    }
    previousPhase.current = phase;
  }, [phase]);

  const showFlame = phase === 'launching' || phase === 'flying';
  const leaning = phase === 'flying' || phase === 'launching';
  // Jetpack only appears right as he launches — matches "stands, then jumps
  // and the jetpack appears" rather than wearing it the whole time.
  const hasJetpack = phase === 'launching' || phase === 'flying';
  const seated = phase === 'seated';

  return (
    <group ref={group}>
      <group rotation={[leaning ? Math.PI / 4 : 0, seated ? Math.PI : 0, 0]}>
        {/* Supplied rigged character plus its idle/jump/flying/sitting clips. */}
        <AnimatedCharacter phase={phase} />

        {/* Retained as an unloaded-asset-safe fallback; the supplied model is
            rendered above in normal operation. */}
        <group visible={false}>
        {/* Head */}
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.4} />
        </mesh>
        {/* Visor */}
        <mesh position={[0, 1.55, 0.18]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial
            color={VISOR_COLOR}
            emissive={VISOR_COLOR}
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.05, 0]}>
          <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.36, 1.05, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.5} />
        </mesh>
        <mesh position={[0.36, 1.05, 0]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
          <meshStandardMaterial color={BODY_COLOR} roughness={0.5} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.12, seated ? 0.55 : 0.4, seated ? 0.2 : 0]} rotation={[seated ? -Math.PI / 2.1 : 0, 0, 0]}>
          <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.5} />
        </mesh>
        <mesh position={[0.12, seated ? 0.55 : 0.4, seated ? 0.2 : 0]} rotation={[seated ? -Math.PI / 2.1 : 0, 0, 0]}>
          <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.5} />
        </mesh>

        {/* Jetpack — appears only when he's about to launch, ditched once seated */}
        {hasJetpack && (
          <>
            <mesh position={[0, 1.1, -0.28]}>
              <boxGeometry args={[0.42, 0.55, 0.2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[-0.12, 0.78, -0.28]}>
              <cylinderGeometry args={[0.07, 0.09, 0.18, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.12, 0.78, -0.28]}>
              <cylinderGeometry args={[0.07, 0.09, 0.18, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}

        {/* Jetpack flames */}
        {showFlame && (
          <>
            <mesh ref={flameL} position={[-0.12, 0.6, -0.28]}>
              <coneGeometry args={[0.06, 0.35, 8]} />
              <meshBasicMaterial color="#67e8f9" transparent opacity={0.85} />
            </mesh>
            <mesh ref={flameR} position={[0.12, 0.6, -0.28]}>
              <coneGeometry args={[0.06, 0.35, 8]} />
              <meshBasicMaterial color="#a78bfa" transparent opacity={0.85} />
            </mesh>
            <pointLight position={[0, 0.6, -0.28]} color="#67e8f9" intensity={2} distance={2} />
          </>
        )}
        </group>
      </group>
    </group>
  );
}
