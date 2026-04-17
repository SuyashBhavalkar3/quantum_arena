"use client";

import { memo, useEffect, useRef, useCallback } from "react";

interface AvatarCanvasProps {
  isSpeaking: boolean;
}

const LISTENING_SRC = "/listening.mp4";
const SPEAKING_SRC = "/speaking.mp4";

function AvatarCanvasInner({ isSpeaking }: AvatarCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentModeRef = useRef<"listening" | "speaking">("listening");

  const switchVideo = useCallback((mode: "listening" | "speaking") => {
    const video = videoRef.current;
    if (!video) return;

    // Skip if already playing the correct video
    if (currentModeRef.current === mode) return;
    currentModeRef.current = mode;

    const src = mode === "speaking" ? SPEAKING_SRC : LISTENING_SRC;

    // Swap source and play immediately
    video.src = src;
    video.muted = mode === "listening";
    video.load();
    video.play().catch(console.error);
  }, []);

  // Default to listening on mount
  useEffect(() => {
    switchVideo("listening");
  }, [switchVideo]);

  // React to isSpeaking changes
  useEffect(() => {
    switchVideo(isSpeaking ? "speaking" : "listening");
  }, [isSpeaking, switchVideo]);

  return (
    <div
      className="h-full w-full"
      style={{ position: "relative", minHeight: 0, overflow: "hidden", background: "#0a0a0f" }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

const AvatarCanvas = memo(AvatarCanvasInner);
export default AvatarCanvas;
