import { Textarea } from "@/components/ui/textarea";
import { Mic } from "lucide-react";

interface OralQuestionProps {
  answer: string;
  setAnswer: (value: string) => void;
  isSpeaking: boolean;
}

export default function OralQuestion({ answer, setAnswer, isSpeaking }: OralQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950/30 p-8 rounded-lg text-center">
        <Mic className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Speak your answer clearly. Your response is being recorded.
        </p>
        {!isSpeaking && (
          <p className="text-sm text-amber-600 mt-2">No voice detected – please speak.</p>
        )}
      </div>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="You can also type notes here..."
        className="min-h-[150px]"
      />
    </div>
  );
}