import { useState, useRef, useEffect } from "react";

const SPEECH_DETECTION_THRESHOLD = 0.03; // increased to filter background noise
const SILENCE_DURATION_ORAL = 10;
const SPEECH_DURATION_CODING = 5;

interface UseVoiceMonitoringProps {
  stream: MediaStream | null;
  isMicOn: boolean;
  questionType?: "oral" | "coding";
  onViolation: (reason: string) => void;
}

export function useVoiceMonitoring({
  stream,
  isMicOn,
  questionType,
  onViolation,
}: UseVoiceMonitoringProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceViolationInProgress, setVoiceViolationInProgress] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const speechTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const cleanup = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setVoiceViolationInProgress(false);
  };

  const setup = async () => {
    if (!stream || !isMicOn || !questionType) return;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume context (browsers require user interaction, but we're in a user-initiated flow)
      if (context.state === 'suspended') await context.resume();
      
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = context;
      analyserRef.current = analyser;

      const checkVoice = () => {
        if (!analyserRef.current || !questionType) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 256; // 0..1
        const speaking = avg > SPEECH_DETECTION_THRESHOLD;
        setIsSpeaking(speaking);

        if (questionType === "oral") {
          if (!speaking && !voiceViolationInProgress) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                onViolation("No speech detected during oral response");
                setVoiceViolationInProgress(false);
              }, SILENCE_DURATION_ORAL * 1000);
            }
          } else if (speaking) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = undefined;
            }
          }
        } else if (questionType === "coding") {
          if (speaking && !voiceViolationInProgress) {
            if (!speechTimerRef.current) {
              speechTimerRef.current = setTimeout(() => {
                onViolation("Unexpected speech detected during coding");
                setVoiceViolationInProgress(false);
              }, SPEECH_DURATION_CODING * 1000);
            }
          } else if (!speaking) {
            if (speechTimerRef.current) {
              clearTimeout(speechTimerRef.current);
              speechTimerRef.current = undefined;
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVoice);
      };

      checkVoice();
    } catch (error) {
      console.error("Voice monitoring setup failed", error);
    }
  };

  useEffect(() => {
    if (stream && isMicOn && questionType) {
      setup();
    } else {
      cleanup();
    }
    return cleanup;
  }, [stream, isMicOn, questionType]);

  return {
    isSpeaking,
    setupVoiceMonitoring: setup,
    cleanupVoiceMonitoring: cleanup,
  };
}
