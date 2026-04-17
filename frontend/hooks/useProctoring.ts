import { useState, useEffect, useCallback, useRef } from "react";

interface UseProctoringProps {
  maxViolations?: number;
  violationCooldown?: number; // ms to ignore same violation type
  active?: boolean;
  requireFullscreen?: boolean;
  onViolation?: (violation: { reason: string; type: string; count: number }) => void;
}

export function useProctoring({ 
  maxViolations = 3, 
  violationCooldown = 2000,
  active = true,
  requireFullscreen = false,
  onViolation,
}: UseProctoringProps = {}) {
  const [violations, setViolations] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cooldown tracking
  const lastViolationTime = useRef<Record<string, number>>({});

  const addViolation = useCallback((reason: string, type: string = 'general') => {
    if (!active) {
      return;
    }

    const now = Date.now();
    const last = lastViolationTime.current[type];
    if (last && now - last < violationCooldown) {
      return; // Skip if within cooldown
    }
    lastViolationTime.current[type] = now;
    setViolations((prev) => {
      const nextCount = prev + 1;
      onViolation?.({ reason, type, count: nextCount });
      return nextCount;
    });
  }, [active, onViolation, violationCooldown]);

  const requestFullscreen = useCallback(async () => {
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };

    if (document.fullscreenElement) {
      setIsFullscreen(true);
      return true;
    }

    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else if (root.msRequestFullscreen) {
        await root.msRequestFullscreen();
      } else {
        return false;
      }

      setIsFullscreen(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Network monitoring
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      addViolation("Network disconnected", 'network');
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [active, addViolation]);

  // Tab visibility monitoring
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabVisible(false);
        addViolation("Tab switched or minimized", 'visibility');
      } else {
        setIsTabVisible(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, addViolation]);

  useEffect(() => {
    if (!active || !requireFullscreen) {
      return;
    }

    const handleFullscreenChange = () => {
      const currentlyFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(currentlyFullscreen);

      if (!currentlyFullscreen) {
        addViolation("Fullscreen mode exited", "fullscreen_exit");
      }
    };

    setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [active, addViolation, requireFullscreen]);

  // Copy/paste prevention
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("Copy attempt detected", 'copy');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("Paste attempt detected", 'paste');
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("Right-click detected", 'contextmenu');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+C, Ctrl+V, Ctrl+X, etc.
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          addViolation("Copy shortcut detected", 'copy');
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          addViolation("Paste shortcut detected", 'paste');
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          addViolation("Cut shortcut detected", 'cut');
        }
      }
      // Detect DevTools shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.shiftKey && e.key === 'J') || 
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        addViolation("Developer tools shortcut detected", 'devtools');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, addViolation]);

  // DevTools detection via window size (heuristic)
  useEffect(() => {
    if (!active) {
      return;
    }

    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 200;
      const heightThreshold = window.outerHeight - window.innerHeight > 200;
      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          setDevToolsOpen(true);
          addViolation("Developer tools detected", 'devtools');
        }
      } else {
        setDevToolsOpen(false);
      }
    };

    window.addEventListener('resize', detectDevTools);
    const interval = setInterval(detectDevTools, 1000); // check periodically

    return () => {
      window.removeEventListener('resize', detectDevTools);
      clearInterval(interval);
    };
  }, [active, addViolation, devToolsOpen]);

  const disqualify = useCallback((_reason: string) => {
    // Force disqualification by setting violations to max
    setViolations(maxViolations);
  }, [maxViolations]);

  return {
    violations,
    isOnline,
    isTabVisible,
    devToolsOpen,
    isFullscreen,
    addViolation,
    disqualify,
    requestFullscreen,
  };
}

