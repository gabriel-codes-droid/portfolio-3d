import { useState } from 'react';
import WorkingMannequin from '../components/WorkingMannequin';
import { MOON_CENTER, MOON_RADIUS } from '../moonConstants';

export default function AnimationTest() {
  const [animationState, setAnimationState] = useState<'idle' | 'flying' | 'landing' | 'sitting'>('idle');

  // Calculate seat position on top of moon
  const seatPosition: [number, number, number] = [
    MOON_CENTER[0],
    MOON_CENTER[1] + MOON_RADIUS,
    MOON_CENTER[2]
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Moon */}
      <mesh position={MOON_CENTER} scale={MOON_RADIUS}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#888888" roughness={0.8} />
      </mesh>

      {/* Mannequin on moon */}
      <WorkingMannequin 
        position={seatPosition}
        scale={0.01}
        animationState={animationState}
      />

      {/* Controls */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}>
        <button onClick={() => setAnimationState('idle')}>Idle</button>
        <button onClick={() => setAnimationState('flying')}>Flying</button>
        <button onClick={() => setAnimationState('landing')}>Landing</button>
        <button onClick={() => setAnimationState('sitting')}>Sitting</button>
      </div>
    </>
  );
}
