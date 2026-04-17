"use client";
import CandidateVoiceReport from "@/components/hr/CandidateVoiceReport";
import { useParams } from "next/navigation";

export default function VoiceReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Voice Analysis Report</h1>
        <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-0.5">Session: <code className="font-mono text-[11px] bg-[#F5F0EA] dark:bg-slate-800 px-1.5 py-0.5 rounded">{sessionId}</code></p>
      </div>
      <CandidateVoiceReport sessionId={sessionId} />
    </div>
  );
}
