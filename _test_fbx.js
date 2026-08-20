const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
const fs = require('fs');

const loader = new FBXLoader();
const fbxFiles = {
  idle: 'C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/idle.fbx',
  sitting: 'C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/sitting.fbx',
  jump: 'C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/jump.fbx',
  flying: 'C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/flying.fbx',
  landing: 'C:/Users/HP/OneDrive/Desktop/portfolio-3d/public/models/landing.fbx',
};

const results = [];
for (const [name, path] of Object.entries(fbxFiles)) {
  const buffer = fs.readFileSync(path);
  const text = Buffer.from(buffer).toString('binary');
  const fbx = loader.parse(text);
  const anims = fbx.animations || [];
  results.push({
    name,
    animations_count: anims.length,
    clips: anims.map(a => ({
      name: a.name,
      duration: a.duration,
      tracks_count: a.tracks.length,
      bones_animated: [...new Set(a.tracks.map(t => t.name.split('.')[0]))],
      sample_tracks: a.tracks.slice(0, 8).map(t => t.name),
    })),
  });
}
console.log(JSON.stringify(results, null, 2));
