import { useMemo } from 'react';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Loads the 5 Mixamo FBX animation clips and prepares them for retargeting
 * onto our character.glb (which is already Mixamo-rigged — bone names use
 * the "mixamorig" prefix WITHOUT a colon, matching the FBX track names
 * exactly since FBXLoader strips the colon).
 *
 * Root motion is stripped from each clip's hip bone: our own code already
 * moves the character between hop waypoints / from cubes to the moon, so
 * baked-in translation from the FBX would fight that and cause sliding.
 * Only the skeletal *pose* (rotation) is kept.
 */

function stripRootMotion(clip: THREE.AnimationClip, rootBoneName = 'mixamorigHips') {
  clip.tracks = clip.tracks.filter((track) => {
    // Drop the root bone's position track entirely; keep everything else
    // (including the root bone's rotation tracks, and every other
    // bone's tracks) so the pose still plays, just without drifting away.
    const isRootPosition = track.name === `${rootBoneName}.position`;
    return !isRootPosition;
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
