import React, { useRef } from 'react';
import type { ImageData } from '../types.ts';
import { UploadIcon, CloseIcon } from './IconComponents.tsx';

interface ImageUploaderProps {
  title: string;
  description: string;
  onImageSelect: (file: File) => void;
  imageData: ImageData | null;
  onImageRemove: () => void;
  aspectRatio: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, onImageSelect, imageData, onImageRemove, aspectRatio }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    // If an image already exists, don't trigger file input on click of the image itself.
    // The user can use the dedicated remove button.
    if (!imageData) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col items-center text-center h-full w-full shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-4">{description}</p>
      <div
        className="relative w-full bg-slate-900/70 rounded-lg group overflow-hidden"
        style={{ aspectRatio: aspectRatio }}
      >
        <div
            className={`w-full h-full flex items-center justify-center border-2 border-dashed border-slate-600 transition-all duration-300 ${!imageData ? 'cursor-pointer hover:border-indigo-500' : ''}`}
            onClick={handleClick}
        >
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            />
            {imageData ? (
            <img src={imageData.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
            <div className="flex flex-col items-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                <UploadIcon />
                <span className="mt-2 font-semibold">Click to upload</span>
            </div>
            )}
        </div>
         {imageData && (
            <button
            onClick={(e) => { e.stopPropagation(); onImageRemove(); }}
            className="absolute top-2 right-2 p-1.5 bg-slate-900/70 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
            aria-label="Remove image"
            >
            <CloseIcon />
            </button>
        )}
      </div>
    </div>
  );
};