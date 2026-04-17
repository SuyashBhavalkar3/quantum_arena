"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Building2,
  Briefcase,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Code2,
  Cpu,
  Users,
  Star,
} from "lucide-react";
import AutocompleteField from "./AutocompleteField";
import MockInterviewAvatarPanel from "./MockInterviewAvatarPanel";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/^http/, "ws");

// This gives the role field a local autocomplete source so selection works consistently.
const ROLE_SUGGESTIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "Business Analyst",
  "DevOps Engineer",
  "QA Engineer",
  "Cloud Engineer",
  "Security Engineer",
  "Mobile App Developer",
  "UI/UX Designer",
  "SDE-1",
  "SDE-2",
  "Engineering Manager",
];

const ROUND_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  intro: { icon: Users, color: "text-blue-500 bg-blue-50", label: "Introduction" },
  dsa: { icon: Code2, color: "text-violet-500 bg-violet-50", label: "DSA" },
  system_design: { icon: Cpu, color: "text-orange-500 bg-orange-50", label: "System Design" },
  behavioral: { icon: Brain, color: "text-emerald-500 bg-emerald-50", label: "Behavioral" },
};

type Phase = "setup" | "starting" | "active" | "scorecard";

interface RoundPreview {
  round_type: string;
  title: string;
}

interface SessionInfo {
  session_id: string;
  company: string;
  role: string;
  total_duration_minutes: number;
  rounds_preview: RoundPreview[];
}

interface Message {
  speaker: "bot" | "candidate";
  text: string;
}

interface Scorecard {
  per_question_scores: Array<Record<string, any>>;
  overall_readiness_percent: number;
  round_scores: Record<string, number>;
  top3_improvement_areas: string[];
  strengths: string[];
  hiring_likelihood: string;
  overall_feedback: string;
}

export default function MockInterviewRoomImpl() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState("intro");
  const [currentRoundTitle, setCurrentRoundTitle] = useState("Introduction");
  const [roundIdx, setRoundIdx] = useState(0);
  const [totalRounds, setTotalRounds] = useState(4);
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(3));
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // This loads the existing company source once so company autocomplete stays fast and controlled.
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/mock/companies`);
        const data = await response.json();
        setCompanies(data.companies || []);
      } catch (loadError) {
        console.error("Failed to load company suggestions", loadError);
      }
    })();
  }, []);

  // This keeps the mic visualization responsive without affecting transcript timing.
  useEffect(() => {
    if (listening) {
      const animate = () => {
        const bars: number[] = [];
        for (let index = 0; index < 20; index += 1) {
          bars.push(Math.random() * 28 + 4);
        }
        setWaveform(bars);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWaveform(Array(20).fill(3));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [listening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playAudio = useCallback((base64Audio: string) => {
    if (!base64Audio) {
      return;
    }

    const bytes = atob(base64Audio);
    const buffer = new Uint8Array(bytes.length);
    for (let index = 0; index < bytes.length; index += 1) {
      buffer[index] = bytes.charCodeAt(index);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onplay = () => setAudioPlaying(true);
      audioRef.current.onended = () => setAudioPlaying(false);
      audioRef.current.onpause = () => setAudioPlaying(false);
      audioRef.current.play().catch(() => undefined);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (const result of event.results) {
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const sendAnswer = useCallback(() => {
    if (!transcript.trim() || !wsRef.current) {
      return;
    }

    wsRef.current.send(JSON.stringify({ type: "candidate_answer", text: transcript }));
    setMessages((previous) => [...previous, { speaker: "candidate", text: transcript }]);
    setTranscript("");
  }, [transcript]);

  const handleWsMessage = useCallback(
    (data: any) => {
      const type = data.type;

      if (["mock_started", "question", "round_transition", "followup_question"].includes(type)) {
        const text = data.text || data.message || "";
        setMessages((previous) => [...previous, { speaker: "bot", text }]);
        if (data.audio) {
          playAudio(data.audio);
        }
        if (data.round_type) {
          setCurrentRound(data.round_type);
        }
        if (data.round_title) {
          setCurrentRoundTitle(data.round_title);
        }
        if (data.round_idx !== undefined) {
          setRoundIdx(data.round_idx);
        }
        if (data.total_rounds !== undefined) {
          setTotalRounds(data.total_rounds);
        }
        if (data.difficulty) {
          setCurrentDifficulty(data.difficulty);
        }
      }

      if (type === "session_ending") {
        const text = data.text || "";
        setMessages((previous) => [...previous, { speaker: "bot", text }]);
        if (data.audio) {
          playAudio(data.audio);
        }
      }

      if (type === "scorecard") {
        setScorecard(data.scorecard);
        setPhase("scorecard");
      }

      if (type === "error") {
        setError(data.message);
      }
    },
    [playAudio]
  );

  const startSession = async () => {
    const confirmedCompany = (selectedCompany || company).trim();
    const confirmedRole = (selectedRole || role).trim();

    if (!confirmedCompany || !confirmedRole) {
      return;
    }

    setStarting(true);
    setError("");
    setPhase("starting");

    try {
      const response = await fetch(
        `${API_BASE}/mock/start?company=${encodeURIComponent(confirmedCompany)}&role=${encodeURIComponent(confirmedRole)}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error("Failed to start session");
      }

      const data: SessionInfo = await response.json();
      setSession(data);
      setCompany(data.company);
      setSelectedCompany(data.company);
      setRole(data.role);
      setSelectedRole(data.role);
      setTotalRounds(data.rounds_preview?.length || 4);

      const ws = new WebSocket(`${WS_BASE}/ws/mock/${data.session_id}`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          handleWsMessage(JSON.parse(event.data));
        } catch (parseError) {
          console.error("Failed to parse mock interview message", parseError);
        }
      };
      ws.onopen = () => setPhase("active");
      ws.onerror = () => setError("WebSocket connection failed");
      ws.onclose = () => {
        if (phase === "active") {
          setError("Connection lost");
        }
      };
    } catch (sessionError: any) {
      setError(sessionError.message);
      setPhase("setup");
    } finally {
      setStarting(false);
    }
  };

  const endSession = () => {
    wsRef.current?.send(JSON.stringify({ type: "end_session" }));
  };

  const resetSession = () => {
    setPhase("setup");
    setScorecard(null);
    setMessages([]);
    setSession(null);
    setCompany("");
    setSelectedCompany(null);
    setRole("");
    setSelectedRole(null);
    setTranscript("");
    setError("");
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-[#E8E0D6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#2D2A24] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8915C]/30 focus:border-[#B8915C] transition-all";

  const roundCfg = ROUND_CONFIG[currentRound] || ROUND_CONFIG.intro;
  const RoundIcon = roundCfg.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <audio ref={audioRef} />

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#2D2A24] dark:text-white">Company Mock Interview</h1>
              <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">Voice mock interview tailored specifically to your target company</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-6 space-y-5 shadow-sm">
              <AutocompleteField label="Target Company" placeholder="e.g. Google, Infosys, Razorpay" value={company} suggestions={companies} icon={Building2} onValueChange={setCompany} onSelectionChange={setSelectedCompany} selectedValue={selectedCompany} inputClassName={inputCls} />
              <AutocompleteField label="Target Role" placeholder="e.g. Software Engineer, SDE-2, Data Analyst" value={role} suggestions={ROLE_SUGGESTIONS} icon={Briefcase} onValueChange={setRole} onSelectionChange={setSelectedRole} selectedValue={selectedRole} inputClassName={inputCls} />

              <div className="grid grid-cols-4 gap-2">
                {["45 min session", "Voice only", "4 rounds", "Performance Scorecard"].map((feature) => (
                  <div key={feature} className="text-center text-[11px] text-[#7A6E65] dark:text-slate-400 bg-[#F5F0EA] dark:bg-slate-800 rounded-lg py-2 px-1 font-medium">{feature}</div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              <button onClick={startSession} disabled={!company.trim() || !role.trim() || starting} className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-40 transition-all shadow-sm">
                <Play className="w-5 h-5" /> Start Mock Interview
              </button>
            </div>
          </motion.div>
        )}

        {phase === "starting" && (
          <motion.div key="starting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center py-20">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">Preparing Your Interview</h2>
              <p className="text-sm text-[#7A6E65] dark:text-slate-400 mt-1">Fetching company intel and generating an interview script...</p>
            </div>
          </motion.div>
        )}

        {phase === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${roundCfg.color}`}>
                    <RoundIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#A69A8C] dark:text-slate-500">Current Round</p>
                    <p className="text-xs font-semibold text-[#2D2A24] dark:text-white">{currentRoundTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#A69A8C]">Round {roundIdx + 1} of {totalRounds}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${currentDifficulty === "easy" ? "bg-emerald-50 text-emerald-600" : currentDifficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{currentDifficulty}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <MockInterviewAvatarPanel isSpeaking={audioPlaying} enabled={phase === "active"} />

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 h-72 overflow-y-auto p-3 space-y-2">
                  {messages.map((message, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.speaker === "bot" ? "bg-[#F5F0EA] dark:bg-slate-800 text-[#2D2A24] dark:text-white rounded-tl-none" : "bg-violet-600 text-white rounded-tr-none"}`}>
                        {message.text}
                      </div>
                    </motion.div>
                  ))}
                  {audioPlaying && (
                    <div className="flex justify-start">
                      <div className="bg-[#F5F0EA] dark:bg-slate-800 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-1">
                        {[3, 5, 3, 7, 4].map((height, index) => (
                          <div key={index} className="w-1 rounded-full bg-[#B8915C] animate-pulse" style={{ height: `${height * 3}px`, animationDelay: `${index * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-3">
                  <div className="flex items-center justify-center gap-0.5 h-8 mb-2">
                    {waveform.map((height, index) => (
                      <div key={index} className={`w-1 rounded-full transition-all duration-75 ${listening ? "bg-violet-500" : "bg-[#D6CDC2] dark:bg-slate-600"}`} style={{ height: `${height}px` }} />
                    ))}
                  </div>

                  {transcript && (
                    <div className="bg-[#F5F0EA] dark:bg-slate-800 rounded-xl px-3 py-2 mb-2 text-sm text-[#2D2A24] dark:text-white italic">
                      &ldquo;{transcript}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={listening ? stopListening : startListening} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${listening ? "bg-red-500 text-white hover:bg-red-600" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                      {listening ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> {transcript ? "Re-record" : "Speak"}</>}
                    </motion.button>
                    {transcript && !listening && (
                      <button onClick={sendAnswer} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#B8915C] text-white rounded-xl text-sm font-medium hover:bg-[#9A7A4A] transition-all">
                        Send <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button onClick={endSession} className="w-full mt-2 py-1.5 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-all">
                    End Interview &amp; Get Scorecard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "scorecard" && scorecard && (
          <motion.div key="scorecard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-violet-600 rounded-2xl p-6 text-white text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-90" />
              <h2 className="text-xl font-semibold">Interview Complete!</h2>
              <p className="text-violet-200 text-sm mt-1">{company} - {role}</p>
              <div className="mt-4">
                <div className="text-5xl font-bold">{scorecard.overall_readiness_percent}%</div>
                <div className="text-violet-200 text-sm mt-1">Overall Readiness</div>
              </div>
              <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium">
                {scorecard.hiring_likelihood.toUpperCase()}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white mb-4">Round Scores</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(scorecard.round_scores || {}).map(([round, score]) => {
                  const config = ROUND_CONFIG[round] || ROUND_CONFIG.intro;
                  const ConfigIcon = config.icon;
                  return (
                    <div key={round} className="flex items-center gap-3 bg-[#FAFAF8] dark:bg-slate-800/50 rounded-xl p-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.color}`}>
                        <ConfigIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#7A6E65] dark:text-slate-400 capitalize">{round.replace("_", " ")}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-[#E8E0D6] dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-bold text-[#2D2A24] dark:text-white">{score}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white mb-3">Top 3 Areas to Improve</h3>
              <div className="space-y-2">
                {scorecard.top3_improvement_areas?.map((area, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-sm text-[#5A534A] dark:text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 text-red-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{index + 1}</span>
                    {area}
                  </div>
                ))}
              </div>
            </div>

            {scorecard.strengths?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white mb-3">Your Strengths</h3>
                <div className="space-y-2">
                  {scorecard.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-sm text-[#5A534A] dark:text-slate-400">
                      <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> {strength}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5">
              <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">{scorecard.overall_feedback}</p>
            </div>

            {/* This preserves the existing score detail view so the setup fixes do not regress scorecard depth. */}
            {scorecard.per_question_scores?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8E0D6] dark:border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-[#2D2A24] dark:text-white mb-4">Question-by-Question</h3>
                <div className="space-y-4">
                  {scorecard.per_question_scores.map((question, index) => (
                    <div key={index} className="border-b border-[#F0E8DE] dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-[#2D2A24] dark:text-white flex-1">{String(question.question || "Question")}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${Number(question.score) >= 7 ? "bg-emerald-50 text-emerald-600" : Number(question.score) >= 5 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                          {String(question.score ?? "-")}/10
                        </span>
                      </div>
                      <p className="text-xs text-[#7A6E65] dark:text-slate-400">{String(question.feedback || "")}</p>
                      {question.ideal_answer && <p className="text-xs text-emerald-600 mt-1.5 italic">Ideal: {String(question.ideal_answer)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={resetSession} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E0D6] dark:border-slate-700 text-[#7A6E65] dark:text-slate-400 hover:border-[#B8915C] hover:text-[#B8915C] transition-all text-sm">
              <RotateCcw className="w-4 h-4" /> Start Another Mock Interview
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
