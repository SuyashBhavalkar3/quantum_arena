"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Square, Loader2 } from "lucide-react";
import { ConversationMessage } from "@/services/conversationStateManager";

interface ChatPanelProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isWaitingForResponse: boolean;
  isAISpeaking: boolean;
  /** STT recording controls */
  isRecording?: boolean;
  isProcessing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

/**
 * Static always-visible chat panel — never floating, never toggled.
 * Structure: fixed header → scrollable messages → fixed input area.
 */
export default function ChatPanel({
  messages,
  onSendMessage,
  isWaitingForResponse,
  isAISpeaking,
  isRecording = false,
  isProcessing = false,
  onStartRecording,
  onStopRecording,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isWaitingForResponse) return;
    onSendMessage(input);
    setInput("");
  }, [input, isWaitingForResponse, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording && onStopRecording) {
      await onStopRecording();
    } else if (onStartRecording) {
      await onStartRecording();
    }
  }, [isRecording, onStartRecording, onStopRecording]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-r border-slate-200 dark:border-slate-700">
      {/* ─── Header (fixed ~48px) ─── */}
      <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Chat
        </h3>
        <div className="flex items-center gap-2">
          {isAISpeaking && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 speaking-dot" />
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                Speaking
              </span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                Recording
              </span>
            </div>
          )}
          <span className="text-[10px] text-slate-400">
            {messages.length} msgs
          </span>
        </div>
      </div>

      {/* ─── Messages (flex-grow, scrollable) ─── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
            Interview chat will appear here…
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "candidate" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "candidate"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : msg.role === "system"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 italic text-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <span
                className={`block text-[10px] mt-1 ${
                  msg.role === "candidate"
                    ? "text-blue-200"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isWaitingForResponse && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              <span className="text-xs text-slate-500">AI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input area (fixed ~64px) ─── */}
      <div className="flex-none border-t border-slate-200 dark:border-slate-700 p-3 space-y-2">
        {isRecording && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-300">
            🎤 Recording… Click stop when done.
          </div>
        )}

        {isProcessing && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-600 dark:text-blue-300 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Converting voice to text…
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isWaitingForResponse
                ? "Waiting for AI…"
                : "Type your answer…"
            }
            disabled={isWaitingForResponse || isRecording || isProcessing}
            className="flex-1 px-3 py-2 text-sm rounded-lg resize-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            rows={1}
          />
        </div>

        <div className="flex gap-2">
          {(onStartRecording || onStopRecording) && (
            <button
              onClick={handleVoiceToggle}
              disabled={isWaitingForResponse || isProcessing || isAISpeaking}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              } disabled:opacity-40`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Stop
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> Voice
                </>
              )}
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!input.trim() || isWaitingForResponse || isAISpeaking}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
