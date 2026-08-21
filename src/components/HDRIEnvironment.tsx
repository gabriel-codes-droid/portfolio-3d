import { Environment } from '@react-three/drei';

export default function HDRIEnvironment() {
  return (
    <Environment 
      background 
      files="/models/night-sky.exr"
      blur={0.8}
    />
  );
}
