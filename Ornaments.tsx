import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint, getTreeSurfacePosition } from '../utils/math';
import { TreeMode } from '../types';

interface OrnamentsProps {
  mode: string;
  count: number;
  type: 'box' | 'sphere' | 'triangle' | 'cylinder' | 'cone' | 'dodecahedron' | 'flat-box' | 'star';
  colorPalette: string[];
  scaleRange: [number, number];
  weight: number; // Affects speed of transition
  emissive?: boolean;
  emissiveIntensity?: number;
  geometryScale?: [number, number, number]; // Optional local scaling for shape distortion
}

export const Ornaments: React.FC<OrnamentsProps> = ({ 
  mode, 
  count, 
  type, 
  colorPalette,
  scaleRange,
  weight,
  emissive = false,
  emissiveIntensity = 0,
  geometryScale = [1, 1, 1]
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  // Prepare static data for instances
  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // Chaos Position - Scattered randomly in a large sphere
      // Increased radius to ensure they really scatter out
      const chaos = randomSpherePoint(25); 
      
      // Target Position (Disordered Cone Surface)
      const target = getTreeSurfacePosition(4.0, 9.5, -5);
      
      // Push ornaments slightly outside the foliage radius
      const pushFactor = 0.25;
      const horizontalDir = new THREE.Vector3(target.x, 0, target.z).normalize();
      target.add(horizontalDir.multiplyScalar(pushFactor));

      const colorHex = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const scale = Math.random() * (scaleRange[1] - scaleRange[0]) + scaleRange[0];

      return {
        chaos,
        target,
        color: new THREE.Color(colorHex),
        scale,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        wobbleSpeed: 1 + Math.random()
      };
    });
  }, [count, colorPalette, scaleRange]);

  // Initial Setup
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    data.forEach((d, i) => {
      tempObject.position.copy(d.chaos);
      tempObject.scale.setScalar(d.scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, d.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [data, tempObject]);

  // Ref for current progress
  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const target = mode === TreeMode.FORMED ? 1 : 0;
    // Heavier items (higher weight) have lower damping speed
    const dampSpeed = 1.0 / weight; 
    
    progress.current = THREE.MathUtils.damp(progress.current, target, dampSpeed, delta);
    
    const t = progress.current;
    // Ease out cubic
    const easedT = 1 - Math.pow(1 - t, 3);

    data.forEach((d, i) => {
      // Position Lerp
      tempObject.position.lerpVectors(d.chaos, d.target, easedT);
      
      // Rotation logic
      const chaosRot = time * d.rotSpeed;
      const formedRotX = Math.sin(time * d.wobbleSpeed + d.phase) * 0.15;
      const formedRotY = time * 0.5 + d.phase;
      
      // Blend rotations
      tempObject.rotation.x = THREE.MathUtils.lerp(chaosRot, formedRotX, easedT);
      tempObject.rotation.y = THREE.MathUtils.lerp(chaosRot, formedRotY, easedT);
      tempObject.rotation.z = THREE.MathUtils.lerp(chaosRot, 0, easedT);

      // Add wobble when close to formed
      if (t > 0.8) {
          const wobble = Math.sin(time * 2 + d.phase) * 0.05;
          tempObject.position.y += wobble;
      }
      
      // Pulse effect for lights or stars
      let scaleMult = 1.0;
      if ((emissive || type === 'star') && t > 0.9) {
          scaleMult = 1.0 + Math.sin(time * 3 + d.phase) * 0.2;
      }

      const finalScale = d.scale * (0.8 + 0.2 * easedT) * scaleMult;
      tempObject.scale.set(
        finalScale * geometryScale[0],
        finalScale * geometryScale[1],
        finalScale * geometryScale[2]
      ); 
      
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const getGeometry = () => {
      switch(type) {
          case 'box': return <boxGeometry />;
          case 'flat-box': return <boxGeometry />; 
          case 'triangle': return <coneGeometry args={[0.5, 1, 4]} />;
          case 'cylinder': return <cylinderGeometry args={[0.3, 0.3, 1, 16]} />; 
          case 'cone': return <coneGeometry args={[0.4, 1, 16]} />; 
          case 'dodecahedron': return <dodecahedronGeometry args={[0.5]} />; 
          case 'star': return <octahedronGeometry args={[0.5, 0]} />; // Looks like a diamond/star
          case 'sphere':
          default: return <sphereGeometry args={[0.5, 16, 16]} />;
      }
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {getGeometry()}
      <meshStandardMaterial 
        roughness={type === 'star' ? 0.1 : (emissive ? 0.0 : 0.3)} 
        metalness={type === 'star' ? 0.9 : (emissive ? 0.0 : 0.7)} 
        envMapIntensity={emissive ? 0.0 : 1.5}
        emissive={emissive ? new THREE.Color(colorPalette[0]) : new THREE.Color(0x000000)}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
        toneMapped={!emissive}
      />
    </instancedMesh>
  );
};