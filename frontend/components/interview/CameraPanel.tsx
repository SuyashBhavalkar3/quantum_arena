import { RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
interface CameraPanelProps {
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export default function CameraPanel({
  videoRef,
  stream,
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  error,
  onRetry,
}: CameraPanelProps) {
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;
  }
}, [stream, videoRef]);
  return (
    
    <Card className="border-slate-200 dark:border-slate-800 lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
              <p className="text-sm text-white mb-2">{error}</p>
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
              )}
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                  <VideoOff className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </>
          )}
        </div>
        {!error && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onToggleCamera} className="flex-1">
              {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onToggleMic} className="flex-1">
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}