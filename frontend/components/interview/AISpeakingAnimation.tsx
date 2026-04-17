"use client";

import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";

interface AISpeakingAnimationProps {
  isSpeaking: boolean;
}

export default function AISpeakingAnimation({ isSpeaking }: AISpeakingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (containerRef.current && !animationRef.current && !loadError) {
      try {
        animationRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: false,
          path: "/lottie/speaking.json",
        });

        animationRef.current.addEventListener('data_ready', () => {
        });

        animationRef.current.addEventListener('data_failed', () => {
          console.error("Lottie data failed");
          setLoadError(true);
        });
      } catch (e) {
        console.error("Lottie load error:", e);
        setLoadError(true);
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [loadError]); // Only runs once unless loadError changes

  // Handle play/pause with reset
  useEffect(() => {
    if (animationRef.current && !loadError) {
      if (isSpeaking) {
        // Reset to first frame before playing
        animationRef.current.goToAndStop(0, true);
        animationRef.current.play();
      } else {
        animationRef.current.stop();
      }
    }
  }, [isSpeaking, loadError]);

  // Fallback CSS animation
  if (loadError) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div 
          className={`w-4 h-4 bg-blue-500 rounded-full transition-all ${
            isSpeaking ? 'animate-pulse scale-125' : ''
          }`} 
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: 40, height: 40 }}
      className="transition-opacity duration-300"
    />
  );
}