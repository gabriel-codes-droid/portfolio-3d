import { useRef, useEffect } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import type { Group } from 'three';
import { useFBXAnimations } from '../hooks/useFBXAnimations';

interface FBXCharacterProps {
  position?: [number, number, number];
  scale?: number;
  animation?: 'idle' | 'flying' | 'landing' | 'jump' | 'sitting';
}

export default function FBXCharacter({ 
  position = [0, 0, 0], 
  scale = 1,
  animation = 'idle'
}: FBXCharacterProps) {
  const group = useRef<Group>(null);
  
  // Load character model
  const { scene: character } = useFBX('/models/character.glb');
  
  // Load animations using our custom hook
  const animations = useFBXAnimations();

  // Setup animations with useAnimations hook
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
