import * as THREE from 'three';

export const randomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  const x = r * sinPhi * Math.cos(theta);
  const y = r * sinPhi * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const getTreePosition = (
  i: number, 
  count: number, 
  radiusBase: number, 
  height: number,
  yOffset: number = 0
): THREE.Vector3 => {
  // Spiral distribution on a cone (Used for Foliage structure)
  const p = i / count;
  const angle = p * Math.PI * 40; // Number of turns
  const y = height * p; // Height goes up
  const r = radiusBase * (1 - p); // Radius gets smaller as we go up
  
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return new THREE.Vector3(x, y + yOffset, z);
};

export const getTreeSurfacePosition = (
  radiusBase: number, 
  height: number,
  yOffset: number = 0
): THREE.Vector3 => {
  // Disordered/Random distribution on cone surface
  // We use 1 - sqrt(random) for height to ensure uniform density 
  // (preventing clustering at the top where the cone is narrower)
  
  const u = Math.random();
  const hRatio = 1 - Math.sqrt(u); // Denser at bottom (0), sparse at top (1) matches area distribution
  
  const y = height * hRatio;
  const r = radiusBase * (1 - hRatio);
  const theta = Math.random() * Math.PI * 2;
  
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  return new THREE.Vector3(x, y + yOffset, z);
};