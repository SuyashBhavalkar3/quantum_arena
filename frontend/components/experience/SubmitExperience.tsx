"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Building2, Briefcase, ChevronRight, ChevronLeft, Send, Shield, Eye } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const POPULAR_TAGS = ["DSA", "System Design", "Behavioral", "HR Round", "Coding", "LLD", "HLD", "Problem Solving", "Culture Fit", "Aptitude"];

interface Round { round_name: string; difficulty: string; description: string; }

const STEPS = ["Company & Role", "Rounds Breakdown", "Tips & Tags", "Preview & Submit"];

export default function SubmitExperience({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [ctc, setCtc] = useState("");
  const [rounds, setRounds] = useState<Round[]>([{ round_name: "", difficulty: "Medium", description: "" }]);
  const [tips, setTips] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addRound = () => setRounds([...rounds, { round_name: "", difficulty: "Medium", description: "" }]);
  const removeRound = (i: number) => setRounds(rounds.filter((_, idx) => idx !== i));
  const updateRound = (i: number, field: keyof Round, val: string) => {
    const r = [...rounds]; r[i] = { ...r[i], [field]: val }; setRounds(r);
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const canProceed = () => {
    if (step === 0) return company.trim().length > 0 && role.trim().length > 0;
    if (step === 1) return rounds.every((r) => r.round_name.trim().length > 0);
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/experience/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company, role,
          offer_date: offerDate || null,
          ctc: ctc || null,
          rounds_count: rounds.length,
          rounds_detail: rounds.map((r) => ({ round_name: r.round_name, difficulty: r.difficulty, description: r.description || null })),
          tips: tips || null,
          tags,
          is_anonymous: isAnonymous,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Submission failed"); }
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#2D2A24] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E0D6] dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Share Your Experience</h2>
              <p className="text-xs text-[#7A6E65] dark:text-slate-400 mt-0.5">{STEPS[step]}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F5F0EA] dark:hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-4 h-4 text-[#7A6E65]" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? "bg-[#B8915C]" : "bg-[#E8E0D6] dark:bg-slate-700"}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

              {/* Step 0: Company & Role */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Company Name *</label>
                    <input className={inputCls} placeholder="e.g. Google, Infosys, Razorpay" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Role Applied For *</label>
                    <input className={inputCls} placeholder="e.g. Software Engineer, SDE-1" value={role} onChange={(e) => setRole(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Offer Month</label>
                      <input type="month" className={inputCls} value={offerDate} onChange={(e) => setOfferDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">CTC / Stipend</label>
                      <input className={inputCls} placeholder="e.g. 12 LPA" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Rounds */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-[#7A6E65] dark:text-slate-400">Break down each round of your interview</p>
                  {rounds.map((r, i) => (
                    <div key={i} className="bg-[#FAFAF8] dark:bg-slate-800/50 rounded-xl p-3.5 border border-[#EEE8E0] dark:border-slate-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#B8915C]">Round {i + 1}</span>
                        {rounds.length > 1 && (
                          <button onClick={() => removeRound(i)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input className={inputCls} placeholder="Round name (e.g. Technical, HR, DSA)" value={r.round_name} onChange={(e) => updateRound(i, "round_name", e.target.value)} />
                      <div className="flex gap-2">
                        {DIFFICULTIES.map((d) => (
                          <button key={d} onClick={() => updateRound(i, "difficulty", d)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              r.difficulty === d
                                ? d === "Easy" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : d === "Medium" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-red-50 border-red-300 text-red-700"
                                : "border-[#E8E0D6] dark:border-slate-600 text-[#A69A8C] hover:border-[#B8915C]/40"
                            }`}
                          >{d}</button>
                        ))}
                      </div>
                      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Brief description of this round..." value={r.description} onChange={(e) => updateRound(i, "description", e.target.value)} />
                    </div>
                  ))}
                  <button onClick={addRound} className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#D6CDC2] dark:border-slate-700 text-[#A69A8C] hover:border-[#B8915C] hover:text-[#B8915C] transition-all flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Add Round
                  </button>
                </div>
              )}

              {/* Step 2: Tips & Tags */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Tips for Future Candidates</label>
                    <textarea className={`${inputCls} resize-none`} rows={4} placeholder="What would you advise candidates preparing for this company? What topics to focus on?" value={tips} onChange={(e) => setTips(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5A534A] dark:text-slate-400 mb-1.5">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 text-[11px] bg-[#B8915C]/10 text-[#B8915C] px-2.5 py-1 rounded-full border border-[#B8915C]/20">
                          {t} <button onClick={() => removeTag(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input className={inputCls} placeholder="Add custom tag..." value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                      />
                      <button onClick={() => addTag(tagInput)} className="px-3 py-2 bg-[#B8915C] text-white rounded-xl text-sm hover:bg-[#9A7A4A] transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                        <button key={t} onClick={() => addTag(t)} className="text-[11px] text-[#7A6E65] dark:text-slate-400 border border-[#E8E0D6] dark:border-slate-700 px-2 py-0.5 rounded-full hover:border-[#B8915C] hover:text-[#B8915C] transition-all">
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#FAFAF8] dark:bg-slate-800/40 rounded-xl p-4 border border-[#EEE8E0] dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-[#B8915C]/15 flex items-center justify-center text-[#B8915C] font-bold">{company[0]}</div>
                      <div>
                        <p className="font-semibold text-[#2D2A24] dark:text-white text-sm">{company}</p>
                        <p className="text-xs text-[#7A6E65] dark:text-slate-400">{role} {offerDate && `· ${offerDate}`} {ctc && `· ${ctc}`}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#5A534A] dark:text-slate-400">{rounds.length} Rounds · {tags.join(", ")}</p>
                    {tips && <p className="text-xs text-[#5A534A] dark:text-slate-400 italic">"{tips.slice(0, 100)}..."</p>}
                  </div>

                  {/* Anonymous toggle */}
                  <button
                    onClick={() => setIsAnonymous((p) => !p)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isAnonymous ? "border-[#B8915C] bg-[#B8915C]/5" : "border-[#E8E0D6] dark:border-slate-700"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={`w-5 h-5 ${isAnonymous ? "text-[#B8915C]" : "text-[#A69A8C]"}`} />
                      <div className="text-left">
                        <p className={`text-sm font-medium ${isAnonymous ? "text-[#B8915C]" : "text-[#2D2A24] dark:text-white"}`}>Post Anonymously</p>
                        <p className="text-xs text-[#7A6E65] dark:text-slate-400">Your name won't be shown publicly</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-all ${isAnonymous ? "bg-[#B8915C]" : "bg-[#D6CDC2] dark:bg-slate-600"} relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isAnonymous ? "left-5" : "left-0.5"}`} />
                    </div>
                  </button>

                  {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D6] dark:border-slate-800 flex items-center justify-between">
          <button onClick={() => setStep((p) => p - 1)} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-[#7A6E65] dark:text-slate-400 hover:bg-[#F5F0EA] dark:hover:bg-slate-800 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((p) => p + 1)} disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm bg-[#B8915C] text-white hover:bg-[#9A7A4A] disabled:opacity-40 transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm bg-[#B8915C] text-white hover:bg-[#9A7A4A] disabled:opacity-60 transition-all">
              <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Share Experience"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
