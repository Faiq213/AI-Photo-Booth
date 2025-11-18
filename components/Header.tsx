import React from 'react';
import { SparklesIcon } from './IconComponents.tsx';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center mb-10">
      <div className="flex items-center justify-center gap-4">
         <SparklesIcon className="text-indigo-400 w-10 h-10" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          AI Photo Booth
        </h1>
      </div>
      <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
        Virtually try on any suit, or create entirely new scenes with your face! Upload your photo, then pick a mode and let Gemini work its magic.
      </p>
    </header>
  );
};