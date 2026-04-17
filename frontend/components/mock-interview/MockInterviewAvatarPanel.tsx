"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as faceapi from "face-api.js";
import { Volume2 } from "lucide-react";

const LIP_SMOOTHING_ALPHA = 0.4;

interface MockInterviewAvatarPanelProps {
  isSpeaking: boolean;
  enabled: boolean;
}

export default function MockInterviewAvatarPanel({
  isSpeaking,
  enabled,
}: MockInterviewAvatarPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousCentroidRef = useRef<{ x: number; y: number } | null>(null);
  const driftHistoryRef = useRef<number[]>([]);
  const driftFrameCountRef = useRef(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // This loads the existing face-api landmark model once so the overlay can anchor to the mouth.
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load mock interview lip-sync models", error);
        if (!cancelled) {
          setCameraError("Unable to load face tracking models.");
        }
      }
    };

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // This scopes webcam access to the active mock session so setup state remains untouched.
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!enabled) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraReady(true);
        setCameraError(null);
      } catch (error) {
        console.error("Mock interview camera error", error);
        if (!cancelled) {
          setCameraReady(false);
          setCameraError("Camera preview unavailable for lip sync.");
        }
      }
    };

    if (enabled) {
      void startCamera();
    }

    return () => {
      cancelled = true;
      setCameraReady(false);
      previousCentroidRef.current = null;
      driftHistoryRef.current = [];
      driftFrameCountRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  // This keeps detection and rendering in the same source video coordinate space.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      return;
    }

    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => {
      void video.play().catch((error) => console.error("Mock interview video play failed", error));
    };
  }, [cameraReady]);

  // This redraws a centroid-anchored lip mesh every frame so the overlay does not drift off the mouth.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!enabled || !modelsLoaded || !cameraReady || !video || !canvas) {
      return;
    }

    let cancelled = false;
    let processing = false;

    const renderFrame = async () => {
      if (cancelled) {
        return;
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        void renderFrame();
      });

      if (processing || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      processing = true;

      try {
        const displayWidth = canvas.offsetWidth || 150;
        const displayHeight = canvas.offsetHeight || 160;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
        }

        const context = canvas.getContext("2d");
        if (!context || !video.videoWidth || !video.videoHeight) {
          return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }))
          .withFaceLandmarks();

        if (!detection) {
          previousCentroidRef.current = null;
          return;
        }

        const mouthLandmarks = detection.landmarks.getMouth();
        if (!mouthLandmarks.length) {
          previousCentroidRef.current = null;
          return;
        }

        const scaleX = displayWidth / video.videoWidth;
        const scaleY = displayHeight / video.videoHeight;

        const transformedPoints = mouthLandmarks.map((point) => ({
          x: point.x * scaleX,
          y: point.y * scaleY,
        }));

        const centroid = transformedPoints.reduce(
          (accumulator, point) => ({
            x: accumulator.x + point.x / transformedPoints.length,
            y: accumulator.y + point.y / transformedPoints.length,
          }),
          { x: 0, y: 0 }
        );

        const smoothedCentroid = previousCentroidRef.current
          ? {
              x:
                LIP_SMOOTHING_ALPHA * centroid.x +
                (1 - LIP_SMOOTHING_ALPHA) * previousCentroidRef.current.x,
              y:
                LIP_SMOOTHING_ALPHA * centroid.y +
                (1 - LIP_SMOOTHING_ALPHA) * previousCentroidRef.current.y,
            }
          : centroid;

        if (previousCentroidRef.current) {
          const drift = Math.hypot(
            smoothedCentroid.x - previousCentroidRef.current.x,
            smoothedCentroid.y - previousCentroidRef.current.y
          );

          driftHistoryRef.current.push(drift);
          driftFrameCountRef.current += 1;

          if (driftHistoryRef.current.length > 30) {
            driftHistoryRef.current.shift();
          }

          if (driftFrameCountRef.current % 30 === 0 && driftHistoryRef.current.length === 30) {
            const maxDrift = Math.max(...driftHistoryRef.current);
            console.debug(`[mock-lipsync] max centroid drift over 30 frames: ${maxDrift.toFixed(2)}px`);
          }
        }

        previousCentroidRef.current = smoothedCentroid;

        const relativePoints = transformedPoints.map((point) => ({
          x: point.x - centroid.x,
          y: point.y - centroid.y,
        }));

        const bounds = relativePoints.reduce(
          (accumulator, point) => ({
            minX: Math.min(accumulator.minX, point.x),
            maxX: Math.max(accumulator.maxX, point.x),
            minY: Math.min(accumulator.minY, point.y),
            maxY: Math.max(accumulator.maxY, point.y),
          }),
          {
            minX: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
          }
        );

        const mouthWidth = Math.max(bounds.maxX - bounds.minX, 18);
        const mouthHeight = Math.max(bounds.maxY - bounds.minY, 6);
        const speakingScaleY = isSpeaking ? 1.2 + Math.sin(performance.now() / 90) * 0.12 : 1;

        context.save();
        context.translate(smoothedCentroid.x, smoothedCentroid.y);
        context.scale(1, speakingScaleY);
        context.beginPath();
        context.ellipse(0, 0, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
        context.fillStyle = "rgba(90, 60, 40, 0.34)";
        context.shadowColor = "rgba(50, 25, 15, 0.22)";
        context.shadowBlur = 4;
        context.fill();
        context.restore();
      } catch (error) {
        console.error("Mock interview lip-sync frame error", error);
      } finally {
        processing = false;
      }
    };

    void renderFrame();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraReady, enabled, isSpeaking, modelsLoaded]);

  const showVideo = enabled && cameraReady && !cameraError;

  return (
    <div style={{ width: 150 }} className="flex-shrink-0 flex flex-col items-center gap-2">
      <div className="relative w-[150px] rounded-2xl border border-[#E8E0D6] dark:border-slate-700 bg-[#FAFAF8] dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="relative w-[150px] h-[160px] bg-[#F2ECE4] dark:bg-slate-950">
          {showVideo ? (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            </>
          ) : (
            <Image
              src="/avatar.png"
              alt="AI Interviewer"
              fill
              style={{ objectFit: "cover", objectPosition: "center top" }}
              priority
              draggable={false}
            />
          )}
        </div>

        <div
          className={`px-3 py-1.5 flex items-center justify-center gap-1.5 transition-colors duration-300 ${
            isSpeaking ? "bg-violet-50 dark:bg-violet-900/30" : "bg-[#F5F0EA] dark:bg-slate-800"
          }`}
        >
          {isSpeaking ? (
            <>
              {[3, 5, 3, 6, 4].map((height, index) => (
                <div
                  key={index}
                  className="w-0.5 rounded-full bg-violet-500 animate-pulse"
                  style={{ height: `${height * 2}px`, animationDelay: `${index * 0.1}s` }}
                />
              ))}
              <span className="text-[10px] text-violet-500 font-medium ml-1">Speaking</span>
            </>
          ) : (
            <span className="text-[10px] text-[#A69A8C] dark:text-slate-500 font-medium flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> AI Interviewer
            </span>
          )}
        </div>
      </div>

      {cameraError && <p className="text-[10px] text-amber-600 text-center">{cameraError}</p>}
    </div>
  );
}
