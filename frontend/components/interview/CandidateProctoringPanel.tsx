"use client";

import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

interface CandidateProctoringPanelProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  stream?: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onCameraToggle: () => void;
  onMicToggle: () => void;
  error?: string | null;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isSpeaking?: boolean;
}

export default function CandidateProctoringPanel({
  isCameraOn,
  isMicOn,
  stream,
  videoRef: externalVideoRef,
  onCameraToggle,
  onMicToggle,
  error,
  canvasRef,
  isSpeaking,
}: CandidateProctoringPanelProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">(
    stream ? "connected" : "disconnected"
  );

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setConnectionStatus("connected");
    }
  }, [stream]);

  useEffect(() => {
    setConnectionStatus(stream ? "connected" : "disconnected");
  }, [stream]);

  return (
    <Card className="flex flex-col h-full bg-slate-900 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white">Your Camera</CardTitle>
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-slate-400">
              {connectionStatus === "connected"
                ? "Recording"
                : "Not Recording"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Video Feed */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden rounded-lg">
          {isCameraOn && stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isSpeaking && (
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none">
                  <div className="absolute inset-0 rounded-lg bg-green-500 opacity-20 animate-pulse" />
                </div>
              )}
              {canvasRef && (
                <canvas
                  ref={canvasRef}
                  className="hidden"
                  width="640"
                  height="480"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Camera Off</p>
              {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="border-t border-slate-700 p-3 space-y-2">
          {/* Camera Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Camera</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isCameraOn ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className={isCameraOn ? "text-green-500" : "text-red-500"}>
                {isCameraOn ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Microphone Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Microphone</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isMicOn ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className={isMicOn ? "text-green-500" : "text-red-500"}>
                {isMicOn ? "Active" : "Muted"}
              </span>
            </div>
          </div>

          {/* Audio Activity */}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <span className="flex h-2 w-2">
                <span className="animate-pulse h-2 w-2 rounded-full bg-green-500" />
              </span>
              Speaking
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="border-t border-slate-700 p-3 flex gap-2">
          <button
            onClick={onCameraToggle}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-colors ${
              isCameraOn
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </button>
          <button
            onClick={onMicToggle}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-colors ${
              isMicOn
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {isMicOn ? "Mute" : "Unmute"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border-t border-red-500 bg-red-950 p-2 text-xs text-red-200">
            <p className="font-semibold">Camera Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
