import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

type AnimationState = 'idle' | 'flying' | 'landing' | 'sitting';

interface WorkingMannequinProps {
  position?: [number, number, number];
  scale?: number;
  animationState: AnimationState;
}

export default function WorkingMannequin({ 
  position = [0, 0, 0], 
  scale = 0.01,
  animationState = 'idle'
}: WorkingMannequinProps) {
  const group = useRef<THREE.Group>(null);
  const [loaded, setLoaded] = useState(false);
  
  // Load character mesh from idle.fbx
  const { scene: character } = useFBX('/models/idle.fbx');
  
  // Load animations
  const idleAnim = useFBX('/models/idle.fbx');
  const flyingAnim = useFBX('/models/flying.fbx');
  const landingAnim = useFBX('/models/landing.fbx');
  const sittingAnim = useFBX('/models/sitting.fbx');

  // Animation mapping
  const animations = {
    idle: idleAnim.animations[0],
    flying: flyingAnim.animations[0],
    landing: landingAnim.animations[0],
    sitting: sittingAnim.animations[0]
  };

  const { actions } = useAnimations(Object.values(animations), group);

  useEffect(() => {
    if (!character || !actions) return;
    setLoaded(true);
  }, [character, actions]);

  useEffect(() => {
    if (!loaded || !actions) return;

    // Stop all animations
    Object.values(actions).forEach(action => {
      action?.stop();
    });

    // Play current animation
    const currentAction = actions[animationState];
    if (currentAction) {
      currentAction.reset().fadeIn(0.3).play();
      console.log('Playing animation:', animationState);
    }
  }, [animationState, loaded, actions]);

  // Breathing effect for idle
  useFrame((state) => {
    if (!group.current || animationState !== 'idle') return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02;
  });

  if (!loaded) return null;

  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={character} />
    </group>
  );
}
