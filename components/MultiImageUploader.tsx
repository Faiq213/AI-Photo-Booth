import React, { useRef } from 'react';
import type { ImageData } from '../types.ts';
import { UploadIcon, CloseIcon } from './IconComponents.tsx';

interface MultiImageUploaderProps {
  title: string;
  description: string;
  onImageSelect: (file: File) => void;
  images: ImageData[];
  onImageRemove: (index: number) => void;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ title, description, onImageSelect, images, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
     // Reset file input to allow uploading the same file again
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col items-center text-center h-full w-full shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-4">{description}</p>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-square">
            <img src={image.previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => onImageRemove(index)}
              className="absolute top-1 right-1 p-1.5 bg-slate-900/70 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10 opacity-0 group-hover:opacity-100"
              aria-label={`Remove image ${index + 1}`}
            >
              <CloseIcon />
            </button>
            {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 rounded-b-lg">Primary</div>
            )}
          </div>
        ))}
        <div
          className="w-full aspect-square flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg transition-all duration-300 cursor-pointer hover:border-indigo-500 bg-slate-900/70"
          onClick={handleAddClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
          <div className="flex flex-col items-center text-slate-500 hover:text-indigo-400 transition-colors">
            <UploadIcon />
            <span className="mt-2 text-sm font-semibold">Add Photo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
