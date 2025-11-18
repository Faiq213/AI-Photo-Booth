import React, { useState, useEffect } from 'react';
import { SpinnerIcon, ErrorIcon, DownloadIcon, ImageIcon } from './IconComponents.tsx';

interface ErrorInfo {
  title: string;
  message: string;
  suggestions?: string[];
}

interface ResultDisplayProps {
  isLoading: boolean;
  error: ErrorInfo | null;
  generatedImage: string | null;
  onReset: () => void;
  mode: 'tryOn' | 'createScene' | 'logoCreator' | 'generativeScene';
}

const loadingMessages = [
    "Warming up the AI's imagination...",
    "Mixing digital paints and pixels...",
    "Consulting with virtual stylists...",
    "Generating your new look...",
    "This is the exciting part!",
    "Almost there, finalizing the details...",
];

const LoadingState: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <SpinnerIcon />
            <h3 className="text-xl font-semibold mt-4 text-indigo-300">Working on it...</h3>
            <p className="text-slate-400 mt-2 transition-opacity duration-500">{message}</p>
        </div>
    );
};

const ErrorState: React.FC<{ onReset: () => void, error: ErrorInfo }> = ({ onReset, error }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
        <ErrorIcon />
        <h3 className="text-xl font-semibold mt-4 text-red-400">{error.title}</h3>
        <p className="text-slate-300 mt-2 max-w-md">
            {error.message}
        </p>
        {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-6 text-left text-slate-400 bg-slate-900/50 p-4 rounded-lg max-w-md w-full">
                <p className="font-semibold mb-2 text-slate-300">Suggestions to try:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {error.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </div>
        )}
        <div className="mt-6">
            <button
                onClick={onReset}
                className="px-6 py-3 font-semibold text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
                Start Over
            </button>
        </div>
    </div>
);

const InitialState: React.FC<{ mode: 'tryOn' | 'createScene' | 'logoCreator' | 'generativeScene' }> = ({ mode }) => {
    const messages = {
        tryOn: 'Upload your photo and a suit, then click "Try On Suit" to start.',
        createScene: 'Upload your photo and describe a scene to get started.',
        logoCreator: 'Describe the logo you want to create, then click "Generate Logo".',
        generativeScene: 'Describe the scene you want to create, then click "Generate Scene".'
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-600">
                 <ImageIcon />
            </div>
            <h3 className="text-xl font-semibold text-slate-300">Your Result Will Appear Here</h3>
            <p className="text-slate-500 mt-2 max-w-sm">{messages[mode]}</p>
        </div>
    );
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, error, generatedImage, onReset, mode }) => {

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'ai-photobooth-result.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-3xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 sm:p-6 mt-8 shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">The Result</h2>
        <div className="w-full aspect-square bg-slate-900/70 rounded-lg flex items-center justify-center overflow-hidden">
        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState onReset={onReset} error={error} />}
        {!isLoading && !error && generatedImage && (
            <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" />
        )}
        {!isLoading && !error && !generatedImage && <InitialState mode={mode} />}
        </div>
         {generatedImage && !isLoading && (
            <div className="flex justify-center items-center gap-4 mt-6">
                <button 
                onClick={onReset}
                className="px-6 py-3 font-semibold text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                Start Over
                </button>
                {generatedImage && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
                  >
                      <DownloadIcon />
                      <span>Download Image</span>
                  </button>
                )}
            </div>
        )}
    </div>
  );
};