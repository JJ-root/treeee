import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint } from '../utils/math';
import { TreeMode } from '../types';

interface PolaroidsProps {
  mode: string;
  urls: string[];
}

// Individual Polaroid Item to handle texture loading safely per instance
const PolaroidItem: React.FC<{ url: string; mode: string; index: number; total: number }> = ({ 
  url, 
  mode, 
  index, 
  total 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, url);

  // STABLE Chaos Position:
  // Calculated once on mount. This ensures the photo has a "home" in the chaos 
  // that doesn't change even if its index on the tree changes.
  const chaosPos = useMemo(() => randomSpherePoint(14), []);
  
  // Random offsets for this specific instance (rotation/sway)
  const { rotationOffset, swaySpeed } = useMemo(() => ({
    rotationOffset: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 1.5
  }), []);

  // DYNAMIC Target Position:
  // Recalculates when index or total changes. 
  // This allows the photos to "shuffle" into new slots on the tree if one is removed.
  const targetPos = useMemo(() => {
    // Tree Surface Distribution
    // Height range: 0 to 9. Radius base: ~4.5
    const radiusBase = 4.8; 
    const treeHeight = 9.0;
    
    // Distribute based on index to avoid clumping
    const heightRatio = 1 - (index / Math.max(total, 1)); 
    // Add stable randomness based on index (so it's deterministic for that slot)
    const randomHeightOffset = (Math.sin(index * 12.34) + 1) * 1.0; 
    
    const yPos = (heightRatio * treeHeight * 0.8) + randomHeightOffset;
    
    // Taper radius based on height
    const rAtHeight = Math.max(0.5, radiusBase * (1 - (yPos / treeHeight)));
    
    // Spiral distribution
    const angle = (index * 0.8) + (index * index * 0.05); 
    
    const x = rAtHeight * Math.cos(angle);
    const z = rAtHeight * Math.sin(angle);
    
    return new THREE.Vector3(x, yPos - 5, z); // -5 yOffset
  }, [index, total]);

  // Handle texture settings
  useMemo(() => {
    if (texture) {
      texture.center.set(0.5, 0.5);
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const target = mode === TreeMode.FORMED ? 1 : 0;
    
    // Smooth transition
    progress.current = THREE.MathUtils.damp(progress.current, target, 1.2, delta);
    const t = progress.current;
    
    // Ease out cubic
    const easedT = 1 - Math.pow(1 - t, 3);

    // 1. Position Lerp
    // Note: If targetPos changes (due to index change), lerpVectors will interpolate 
    // from chaosPos to the NEW targetPos based on easedT.
    // If we are already formed (easedT ~ 1), it will snap to the new position.
    // This creates a "reshuffle" effect.
    groupRef.current.position.lerpVectors(chaosPos, targetPos, easedT);

    // 2. Rotation Logic
    // Chaos: Random tumbling
    const tumbleX = time * swaySpeed * 0.5;
    const tumbleY = time * swaySpeed * 0.3;

    // Formed: Look outward + gentle wind sway
    const dummy = new THREE.Object3D();
    dummy.position.copy(targetPos);
    dummy.lookAt(targetPos.x * 2, targetPos.y, targetPos.z * 2); // Face out
    // Add z-axis tilt (hanging effect)
    dummy.rotateZ(Math.sin(time * swaySpeed + rotationOffset) * 0.1); 
    dummy.rotateX(Math.sin(time * swaySpeed * 0.7) * 0.05);

    const targetQuat = dummy.quaternion;
    
    const chaosQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tumbleX, tumbleY, 0));
    groupRef.current.quaternion.slerpQuaternions(chaosQuat, targetQuat, easedT);

    // 3. Scale Interaction
    const scale = 1.0 + Math.sin(t * Math.PI) * 0.1;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* The Paper (White Border) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.25, 0.02]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
      </mesh>

      {/* The Photo (Texture) */}
      <mesh position={[0, 0.1, 0.011]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>

      {/* Gold Clip/Hanger */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[0.05, 0.01, 8, 16]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
};

export const Polaroids: React.FC<PolaroidsProps> = ({ mode, urls }) => {
  if (!urls || urls.length === 0) return null;

  return (
    <group>
      {urls.map((url, i) => (
        <PolaroidItem 
          key={url} // Use URL as key to preserve instance identity (assuming blob URLs)
          url={url} 
          mode={mode} 
          index={i} 
          total={urls.length} 
        />
      ))}
    </group>
  );
};
