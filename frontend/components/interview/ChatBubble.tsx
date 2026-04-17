"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface ChatBubbleProps {
  /** The most recent AI message text, or null if none */
  latestAiMessage: string | null;
  /** Unique key to detect new messages (message ID or timestamp) */
  messageKey: string | null;
}

/**
 * Floating speech bubble that shows the latest AI message, overlaid on the avatar.
 * Slides in from right, auto-dismisses after 10 seconds with a fade-out.
 * Only shows the most recent message — does not stack.
 */
export default function ChatBubble({ latestAiMessage, messageKey }: ChatBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!latestAiMessage || !messageKey) {
      return;
    }

    // Show new message
    clearTimers();
    setFading(false);
    setDisplayedMessage(latestAiMessage);
    setVisible(true);

    // Start fade-out after 10 seconds
    timerRef.current = setTimeout(() => {
      setFading(true);
      // Remove from DOM after fade animation completes (0.4s)
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setFading(false);
        setDisplayedMessage(null);
      }, 400);
    }, 10000);

    return () => {
      clearTimers();
    };
  }, [messageKey, latestAiMessage, clearTimers]);

  if (!visible || !displayedMessage) return null;

  // Truncate very long messages for the bubble
  const truncated =
    displayedMessage.length > 200
      ? displayedMessage.slice(0, 200) + "…"
      : displayedMessage;

  return (
    <div
      className={`absolute top-16 right-4 chat-bubble-enter ${
        fading ? "chat-bubble-exit" : ""
      }`}
      style={{
        maxWidth: 280,
        borderRadius: 16,
        padding: "12px 16px",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Speech bubble tail */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: -6,
          width: 12,
          height: 12,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          transform: "rotate(45deg)",
          borderRadius: 2,
        }}
      />
      <p className="text-sm text-slate-800 leading-relaxed">{truncated}</p>
    </div>
  );
}
