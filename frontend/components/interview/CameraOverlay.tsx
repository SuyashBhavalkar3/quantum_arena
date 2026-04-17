"use client";

import { useRef, useEffect, memo } from "react";
import { Camera, Mic, MicOff } from "lucide-react";

interface CameraOverlayProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
}

/**
 * Small camera feed overlay positioned at the bottom-right of the right panel.
 * Reuses the existing getUserMedia stream from proctoring — does NOT request new permissions.
 */
function CameraOverlayInner({ stream, isCameraOn, isMicOn }: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {});
      };
    }
  }, [stream]);

  return (
    <div
      className="absolute bottom-4 right-4 overflow-hidden"
      style={{
        width: 160,
        height: 120,
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        zIndex: 10,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        backgroundColor: "#111",
      }}
    >
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <Camera className="w-6 h-6 text-slate-600" />
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {/* Camera active dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            isCameraOn ? "bg-green-500" : "bg-red-500"
          }`}
          style={{
            boxShadow: isCameraOn
              ? "0 0 6px rgba(34, 197, 94, 0.6)"
              : "0 0 6px rgba(239, 68, 68, 0.6)",
          }}
        />
      </div>

      {/* Mic indicator */}
      <div className="absolute top-2 right-2">
        {isMicOn ? (
          <Mic className="w-3 h-3 text-green-400" />
        ) : (
          <MicOff className="w-3 h-3 text-red-400" />
        )}
      </div>
    </div>
  );
}

const CameraOverlay = memo(CameraOverlayInner);
export default CameraOverlay;
