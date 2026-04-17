import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

interface UseFaceRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useFaceRecognition({ videoRef }: UseFaceRecognitionProps) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load face models", error);
      }
    };
    loadModels();
  }, []);

  // Capture reference face
  const captureReference = async (): Promise<boolean> => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return false;

    const video = videoRef.current;
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return false;

    setReferenceDescriptor(detection.descriptor);

    // Optional: upload to Cloudinary (can be extracted to separate service)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    // ... upload logic

    return true;
  };

  // Start periodic face check
  const startFaceCheck = (onViolation: (reason: string) => void) => {
    if (!videoRef.current || !referenceDescriptor) return;

    faceCheckInterval.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          onViolation("No face detected");
          return;
        }

        const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
        if (distance > 0.6) {
          onViolation("Face mismatch - possible impersonation");
        }
      } catch (error) {
        console.error("Face check error", error);
      }
    }, 5000);
  };

  const stopFaceCheck = () => {
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
  };

  return {
    modelsLoaded,
    referenceDescriptor,
    canvasRef,
    captureReference,
    startFaceCheck,
    stopFaceCheck,
  };
}
