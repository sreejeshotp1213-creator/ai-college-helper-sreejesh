import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Image as ImageIcon,
  Camera,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  FileCode,
  Square,
} from 'lucide-react';
import { AttachedImage, AttachedFile } from '../types';

interface ComposerProps {
  prompt: string;
  setPrompt: (text: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  loading: boolean;
  attachedImage: AttachedImage | null;
  setAttachedImage: (img: AttachedImage | null) => void;
  attachedFile: AttachedFile | null;
  setAttachedFile: (file: AttachedFile | null) => void;
  onOpenCamera: () => void;
  isListening: boolean;
  toggleVoiceInput: () => void;
  speechRecognitionSupported: boolean;
  placeholder?: string;
  onClearError?: () => void;
  onError?: (err: string) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  onStop,
  loading,
  attachedImage,
  setAttachedImage,
  attachedFile,
  setAttachedFile,
  onOpenCamera,
  isListening,
  toggleVoiceInput,
  speechRecognitionSupported,
  placeholder,
  onClearError,
  onError,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), 160)}px`;
    }
  }, [prompt]);

  // Handle image upload from storage
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onError?.('Image file size is too large (max 15MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachedImage({
        data: dataUrl,
        previewUrl: dataUrl,
        name: file.name,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
    onClearError?.();
  };

  // Handle document or code upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onError?.('File size exceeds the 10MB limit. Please upload a smaller study document.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          data: reader.result as string,
          name: file.name,
          size: file.size,
          mimeType: 'application/pdf',
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          text: reader.result as string,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
        });
      };
      reader.readAsText(file);
    }

    e.target.value = '';
    onClearError?.();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && (prompt.trim() || attachedImage || attachedFile)) {
        onSubmit();
      }
    }
  };

  const canSubmit = !loading && (prompt.trim().length > 0 || !!attachedImage || !!attachedFile);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Modern Floating Chat Input Container */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-slate-300/90 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/80 transition-all overflow-hidden flex flex-col p-2 sm:p-2.5">
        {/* Attachment Previews Area (if photo or document is selected) */}
        {(attachedImage || attachedFile) && (
          <div className="px-2 pt-1 pb-2 flex flex-wrap gap-2 items-center border-b border-slate-100">
            {/* Image Preview */}
            {attachedImage && (
              <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 pr-2.5 shadow-2xs">
                <img
                  src={attachedImage.previewUrl}
                  alt={attachedImage.name}
                  className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex flex-col max-w-[130px] sm:max-w-[180px]">
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {attachedImage.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">
                    Study Image
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Document / File Preview */}
            {attachedFile && (
              <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 pr-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                  {attachedFile.mimeType.includes('pdf') ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <FileCode className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col max-w-[130px] sm:max-w-[180px]">
                  <span className="text-xs font-medium text-slate-800 truncate">
                    {attachedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatFileSize(attachedFile.size)} • {attachedFile.mimeType.includes('pdf') ? 'PDF' : 'Code'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Input */}
        <div className="px-2 pt-1 pb-1">
          <textarea
            ref={textareaRef}
            id="composer-textarea"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              onClearError?.();
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={placeholder || 'Ask any question, paste code, or attach notes...'}
            rows={1}
            className="w-full bg-transparent resize-none outline-hidden text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed min-h-[38px] max-h-40 overflow-y-auto"
          />
        </div>

        {/* Action Controls Toolbar */}
        <div className="px-1 pt-1 flex items-center justify-between gap-1">
          {/* Left: Input Options (Photo, Camera, File, Voice) */}
          <div className="flex items-center gap-1">
            {/* Photo / Gallery */}
            <button
              id="composer-gallery-btn"
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={loading}
              className="p-2 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Upload photo (textbook, question, diagram)"
              aria-label="Upload photo"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Photo</span>
            </button>

            {/* Camera Capture */}
            <button
              id="composer-camera-btn"
              type="button"
              onClick={onOpenCamera}
              disabled={loading}
              className="p-2 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Take photo with camera"
              aria-label="Take photo"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden xs:inline">Camera</span>
            </button>

            {/* Attach Document / File */}
            <button
              id="composer-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="p-2 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Attach PDF document or code file"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden xs:inline">File</span>
            </button>

            {/* Voice Input (Speech-to-Text) */}
            <button
              id="composer-mic-btn"
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                isListening
                  ? 'bg-rose-50 text-rose-600 animate-pulse'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={
                !speechRecognitionSupported
                  ? 'Speech recognition is not supported in this browser'
                  : isListening
                  ? 'Listening... click to stop'
                  : 'Ask with voice'
              }
              aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] font-semibold text-rose-600">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Send or Stop Button (ChatGPT-style) */}
          {loading ? (
            <button
              id="composer-stop-btn"
              type="button"
              onClick={onStop}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current text-white" />
            </button>
          ) : (
            <button
              id="composer-send-btn"
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                canSubmit
                  ? 'bg-slate-900 hover:bg-black text-white shadow-xs active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Hidden inputs for photo and file picker */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleImageSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.py,.java,.cpp,.c,.js,.ts,.html,.css,.json,.csv,.sql"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Subtle micro footer note */}
      <p className="text-[11px] text-center text-slate-400 mt-1.5 hidden sm:block">
        Press Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
};
