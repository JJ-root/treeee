import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomSpherePoint, getTreeSurfacePosition } from '../utils/math';
import '../types';

interface SnowProps {
  mode: string;
  count?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  
  attribute vec3 aChaos;
  attribute vec3 aTarget;
  attribute float aRandom;
  attribute float aType; // 0 = soft snow, 1 = glitter
  
  varying float vType;
  varying float vRandom;
  varying float vAlpha;

  void main() {
    vType = aType;
    vRandom = aRandom;

    // Cubic ease out
    float t = uProgress;
    t = 1.0 - pow(1.0 - t, 3.0);
    
    vec3 pos = mix(aChaos, aTarget, t);
    
    // Float movement
    // Allow float movement in chaos mode too, but differently
    float movementAmp = 1.0; 
    
    pos.x += sin(uTime * 0.5 + aRandom * 10.0) * 0.2 * movementAmp;
    pos.y += cos(uTime * 0.3 + aRandom * 20.0) * 0.2 * movementAmp;
    pos.z += sin(uTime * 0.4 + aRandom * 15.0) * 0.2 * movementAmp;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size logic
    float baseSize = (aType > 0.5) ? 4.0 : 6.0; 
    gl_PointSize = baseSize * uPixelRatio;
    gl_PointSize *= (10.0 / -mvPosition.z);
    
    // Sparkle
    // FIX: Ensure sine wave is mapped to positive range [0.0, 1.0] to avoid negative alpha
    float sparkle = 1.0;
    if (aType > 0.5) {
        sparkle = 0.5 + 0.5 * sin(uTime * 8.0 + aRandom * 50.0);
    }
    vAlpha = sparkle;
  }
`;

const fragmentShader = `
  varying float vType;
  varying float vRandom;
  varying float vAlpha;
  
  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    
    vec3 color;
    float alpha = 1.0;
    
    if (vType < 0.5) {
        // Soft Snow
        color = vec3(0.95, 0.98, 1.0);
        alpha = (1.0 - r) * 0.6 * vAlpha;
    } else {
        // Glitter
        color = vec3(1.0, 1.0, 1.0);
        float glow = 1.0 - pow(r, 3.0);
        alpha = glow * vAlpha; 
        if (alpha > 0.2) color *= 2.0; 
    }

    // Ensure alpha is non-negative
    gl_FragColor = vec4(color, max(0.0, alpha));
  }
`;

export const Snow: React.FC<SnowProps> = ({ mode, count = 4000 }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { chaos, target, randoms, types } = useMemo(() => {
    const c = new Float32Array(count * 3);
    const t = new Float32Array(count * 3);
    const r = new Float32Array(count);
    const typ = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Chaos
      const cp = randomSpherePoint(30);
      c[i * 3] = cp.x;
      c[i * 3 + 1] = cp.y;
      c[i * 3 + 2] = cp.z;

      // Target: Accumulate on tree branches
      const tp = getTreeSurfacePosition(4.6, 9.8, -5);
      
      // Jitter slightly to clump on imaginary branches
      tp.y += (Math.random() * 0.2); 
      
      t[i * 3] = tp.x;
      t[i * 3 + 1] = tp.y;
      t[i * 3 + 2] = tp.z;

      r[i] = Math.random();
      typ[i] = Math.random() > 0.6 ? 1.0 : 0.0; // 40% Glitter
    }

    return { chaos: c, target: t, randoms: r, types: typ };
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      const targetProgress = mode === 'FORMED' ? 1 : 0;
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        targetProgress,
        0.02
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aChaos" count={count} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={count} array={target} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aType" count={count} array={types} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};