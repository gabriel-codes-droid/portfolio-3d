import { useMemo } from 'react';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Loads the 5 Mixamo FBX animation clips. Bone-name remapping to match
 * character.glb's actual skeleton happens in Mannequin.tsx (it needs the
 * loaded character to know the real names) — this hook only handles loading
 * and stripping root motion, in a way that doesn't assume any particular
 * naming convention (colon vs no colon), since guessing that wrong is
 * exactly what caused animations to silently have zero visible effect
 * before: the track names simply didn't match any bone in the skeleton.
 */
function stripRootMotion(clip: THREE.AnimationClip) {
  clip.tracks = clip.tracks.filter((track) => {
    if (!track.name.endsWith('.position')) return true;
    const nodeName = track.name.slice(0, track.name.lastIndexOf('.'));
    // Match the root/hip bone regardless of exact naming convention
    // ("mixamorig:Hips", "mixamorigHips", "Hips", etc.)
    const isRootBone = /hips?$/i.test(nodeName.replace(/[:_.]/g, ''));
    return !isRootBone;
  });
  return clip;
}

export type MixamoClipName = 'idle' | 'hop' | 'flying' | 'landing' | 'seated';

const IDLE_PATH    = '/models/idle.fbx';
const JUMP_PATH    = '/models/jump.fbx';
const FLYING_PATH  = '/models/flying.fbx';
const LANDING_PATH = '/models/landing.fbx';
const SITTING_PATH = '/models/sitting.fbx';

export function useMixamoAnimations() {
  const idleFbx   = useFBX(IDLE_PATH);
  const hopFbx    = useFBX(JUMP_PATH);
  const flyingFbx = useFBX(FLYING_PATH);
  const landingFbx = useFBX(LANDING_PATH);
  const seatedFbx  = useFBX(SITTING_PATH);

  const clips = useMemo(() => {
    const map: Record<MixamoClipName, THREE.AnimationClip> = {
      idle:   idleFbx.animations[0].clone(),
      hop:    hopFbx.animations[0].clone(),
      flying: flyingFbx.animations[0].clone(),
      landing: landingFbx.animations[0].clone(),
      seated: seatedFbx.animations[0].clone(),
    };
    (Object.keys(map) as MixamoClipName[]).forEach((key) => {
      map[key].name = key;
      stripRootMotion(map[key]);
    });
    return map;
  }, [idleFbx, hopFbx, flyingFbx, landingFbx, seatedFbx]);

  return clips;
}

useFBX.preload(IDLE_PATH);
useFBX.preload(JUMP_PATH);
useFBX.preload(FLYING_PATH);
useFBX.preload(LANDING_PATH);
useFBX.preload(SITTING_PATH);
