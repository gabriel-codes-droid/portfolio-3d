import { useRef, useEffect } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import type { Group } from 'three';

interface AnimatedCharacterProps {
  position?: [number, number, number];
  scale?: number;
  animation?: 'idle' | 'flying' | 'landing' | 'jump' | 'sitting';
}

export default function AnimatedCharacter({ 
  position = [0, 0, 0], 
  scale = 1,
  animation = 'idle'
}: AnimatedCharacterProps) {
  const group = useRef<Group>(null);
  
  // Load character model
  const { scene: character } = useFBX('/models/character.glb');
  
  // Load animations
  const idle = useFBX('/models/idle.fbx');
  const flying = useFBX('/models/flying.fbx');
  const landing = useFBX('/models/landing.fbx');
  const jump = useFBX('/models/jump.fbx');
  const sitting = useFBX('/models/sitting.fbx');

  // Setup animations
  const animations = {
    idle: idle.animations[0],
    flying: flying.animations[0],
    landing: landing.animations[0],
    jump: jump.animations[0],
    sitting: sitting.animations[0]
  };

  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Stop all animations first
    Object.values(actions).forEach(action => {
      action?.stop();
    });

    // Play the selected animation
    const currentAction = actions[animation];
    if (currentAction) {
      currentAction.reset().fadeIn(0.5).play();
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
