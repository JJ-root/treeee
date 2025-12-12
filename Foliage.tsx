import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint, getTreePosition } from '../utils/math';
import '../types';

interface FoliageProps {
  count?: number;
  mode: string;
  color?: string;
  size?: number;
  radiusBase?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform float uSize;
  
  attribute vec3 aChaos;
  attribute vec3 aTarget;
  attribute float aRandom;
  
  varying float vAlpha;
  varying float vRandom; 
  varying float vProgress; 

  void main() {
    vRandom = aRandom;
    vProgress = uProgress;

    // Cubic ease out for smooth movement
    float t = uProgress;
    t = 1.0 - pow(1.0 - t, 3.0);
    
    // Mix positions
    vec3 pos = mix(aChaos, aTarget, t);
    
    // Add some "breathing" life
    pos.y += sin(uTime * 0.5 + aRandom * 10.0) * 0.1 * t;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (4.0 + aRandom * 3.0) * uPixelRatio * uSize;
    gl_PointSize *= (1.0 / -mvPosition.z);
    
    // Base alpha sparkle effect
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aRandom * 20.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  
  varying float vAlpha;
  varying float vRandom;
  varying float vProgress;
  
  void main() {
    // Soft circular particle
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    
    float alpha = (1.0 - r) * vAlpha;
    
    // Base color mix (User color + Gold hint)
    vec3 baseColor = mix(uColor, vec3(1.0, 0.9, 0.5), (1.0 - r) * 0.3);
    
    // --- Green Blink Logic ---
    float blinkSpeed = 3.0; 
    float blinkPhase = uTime * blinkSpeed + vRandom * 100.0;
    float blink = sin(blinkPhase);
    
    // Sharpen the sine wave to make it a "flash" rather than a pulse
    float flash = smoothstep(0.8, 1.0, blink);
    
    // Bright neon green color for the flash
    vec3 flashColor = vec3(0.4, 1.0, 0.5); 
    
    // Intensity depends on progress 
    // MODIFIED: Allow blinking in chaos too, just slightly less intense
    float flashIntensity = flash * (0.4 + 0.6 * vProgress);
    
    // Add flash to base color
    vec3 finalColor = mix(baseColor, flashColor, flashIntensity * 0.8); 
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ 
  count = 15000, 
  mode, 
  color = '#006432', 
  size = 1.0,
  radiusBase = 4.5
}) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate data once
  const { positions, chaosPositions, targetPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Chaos: Random sphere
      // MODIFIED: Increase radius to 25 to ensure they scatter widely
      const c = randomSpherePoint(25);
      chaos[i * 3] = c.x;
      chaos[i * 3 + 1] = c.y;
      chaos[i * 3 + 2] = c.z;

      // Target: Tree Cone
      const tBase = getTreePosition(i, count, radiusBase, 10, -5);
      // Volume jitter
      const jitterAmount = 0.8;
      const jitter = new THREE.Vector3(
        (Math.random()-0.5) * jitterAmount, 
        (Math.random()-0.5) * jitterAmount, 
        (Math.random()-0.5) * jitterAmount
      );
      tBase.add(jitter);
      
      target[i * 3] = tBase.x;
      target[i * 3 + 1] = tBase.y;
      target[i * 3 + 2] = tBase.z;

      // Initial buffer position (start at chaos)
      pos[i * 3] = c.x;
      pos[i * 3 + 1] = c.y;
      pos[i * 3 + 2] = c.z;

      rnd[i] = Math.random();
    }

    return {
      positions: pos,
      chaosPositions: chaos,
      targetPositions: target,
      randoms: rnd
    };
  }, [count, radiusBase]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uColor: { value: new THREE.Color(color) },
    uSize: { value: size }
  }), [color, size]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Smooth lerp for progress uniform
      const targetProgress = mode === 'FORMED' ? 1 : 0;
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        targetProgress,
        0.02 // Slower, more majestic transition
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTarget"
          count={targetPositions.length / 3}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};