import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint } from '../utils/math';
import { TreeMode } from '../types';

interface TrunkProps {
  mode: string;
  color?: string;
}

export const Trunk: React.FC<TrunkProps> = ({ mode, color = '#3e2723' }) => {
  const count = 800;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      // Chaos: Random scatter
      const chaos = randomSpherePoint(8);
      
      // Target: Central Spine Cylinder
      // Height range from bottom (-6) to mid-top (4)
      const h = (Math.random() * 10) - 6; 
      
      // Radius: Thick at bottom, thin at top
      const progressH = (h + 6) / 10; // 0 to 1
      const maxR = 0.8 * (1 - progressH * 0.7); // Taper
      const r = Math.sqrt(Math.random()) * maxR; // Uniform disk distribution
      const theta = Math.random() * Math.PI * 2;
      
      const target = new THREE.Vector3(
        r * Math.cos(theta),
        h,
        r * Math.sin(theta)
      );

      return { 
        chaos, 
        target, 
        scale: Math.random() * 0.4 + 0.3,
        rotationSpeed: Math.random()
      };
    });
  }, [count]);

  useLayoutEffect(() => {
    if(!meshRef.current) return;
    
    // Initial setup
    const c = new THREE.Color(color);
    for(let i=0; i<count; i++) {
        meshRef.current.setColorAt(i, c);
        tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [color, count]);

  const progress = useRef(0);

  useFrame((state, delta) => {
    if(!meshRef.current) return;
    
    const targetMode = mode === TreeMode.FORMED ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, targetMode, 1.2, delta);
    const t = progress.current;
    
    const easedT = 1 - Math.pow(1 - t, 3);
    const time = state.clock.getElapsedTime();

    data.forEach((d, i) => {
        // Position
        tempObject.position.lerpVectors(d.chaos, d.target, easedT);
        
        // Rotation
        // In Chaos: Spin
        if (t < 0.2) {
            tempObject.rotation.x += delta * d.rotationSpeed;
            tempObject.rotation.z += delta * d.rotationSpeed;
        } else {
            // In Formed: Align vertically with random variance for "Bark" look
            const targetRotX = Math.sin(time + i) * 0.05;
            const targetRotZ = Math.cos(time + i) * 0.05;
            
            // Lerp rotation
            tempObject.rotation.x = THREE.MathUtils.lerp(tempObject.rotation.x, targetRotX, delta * 2);
            tempObject.rotation.z = THREE.MathUtils.lerp(tempObject.rotation.z, targetRotZ, delta * 2);
        }

        tempObject.scale.setScalar(d.scale);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.4, 0.25]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.9} 
          metalness={0.1}
        />
    </instancedMesh>
  );
};
