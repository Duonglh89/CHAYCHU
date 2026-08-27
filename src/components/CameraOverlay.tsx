import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraOverlayProps {
  opacity: number;
  isMirrored: boolean;
  position: 'behind' | 'side' | 'pip';
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ opacity, isMirrored, position }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setError(null);
        if (currentStream) {
          currentStream.getTracks().forEach((t) => t.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setError('Không thể mở camera. Vui lòng cấp quyền truy cập camera trong trình duyệt.');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (error) {
    return (
      <div className="absolute top-16 right-4 z-20 bg-neutral-900/90 border border-red-500/50 text-red-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 backdrop-blur-md">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (position === 'pip') {
    return (
      <div className="absolute bottom-20 right-4 z-20 w-48 sm:w-64 aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored || facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={toggleFacingMode}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"
            title="Đổi camera trước/sau"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: opacity / 100 }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored || facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />
    </div>
  );
};
