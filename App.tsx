import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader.tsx';
import { MultiImageUploader } from './components/MultiImageUploader.tsx';
import { ResultDisplay } from './components/ResultDisplay.tsx';
import { Header } from './components/Header.tsx';
import { generateSuitImage, generateSceneImage, generateLogoImage, generateGenerativeSceneImage } from './services/geminiService.ts';
import type { ImageData } from './types.ts';
import { ArrowRightIcon, SparklesIcon, PhotoIcon, PencilIcon, SuitIcon, AIIcon } from './components/IconComponents.tsx';
import { SuitDescriptionInput } from './components/SuitDescriptionInput.tsx';
import { SceneDescriptionInput } from './components/SceneDescriptionInput.tsx';
import { LogoDescriptionInput } from './components/LogoDescriptionInput.tsx';
import { GenerativeSceneDescriptionInput } from './components/GenerativeSceneDescriptionInput.tsx';
import { ImageCropperModal } from './components/ImageCropperModal.tsx';


type Mode = 'tryOn' | 'createScene' | 'generativeScene' | 'logoCreator';

type ErrorState = {
  title: string;
  message: string;
  suggestions?: string[];
};

const App: React.FC = () => {
  const [personImages, setPersonImages] = useState<ImageData[]>([]);
  const [suitImage, setSuitImage] = useState<ImageData | null>(null);
  const [suitDescription, setSuitDescription] = useState<string>('');
  const [suitInputMode, setSuitInputMode] = useState<'image' | 'text'>('image');
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [logoDescription, setLogoDescription] = useState<string>('');
  const [generativeSceneDescription, setGenerativeSceneDescription] = useState<string>('');
  const [mode, setMode] = useState<Mode>('tryOn');
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState | null>(null);

  const [croppingImageInfo, setCroppingImageInfo] = useState<{ src: string; target: 'person' | 'suit', fileType: string } | null>(null);

  const handleImageSelect = (file: File, target: 'person' | 'suit') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppingImageInfo({ 
        src: reader.result as string, 
        target,
        fileType: file.type
      });
    };
    reader.onerror = () => {
      setError({
        title: 'Image Read Failed',
        message: 'There was an issue reading your image file. It might be corrupted.',
        suggestions: ['Please try a different image.', 'Ensure the file is a standard JPEG, PNG, or WEBP.'],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (previewUrl: string, base64: string) => {
    if (!croppingImageInfo) return;
    
    const newImageData: ImageData = {
        base64,
        mimeType: croppingImageInfo.fileType,
        previewUrl,
    };
    
    if (croppingImageInfo.target === 'person') {
       if (mode === 'tryOn') {
        setPersonImages([newImageData]); // Replace
      } else { // 'createScene'
        setPersonImages(prev => [...prev, newImageData]); // Append
      }
    } else {
      setSuitImage(newImageData);
      setSuitInputMode('image');
    }
    setCroppingImageInfo(null);
  };

  const handleRemovePersonImage = (indexToRemove: number) => {
    setPersonImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleCloseCropper = () => {
    setCroppingImageInfo(null);
  };


  const handleGenerate = useCallback(async () => {
    if (mode !== 'logoCreator' && mode !== 'generativeScene' && personImages.length === 0) {
      setError({ title: 'Your Photo is Missing', message: 'Please upload a photo of yourself to get started.' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let resultBase64: string | null = null;
      if (mode === 'tryOn') {
        const suitInput = suitInputMode === 'image' ? suitImage : suitDescription.trim();
        if (!suitInput) {
            setError(suitInputMode === 'image' 
                ? { title: 'Suit Photo Missing', message: 'Please upload a photo of the suit you want to try on.' }
                : { title: 'Suit Description Missing', message: 'Please describe the suit you want to wear.' }
            );
            setIsLoading(false);
            return;
        }
        resultBase64 = await generateSuitImage(personImages[0]!, suitInput);
      } else if (mode === 'createScene') {
          if (!sceneDescription.trim()) {
              setError({ title: 'Scene Description Missing', message: 'Please describe the scene you want to create.' });
              setIsLoading(false);
              return;
          }
          resultBase64 = await generateSceneImage(personImages, sceneDescription.trim());
      } else if (mode === 'generativeScene') {
          if (!generativeSceneDescription.trim()) {
              setError({ title: 'Scene Description Missing', message: 'Please describe the scene you want to create.' });
              setIsLoading(false);
              return;
          }
          resultBase64 = await generateGenerativeSceneImage(generativeSceneDescription.trim());
      } else { // mode === 'logoCreator'
          if (!logoDescription.trim()) {
              setError({ title: 'Logo Description Missing', message: 'Please describe the logo you want to create.' });
              setIsLoading(false);
              return;
          }
          resultBase64 = await generateLogoImage(logoDescription.trim());
      }


      if (resultBase64) {
        setGeneratedImage(`data:image/jpeg;base64,${resultBase64}`);
      } else {
        throw new Error('The model did not return an image. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError({
        title: 'AI Generation Failed',
        message: err instanceof Error ? err.message : 'An unknown error occurred while contacting the AI model.',
        suggestions: [
          'Try using a clearer, front-facing photo.',
          'Simplify your text description.',
          'Check your internet connection and try again.',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [personImages, suitImage, suitDescription, suitInputMode, mode, sceneDescription, logoDescription, generativeSceneDescription]);

  const handleReset = () => {
    setPersonImages([]);
    setSuitImage(null);
    setSuitDescription('');
    setSceneDescription('');
    setLogoDescription('');
    setGenerativeSceneDescription('');
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
  };
  
  const generateButtonLabels: Record<Mode, string> = {
      tryOn: 'Try On Suit',
      createScene: 'Create My Scene',
      generativeScene: 'Generate AI Scene',
      logoCreator: 'Generate Logo'
  };

  const isGenerateDisabled = isLoading || 
    (mode === 'tryOn' && (personImages.length === 0 || ((suitInputMode === 'image' && !suitImage) || (suitInputMode === 'text' && !suitDescription.trim())))) ||
    (mode === 'createScene' && (personImages.length === 0 || !sceneDescription.trim())) ||
    (mode === 'generativeScene' && !generativeSceneDescription.trim()) ||
    (mode === 'logoCreator' && !logoDescription.trim());

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
        <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <Header />
      <main className="container mx-auto max-w-7xl w-full flex-grow flex flex-col items-center">
        
        <div className="flex justify-center p-1 bg-slate-800/80 backdrop-blur-sm rounded-xl mb-8 flex-wrap shadow-lg border border-slate-700">
            <button
                onClick={() => setMode('tryOn')}
                className={`flex items-center px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors ${mode === 'tryOn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
                <SuitIcon /> Suit Try-On
            </button>
            <button
                onClick={() => setMode('createScene')}
                className={`flex items-center px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors ${mode === 'createScene' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
                <PhotoIcon /> My Scene
            </button>
            <button
                onClick={() => setMode('generativeScene')}
                className={`flex items-center px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors ${mode === 'generativeScene' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
                <AIIcon className="w-5 h-5 mr-2"/> AI Scene
            </button>
            <button
                onClick={() => setMode('logoCreator')}
                className={`flex items-center px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors ${mode === 'logoCreator' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
                <PencilIcon /> Logo Creator
            </button>
        </div>

        {mode === 'tryOn' ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start mb-8">
                <ImageUploader
                    title="1. Your Photo"
                    description="Upload a clear, front-facing photo of yourself."
                    onImageSelect={(file) => handleImageSelect(file, 'person')}
                    imageData={personImages[0] || null}
                    onImageRemove={() => setPersonImages([])}
                    aspectRatio="3/4"
                />

                <div className="flex flex-col items-center justify-center h-full text-center lg:mt-32">
                    <div className="hidden lg:block text-indigo-400 mb-4">
                        <ArrowRightIcon />
                    </div>
                     <div className="lg:hidden text-indigo-400 mb-4 rotate-90">
                        <ArrowRightIcon />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600"
                    >
                        <SparklesIcon className="mr-3 w-6 h-6"/>
                        {isLoading ? 'Generating...' : generateButtonLabels[mode]}
                    </button>
                </div>

                <div className="flex flex-col h-full w-full">
                    <div className="flex mb-4 border-b border-slate-700">
                    <button 
                        onClick={() => setSuitInputMode('image')}
                        className={`flex items-center justify-center w-1/2 py-3 font-semibold transition-colors ${suitInputMode === 'image' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <PhotoIcon />
                        <span>Upload Photo</span>
                    </button>
                    <button 
                        onClick={() => setSuitInputMode('text')}
                        className={`flex items-center justify-center w-1/2 py-3 font-semibold transition-colors ${suitInputMode === 'text' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <PencilIcon />
                        <span>Describe with AI</span>
                    </button>
                    </div>
                    {suitInputMode === 'image' ? (
                        <ImageUploader
                            title="2. Suit Photo"
                            description="Upload a photo of the suit."
                            onImageSelect={(file) => handleImageSelect(file, 'suit')}
                            imageData={suitImage}
                            onImageRemove={() => setSuitImage(null)}
                            aspectRatio="1"
                        />
                    ) : (
                        <SuitDescriptionInput
                            description={suitDescription}
                            onDescriptionChange={setSuitDescription}
                        />
                    )}
                </div>
            </div>
        ) : mode === 'createScene' ? (
             <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start mb-8">
                <MultiImageUploader
                    title="1. Your Photos"
                    description="Upload photos. The AI uses the head from the first photo as the main subject."
                    onImageSelect={(file) => handleImageSelect(file, 'person')}
                    images={personImages}
                    onImageRemove={handleRemovePersonImage}
                />
                <div className="flex flex-col items-center justify-center h-full text-center lg:mt-32">
                     <div className="hidden lg:block text-indigo-400 mb-4">
                        <ArrowRightIcon />
                    </div>
                     <div className="lg:hidden text-indigo-400 mb-4 rotate-90">
                        <ArrowRightIcon />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600"
                    >
                        <SparklesIcon className="mr-3 w-6 h-6"/>
                        {isLoading ? 'Generating...' : generateButtonLabels[mode]}
                    </button>
                </div>

                <SceneDescriptionInput
                    description={sceneDescription}
                    onDescriptionChange={setSceneDescription}
                />
            </div>
        ) : mode === 'generativeScene' ? (
            <div className="w-full flex flex-col items-center gap-8 mb-8">
                <div className="w-full max-w-lg">
                    <GenerativeSceneDescriptionInput
                        description={generativeSceneDescription}
                        onDescriptionChange={setGenerativeSceneDescription}
                    />
                </div>
                 <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600"
                >
                    <SparklesIcon className="mr-3 w-6 h-6" />
                    {isLoading ? 'Generating...' : generateButtonLabels[mode]}
                </button>
            </div>
        ) : ( // mode === 'logoCreator'
            <div className="w-full flex flex-col items-center gap-8 mb-8">
                <div className="w-full max-w-lg">
                    <LogoDescriptionInput
                        description={logoDescription}
                        onDescriptionChange={setLogoDescription}
                    />
                </div>
                 <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600"
                >
                    <SparklesIcon className="mr-3 w-6 h-6" />
                    {isLoading ? 'Generating...' : generateButtonLabels[mode]}
                </button>
            </div>
        )}

        <ResultDisplay
          isLoading={isLoading}
          error={error}
          generatedImage={generatedImage}
          onReset={handleReset}
          mode={mode}
        />
      </main>

      {croppingImageInfo && (
        <ImageCropperModal
          imageSrc={croppingImageInfo.src}
          onClose={handleCloseCropper}
          onCropComplete={handleCropComplete}
          aspect={croppingImageInfo.target === 'person' ? 3/4 : 1}
        />
      )}
    </div>
  );
};

export default App;
