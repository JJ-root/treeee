import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TreeLights } from './Lights';
import { Star } from './Star';
import { Leaves } from './Leaves';
import { Polaroids } from './Polaroids';
import { Snow } from './Snow';
import { Ribbon } from './Ribbon';
import { TreeMode, Theme } from '../types';

interface SceneProps {
  mode: string;
  theme: Theme;
  photos?: string[];
}

export const Scene: React.FC<SceneProps> = ({ mode, theme, photos = [] }) => {
  
  // Define Palettes based on Theme
  // REMOVED all near-black colors.
  const palettes = useMemo(() => {
    const isIcy = theme === 'ICY';
    return {
      // Changed dark green/dark red to brighter, richer versions
      box: isIcy ? ['#1E90FF', '#87CEEB', '#FFFFFF'] : ['#B22222', '#D4AF37', '#228B22', '#FFFFFF'],
      drum: isIcy ? ['#4682B4', '#C0C0C0'] : ['#B22222', '#D4AF37'],
      cane: isIcy ? ['#FFFFFF', '#87CEEB', '#B0C4DE'] : ['#FF0000', '#FFFFFF', '#DC143C'],
      bell: isIcy ? ['#C0C0C0', '#FFFFFF'] : ['#D4AF37', '#C0C0C0', '#CD7F32'],
      pine: isIcy ? ['#708090', '#A9A9A9', '#C0C0C0'] : ['#DAA520', '#A9A9A9', '#8B4513'],
      flat: isIcy ? ['#4682B4', '#5F9EA0'] : ['#CD853F', '#D2691E'],
      ball: isIcy ? ['#00BFFF', '#1E90FF', '#F0F8FF', '#FFFFFF'] : ['#FF0000', '#4169E1', '#32CD32', '#D4AF37'],
      // New palette for Icy Stars
      stars: ['#FFFFFF', '#E0FFFF', '#B0E0E6']
    };
  }, [theme]);

  // Foliage Color tweak 
  const foliageColor = theme === 'ICY' ? '#004242' : '#006432';
  const innerFoliageColor = theme === 'ICY' ? '#002222' : '#003300';
  
  // Config for Ornament Counts based on Theme
  const config = useMemo(() => {
      const isIcy = theme === 'ICY';
      return {
          boxCount: isIcy ? 0 : 60, // Remove boxes in Icy
          ballCount: isIcy ? 350 : 150, // Massive increase in balls for Icy
          starCount: isIcy ? 120 : 0, // Add stars only for Icy
          drumCount: isIcy ? 0 : 50,
          flatCount: isIcy ? 0 : 40,
          caneCount: isIcy ? 40 : 80, // Fewer canes in icy
      }
  }, [theme]);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: 3 }} // ACESFilmic
    >
      <PerspectiveCamera makeDefault position={[0, 2, 18]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={30}
        autoRotate={mode === TreeMode.FORMED}
        autoRotateSpeed={0.5}
      />
      
      {/* Deep Dark Luxury Background */}
      <color attach="background" args={['#010502']} />
      
      <Suspense fallback={null}>
        <Environment preset="city" background={false} blur={1} />
        
        {/* Main Tree Group */}
        <group position={[0, 0, 0]}>
          
          {/* Theme Specific Extras */}
          {theme === 'SNOWY' && <Snow mode={mode} count={5000} />}
          {theme === 'ICY' && <Ribbon mode={mode} />}

          {/* Layer 1: Inner Dark Foliage (Volume) */}
          <Foliage 
            mode={mode} 
            count={20000} 
            color={innerFoliageColor} 
            size={2.5} 
            radiusBase={3.8} 
          />
          
          {/* Layer 2: Outer Detailed Foliage (Texture) */}
          <Foliage 
            mode={mode} 
            count={30000} 
            color={foliageColor} 
            size={1.0} 
            radiusBase={4.5} 
          />

          {/* Layer 3: Triangular Leaf Flakes (Physical Detail) */}
          <Leaves mode={mode} count={800} />
          
          {/* --- Specific Ornaments Section --- */}

          {/* 1. Mini Gift Boxes (Reduced in Icy) */}
          {config.boxCount > 0 && (
            <Ornaments 
                mode={mode} 
                count={config.boxCount} 
                type="box" 
                colorPalette={palettes.box} 
                scaleRange={[0.3, 0.5]}
                weight={0.9}
            />
          )}

          {/* 2. Small Drums */}
          {config.drumCount > 0 && (
            <Ornaments 
                mode={mode} 
                count={config.drumCount} 
                type="cylinder" 
                colorPalette={palettes.drum} 
                scaleRange={[0.3, 0.45]}
                geometryScale={[1, 0.6, 1]} 
                weight={0.7}
            />
          )}

          {/* 3. Candy Canes */}
          <Ornaments 
            mode={mode} 
            count={config.caneCount} 
            type="cylinder" 
            colorPalette={palettes.cane} 
            scaleRange={[0.2, 0.3]}
            geometryScale={[0.2, 3.0, 0.2]} 
            weight={0.4}
          />

          {/* 4. Bells */}
          <Ornaments 
            mode={mode} 
            count={60} 
            type="cone" 
            colorPalette={palettes.bell} 
            scaleRange={[0.25, 0.4]}
            weight={0.6}
          />

          {/* 5. Pinecones */}
          <Ornaments 
            mode={mode} 
            count={70} 
            type="dodecahedron" 
            colorPalette={palettes.pine} 
            scaleRange={[0.3, 0.4]}
            geometryScale={[0.7, 1.2, 0.7]} 
            weight={0.8}
          />

          {/* 6. Gingerbread / Flat items */}
          {config.flatCount > 0 && (
            <Ornaments 
                mode={mode} 
                count={config.flatCount} 
                type="flat-box" 
                colorPalette={palettes.flat} 
                scaleRange={[0.3, 0.4]}
                geometryScale={[1, 1.2, 0.2]} 
                weight={0.5}
            />
          )}

           {/* 7. Filler Balls (Massive count for Icy) */}
           <Ornaments 
            mode={mode} 
            count={config.ballCount} 
            type="sphere" 
            colorPalette={palettes.ball} 
            scaleRange={[0.15, 0.25]}
            weight={0.4}
          />

          {/* 8. Stars (New for Icy) */}
          {config.starCount > 0 && (
             <Ornaments 
                mode={mode} 
                count={config.starCount} 
                type="star" 
                colorPalette={palettes.stars} 
                scaleRange={[0.2, 0.35]}
                weight={0.3}
            />
          )}

          {/* User Uploaded Polaroids */}
          <Polaroids mode={mode} urls={photos} />
          
          {/* Surface Lights (Yellow Bulbs) */}
          <TreeLights mode={mode} />

          {/* The Crown Jewel */}
          <Star mode={mode} />

        </group>

        {/* Floor Reflections */}
        <ContactShadows 
          position={[0, -6, 0]} 
          opacity={0.8} 
          scale={45} 
          blur={2.0} 
          far={8} 
          color="#000000" 
        />
      </Suspense>

      <ambientLight intensity={theme === 'ICY' ? 0.6 : 0.4} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={3.5} 
        color={theme === 'ICY' ? "#E0F6FF" : "#FEDC56"} 
        castShadow
      />
      <pointLight position={[-10, 5, -10]} intensity={1.5} color={theme === 'ICY' ? "#88CCFF" : "#00ffaa"} />

      {/* Cinematic Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.65} 
          mipmapBlur 
          intensity={2.2} 
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  );
};