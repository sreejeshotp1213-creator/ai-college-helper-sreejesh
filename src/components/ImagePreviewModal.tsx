import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  imageName?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  imageName,
  onClose,
}) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName || 'study-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold truncate max-w-xs sm:max-w-md">
              {imageName || 'Attached Study Image'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full Image */}
        <div className="p-2 sm:p-4 overflow-auto flex items-center justify-center bg-black/40 max-h-[80vh]">
          <img
            src={imageUrl}
            alt={imageName || 'Study image preview'}
            className="max-h-[75vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
