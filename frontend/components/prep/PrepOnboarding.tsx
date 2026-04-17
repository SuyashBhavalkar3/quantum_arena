"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, Loader2, Download,
  Target, Code2, AlertTriangle, ChevronRight, ChevronLeft,
  Upload, X,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STEPS = ["Resume", "Target Setup", "Tech Profile", "Generating"];

interface OnboardStatus {
  has_resume: boolean;
  resume_url?: string;
  candidate_name?: string;
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#2D2A24] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C] transition-all placeholder:text-[#A69A8C]";

export default function PrepOnboarding() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<OnboardStatus | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);

  // Inline upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [jobRole, setJobRole] = useState("");
  const [targetCompanies, setTargetCompanies] = useState("");
  const [daysAvailable, setDaysAvailable] = useState(30);
  const [currentStack, setCurrentStack] = useState("");
  const [weakestSkill, setWeakestSkill] = useState("");

  // Report state
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("prep_report.pdf");
  const [error, setError] = useState("");

  // Token always read inside effects/handlers — avoids Next.js hydration race
  const getToken = () => getAuthToken();

  // ── Check resume status on mount ────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          if (mounted) {
            setUploadError("Not authenticated — please sign in again.");
            setCheckingResume(false);
          }
          return;
        }
        const res = await fetch(`${API_BASE}/prep/resume-status`, {
          headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: OnboardStatus = await res.json();
        if (mounted) {
          setStatus(data);
          if (data.has_resume) setStep(1); // skip upload step
        }
      } catch (e: any) {
        if (mounted) setUploadError(e.message || "Failed to check resume status.");
      } finally {
        if (mounted) setCheckingResume(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Inline resume upload ────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only PDF or Word documents are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10 MB.");
      return;
    }
    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const token = getToken();
      const form = new FormData();
      form.append("file", selectedFile);

      const res = await fetch(`${API_BASE}/prep/upload-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }

      const data: OnboardStatus = await res.json();
      setStatus(data);
      setSelectedFile(null);
      setStep(1); // advance to target setup
    } catch (e: any) {
      setUploadError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Generate report ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setStep(3);
    try {
      const res = await fetch(`${API_BASE}/prep/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          job_role: jobRole,
          target_companies: targetCompanies.split(",").map((s) => s.trim()).filter(Boolean),
          days_available: daysAvailable,
          current_tech_stack: currentStack,
          weakest_skill: weakestSkill,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "Report generation failed" }));
        throw new Error(e.detail || "Report generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const match = (res.headers.get("Content-Disposition") || "").match(/filename="(.+?)"/);
      setDownloadUrl(url);
      setDownloadName(match?.[1] || "prep_report.pdf");
    } catch (e: any) {
      setError(e.message);
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return jobRole.trim().length > 0 && targetCompanies.trim().length > 0 && daysAvailable > 0;
    if (step === 2) return currentStack.trim().length > 0 && weakestSkill.trim().length > 0;
    return true;
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-[#2D2A24] dark:text-white">Placement Prep</h1>
        <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">
          Get a personalized 8-section prep report from your resume
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.slice(0, 3).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < step ? "bg-[#B8915C]" : i === step && step < 3 ? "bg-[#B8915C]/50" : "bg-[#E8E0D6] dark:bg-slate-700"
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 0: Resume check / inline upload ── */}
        {step === 0 && (
          <motion.div key="resume" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-8 shadow-sm">

              {checkingResume ? (
                /* Loading */
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 text-[#B8915C] animate-spin" />
                  <p className="text-sm text-[#7A6E65]">Checking your profile...</p>
                </div>
              ) : (
                /* Upload UI */
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#B8915C]/10 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7 text-[#B8915C]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Upload Your Resume</h2>
                    <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">
                      Upload your resume PDF to generate a personalised prep report from it.
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(f);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all ${
                      dragOver
                        ? "border-[#B8915C] bg-[#B8915C]/5"
                        : selectedFile
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                        : "border-[#D6CDC2] dark:border-slate-700 hover:border-[#B8915C] hover:bg-[#B8915C]/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                    />
                    {selectedFile ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{selectedFile.name}</p>
                          <p className="text-xs text-[#A69A8C] mt-0.5">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadError(""); }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8E0D6] dark:bg-slate-700 flex items-center justify-center text-[#7A6E65] hover:bg-red-100 hover:text-red-500 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#A69A8C]" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                            Drop your resume here or <span className="text-[#B8915C] underline underline-offset-2">browse</span>
                          </p>
                          <p className="text-xs text-[#A69A8C] mt-1">PDF or Word · max 10 MB</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {uploadError && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                    </div>
                  )}

                  {/* Upload button */}
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#B8915C] text-white rounded-xl font-medium disabled:opacity-40 hover:bg-[#9F7A4F] transition-all shadow-sm"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; Parsing...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload &amp; Continue</>
                    )}
                  </button>

                  {uploading && (
                    <div className="flex flex-col items-start gap-1.5 px-1">
                      {["Uploading to secure storage", "Parsing resume content", "Saving to your profile"].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 text-xs text-[#7A6E65] dark:text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Target setup ── */}
        {step === 1 && (
          <motion.div key="target" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-[#F0E8DE] dark:border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#B8915C]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D2A24] dark:text-white">Target Setup</h2>
                  <p className="text-xs text-[#7A6E65] dark:text-slate-400">Tell us what you&apos;re aiming for</p>
                </div>
              </div>

              {status?.candidate_name && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                  ✓ Resume ready for <strong>{status.candidate_name}</strong>
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Target Role *</label>
                  <input className={inputCls} placeholder="e.g. Software Engineer, SDE-2, Data Scientist" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">
                    Target Companies * <span className="font-normal text-[#A69A8C]">(comma-separated)</span>
                  </label>
                  <input className={inputCls} placeholder="e.g. Google, Microsoft, Razorpay" value={targetCompanies} onChange={(e) => setTargetCompanies(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">
                    Days Available for Prep: <span className="text-[#B8915C] font-semibold">{daysAvailable} days</span>
                  </label>
                  <input type="range" min={7} max={180} value={daysAvailable} onChange={(e) => setDaysAvailable(Number(e.target.value))} className="w-full accent-[#B8915C]" />
                  <div className="flex justify-between text-[10px] text-[#A69A8C] mt-1">
                    <span>1 week</span><span>1 month</span><span>3 months</span><span>6 months</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Tech profile ── */}
        {step === 2 && (
          <motion.div key="tech" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-[#F0E8DE] dark:border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-[#B8915C]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D2A24] dark:text-white">Tech Profile</h2>
                  <p className="text-xs text-[#7A6E65] dark:text-slate-400">Personalizes your skill gap analysis</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Current Tech Stack *</label>
                  <textarea className={`${inputCls} resize-none`} rows={3} placeholder="e.g. Python, React, Node.js, PostgreSQL, AWS basics..." value={currentStack} onChange={(e) => setCurrentStack(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Weakest Area / Skill to Improve *</label>
                  <input className={inputCls} placeholder="e.g. System Design, Dynamic Programming, Behavioral interviews" value={weakestSkill} onChange={(e) => setWeakestSkill(e.target.value)} />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Generating / Done ── */}
        {step === 3 && (
          <motion.div key="gen" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-10 text-center shadow-sm">
              {generating ? (
                <div className="space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <Loader2 className="w-16 h-16 text-[#B8915C] animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Generating Your Report</h2>
                    <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">Reading your resume and crafting an 8-section prep plan...</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 max-w-xs mx-auto text-left">
                    {["Fetching your resume", "Analysing skill gaps", "Building prep plan", "Generating PDF"].map((s, i) => (
                      <div key={s} className="flex items-center gap-2 text-xs text-[#7A6E65] dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : downloadUrl ? (
                <div className="space-y-5">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Your Report is Ready!</h2>
                    <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">8-section personalized placement prep report</p>
                  </div>
                  <a href={downloadUrl} download={downloadName} className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#B8915C] text-white rounded-xl font-medium hover:bg-[#9A7A4A] transition-all shadow-sm">
                    <Download className="w-5 h-5" /> Download PDF Report
                  </a>
                  <p className="text-xs text-[#A69A8C]">Includes skill gaps, daily plan, DSA roadmap, behavioral prep &amp; free resources</p>
                </div>
              ) : (
                <div className="text-sm text-red-500">{error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      {step >= 1 && step < 3 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((p) => Math.max(1, p - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-[#7A6E65] hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-[#E8E0D6] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < 2 ? (
            <button onClick={() => setStep((p) => p + 1)} disabled={!canProceed()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm bg-[#B8915C] text-white hover:bg-[#9A7A4A] disabled:opacity-40 transition-all shadow-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={!canProceed() || generating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-[#B8915C] text-white hover:bg-[#9A7A4A] disabled:opacity-40 transition-all shadow-sm">
              <FileText className="w-4 h-4" /> Generate My Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}
