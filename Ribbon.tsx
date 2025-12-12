import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint } from '../utils/math';
import { TreeMode } from '../types';

interface RibbonProps {
  mode: string;
}

export const Ribbon: React.FC<RibbonProps> = ({ mode }) => {
  const count = 400; // Number of segments to make the ribbon smooth
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // 1. Chaos Position
      // Wider scatter for chaos
      const chaos = randomSpherePoint(25);

      // 2. Target Position (Spiral Helix)
      const p = i / count; // 0 to 1
      
      // Tree dimensions matching Foliage
      const height = 11.0; 
      const radiusBase = 5.0;
      
      // Calculate Spiral
      const turns = 4.5;
      const angle = p * Math.PI * 2 * turns;
      
      const y = (1 - p) * height - 5.5; // Top to bottom
      const currentRadius = radiusBase * (1 - (y + 5.5) / height) + 0.5; // Tapered
      
      const x = currentRadius * Math.cos(angle);
      const z = currentRadius * Math.sin(angle);
      
      const target = new THREE.Vector3(x, y, z);

      // 3. Orientation
      const nextP = (i + 1) / count;
      const nextAngle = nextP * Math.PI * 2 * turns;
      const nextY = (1 - nextP) * height - 5.5;
      const nextR = radiusBase * (1 - (nextY + 5.5) / height) + 0.5;
      const nextX = nextR * Math.cos(nextAngle);
      const nextZ = nextR * Math.sin(nextAngle);
      const lookAtTarget = new THREE.Vector3(nextX, nextY, nextZ);

      return {
        chaos,
        target,
        lookAtTarget
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    // Initial color setup
    // Pale Champagne Gold
    const color = new THREE.Color('#FFFACD'); 
    for (let i = 0; i < count; i++) {
        meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [count]);

  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const targetMode = mode === TreeMode.FORMED ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, targetMode, 1.0, delta);
    const t = progress.current;
    
    // Ease out cubic
    const easedT = 1 - Math.pow(1 - t, 3);
    const time = state.clock.getElapsedTime();

    data.forEach((d, i) => {
        // Interpolate position
        tempObject.position.lerpVectors(d.chaos, d.target, easedT);
        
        if (t < 0.1) {
            tempObject.rotation.set(time + i, time * 0.5, i);
        } else {
            tempObject.lookAt(d.lookAtTarget);
            tempObject.rotateZ(Math.sin(time * 2 + i * 0.1) * 0.2);
        }
        
        const scale = 1.0 + Math.sin(time * 3 + i * 0.05) * 0.1;
        tempObject.scale.set(1, 1, scale); 

        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      {/* A thin, wide box acts as a ribbon segment */}
      <boxGeometry args={[0.15, 0.05, 0.6]} />
      {/* Increased transparency, pale color, high roughness for fabric look */}
      <meshStandardMaterial 
        color="#FFFACD" 
        transparent 
        opacity={0.35} 
        roughness={0.4} 
        metalness={0.8} 
        emissive="#FFFACD"
        emissiveIntensity={0.1}
      />
    </instancedMesh>
  );
};