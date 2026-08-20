// Polyfill for Node.js
globalThis.ProgressEvent = class ProgressEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.lengthComputable = params.lengthComputable || false;
    this.loaded = params.loaded || 0;
    this.total = params.total || 0;
  }
};

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

const BASE = 'http://localhost:8099';

gltfLoader.load(BASE + '/models/character.glb', (gltf) => {
  console.log('=== CHARACTER.GLB ===');
  console.log('Scene children:', gltf.scene.children.length);

  gltf.scene.traverse((child) => {
    if (child.isSkinnedMesh) {
      console.log('SkinnedMesh found:', child.name);
      const skeleton = child.skeleton;
      console.log('Bone count:', skeleton.bones.length);
      const boneNames = skeleton.bones.map(b => b.name);
      console.log('Bone names (all):', boneNames);
    }
  });

  console.log('Animations in GLB:', gltf.animations.length);
  if (gltf.animations.length > 0) {
    gltf.animations.forEach((clip, i) => {
      console.log('  Clip ' + i + ': ' + clip.name + ', tracks:', clip.tracks.map(t => t.name));
    });
  }
  console.log('Children types:', gltf.scene.children.map(c => ({name: c.name, type: c.type})));

  const fbxFiles = ['idle.fbx', 'jump.fbx', 'flying.fbx', 'landing.fbx', 'sitting.fbx'];
  let loaded = 0;
  
  fbxFiles.forEach((file) => {
    fbxLoader.load(BASE + '/models/' + file, (fbx) => {
      console.log('\n=== ' + file + ' ===');
      console.log('Animations:', fbx.animations.length);
      if (fbx.animations.length > 0) {
        const clip = fbx.animations[0];
        console.log('Clip name:', clip.name);
        console.log('Total tracks:', clip.tracks.length);
        console.log('All track names:', clip.tracks.map(t => t.name));
      } else {
        console.log('NO animations found in FBX!');
      }
      loaded++;
      if (loaded === fbxFiles.length) {
        console.log('\n=== DONE ===');
        process.exit(0);
      }
    }, undefined, (err) => {
      console.error('FBX Error for', file, err);
      loaded++;
      if (loaded === fbxFiles.length) {
        console.log('\n=== DONE ===');
        process.exit(0);
      }
    });
  });
}, undefined, (err) => {
  console.error('GLB Error:', err);
  process.exit(1);
});
