import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useMixamoAnimations, type MixamoClipName } from '../hooks/useMixamoAnimations';

export type MannequinPhase = 'idle' | 'hopping' | 'launching' | 'flying' | 'landing' | 'seated';

interface MannequinProps {
  phase: MannequinPhase;
  /** Waypoints (real cube-platform positions) the character hops between during the intro. */
  hopPoints: [number, number, number][];
  /** Written every frame while hopping, so useMannequinJourney can hand off
   * seamlessly from the local hop position into its GSAP flight tween. */
  hopPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

const HOP_DURATION = 1.9; // seconds per hop — slow, deliberate hops
// Bone the jetpack rides on. The character.glb bones use the "mixamorig"
// prefix WITHOUT a colon (FBXLoader / the export strips it), so we match
// against those exact names. Falls back gracefully to other spine levels.
const BACK_BONE_CANDIDATES = ['mixamorigSpine2', 'mixamorigSpine1', 'mixamorigSpine'];
const JETPACK_PATH = '/models/jetpack/source/Jetpack.glb';

// Module-level constant, NOT recreated per-render — this used to be defined
// inside the component body, which meant the crossfade effect's dependency
// array saw a new object identity on every render (even unrelated ones) and
// kept calling .reset() on the current animation, snapping it back to frame
// 0 before it could ever visibly play. That's what was causing the frozen
// T-pose look.
const PHASE_TO_CLIP: Record<MannequinPhase, MixamoClipName | null> = {
  idle: 'idle',
  hopping: 'hop',
  launching: 'flying',
  flying: 'flying',
  landing: 'landing',
  seated: 'seated',
};

function findBackBone(root: THREE.Object3D): THREE.Object3D | null {
  for (const name of BACK_BONE_CANDIDATES) {
    const bone = root.getObjectByName(name);
    if (bone) return bone;
  }
  return null;
}

/** Hides any mesh in the jetpack model whose name suggests it's the bundled
 * weapon prop rather than the jetpack itself. */
function hideUnwantedProps(root: THREE.Object3D) {
  root.traverse((child) => {
    if (/bazooka|weapon/i.test(child.name)) {
      child.visible = false;
    }
  });
}

/**
 * Builds the jetpack flame meshes as Object3D so they can be parented
 * directly under the spine bone (via the jetpack clone). This gives
 * true skeletal attachment — flames move with the spine during the
 * flying pose, not a fixed position on the character root.
 */
function createFlameGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'jetpack-flames';

  const flameMatL = new THREE.MeshBasicMaterial({
    color: '#67e8f9',
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flameMatR = new THREE.MeshBasicMaterial({
    color: '#a78bfa',
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cone = new THREE.ConeGeometry(0.06, 0.35, 8);

  const flameL = new THREE.Mesh(cone, flameMatL);
  flameL.position.set(-0.12, -0.3, 0);
  const flameR = new THREE.Mesh(cone, flameMatR);
  flameR.position.set(0.12, -0.3, 0);

  group.add(flameL, flameR);

  const light = new THREE.PointLight('#67e8f9', 2, 2);
  light.position.set(0, -0.35, 0);
  group.add(light);

  return group;
}

export default function Mannequin({ phase, hopPoints, hopPositionRef }: MannequinProps) {
  const group = useRef<THREE.Group>(null);
  const hopIndex = useRef(0);
  const hopStart = useRef<number | null>(null);

  const { scene: characterScene, animations: characterBuiltinAnims } = useGLTF('/models/character.glb');
  const { scene: jetpackScene } = useGLTF(JETPACK_PATH);
  const clips = useMixamoAnimations();

  // Clone the loaded scenes so multiple Mannequin instances (if ever) don't
  // fight over the same Object3D graph.
  const character = useMemo(() => characterScene.clone(true), [characterScene]);

  // Build the jetpack model once, including flame meshes attached as children
  // so they follow the spine bone's animated transform.
  const jetpack = useMemo(() => {
    const cloned = jetpackScene.clone(true);
    hideUnwantedProps(cloned);
    cloned.scale.setScalar(0.6);
    cloned.position.set(0, 0, -0.05);
    cloned.rotation.set(0, Math.PI, 0);

    // Create the flame group and parent it under the jetpack so it inherits
    // the spine bone's movement. The flames sit at the jetpack's exhaust.
    const flames = createFlameGroup();
    flames.position.set(0, 0.3, -0.02);
    cloned.add(flames);

    // Start with jetpack + flames hidden; they appear only during flying phases.
    cloned.visible = false;
    return cloned;
  }, [jetpackScene]);

  const { actions } = useAnimations(
    useMemo(
      () => [clips.idle, clips.hop, clips.flying, clips.landing, clips.seated, ...characterBuiltinAnims],
      [clips, characterBuiltinAnims]
    ),
    character
  );

  const points = useMemo(
    () => (hopPoints.length > 0 ? hopPoints : [[0, 0, 0] as [number, number, number]]),
    [hopPoints]
  );

  // Attach the jetpack to the character's back bone once, so it inherits
  // that bone's animated transform every frame for free (real skeletal
  // attachment, not a manually-copied offset).
  const backBone = useMemo(() => findBackBone(character), [character]);
  useEffect(() => {
    const parent = backBone ?? character;
    parent.add(jetpack);
    return () => {
      parent.remove(jetpack);
    };
  }, [backBone, character, jetpack]);

  // Toggle jetpack (model + flames) visibility based on phase.
  // Jetpack is visible ONLY during launching & flying — it detaches
  // during landing and is never worn during idle/seated/hopping.
  const showJetpack = phase === 'launching' || phase === 'flying';
  useEffect(() => {
    if (jetpack) {
      jetpack.visible = showJetpack;
      // Also toggle the flame sub-group
      const flames = jetpack.getObjectByName('jetpack-flames');
      if (flames) {
        flames.visible = showJetpack;
      }
    }
  }, [phase, jetpack, showJetpack]);

  // Crossfade between actions whenever the phase changes, instead of
  // hard-cutting — this is what makes transitions read as "sophisticated"
  // rather than a jump-cut between poses.
  const activeAction = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    const clipName = PHASE_TO_CLIP[phase];
    if (!clipName) return;
    const next = actions[clipName];
    if (!next) return;

    next.reset();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.fadeIn(0.4);
    next.play();

    if (activeAction.current && activeAction.current !== next) {
      activeAction.current.fadeOut(0.4);
    }
    activeAction.current = next;
  }, [phase, actions]);

  // Lean forward during flight for a game-like flying pose.
  // Smoothed in useFrame below for a natural acceleration/deceleration.
  const leaning = phase === 'flying' || phase === 'launching';

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // Smooth lean during flight/idle for game-like responsiveness
    const targetLean = leaning ? Math.PI / 5 : 0;
    group.current.rotation.x += (targetLean - group.current.rotation.x) * 0.08;

    if (phase === 'idle') {
      hopStart.current = null;
      hopIndex.current = 0;
      const p0 = points[0];
      group.current.position.set(p0[0], p0[1], p0[2]);
      // Subtle idle sway — slight breathing/bobbing
      group.current.position.y += Math.sin(t * 2) * 0.01;
      group.current.rotation.z = 0;
      hopPositionRef?.current.copy(group.current.position);
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

      // Report our local position so useMannequinJourney's launch() can pick
      // up exactly where the hop left off when it seeds the wrapper's tween.
      hopPositionRef?.current.copy(group.current.position);
      return;
    }

    // Every other phase (launching/flying/landing/seated) is driven entirely
    // by the OUTER wrapper's GSAP tween in useMannequinJourney — this inner
    // group must sit at local (0,0,0) so it doesn't add a leftover offset on
    // top of the wrapper's position. Without this, the last hop's local
    // offset stayed frozen here forever, shifting the character away from
    // the actual moon seat position by that amount (why he looked like he
    // was floating near the planets instead of sitting on the moon).
    group.current.position.set(0, 0, 0);

    // Jetpack flame flicker during launch/flight (driven via the bone-attached
    // sub-mesh, so it automatically follows the spine bone's pose).
    if ((phase === 'launching' || phase === 'flying') && jetpack) {
      const flames = jetpack.getObjectByName('jetpack-flames') as THREE.Group | undefined;
      if (flames) {
        const flicker = 0.7 + Math.sin(t * 30) * 0.2 + Math.random() * 0.1;
        flames.traverse((child) => {
          if ((child as any).isMesh) {
            const meshChild = child as any;
            if (meshChild.material) {
              if (Array.isArray(meshChild.material)) {
                meshChild.material.forEach((m: any) => m.opacity = 0.85 * flicker);
              } else {
                meshChild.material.opacity = 0.85 * flicker;
              }
            }
          }
        });
      }
    }
  });

  return (
    <group ref={group}>
      <primitive object={character} scale={1} />
    </group>
  );
}

useGLTF.preload('/models/character.glb');
useGLTF.preload(JETPACK_PATH);
