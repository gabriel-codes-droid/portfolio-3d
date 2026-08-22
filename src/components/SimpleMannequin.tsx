import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface SimpleMannequinProps {
  position?: [number, number, number];
  scale?: number;
  animation?: 'idle' | 'flying' | 'landing' | 'jump' | 'sitting';
}

export default function SimpleMannequin({ 
  position = [0, 0, 0], 
  scale = 0.01,
  animation = 'idle'
}: SimpleMannequinProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load character from idle.fbx (this has the mesh + skeleton)
  const { scene: character } = useFBX('/models/idle.fbx');
  
  // Load each animation file separately
  const idle = useFBX('/models/idle.fbx');
  const flying = useFBX('/models/flying.fbx');
  const landing = useFBX('/models/landing.fbx');
  const jump = useFBX('/models/jump.fbx');
  const sitting = useFBX('/models/sitting.fbx');

  // Extract animations from each FBX
  const animations = {
    idle: idle.animations[0],
    flying: flying.animations[0],
    landing: landing.animations[0],
    jump: jump.animations[0],
    sitting: sitting.animations[0]
  };

  // Use the animations hook
  const { actions } = useAnimations(Object.values(animations), group);

  useEffect(() => {
    // Stop all animations first
    Object.values(actions).forEach(action => {
      action?.stop();
    });

    // Play the selected animation
    const currentAction = actions[animation];
    if (currentAction) {
      currentAction.reset().fadeIn(0.5).play();
      console.log('Playing animation:', animation);
    }

    return () => {
      currentAction?.fadeOut(0.5);
    };
  }, [animation, actions]);

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={character} />
    </group>
  );
}
