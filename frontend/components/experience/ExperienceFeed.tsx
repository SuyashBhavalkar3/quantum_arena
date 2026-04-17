"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, TrendingUp, Clock, RefreshCw, PlusCircle } from "lucide-react";
import ExperienceCard from "./ExperienceCard";
import { AnimatePresence } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Post {
  id: number;
  company: string;
  role: string;
  offer_date?: string;
  ctc?: string;
  rounds_count: number;
  rounds_detail?: any[];
  tips?: string;
  tags?: string[];
  is_anonymous: boolean;
  is_verified: boolean;
  upvotes: number;
  created_at: string;
}

const YEARS = ["2025", "2024", "2023", "2022"];

export default function ExperienceFeed({ onSubmitClick }: { onSubmitClick: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<"recency" | "upvotes">("recency");
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const params = new URLSearchParams({
      sort,
      page: String(currentPage),
      page_size: "10",
    });
    if (company) params.set("company", company);
    if (role) params.set("role", role);
    if (year) params.set("year", year);

    try {
      const res = await fetch(`${API_BASE}/experience/feed?${params}`);
      const data = await res.json();
      if (reset) {
        setPosts(data.posts || []);
        setPage(1);
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      }
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  }, [company, role, year, sort, page]);

  useEffect(() => { fetchPosts(true); }, [company, role, year, sort]);

  const fetchSuggestions = async (q: string) => {
    if (!q) { setCompanySuggestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/experience/companies?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCompanySuggestions(data.companies || []);
    } catch {}
  };

  const handleUpvote = (id: number, newCount: number) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, upvotes: newCount } : p)));
  };

  const hasMore = posts.length < total;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2A24] dark:text-white">Experience Wall</h1>
          <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-0.5">{total} interview experiences shared</p>
        </div>
        <button
          onClick={onSubmitClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#B8915C] text-white rounded-xl text-sm font-medium hover:bg-[#9A7A4A] transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Share Your Experience
        </button>
      </div>

      {/* Search + Sort Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {/* Company search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69A8C]" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-[#FAFAF8] dark:bg-slate-800 text-sm text-[#2D2A24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C]"
              placeholder="Search by company..."
              value={company}
              onChange={(e) => { setCompany(e.target.value); fetchSuggestions(e.target.value); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && companySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-[#E8E0D6] dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                {companySuggestions.map((s) => (
                  <button key={s} onClick={() => { setCompany(s); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F5F0EA] dark:hover:bg-slate-800 text-[#2D2A24] dark:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role search */}
          <input
            className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-[#FAFAF8] dark:bg-slate-800 text-sm text-[#2D2A24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C]"
            placeholder="Filter by role..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />

          {/* Year filter */}
          <select
            className="px-3 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-[#FAFAF8] dark:bg-slate-800 text-sm text-[#2D2A24] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Sort toggle */}
          <div className="flex rounded-xl border border-[#E8E0D6] dark:border-slate-700 overflow-hidden">
            <button onClick={() => setSort("recency")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${sort === "recency" ? "bg-[#B8915C] text-white" : "text-[#7A6E65] dark:text-slate-400 hover:bg-[#F5F0EA] dark:hover:bg-slate-800"}`}>
              <Clock className="w-3.5 h-3.5" /> Recent
            </button>
            <button onClick={() => setSort("upvotes")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${sort === "upvotes" ? "bg-[#B8915C] text-white" : "text-[#7A6E65] dark:text-slate-400 hover:bg-[#F5F0EA] dark:hover:bg-slate-800"}`}>
              <TrendingUp className="w-3.5 h-3.5" /> Top
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F0EA] dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
          <h3 className="text-[#2D2A24] dark:text-white font-semibold mb-1">No experiences yet</h3>
          <p className="text-sm text-[#7A6E65] dark:text-slate-400 mb-4">Be the first to share your interview experience!</p>
          <button onClick={onSubmitClick} className="px-4 py-2 bg-[#B8915C] text-white rounded-xl text-sm hover:bg-[#9A7A4A] transition-all">
            Share Experience
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ExperienceCard key={post.id} post={post} onUpvote={handleUpvote} />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => { setPage((p) => p + 1); fetchPosts(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-slate-700 text-sm text-[#7A6E65] dark:text-slate-400 hover:border-[#B8915C] hover:text-[#B8915C] transition-all">
                <RefreshCw className="w-4 h-4" /> Load More ({total - posts.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
