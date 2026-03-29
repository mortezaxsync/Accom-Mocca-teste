import React from 'react';
import { Logo } from './Logo';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center h-screen w-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 animate-slowZoom"
        style={{ 
          backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Wheat-Field-with-Cypresses-%281889%29-Vincent-van-Gogh-Met.jpg/1920px-Wheat-Field-with-Cypresses-%281889%29-Vincent-van-Gogh-Met.jpg")'
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      <div className="relative z-10 scale-150 transform transition-all duration-1000 animate-fadeIn">
        <Logo />
      </div>
      
      <div className="absolute bottom-16 z-10 flex flex-col items-center gap-4">
         <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin shadow-xl"></div>
         <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase opacity-80 animate-pulse drop-shadow-md">
           Carregando Sistema
         </p>
      </div>
    </div>
  );
};