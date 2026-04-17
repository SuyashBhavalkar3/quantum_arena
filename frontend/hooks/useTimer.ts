import { useState, useEffect, useRef } from "react";

interface UseTimerProps {
  initialTime: number;
  active: boolean;
  onExpire: () => void;
}

export function useTimer({ initialTime, active, onExpire }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = (newTime: number) => {
    setTimeLeft(newTime);
  };

  useEffect(() => {
    if (!active) {
      return;
    }

    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          return prev - 1;
        });
      }, 1000);
    } else {
      onExpire();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, timeLeft, onExpire]);

  return { timeLeft, resetTimer };
}
