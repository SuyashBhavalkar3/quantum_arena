"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";

/* ────────────────────────────────────────────────────────────────────────────
 * useAIProctoring
 *
 * Runs two AI models on the webcam feed at a configurable interval:
 *   1. face-api.js  TinyFaceDetector — counts faces (0 → warning, >1 → violation)
 *   2. COCO-SSD     (TensorFlow.js)  — detects "cell phone" objects
 *
 * Canvas snapshot approach: captures a frame from the video onto a canvas,
 * then runs detection on the canvas. This avoids cross-origin and readyState
 * issues with directly passing the video element.
 * ──────────────────────────────────────────────────────────────────────────── */

interface UseAIProctoringProps {
  /** Ref to a <video> element currently showing the webcam stream */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the proctoring is active (false pauses detection) */
  active?: boolean;
  /** Interval in ms between detection sweeps (default 3 000) */
  intervalMs?: number;
  /** Callback fired for each detected violation */
  onViolation?: (violation: { type: string; message: string }) => void;
}

interface AIDetectionState {
  /** Number of faces detected in the latest frame */
  faceCount: number | null;
  /** Whether a phone was detected in the latest frame */
  phoneDetected: boolean;
  /** Whether the AI models have finished loading */
  modelsLoaded: boolean;
  /** Description of the latest alert, if any */
  currentAlert: { type: string; message: string } | null;
}

// ─── Global model loading (runs once per page) ──────────────────────────────

let faceModelLoaded = false;
let faceModelLoading = false;
let cocoModel: any = null;
let cocoModelLoading = false;

async function loadFaceModel(): Promise<boolean> {
  if (faceModelLoaded) return true;
  if (faceModelLoading) {
    // Wait for existing load
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (faceModelLoaded || !faceModelLoading) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });
    return faceModelLoaded;
  }

  faceModelLoading = true;
  try {
    console.log("[AIProctoring] Loading face-api.js TinyFaceDetector model...");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    faceModelLoaded = true;
    console.log("[AIProctoring] ✓ TinyFaceDetector model loaded successfully");
    return true;
  } catch (err) {
    console.error("[AIProctoring] ✗ Failed to load TinyFaceDetector model:", err);
    faceModelLoading = false;
    return false;
  }
}

async function loadCocoModel(): Promise<boolean> {
  if (cocoModel) return true;
  if (cocoModelLoading) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (cocoModel || !cocoModelLoading) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });
    return !!cocoModel;
  }

  cocoModelLoading = true;
  try {
    console.log("[AIProctoring] Loading TFJS and COCO-SSD model...");
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    cocoModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    console.log("[AIProctoring] ✓ COCO-SSD model loaded successfully");
    return true;
  } catch (err) {
    console.error("[AIProctoring] ✗ Failed to load COCO-SSD model:", err);
    cocoModelLoading = false;
    return false;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAIProctoring({
  videoRef,
  active = true,
  intervalMs = 3000,
  onViolation,
}: UseAIProctoringProps) {
  const [state, setState] = useState<AIDetectionState>({
    faceCount: null,
    phoneDetected: false,
    modelsLoaded: false,
    currentAlert: null,
  });

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  // Track alert timeout so we can auto-clear it
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Offscreen canvas for capturing video frames
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Load models (independently, so one failure doesn't block the other) ──
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    (async () => {
      // Load both models in parallel; each has its own error handling
      const [faceOk, cocoOk] = await Promise.all([
        loadFaceModel(),
        loadCocoModel(),
      ]);

      if (!cancelled && (faceOk || cocoOk)) {
        console.log(
          `[AIProctoring] Models ready — face: ${faceOk ? "✓" : "✗"}, coco: ${cocoOk ? "✓" : "✗"}`
        );
        setState((s) => ({ ...s, modelsLoaded: true }));
      } else if (!cancelled) {
        console.error("[AIProctoring] All models failed to load");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  // ── Helper: set a timed alert ──────────────────────────────────────────
  const showAlert = useCallback((type: string, message: string) => {
    setState((s) => ({ ...s, currentAlert: { type, message } }));
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setState((s) => ({ ...s, currentAlert: null }));
    }, 5000);
  }, []);

  // ── Capture a canvas snapshot from the video ───────────────────────────
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, [videoRef]);

  // ── Detection loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !state.modelsLoaded) return;

    let cancelled = false;

    const detect = async () => {
      if (cancelled) return;

      const canvas = captureFrame();
      if (!canvas) {
        console.log("[AIProctoring] Skipping frame — video not ready");
        return;
      }

      // ── 1. Face detection (face-api.js) ──────────────────────────────
      if (faceModelLoaded) {
        try {
          const detections = await faceapi.detectAllFaces(
            canvas as unknown as faceapi.TNetInput,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,        // Higher resolution for better accuracy
              scoreThreshold: 0.35,  // Lower threshold to catch more faces
            })
          );

          const faceCount = detections.length;

          if (!cancelled) {
            setState((s) => ({ ...s, faceCount }));

            if (faceCount === 0) {
              const v = {
                type: "face_not_detected",
                message: "No face detected in camera",
              };
              showAlert(v.type, v.message);
              onViolationRef.current?.(v);
            } else if (faceCount > 1) {
              const v = {
                type: "multiple_faces",
                message: `${faceCount} faces detected — unauthorized person in frame`,
              };
              showAlert(v.type, v.message);
              onViolationRef.current?.(v);
            }
          }
        } catch (err) {
          console.warn("[AIProctoring] Face detection error:", err);
        }
      }

      // ── 2. Phone detection (COCO-SSD) ────────────────────────────────
      if (cocoModel && !cancelled) {
        try {
          const predictions: Array<{
            class: string;
            score: number;
            bbox: [number, number, number, number];
          }> = await cocoModel.detect(canvas);

          const phoneFound = predictions.some(
            (p) => p.class === "cell phone" && p.score > 0.45
          );

          if (!cancelled) {
            setState((s) => ({ ...s, phoneDetected: phoneFound }));

            if (phoneFound) {
              const v = {
                type: "phone_detected",
                message: "Phone detected — electronic devices are not allowed",
              };
              showAlert(v.type, v.message);
              onViolationRef.current?.(v);
            }
          }
        } catch (err) {
          console.warn("[AIProctoring] COCO-SSD detection error:", err);
        }
      }
    };

    // Wait 2s for models to warm up, then start loop
    const startDelay = setTimeout(() => {
      if (cancelled) return;
      console.log("[AIProctoring] Detection loop started");
      void detect();
    }, 2000);

    const timer = setInterval(() => {
      if (!cancelled) void detect();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearTimeout(startDelay);
      clearInterval(timer);
    };
  }, [active, state.modelsLoaded, intervalMs, captureFrame, showAlert]);

  // ── Cleanup alert timeout on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  return state;
}
