"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Building2, Briefcase, Calendar, DollarSign, Tag, ChevronDown, ChevronUp, BadgeCheck, Shield } from "lucide-react";

interface RoundDetail {
  round_name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description?: string;
}

interface ExperiencePost {
  id: number;
  company: string;
  role: string;
  offer_date?: string;
  ctc?: string;
  rounds_count: number;
  rounds_detail?: RoundDetail[];
  tips?: string;
  tags?: string[];
  is_anonymous: boolean;
  is_verified: boolean;
  upvotes: number;
  created_at: string;
}

const DIFFICULTY_CONFIG = {
  Easy:   { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Medium: { color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500"   },
  Hard:   { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500"     },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ExperienceCard({
  post,
  onUpvote,
}: {
  post: ExperiencePost;
  onUpvote?: (id: number, newCount: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async () => {
    if (upvoted || upvoting) return;
    setUpvoting(true);
    try {
      const res = await fetch(`${API_BASE}/experience/${post.id}/upvote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUpvotes(data.upvotes);
        setUpvoted(true);
        onUpvote?.(post.id, data.upvotes);
      }
    } catch {}
    setUpvoting(false);
  };

  const formattedDate = post.offer_date
    ? new Date(post.offer_date + "-01").toLocaleDateString("en-IN", { year: "numeric", month: "short" })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Company Avatar */}
            <div className="w-11 h-11 rounded-xl bg-[#B8915C]/10 flex items-center justify-center flex-shrink-0 text-[#B8915C] font-bold text-lg border border-[#B8915C]/20">
              {post.company[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#2D2A24] dark:text-white text-[15px]">{post.company}</h3>
                {post.is_verified && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-[#5A534A] dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" />
                {post.role}
                {post.is_anonymous && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">
                    <Shield className="w-3 h-3" /> Anonymous
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Upvote */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleUpvote}
            disabled={upvoted || upvoting}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all duration-200 ${
              upvoted
                ? "bg-[#B8915C]/10 border-[#B8915C]/40 text-[#B8915C]"
                : "border-[#E8E0D6] dark:border-slate-700 text-[#A69A8C] hover:border-[#B8915C]/40 hover:text-[#B8915C] hover:bg-[#B8915C]/5"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs font-semibold">{upvotes}</span>
          </motion.button>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {formattedDate && (
            <span className="inline-flex items-center gap-1.5 text-[11px] bg-[#F5F0EA] dark:bg-slate-800 text-[#5A534A] dark:text-slate-400 px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          )}
          {post.ctc && (
            <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100">
              <DollarSign className="w-3 h-3" /> {post.ctc}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] bg-[#F5F0EA] dark:bg-slate-800 text-[#5A534A] dark:text-slate-400 px-2.5 py-1 rounded-full">
            {post.rounds_count} Round{post.rounds_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Rounds Timeline */}
      {post.rounds_detail && post.rounds_detail.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#B8915C] hover:text-[#9A7A4A] transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Hide Rounds" : `View ${post.rounds_detail.length} Round Breakdown`}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mt-3"
              >
                <div className="relative pl-5">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E8E0D6] dark:bg-slate-700" />

                  {post.rounds_detail.map((round, idx) => {
                    const diff = round.difficulty as "Easy" | "Medium" | "Hard";
                    const cfg = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG["Medium"];
                    return (
                      <div key={idx} className="relative mb-4 last:mb-0">
                        {/* Timeline dot */}
                        <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${cfg.dot}`} />
                        <div className="bg-[#FAFAF8] dark:bg-slate-800/60 rounded-xl p-3 border border-[#EEE8E0] dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#2D2A24] dark:text-white">
                              Round {idx + 1}: {round.round_name}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              {diff}
                            </span>
                          </div>
                          {round.description && (
                            <p className="text-[12px] text-[#5A534A] dark:text-slate-400 mt-1.5 leading-relaxed">
                              {round.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tips */}
      {post.tips && (
        <div className="px-5 pb-3">
          <p className="text-[12px] text-[#5A534A] dark:text-slate-400 leading-relaxed bg-[#FAFAF8] dark:bg-slate-800/40 rounded-xl p-3 border border-[#EEE8E0] dark:border-slate-700">
            <span className="font-semibold text-[#B8915C]">💡 Tip: </span>
            {post.tips}
          </p>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] bg-[#F5F0EA] dark:bg-slate-800 text-[#7A6E65] dark:text-slate-400 px-2 py-0.5 rounded-full border border-[#E8E0D6] dark:border-slate-700"
            >
              <Tag className="w-2.5 h-2.5" /> {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
