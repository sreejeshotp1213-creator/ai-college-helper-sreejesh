import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (captured: { data: string; previewUrl: string; name: string; mimeType: string }) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Stop camera stream tracks
  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);
    setCapturedPreview(null);

    // Stop previous tracks if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Direct live camera streaming is not supported on this browser. You can still snap or select a photo using your device camera below.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      // Try fallback to any video source if environment failed
      if (mode === 'environment') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setIsInitializing(false);
          return;
        } catch {
          // Fall through to error
        }
      }

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings or use the file upload button below.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('No active camera device was detected on your system.');
      } else {
        setCameraError('Unable to open camera stream. You can upload a photo directly using the device camera picker.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [stream]);

  // Trigger camera on open
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopTracks();
      setCapturedPreview(null);
      setCameraError(null);
    }

    return () => {
      stopTracks();
    };
  }, [isOpen]);

  // Handle Capture
  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use video dimensions
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror for natural feel
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPreview(dataUrl);
  };

  // Retake
  const handleRetake = () => {
    setCapturedPreview(null);
  };

  // Confirm photo
  const handleConfirmPhoto = () => {
    if (!capturedPreview) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    onCapture({
      data: capturedPreview,
      previewUrl: capturedPreview,
      name: `camera-capture-${timestamp}.jpg`,
      mimeType: 'image/jpeg',
    });
    handleCloseModal();
  };

  // Switch Camera
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Close and cleanup
  const handleCloseModal = () => {
    stopTracks();
    setCapturedPreview(null);
    setCameraError(null);
    onClose();
  };

  // Handle direct file input fallback
  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onCapture({
        data: result,
        previewUrl: result,
        name: file.name || 'photo.jpg',
        mimeType: file.type || 'image/jpeg',
      });
      handleCloseModal();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800 relative max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Camera Capture"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {capturedPreview ? 'Review Photo' : 'Capture Study Photo'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative flex-1 min-h-[300px] max-h-[58vh] bg-black flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured preview"
              className="max-h-[58vh] w-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1.5">Camera Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Take or Select Photo</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`max-h-[58vh] w-full object-cover sm:object-contain ${
                  facingMode === 'user' ? '-scale-x-100' : ''
                }`}
              />
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center gap-2 text-slate-300">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-xs font-medium">Starting camera...</span>
                </div>
              )}
              {/* Alignment guides for textbooks/questions */}
              <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="text-[10px] text-white/60 font-mono tracking-wider bg-black/40 px-2 py-0.5 rounded w-fit">
                  AI STUDY SCANNER
                </div>
                <div className="text-center text-[11px] text-white/70 bg-black/50 backdrop-blur-xs py-1 px-3 rounded-full mx-auto">
                  Align textbook page or question inside frame
                </div>
              </div>
            </>
          )}

          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input for native camera fallback */}
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFallbackFileChange}
          />
        </div>

        {/* Controls Footer */}
        <div className="px-4 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                title="Select from gallery instead"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Gallery</span>
              </button>

              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isInitializing || !!cameraError}
                className="w-14 h-14 rounded-full border-4 border-white/80 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mx-auto"
                aria-label="Capture photo"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>

              <button
                type="button"
                onClick={handleFlipCamera}
                disabled={isInitializing || !!cameraError}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
                title="Flip camera"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Flip</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
