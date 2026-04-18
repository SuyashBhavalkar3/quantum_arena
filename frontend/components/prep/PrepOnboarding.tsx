"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, Loader2, Download,
  Target, BookOpen, AlertTriangle, Upload, X, Building2, Search, ChevronRight, Sparkles,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ─── Design tokens matching the app ───────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#2D2A24] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C] transition-all placeholder:text-[#A69A8C]";

// ─── Autocomplete data ────────────────────────────────────────────────────────
const COMMON_ROLES = [
  "Software Engineer", "SDE-1", "SDE-2", "Senior Software Engineer",
  "Full Stack Developer", "Backend Developer", "Frontend Developer",
  "Data Scientist", "Machine Learning Engineer", "AI Engineer",
  "Data Analyst", "Data Engineer", "Cloud Engineer", "DevOps Engineer",
  "Site Reliability Engineer", "Platform Engineer", "MLOps Engineer",
  "Product Manager", "Associate Product Manager", "Technical Program Manager",
  "Android Developer", "iOS Developer", "Mobile Developer",
  "Blockchain Developer", "Embedded Systems Engineer",
  "Cybersecurity Engineer", "Security Analyst",
  "QA Engineer", "Automation Test Engineer", "SDET",
  "Solution Architect", "System Architect", "Principal Engineer",
];

const COMMON_COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber",
  "Airbnb", "LinkedIn", "Twitter / X", "Stripe", "Shopify", "Salesforce",
  "Adobe", "Oracle", "IBM", "SAP", "Cisco", "Intel", "NVIDIA",
  "Flipkart", "Razorpay", "Zepto", "Swiggy", "Zomato", "CRED", "Dream11",
  "Paytm", "PhonePe", "MakeMyTrip", "Nykaa", "OYO", "Groww",
  "Infosys", "TCS", "Wipro", "HCL", "Cognizant", "Accenture", "Capgemini",
  "Goldman Sachs", "JPMorgan Chase", "Morgan Stanley", "Deutsche Bank",
  "DE Shaw", "Two Sigma", "Citadel", "Jane Street",
  "Atlassian", "Datadog", "Databricks", "Snowflake", "Confluent", "HashiCorp",
  "ByteDance", "Samsung R&D", "Qualcomm", "Broadcom", "Texas Instruments",
  "ServiceNow", "Workday", "Twilio", "Cloudflare", "Okta", "Palo Alto Networks",
];

interface OnboardStatus {
  has_resume: boolean;
  resume_url?: string;
  candidate_name?: string;
}

// ─── Autocomplete: Role Input ─────────────────────────────────────────────────
function RoleAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length > 0
    ? COMMON_ROLES.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : COMMON_ROLES.slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">
        Target Role *
      </label>
      <div className="relative">
        <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69A8C]" />
        <input
          className={`${inputCls} pl-10 pr-10`}
          placeholder="e.g. Software Engineer, SDE-2, Data Scientist"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A69A8C] hover:text-[#5A534A] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1 w-full rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
          >
            {filtered.map((s) => (
              <button
                key={s}
                onMouseDown={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  value === s
                    ? "bg-[#B8915C]/10 text-[#B8915C]"
                    : "text-[#2D2A24] dark:text-slate-300 hover:bg-[#F1E9E0] dark:hover:bg-slate-800"
                }`}
              >
                <Search className="w-3 h-3 text-[#A69A8C] flex-shrink-0" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Company Tag Input ────────────────────────────────────────────────────────
function CompanyTagInput({
  companies,
  onChange,
}: {
  companies: string[];
  onChange: (c: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = input.trim().length > 0
    ? COMMON_COMPANIES.filter(
        (c) => c.toLowerCase().includes(input.toLowerCase()) && !companies.includes(c)
      ).slice(0, 7)
    : COMMON_COMPANIES.filter((c) => !companies.includes(c)).slice(0, 7);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || companies.includes(trimmed) || companies.length >= 5) return;
    onChange([...companies, trimmed]);
    setInput("");
    setOpen(false);
  };

  const remove = (c: string) => onChange(companies.filter((x) => x !== c));

  return (
    <div ref={ref}>
      <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">
        Target Companies *{" "}
        <span className="font-normal text-[#A69A8C]">(up to 5)</span>
      </label>

      {/* Tags */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <AnimatePresence>
            {companies.map((c) => (
              <motion.span
                key={c}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B8915C]/10 border border-[#B8915C]/20 text-[#B8915C] rounded-lg text-xs font-medium"
              >
                <Building2 className="w-3 h-3" />
                {c}
                <button
                  onClick={() => remove(c)}
                  className="text-[#B8915C]/60 hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Input */}
      {companies.length < 5 && (
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69A8C]" />
          <input
            className={`${inputCls} pl-10 pr-10`}
            placeholder="Search or type a company name..."
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) { e.preventDefault(); add(input); }
              if (e.key === "Backspace" && !input && companies.length > 0) remove(companies[companies.length - 1]);
            }}
            autoComplete="off"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C8BFB5]" />
          <AnimatePresence>
            {open && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute z-50 mt-1 w-full rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
              >
                {filtered.map((c) => (
                  <button
                    key={c}
                    onMouseDown={() => add(c)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#2D2A24] dark:text-slate-300 hover:bg-[#F1E9E0] dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#A69A8C] flex-shrink-0" />
                    {c}
                  </button>
                ))}
                {input.trim() && !COMMON_COMPANIES.find((c) => c.toLowerCase() === input.toLowerCase()) && (
                  <button
                    onMouseDown={() => add(input)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#B8915C] hover:bg-[#F1E9E0] transition-colors border-t border-[#F0E8DE] flex items-center gap-2 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    Add &quot;{input.trim()}&quot;
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PrepOnboarding() {
  const [step, setStep] = useState<"resume" | "form" | "generating" | "done" | "error">("resume");
  const [status, setStatus] = useState<OnboardStatus | null>(null);
  const [checkingResume, setCheckingResume] = useState(true);

  // Inline upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [jobRole, setJobRole] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);

  // Report
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("prep_report.pdf");
  const [error, setError] = useState("");

  const getToken = () => getAuthToken();

  // ── Resume check ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          if (mounted) { setUploadError("Not authenticated — please sign in again."); setCheckingResume(false); }
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
          if (data.has_resume) setStep("form");
        }
      } catch (e: any) {
        if (mounted) setUploadError(e.message || "Failed to check resume status.");
      } finally {
        if (mounted) setCheckingResume(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { setUploadError("Only PDF or Word documents are accepted."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File must be under 10 MB."); return; }
    setUploadError("");
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch(`${API_BASE}/prep/upload-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }
      const data: OnboardStatus = await res.json();
      setStatus(data);
      setSelectedFile(null);
      setStep("form");
    } catch (e: any) {
      setUploadError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setStep("generating");
    try {
      const res = await fetch(`${API_BASE}/prep/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ job_role: jobRole, target_companies: targetCompanies }),
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
      setStep("done");
    } catch (e: any) {
      setError(e.message);
      setStep("error");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = jobRole.trim().length > 0 && targetCompanies.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#B8915C]" />
          <h1 className="text-2xl font-serif font-medium text-[#2D2A24] dark:text-white">
            AI Prep Report
          </h1>
        </div>
        <p className="text-sm text-[#7A6E65] dark:text-slate-400">
          Get a personalised placement prep roadmap — just tell us your target role and company.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── RESUME STEP ── */}
        {step === "resume" && (
          <motion.div key="resume" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-8 shadow-lg">
              {checkingResume ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 text-[#B8915C] animate-spin" />
                  <p className="text-sm text-[#7A6E65]">Checking your profile...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#B8915C]/10 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7 text-[#B8915C]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                      Upload Your Resume
                    </h2>
                    <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">
                      We&apos;ll automatically extract your skills, experience and gaps — no manual entry needed.
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
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
                            Drop your resume here or{" "}
                            <span className="text-[#B8915C] underline underline-offset-2">browse</span>
                          </p>
                          <p className="text-xs text-[#A69A8C] mt-1">PDF or Word · max 10 MB</p>
                        </div>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#B8915C] text-white rounded-xl font-medium disabled:opacity-40 hover:bg-[#9F7A4F] transition-all shadow-sm"
                  >
                    {uploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; Parsing...</>
                      : <><Upload className="w-4 h-4" /> Upload &amp; Continue</>
                    }
                  </button>

                  {uploading && (
                    <div className="flex flex-col items-start gap-1.5 px-1">
                      {["Uploading to secure storage", "Parsing resume content", "Saving to your profile"].map((s) => (
                        <div key={s} className="flex items-center gap-2 text-xs text-[#7A6E65] dark:text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B8915C]/30" /> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FORM STEP ── */}
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-6 shadow-lg space-y-5">

              {/* Section header */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#F0E8DE] dark:border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-[#B8915C]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#B8915C]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D2A24] dark:text-white">Target Setup</h2>
                  <p className="text-xs text-[#7A6E65] dark:text-slate-400">
                    {status?.candidate_name
                      ? <>Resume ready for <strong>{status.candidate_name}</strong> · AI will auto-analyse your profile</>
                      : "AI will auto-analyse your resume for skill gaps"}
                  </p>
                </div>
              </div>

              {/* Role autocomplete */}
              <RoleAutocomplete value={jobRole} onChange={setJobRole} />

              {/* Company tag input */}
              <CompanyTagInput companies={targetCompanies} onChange={setTargetCompanies} />

              {/* AI info callout */}
              <div className="flex items-start gap-3 bg-[#F9F6F0] dark:bg-slate-800/50 border border-[#E8E0D6] dark:border-slate-700 rounded-xl p-4">
                <Sparkles className="w-4 h-4 text-[#B8915C] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#7A6E65] dark:text-slate-400 leading-relaxed">
                  <span className="text-[#2D2A24] dark:text-white font-medium">AI-powered report</span> —
                  Your tech stack, strengths, skill gaps, and weaknesses are automatically extracted from your resume.
                  The full 10-section report is tailored to{" "}
                  <span className="text-[#B8915C] font-medium">
                    {targetCompanies.length > 0 ? targetCompanies.join(", ") : "your target companies"}
                  </span>.
                </p>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#B8915C] text-white rounded-xl font-medium disabled:opacity-40 hover:bg-[#9F7A4F] transition-all shadow-sm text-sm"
              >
                <FileText className="w-4 h-4" />
                Generate My Prep Report
              </button>

              {!canGenerate && (
                <p className="text-center text-xs text-[#A69A8C]">
                  {!jobRole.trim() ? "Enter your target role to continue" : "Add at least one target company"}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── GENERATING STEP ── */}
        {step === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-10 text-center shadow-lg">
              <div className="space-y-5">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-[#B8915C]/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="relative w-16 h-16 rounded-full bg-[#B8915C]/10 border border-[#B8915C]/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-[#B8915C] animate-pulse" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                    Crafting Your Report
                  </h2>
                  <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">
                    AI is analysing your resume against{" "}
                    <strong className="text-[#2D2A24] dark:text-white">{jobRole}</strong> at{" "}
                    <strong className="text-[#B8915C]">{targetCompanies.join(", ")}</strong>
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2.5 max-w-xs mx-auto text-left">
                  {[
                    "Reading your resume",
                    "Identifying skill gaps",
                    "Analysing company expectations",
                    "Building 10-section prep plan",
                    "Generating PDF report",
                  ].map((s, i) => (
                    <div key={s} className="flex items-center gap-2 text-xs text-[#7A6E65] dark:text-slate-400">
                      <Loader2
                        className="w-3.5 h-3.5 text-[#B8915C] animate-spin"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DONE STEP ── */}
        {step === "done" && downloadUrl && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-10 text-center shadow-lg">
              <div className="space-y-5">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Your Report is Ready!</h2>
                  <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">
                    10-section personalised prep report for{" "}
                    <span className="text-[#B8915C] font-medium">{jobRole}</span>
                  </p>
                </div>
                <a
                  href={downloadUrl}
                  download={downloadName}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#B8915C] text-white rounded-xl font-medium hover:bg-[#9A7A4A] transition-all shadow-sm"
                >
                  <Download className="w-5 h-5" /> Download PDF Report
                </a>
                <p className="text-xs text-[#A69A8C]">
                  Includes skill radar · ATS analysis · DSA roadmap · mock interview strategy · behavioral prep &amp; more
                </p>
                <button
                  onClick={() => { setStep("form"); setDownloadUrl(null); }}
                  className="text-xs text-[#A69A8C] hover:text-[#5A534A] transition-colors underline underline-offset-2"
                >
                  Generate for a different role
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ERROR STEP ── */}
        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-red-200 dark:border-red-800 p-8 text-center shadow-lg space-y-4">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <h2 className="text-base font-semibold text-[#2D2A24] dark:text-white">Generation Failed</h2>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setStep("form")}
                className="px-6 py-2.5 bg-[#F1E9E0] dark:bg-slate-800 hover:bg-[#E8DDD4] dark:hover:bg-slate-700 text-[#2D2A24] dark:text-white rounded-xl text-sm font-medium transition-colors border border-[#D6CDC2] dark:border-slate-700"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
