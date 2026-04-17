"use client";

import { useRef, useEffect, memo } from "react";

interface CameraFeedProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  /** External video ref for proctoring/face detection */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  /** Active violation alert to display on the camera overlay */
  violationAlert?: { type: string; message: string } | null;
}

/**
 * Full-panel camera feed — fills its container with object-fit: cover.
 * Reuses the existing MediaStream from useCamera (no duplicate getUserMedia).
 * Also forwards the video element ref for proctoring face detection.
 * Shows violation overlays when AI proctoring detects threats.
 */
function CameraFeedInner({
  stream,
  isCameraOn,
  isMicOn,
  videoRef: externalVideoRef,
  violationAlert,
}: CameraFeedProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const activeRef = externalVideoRef ?? internalVideoRef;

  useEffect(() => {
    if (activeRef.current && stream) {
      activeRef.current.srcObject = stream;
      activeRef.current.onloadedmetadata = () => {
        activeRef.current?.play().catch(() => {});
      };
    }
  }, [stream, activeRef]);

  // Choose icon + color based on violation type
  const getViolationVisual = () => {
    if (!violationAlert) return null;
    switch (violationAlert.type) {
      case "multiple_faces":
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          label: "⚠ MULTIPLE PERSONS",
          borderClass: "border-red-500",
          bgClass: "bg-red-500",
        };
      case "phone_detected":
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
          label: "⚠ PHONE DETECTED",
          borderClass: "border-orange-500",
          bgClass: "bg-orange-500",
        };
      case "face_not_detected":
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ),
          label: "⚠ NO FACE DETECTED",
          borderClass: "border-yellow-500",
          bgClass: "bg-yellow-500",
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          label: "⚠ VIOLATION",
          borderClass: "border-red-500",
          bgClass: "bg-red-500",
        };
    }
  };

  const visual = getViolationVisual();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {isCameraOn && stream ? (
        <video
          ref={activeRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <span className="text-xs">Camera Off</span>
        </div>
      )}

      {/* ── Violation Alert Overlay ── */}
      {violationAlert && visual && (
        <>
          {/* Pulsing border */}
          <div
            className={`absolute inset-0 border-4 ${visual.borderClass} rounded-lg pointer-events-none proctoring-pulse`}
          />
          {/* Semi-transparent overlay */}
          <div
            className={`absolute inset-0 ${visual.bgClass} pointer-events-none rounded-lg opacity-15 proctoring-pulse`}
          />
          {/* Warning badge */}
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none">
            <span className="text-white">{visual.icon}</span>
            <div>
              <p className="text-xs font-bold text-white">{visual.label}</p>
              <p className="text-[10px] text-white/70 max-w-[160px] leading-tight">
                {violationAlert.message}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Status indicators */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isCameraOn ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-[10px] text-white/80">
            {isCameraOn ? "Camera On" : "Camera Off"}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isMicOn ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-[10px] text-white/80">
            {isMicOn ? "Mic On" : "Muted"}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1">
        <span className="text-[10px] text-white/80 font-medium">You</span>
      </div>

    </div>
  );
}

const CameraFeed = memo(CameraFeedInner);
export default CameraFeed;

