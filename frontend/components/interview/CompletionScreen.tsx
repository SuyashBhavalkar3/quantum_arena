import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function CompletionScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-lg w-full text-center border-slate-200 dark:border-slate-800">
        <CardContent className="p-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your responses will be reviewed by our AI system and hiring team.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-2">What's Next?</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>✓ AI analysis (1-2 hours)</li>
              <li>✓ Team review (2-3 days)</li>
              <li>✓ Decision notification via email</li>
            </ul>
          </div>
          <Button className="w-full">Back to Applications</Button>
        </CardContent>
      </Card>
    </div>
  );
}