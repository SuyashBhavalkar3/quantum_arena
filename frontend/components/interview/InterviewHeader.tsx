import { Badge } from "@/components/ui/badge";
import { Clock, WifiOff, EyeOff, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { useProctoring } from "@/hooks/useProctoring";
import AISpeakingAnimation from "./AISpeakingAnimation";

interface InterviewHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
  violations: number;
  isSpeaking: boolean;
  isAISpeaking: boolean;
}

export default function InterviewHeader({
  currentIndex,
  totalQuestions,
  timeLeft,
  violations,
  isSpeaking,
  isAISpeaking,
}: InterviewHeaderProps) {
  const { isOnline, isTabVisible } = useProctoring();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Interview</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Question {currentIndex + 1} of {totalQuestions}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
          {!isTabVisible && (
            <Badge variant="destructive" className="gap-1">
              <EyeOff className="h-3 w-3" /> Tab Hidden
            </Badge>
          )}
          {isAISpeaking && (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              <AISpeakingAnimation isSpeaking={isAISpeaking} />
              <span className="text-xs text-blue-700 dark:text-blue-300">AI Speaking</span>
            </div>
          )}
          {isSpeaking ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Volume2 className="h-3 w-3" /> You're Speaking
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <VolumeX className="h-3 w-3" /> Silent
            </Badge>
          )}
          <Badge
            variant={violations === 0 ? "outline" : violations === 1 ? "secondary" : "destructive"}
            className="gap-1"
          >
            <AlertTriangle className="h-3 w-3" /> Violations: {violations}/3
          </Badge>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border">
          <Clock className={`h-5 w-5 ${timeLeft < 30 ? "text-red-500" : "text-blue-600"}`} />
          <span className={`font-mono font-semibold ${timeLeft < 30 ? "text-red-500" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}