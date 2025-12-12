import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint, getTreeSurfacePosition } from '../utils/math';
import { TreeMode } from '../types';

interface LeavesProps {
  mode: string;
  count?: number;
}

export const Leaves: React.FC<LeavesProps> = ({ mode, count = 800 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions and target rotations
  const data = useMemo(() => {
    const dummy = new THREE.Object3D();
    
    return new Array(count).fill(0).map((_, i) => {
      // Chaos: Random position in sphere
      // Increased radius to match other components (Foliage, Ornaments) for proper "Explosion" effect
      const chaos = randomSpherePoint(25);
      
      // Target: Tree surface
      // Slightly deeper than ornaments (radius factor 0.9) to sit among the foliage
      const rawTarget = getTreeSurfacePosition(4.2, 9.5, -5);
      const target = rawTarget.clone().multiplyScalar(0.95); // Pull in slightly
      
      // Target Rotation: Face outwards from the center
      dummy.position.copy(target);
      // Look away from center (0, y, 0)
      dummy.lookAt(target.x * 2, target.y, target.z * 2);
      
      // Add random tilt to simulate natural leaves/needles
      dummy.rotateX((Math.random() - 0.5) * 1.5);
      dummy.rotateZ((Math.random() - 0.5) * 1.5);
      dummy.rotateY((Math.random() - 0.5) * 1.5);
      
      const targetQuat = dummy.quaternion.clone();

      // Chaos Rotation: Random initial rotation axis and speed
      const chaosRotSpeed = new THREE.Vector3(
        Math.random() - 0.5, 
        Math.random() - 0.5, 
        Math.random() - 0.5
      ).multiplyScalar(2);

      // Color variation: Emerald to Dark Forest Green
      const colors = ['#013220', '#004225', '#1a5236', '#0B6623', '#2E8B57'];
      const colorHex = colors[Math.floor(Math.random() * colors.length)];
      
      // Scale: Thin flakes
      const scale = 0.3 + Math.random() * 0.4;

      return {
        chaos,
        target,
        targetQuat,
        chaosRotSpeed,
        color: new THREE.Color(colorHex),
        scale,
        randomPhase: Math.random() * Math.PI * 2
      };
    });
  }, [count]);

  // Initial set up
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

  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const targetMode = mode === TreeMode.FORMED ? 1 : 0;
    // Smooth transition
    progress.current = THREE.MathUtils.damp(progress.current, targetMode, 1.5, delta);
    const t = progress.current;
    
    // Ease function for position/rotation mixing
    const easedT = 1 - Math.pow(1 - t, 3);
    const time = state.clock.getElapsedTime();

    data.forEach((d, i) => {
      // 1. Interpolate Position
      tempObject.position.lerpVectors(d.chaos, d.target, easedT);

      // 2. Interpolate Rotation
      // Chaos state: spinning continuously
      if (t < 0.95) {
        tempObject.rotation.set(
            time * d.chaosRotSpeed.x,
            time * d.chaosRotSpeed.y,
            time * d.chaosRotSpeed.z
        );
      }
      
      // Calculate Chaos Quaternion from the current spinning Euler
      const currentQuat = new THREE.Quaternion().setFromEuler(tempObject.rotation);
      
      // Slerp to Target Quaternion (Fixed outward orientation)
      currentQuat.slerp(d.targetQuat, easedT);
      tempObject.setRotationFromQuaternion(currentQuat);

      // 3. Add formed-state wind sway
      if (t > 0.5) {
         const sway = Math.sin(time * 2 + d.randomPhase) * 0.1 * easedT;
         tempObject.rotateX(sway);
      }

      // 4. Scale
      tempObject.scale.setScalar(d.scale);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {/* CircleGeometry with 3 segments creates a flat triangle */}
      <circleGeometry args={[0.3, 3]} />
      <meshStandardMaterial 
        roughness={0.7} 
        metalness={0.1} 
        side={THREE.DoubleSide} // Important for flakes to be visible from back
        transparent={false}
      />
    </instancedMesh>
  );
};