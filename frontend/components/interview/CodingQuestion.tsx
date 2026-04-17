import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CodingQuestionProps {
  answer: string;
  setAnswer: (value: string) => void;
  starterCode?: string;
  isSpeaking: boolean;
  onRun?: () => void;
  isCompiling?: boolean;
  output?: string;
}

export default function CodingQuestion({
  answer,
  setAnswer,
  starterCode,
  isSpeaking,
  onRun,
  isCompiling,
  output,
}: CodingQuestionProps) {
  return (
    <div className="space-y-4">
      <Textarea
        value={answer || starterCode}
        onChange={(e) => setAnswer(e.target.value)}
        className="font-mono text-sm min-h-[300px] bg-slate-50 dark:bg-slate-900"
      />
      {isSpeaking && (
        <p className="text-sm text-amber-600">
          Unexpected speech detected – please remain silent during coding.
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={onRun} disabled={isCompiling}>
          {isCompiling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run Code
        </Button>
      </div>
      {output !== undefined && (
        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-2">Output:</h4>
          <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}