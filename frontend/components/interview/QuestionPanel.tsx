import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat, Send } from "lucide-react";
import OralQuestion from "./OralQuestion";
import CodingQuestion from "./CodingQuestion";
import type { Section } from "./StartScreen";

interface QuestionPanelProps {
  question: Section;
  answer: string;
  setAnswer: (value: string) => void;
  onNext: () => void;
  isLast: boolean;
  isSpeaking: boolean;
  onRunCode?: () => void;
  isCompiling?: boolean;
  compileOutput?: string;
}

export default function QuestionPanel({
  question,
  answer,
  setAnswer,
  onNext,
  isLast,
  isSpeaking,
  onRunCode,
  isCompiling,
  compileOutput,
}: QuestionPanelProps) {
  // Guard against undefined question
  if (!question) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 lg:col-span-3">
        <CardContent className="p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading question...</p>
        </CardContent>
      </Card>
    );
  }

  const { type, question: text, starterCode } = question;

  const repeatQuestion = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{type === "oral" ? "ORAL" : "CODING"}</Badge>
          <Button variant="ghost" size="sm" onClick={repeatQuestion} className="ml-auto">
            <Repeat className="h-4 w-4 mr-1" /> Repeat
          </Button>
        </div>
        <CardTitle className="text-xl">{text}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === "oral" ? (
          <OralQuestion answer={answer} setAnswer={setAnswer} isSpeaking={isSpeaking} />
        ) : (
          <CodingQuestion
            answer={answer}
            setAnswer={setAnswer}
            starterCode={starterCode}
            isSpeaking={isSpeaking}
            onRun={onRunCode}
            isCompiling={isCompiling}
            output={compileOutput}
          />
        )}
      </CardContent>
      <div className="flex justify-end p-4">
        <Button onClick={onNext}>
          {!isLast ? (
            "Next Question"
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Complete Interview
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}