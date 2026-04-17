"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Info, Clock, Volume2, MessageSquare, Activity } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface FlaggedMoment { timestamp_seconds: number; reason: string; text?: string; }
interface PerQuestionScore { question_id?: string; question_text?: string; linguistic_score: number; completeness: number; star_structure: number; overall: number; }

interface Report {
  id: number; session_id: string; application_id?: number;
  wpm?: number; pause_count?: number; filler_count?: number;
  pitch_variance?: number; volume_stability?: number;
  linguistic_score?: number; answer_completeness?: number;
  star_structure_score?: number; vocabulary_richness?: number;
  hedging_ratio?: number; deflection_count?: number;
  confidence_index?: number; recommendation?: string;
  per_question_scores?: PerQuestionScore[];
  flagged_moments?: FlaggedMoment[];
  transcript?: string; created_at: string;
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  "Confident":     { label: "Confident",     color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-300", emoji: "✅" },
  "Neutral":       { label: "Neutral",       color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-300",   emoji: "⚡" },
  "Needs Review":  { label: "Needs Review",  color: "text-red-700",     bg: "bg-red-50",      border: "border-red-300",     emoji: "⚠️" },
};

// SVG circular gauge
function ConfidenceGauge({ value }: { value: number }) {
  const r = 60; const cx = 80; const cy = 80;
  const circumference = 2 * Math.PI * r;
  const progress = (value / 100) * circumference;
  const color = value >= 72 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0E8DE" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[#2D2A24] dark:text-white">{Math.round(value)}</span>
        <span className="text-xs text-[#7A6E65] dark:text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max = 10, unit = "" }: { label: string; value?: number | null; max?: number; unit?: string }) {
  if (value == null) return null;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#5A534A] dark:text-slate-400">{label}</span>
        <span className="font-medium text-[#2D2A24] dark:text-white">{typeof value === "number" ? value.toFixed(1) : value}{unit}</span>
      </div>
      <div className="h-1.5 bg-[#F0E8DE] dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-[#B8915C]" />
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60); const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CandidateVoiceReport({ sessionId }: { sessionId: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const token = typeof window !== "undefined" ? getAuthToken() : null;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/analysis/voice/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch report");
        setReport(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, token]);

  const generateReport = async () => {
    setGenerating(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/analysis/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Analysis failed"); }
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-7 h-7 text-[#B8915C] animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="text-center py-10">
      <Activity className="w-10 h-10 mx-auto text-[#B8915C] mb-3" />
      <h3 className="text-base font-semibold text-[#2D2A24] dark:text-white">No Voice Analysis Yet</h3>
      <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1 mb-4">Click below to run the analysis on this interview session.</p>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <button onClick={generateReport} disabled={generating}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8915C] text-white rounded-xl text-sm font-medium hover:bg-[#9A7A4A] disabled:opacity-50 transition-all">
        {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Run Voice Analysis"}
      </button>
    </div>
  );

  const recCfg = RECOMMENDATION_CONFIG[report.recommendation || "Neutral"];
  const ci = report.confidence_index || 0;

  return (
    <div className="space-y-5">
      {/* Confidence gauge */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-6 text-center">
        <h2 className="text-base font-semibold text-[#2D2A24] dark:text-white mb-1">Confidence Index</h2>
        <p className="text-xs text-[#A69A8C] mb-4">40% Prosody + 40% Linguistic + 20% Consistency</p>
        <ConfidenceGauge value={ci} />

        {/* Recommendation badge */}
        {report.recommendation && (
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border text-sm font-semibold ${recCfg.bg} ${recCfg.border} ${recCfg.color}`}>
            <span>{recCfg.emoji}</span> {recCfg.label}
          </div>
        )}
      </div>

      {/* Prosody metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-[#B8915C]" />
          <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white">Voice & Prosody</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "Speaking Rate", value: report.wpm ? `${Math.round(report.wpm)} WPM` : "N/A", note: "Ideal: 120–160" },
            { label: "Pause Count", value: report.pause_count ?? "N/A", note: "Significant pauses" },
            { label: "Filler Words", value: report.filler_count ?? "N/A", note: "um, uh, like, etc." },
            { label: "Volume Stability", value: report.volume_stability != null ? `${(report.volume_stability * 100).toFixed(0)}%` : "N/A", note: "Consistency score" },
          ].map((m) => (
            <div key={m.label} className="bg-[#FAFAF8] dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-[#A69A8C] uppercase tracking-wide">{m.label}</p>
              <p className="text-xl font-bold text-[#2D2A24] dark:text-white mt-0.5">{m.value}</p>
              <p className="text-[10px] text-[#A69A8C] mt-0.5">{m.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Linguistic metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-[#B8915C]" />
          <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white">Linguistic Quality</h3>
        </div>
        <div className="space-y-3">
          <MetricBar label="Answer Completeness"   value={report.answer_completeness} />
          <MetricBar label="STAR Structure Usage"  value={report.star_structure_score} />
          <MetricBar label="Vocabulary Richness"   value={report.vocabulary_richness} />
          {report.hedging_ratio != null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#5A534A] dark:text-slate-400">Hedging Ratio</span>
                <span className={`font-medium ${report.hedging_ratio > 0.4 ? "text-red-500" : "text-emerald-600"}`}>
                  {(report.hedging_ratio * 100).toFixed(0)}% {report.hedging_ratio > 0.4 ? "⚠ High" : "✓ Low"}
                </span>
              </div>
            </div>
          )}
          {report.deflection_count != null && (
            <div className="flex justify-between text-xs">
              <span className="text-[#5A534A] dark:text-slate-400">Questions Deflected</span>
              <span className={`font-medium ${report.deflection_count > 0 ? "text-amber-600" : "text-emerald-600"}`}>{report.deflection_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-question scores */}
      {report.per_question_scores && report.per_question_scores.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white mb-4">Per-Question Scores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0E8DE] dark:border-slate-700">
                  <th className="text-left py-2 text-[#A69A8C] font-medium w-1/2">Question</th>
                  <th className="text-center py-2 text-[#A69A8C] font-medium">Completeness</th>
                  <th className="text-center py-2 text-[#A69A8C] font-medium">STAR</th>
                  <th className="text-center py-2 text-[#A69A8C] font-medium">Linguistic</th>
                  <th className="text-center py-2 text-[#A69A8C] font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {report.per_question_scores.map((q, i) => (
                  <tr key={i} className="border-b border-[#F5F0EA] dark:border-slate-800 last:border-0">
                    <td className="py-2.5 pr-3 text-[#5A534A] dark:text-slate-400 leading-tight">
                      {q.question_text ? q.question_text.slice(0, 60) + (q.question_text.length > 60 ? "…" : "") : `Q${i + 1}`}
                    </td>
                    {[q.completeness, q.star_structure, q.linguistic_score, q.overall].map((v, vi) => (
                      <td key={vi} className={`text-center py-2.5 font-semibold ${v >= 7 ? "text-emerald-600" : v >= 5 ? "text-amber-600" : "text-red-500"}`}>
                        {v?.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flagged moments timeline */}
      {report.flagged_moments && report.flagged_moments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#B8915C]" />
            <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white">Flagged Moments</h3>
          </div>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E8E0D6] dark:bg-slate-700" />
            {report.flagged_moments.map((fm, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900" />
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">{fm.reason.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 font-mono">{formatTime(fm.timestamp_seconds)}</span>
                  </div>
                  {fm.text && <p className="text-xs text-amber-800 dark:text-amber-300 italic">"{fm.text}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-[#F5F0EA] dark:bg-slate-800/50 rounded-xl border border-[#E8E0D6] dark:border-slate-700 p-4">
        <Info className="w-4 h-4 text-[#A69A8C] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#7A6E65] dark:text-slate-400 leading-relaxed">
          <strong className="text-[#5A534A] dark:text-slate-300">Disclaimer:</strong> This voice analysis is an AI-assisted tool to support — not replace — human judgment. Confidence scores are based on measurable acoustic and linguistic signals and should be considered alongside qualitative assessment by HR professionals.
        </p>
      </div>
    </div>
  );
}
