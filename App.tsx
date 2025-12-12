import React, { useState } from 'react';
import { Scene } from './components/Scene';
import { TreeMode, Theme } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<TreeMode>(TreeMode.CHAOS);
  const [theme, setTheme] = useState<Theme>('CLASSIC');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === TreeMode.CHAOS ? TreeMode.FORMED : TreeMode.CHAOS));
  };

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'CLASSIC') return 'SNOWY';
      if (prev === 'SNOWY') return 'ICY';
      return 'CLASSIC';
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newPhotos = Array.from(event.target.files).map((file) => 
        URL.createObjectURL(file)
      );
      setPhotos((prev) => [...prev, ...newPhotos]);
      // Reset input value to allow selecting the same file again if needed
      event.target.value = '';
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos((prev) => {
      const photoUrl = prev[indexToRemove];
      URL.revokeObjectURL(photoUrl); // Cleanup memory
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  return (
    <div className="relative w-full h-screen bg-black text-luxury-gold selection:bg-luxury-gold selection:text-black font-sans overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene mode={mode} theme={theme} photos={photos} />
      </div>

      {/* Top Right - Theme Toggle */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 pointer-events-auto">
        <div className="flex flex-col items-center gap-2 group">
             {/* Label */}
             <span className="text-[10px] font-display uppercase tracking-widest text-luxury-gold/0 translate-y-2 group-hover:-translate-y-1 group-hover:text-luxury-gold transition-all duration-300">
                {theme}
            </span>
            <button
                onClick={cycleTheme}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 hover:border-luxury-gold hover:bg-luxury-gold/20 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-luxury-gold-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
            </button>
        </div>
      </div>

      {/* UI Overlay Layer - Right Center Placement */}
      <div className="absolute top-1/2 right-6 md:right-10 -translate-y-1/2 z-10 pointer-events-none">
        {/* Controls Container */}
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          {/* Slender Vertical Button */}
          <button
            onClick={toggleMode}
            className="group relative w-12 h-48 md:w-14 md:h-56 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md border border-luxury-gold/40 rounded-[3rem] overflow-hidden transition-all duration-500 hover:scale-105 hover:border-luxury-gold hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] active:scale-95"
          >
            {/* Hover fill animation */}
            <div className="absolute inset-0 bg-luxury-gold/10 translate-y-full transition-transform duration-500 group-hover:translate-y-0" />
            
            {/* Rotated Text Label */}
            <span className="relative font-display font-bold tracking-widest text-luxury-gold-light text-xs md:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [writing-mode:vertical-rl] rotate-180 uppercase">
              {mode === TreeMode.CHAOS ? 'Tree' : 'Release'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Left - Controls */}
      <div className="absolute bottom-10 left-6 md:left-10 z-20 pointer-events-auto flex items-end gap-6">
        
        {/* Button 1: Upload (Direct Action) */}
        <div className="flex flex-col items-center gap-2 group">
            <span className="text-[10px] font-display uppercase tracking-widest text-luxury-gold/0 -translate-y-2 group-hover:translate-y-0 group-hover:text-luxury-gold transition-all duration-300">
                Add Photo
            </span>
            <label className="cursor-pointer relative flex items-center justify-center w-14 h-14 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-luxury-gold/20 hover:border-luxury-gold hover:scale-105 transition-all duration-300 shadow-lg active:scale-95">
                <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-luxury-gold-light opacity-90">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </label>
        </div>

        {/* Button 2: Gallery Entrance */}
        <div className="flex flex-col items-center gap-2 group">
            <span className="text-[10px] font-display uppercase tracking-widest text-luxury-gold/0 -translate-y-2 group-hover:translate-y-0 group-hover:text-luxury-gold transition-all duration-300">
                Gallery
            </span>
            <button 
                onClick={() => setIsGalleryOpen(true)}
                className="relative flex items-center justify-center w-14 h-14 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-luxury-gold/20 hover:border-luxury-gold hover:scale-105 transition-all duration-300 shadow-lg active:scale-95"
            >
                {/* Badge count */}
                {photos.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-luxury-gold text-[10px] font-bold text-black border border-black shadow-sm">
                        {photos.length}
                    </span>
                )}
                
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-luxury-gold-light opacity-90">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            </button>
        </div>

      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-[#050505] border border-luxury-gold/30 rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
                
                {/* Close Button */}
                <button 
                    onClick={() => setIsGalleryOpen(false)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-luxury-gold tracking-[0.2em] uppercase mb-2">
                        Memory Gallery
                    </h2>
                    <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-luxury-gold to-transparent mx-auto opacity-50" />
                    <p className="mt-2 text-xs text-white/40 uppercase tracking-widest">
                        {photos.length} {photos.length === 1 ? 'Item' : 'Items'} Collected
                    </p>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {photos.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span className="text-sm font-serif">No memories yet</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {photos.map((photo, index) => (
                                <div key={photo} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-luxury-gold transition-colors shadow-lg bg-white/5">
                                    <img src={photo} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Action overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => removePhoto(index)}
                                            className="px-4 py-2 bg-red-900/80 hover:bg-red-600 text-white text-xs uppercase tracking-wider rounded-lg border border-red-500/30 hover:border-red-400 transition-all transform hover:scale-105"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer hint */}
                <div className="mt-6 text-center text-[10px] text-white/20 uppercase tracking-widest">
                    Upload photos to decorate your tree
                </div>
            </div>
        </div>
      )}

      {/* Decorative Border - Minimalist Frame */}
      <div className="absolute inset-0 border-[1px] border-luxury-gold/10 pointer-events-none m-4 md:m-8 rounded-3xl" />
      
    </div>
  );
};

export default App;