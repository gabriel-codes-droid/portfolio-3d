import { useMemo } from 'react';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';

export type FBXAnimationName = 'idle' | 'flying' | 'landing' | 'jump' | 'sitting';

interface FBXAnimations {
  [key: string]: THREE.AnimationClip;
}

export function useFBXAnimations(): FBXAnimations {
  const idle = useFBX('/models/idle.fbx');
  const flying = useFBX('/models/flying.fbx');
  const landing = useFBX('/models/landing.fbx');
  const jump = useFBX('/models/jump.fbx');
  const sitting = useFBX('/models/sitting.fbx');

  const animations = useMemo(() => ({
    idle: idle.animations[0],
    flying: flying.animations[0],
    landing: landing.animations[0],
    jump: jump.animations[0],
    sitting: sitting.animations[0]
  }), [idle, flying, landing, jump, sitting]);

  return animations;
}
