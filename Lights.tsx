import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTreeSurfacePosition, randomSpherePoint } from '../utils/math';
import '../types';

interface LightsProps {
  mode: string;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aChaos;
  attribute vec3 aTarget;
  attribute float aPhase;
  attribute float aSize; // Variable size attribute
  varying float vAlpha;

  void main() {
    float t = smoothstep(0.0, 1.0, uProgress);
    
    // Ease out cubic for position
    float ease = 1.0 - pow(1.0 - t, 3.0);
    vec3 pos = mix(aChaos, aTarget, ease);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size varies based on attribute and time pulsation
    float pulse = 1.0 + 0.3 * sin(uTime * 3.0 + aPhase);
    gl_PointSize = aSize * pulse;
    
    // Perspective scaling
    gl_PointSize *= (10.0 / -mvPosition.z);
    
    vAlpha = 0.8 + 0.2 * sin(uTime * 4.0 + aPhase);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  
  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    
    // Sharp center, glowing edge
    float glow = 1.0 - r;
    glow = pow(glow, 2.0);
    
    if (r > 1.0) discard;
    
    // Warm Golden-Yellow Light (Specific Requirement)
    vec3 color = vec3(1.0, 0.8, 0.1); 
    
    // Add a hot white center
    color = mix(color, vec3(1.0, 1.0, 1.0), 1.0 - smoothstep(0.0, 0.15, r));

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

export const TreeLights: React.FC<LightsProps> = ({ mode }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  // Reduced count to minimize outer yellow clutter
  const count = 150;

  const { chaos, target, phase, sizes } = useMemo(() => {
    const c = new Float32Array(count * 3);
    const t = new Float32Array(count * 3);
    const p = new Float32Array(count);
    const s = new Float32Array(count);
    
    for(let i=0; i<count; i++) {
        const chaosPt = randomSpherePoint(14);
        
        // Use disordered surface positioning
        const targetPt = getTreeSurfacePosition(4.6, 9.8, -5);
        
        // No jitter needed as getTreeSurfacePosition is already random
        
        c.set([chaosPt.x, chaosPt.y, chaosPt.z], i*3);
        t.set([targetPt.x, targetPt.y, targetPt.z], i*3);
        p[i] = Math.random() * Math.PI * 2;
        
        // Explicit "Big and Small" sizing
        // 15% are large "feature" lights, 85% are small "fairy" lights
        const isBig = Math.random() > 0.85;
        s[i] = isBig ? 50.0 + Math.random() * 20.0 : 15.0 + Math.random() * 8.0; 
    }
    return { chaos: c, target: t, phase: p, sizes: s };
  }, []);

  useFrame((state, delta) => {
    if(shaderRef.current) {
        shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        const targetProg = mode === 'FORMED' ? 1 : 0;
        shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
            shaderRef.current.uniforms.uProgress.value,
            targetProg,
            delta * 1.0
        );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aChaos" count={count} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={count} array={target} itemSize={3} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={phase} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
};