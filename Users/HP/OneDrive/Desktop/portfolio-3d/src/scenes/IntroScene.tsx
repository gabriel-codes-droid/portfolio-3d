import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import FloatingCube from '../components/FloatingCube';

interface IntroSceneProps {}

export default function IntroScene({}: IntroSceneProps) {
  const cubeCount = 40;

  const cubes = Array.from({ length: cubeCount }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    ] as [number, number, number],
    size: 0.5 + Math.random() * 1.5,
    color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
    speed: 0.5 + Math.random() * 1.5,
    index: i
  }));

  return (
    <group>
      {/* Stars Background */}
      <Stars 
        count={2000}
        saturation={1}
        factor={10}
        radius={50}
      />
      
      {/* Ambient Light Fields */}
      <pointLight position={[0, 10, 10]} intensity={0.5} color="#a5b4fc" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#f59e0b" />
      
      {/* Floating Cubes */}
      {cubes.map((cube) => (
        <FloatingCube
          key={cube.index}
          position={cube.position}
          size={cube.size}
          color={cube.color}
          speed={cube.speed}
          index={cube.index}
        />
      ))}

      {/* Energy Orbs */}
      {[...Array(5)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          ]}
        >
          <sphereGeometry args={[0.1 + Math.random() * 0.2, 16, 16]} />
          <meshBasicMaterial 
            color={`hsl(${Math.random() * 60 + 180}, 80%, 60%)`}
            transparent 
            opacity={0.3}
            blending={8} // AdditiveBlending
          />
        </mesh>
      ))}
    </group>
  );
}