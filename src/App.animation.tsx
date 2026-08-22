import { Canvas } from '@react-three/fiber';
import AnimationTest from './scenes/AnimationTest';

export default function AnimationApp() {
  return (
    <div className="w-full h-screen relative">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <AnimationTest />
      </Canvas>
    </div>
  );
}
