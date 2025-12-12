import * as THREE from 'three';
import React from 'react';

// Manually declaring the intrinsic elements used in the project
// to ensure TypeScript recognizes them globally, bypassing potential 
// library type definition issues.

export enum TreeMode {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export type Theme = 'CLASSIC' | 'SNOWY' | 'ICY';

export interface OrnamentData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  rotationSpeed: number;
  wobbleSpeed: number;
}

// Define the properties for our custom three elements
export interface ThreeElements {
  // Core
  group: any;
  mesh: any;
  points: any;
  instancedMesh: any;
  primitive: any;

  // Geometries
  bufferGeometry: any;
  boxGeometry: any;
  coneGeometry: any;
  cylinderGeometry: any;
  dodecahedronGeometry: any;
  sphereGeometry: any;
  octahedronGeometry: any;
  circleGeometry: any;
  planeGeometry: any;
  torusGeometry: any;

  // Materials
  shaderMaterial: any;
  meshStandardMaterial: any;
  meshBasicMaterial: any;

  // Lights
  ambientLight: any;
  spotLight: any;
  pointLight: any;

  // Attributes & Helpers
  bufferAttribute: any;
  color: any;

  // Catch-all
  [elemName: string]: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}