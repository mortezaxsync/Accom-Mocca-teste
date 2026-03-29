
import React, { useState } from 'react';

export const Logo: React.FC = () => {
  const [useImage, setUseImage] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center mb-6 select-none w-full">
      {/* 
         ÁREA DO ÍCONE / IMAGEM 
         Lógica: Tenta carregar "logo.png" (basta colocar este arquivo na pasta do app).
         Se falhar, mostra o SVG padrão.
      */}
      <div className="w-full max-w-[400px] mb-2 flex items-center justify-center relative h-64">
        {useImage ? (
          <img 
            src="./logo.png" 
            alt="Logo Mocca"
            className="h-full w-auto object-contain drop-shadow-xl"
            onError={() => setUseImage(false)}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 300 180"
            className="w-full h-auto drop-shadow-xl"
          >
            {/* Logo Padrão (M Block Style) caso não tenha imagem */}
            <path
              fill="#2563eb"
              d="M85 145 V20 H120 L150 65 L180 20 H215 V145 H185 V70 L150 120 L115 70 V145 H85 Z"
            />
          </svg>
        )}
      </div>

    </div>
  );
};
