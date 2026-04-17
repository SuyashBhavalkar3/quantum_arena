import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, AlertTriangle } from "lucide-react";

export interface Section {
  name: string;
  type: string;
  duration: number;
  content?: string;
  question?: string;
  starterCode?: string;
}

interface StartScreenProps {
  questions: Section[];
  onStart: () => void;
  modelsLoaded: boolean;
}

export default function StartScreen({ questions, onStart, modelsLoaded }: StartScreenProps) {
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-2xl w-full border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl">AI Interview - {questions[0]?.name ? questions[0].name.slice(0, 30) : "Interview"}</CardTitle>
          <p className="text-slate-600 dark:text-slate-400">Based on your job description</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Interview Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li>• Camera and microphone must remain on throughout</li>
              <li>• Mix of oral and coding questions</li>
              <li>• Each question has a time limit</li>
              <li>• AI proctored for fairness</li>
              <li>• Ensure quiet, well-lit environment</li>
              <li>• Questions will be spoken aloud – keep volume on</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sections</p>
              <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Est. Duration</p>
              <p className="text-2xl font-bold text-purple-600">{questions.reduce((sum, q) => sum + (q.duration || 0), 0)} min</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <strong>Important:</strong> Any violation (tab switch, face mismatch, network drop,
              unexpected silence/speech) will count against you. After 3 violations, you will be disqualified.
            </p>
          </div>

          <Button
            onClick={onStart}
            disabled={!modelsLoaded}
            className="w-full h-12 text-lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            {modelsLoaded ? "Start Interview" : "Loading models..."}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
