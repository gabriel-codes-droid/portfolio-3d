import { Canvas } from '@react-three/fiber';
import TestScene from './scenes/TestScene';

export default function TestApp() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <TestScene />
      </Canvas>
    </div>
  );
}
