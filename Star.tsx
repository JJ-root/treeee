import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint } from '../utils/math';
import { TreeMode } from '../types';

interface StarProps {
  mode: string;
}

export const Star: React.FC<StarProps> = ({ mode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const { chaosPos, targetPos } = useMemo(() => ({
    chaosPos: randomSpherePoint(12),
    // Tree top is approximately at y=5 based on Foliage calculations
    targetPos: new THREE.Vector3(0, 5.2, 0) 
  }), []);

  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Transition logic: Star is heavy and majestic, moves smoothly
    const target = mode === TreeMode.FORMED ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 0.8, delta);
    const t = progress.current;
    
    // Ease out cubic
    const easedT = 1 - Math.pow(1 - t, 3);
    
    // Position Lerp
    groupRef.current.position.lerpVectors(chaosPos, targetPos, easedT);
    
    // Animation: Constant luxurious rotation
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.y = time * 0.4;
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.05;
    
    // Breathing scale effect
    const scaleBase = 1.0;
    const pulse = Math.sin(time * 3) * 0.05;
    // Star shrinks slightly when in Chaos mode
    const scale = (scaleBase + pulse) * (0.4 + 0.6 * easedT); 
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
        {/* Inner Glowing Core - The "Diamond" */}
        <mesh>
            <dodecahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial 
                color="#FEDC56" 
                emissive="#FEDC56" 
                emissiveIntensity={4} 
                toneMapped={false} 
            />
        </mesh>
        
        {/* Spikes Layer 1 - Gold */}
        <mesh>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial 
                color="#D4AF37" 
                metalness={1} 
                roughness={0} 
                envMapIntensity={3} 
            />
        </mesh>

        {/* Spikes Layer 2 - Gold (Rotated) */}
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial 
                color="#D4AF37" 
                metalness={1} 
                roughness={0} 
                envMapIntensity={3} 
            />
        </mesh>
        
        {/* Local light to illuminate the top needles */}
        <pointLight intensity={4} color="#FEDC56" distance={8} decay={2} />
    </group>
  );
};