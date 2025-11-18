import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import { CropIcon, CloseIcon } from './IconComponents.tsx';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (previewUrl: string, base64: string) => void;
  aspect?: number;
}

function getCroppedImage(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<{ previewUrl:string, base64: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const previewUrl = window.URL.createObjectURL(blob);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ previewUrl, base64 });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
}


export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onClose, onCropComplete, aspect }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset crop state when a new image is provided to prevent using a stale crop area.
  useEffect(() => {
    setCrop(undefined);
  }, [imageSrc]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // A simple guard to prevent issues when the image dimensions are not available yet.
    if (width === 0 || height === 0) {
      return;
    }

    const newCrop = centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect || width / height, // Use the image's aspect ratio as a fallback for free-form crops
            width,
            height
        ),
        width,
        height
    );
    setCrop(newCrop);
  };
  
  const handleCrop = async () => {
    if (imgRef.current && completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        setIsProcessing(true);
        try {
            const { previewUrl, base64 } = await getCroppedImage(imgRef.current, completedCrop);
            onCropComplete(previewUrl, base64);
        } catch (e) {
            console.error("Cropping failed:", e);
        } finally {
            setIsProcessing(false);
        }
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CropIcon />
            <h2 className="text-2xl font-bold">Crop Your Image</h2>
          </div>
          <button onClick={onClose} aria-label="Close cropper" className="text-slate-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center min-h-0 bg-slate-900/50 rounded-lg p-2">
            <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={100}
                minHeight={100}
            >
                <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Source for cropping" className="max-h-[65vh] object-contain" />
            </ReactCrop>
        </div>
        <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="px-6 py-3 font-semibold text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                Cancel
            </button>
            <button 
                onClick={handleCrop}
                disabled={!completedCrop || completedCrop.width === 0 || isProcessing}
                className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isProcessing ? 'Processing...' : 'Crop Image'}
            </button>
        </div>
      </div>
    </div>
  );
};