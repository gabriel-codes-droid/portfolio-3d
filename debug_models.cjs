import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

gltfLoader.load('C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/character.glb', (gltf) => {
  console.log('=== CHARACTER.GLB ===');
  console.log('Scene children:', gltf.scene.children.length);

  gltf.scene.traverse((child) => {
    if ((child as any).isSkinnedMesh) {
      console.log('SkinnedMesh found:', child.name);
      const skeleton = (child as any).skeleton;
      console.log('Bone count:', skeleton.bones.length);
      const boneNames = skeleton.bones.map((b: any) => b.name);
      console.log('Bone names (first 20):', boneNames.slice(0, 20));
      console.log('Bone names (all):', boneNames);
    }
  });

  console.log('Animations in GLB:', gltf.animations.length);
  if (gltf.animations.length > 0) {
    gltf.animations.forEach((clip: any, i: number) => {
      console.log(`  Clip ${i}: ${clip.name}, tracks:`, clip.tracks.map((t: any) => t.name));
    });
  }
  console.log('Children types:', gltf.scene.children.map(c => ({name: c.name, type: c.type})));
}, undefined, (err) => {
  console.error('Error loading character.glb:', err);
  process.exit(1);
});
