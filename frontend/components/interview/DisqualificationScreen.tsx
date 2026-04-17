import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DisqualificationScreenProps {
  reason: string;
}

export default function DisqualificationScreen({ reason }: DisqualificationScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-lg w-full border-red-200 dark:border-red-800">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-600">Interview Disqualified</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{reason}</p>
          <p className="text-sm text-slate-500 mb-6">
            If you believe this is an error, please contact support.
          </p>
          <Button className="w-full" variant="destructive">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}