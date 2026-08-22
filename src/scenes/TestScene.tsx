import SimpleMannequin from '../components/SimpleMannequin';

export default function TestScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <SimpleMannequin 
        position={[0, 0, 0]} 
        scale={0.01} 
        animation="idle" 
      />
    </>
  );
}
