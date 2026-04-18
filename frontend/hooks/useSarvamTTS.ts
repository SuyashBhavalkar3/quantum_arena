import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSarvamTTSProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  backendUrl?: string;
}

export function useSarvamTTS({
  onSpeakingStart,
  onSpeakingEnd,
  backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
}: UseSarvamTTSProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const speak = useCallback(
    async (text: string) => {
      try {
        if (!text) return;
        setError(null);
        setIsLoading(true);

        if (sourceRef.current) {
          try {
            sourceRef.current.stop();
          } catch {
            // Ignore if the previous source already ended.
          }
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }

        const response = await fetch(`${backendUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`TTS failed: ${response.statusText}`);
        }

        const data = await response.json();
        const audioBase64 = data.audio;

        if (!audioBase64) {
          throw new Error('No audio data returned from server');
        }

        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i += 1) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        if (!analyserRef.current) {
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.6;
          analyser.connect(audioContext.destination);
          analyserRef.current = analyser;
        }

        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0));
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyserRef.current);

        setIsLoading(false);
        setIsSpeaking(true);
        onSpeakingStart?.();

        source.onended = () => {
          setIsSpeaking(false);
          sourceRef.current = null;
          onSpeakingEnd?.();
        };

        source.start();
        sourceRef.current = source;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'TTS conversion failed';
        setError(errorMsg);
        setIsLoading(false);
        console.error('TTS Error:', err);
      }
    },
    [backendUrl, onSpeakingEnd, onSpeakingStart]
  );

  const cancel = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped.
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Ignore if already stopped.
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isLoading,
    error,
    analyserRef,
  };
}
