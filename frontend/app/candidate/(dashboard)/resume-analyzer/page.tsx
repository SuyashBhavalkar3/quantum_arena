'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, UploadCloud, CheckCircle2, AlertTriangle, 
  Lightbulb, Activity, BarChart3, ChevronRight 
} from 'lucide-react';
import { resumeAnalyzerAPI, ResumeAnalysisResponse, profileAPI } from '@/lib/api';

export default function ResumeAnalyzerPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'upload'>('profile');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    async function checkProfileStatus() {
      try {
        const status = await profileAPI.getCandidateStatus();
        setIsProfileComplete(status.profile_completed);
      } catch (err) {
        console.error("Failed to check profile status", err);
        setIsProfileComplete(false);
      }
    }
    checkProfileStatus();
  }, []);

  const handleProfileAnalysis = async () => {
    if (!isProfileComplete) {
      setError("Profile not completed. Please complete your profile and upload a resume before using this feature.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await resumeAnalyzerAPI.analyzeProfileResume();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAnalysis = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await resumeAnalyzerAPI.analyzeUploadedResume(selectedFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ScoreRing = ({ score, label }: { score: number, label: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-[#D6CDC2] stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <motion.circle
              className={`stroke-current ${color}`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            ></motion.circle>
          </svg>
          <div className="absolute text-3xl font-bold text-[#2D2A24] dark:text-white">{score}</div>
        </div>
        <span className="mt-2 text-sm font-medium text-[#5A534A] dark:text-slate-400">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 text-[#2D2A24] dark:text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#2D2A24] dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#B8915C]" />
            Resume Analyzer
          </h1>
          <p className="text-[#5A534A] dark:text-slate-400">
            Get instant, AI-powered feedback on your resume. Identify strengths, fix weaknesses, and boost your ATS score.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 space-x-1 bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-[#D6CDC2] dark:border-slate-800 shadow-sm">
          <button
            onClick={() => { setActiveTab('profile'); setResult(null); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex justify-center items-center gap-2 ${
              activeTab === 'profile' 
                ? 'bg-[#B8915C] text-white shadow-md'
                : 'text-[#4A443C] dark:text-slate-400 hover:bg-[#F1E9E0] dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Profile Resume
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setResult(null); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex justify-center items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-[#B8915C] text-white shadow-md'
                : 'text-[#4A443C] dark:text-slate-400 hover:bg-[#F1E9E0] dark:hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload New
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Action Area */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-[#D6CDC2] dark:border-slate-800 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
              
              <AnimatePresence mode="wait">
                {activeTab === 'profile' ? (
                  <motion.div 
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-center py-4"
                  >
                    <div className="w-16 h-16 bg-[#F1E9E0] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B8915C]/20">
                      <FileText className="w-8 h-8 text-[#B8915C]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Stored Resume</h3>
                    <p className="text-[#5A534A] dark:text-slate-400 text-sm">
                      We'll analyze the resume currently linked to your candidate profile.
                    </p>
                    
                    {isProfileComplete === false && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm flex items-start gap-2 text-left">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>Profile not completed. Please complete your profile and upload a resume first.</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleProfileAnalysis}
                      disabled={isAnalyzing || isProfileComplete === false}
                      className="w-full mt-4 bg-[#B8915C] hover:bg-[#a37e4c] text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-md"
                    >
                      {isAnalyzing ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Analyze Profile Resume <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-center py-4"
                  >
                    <div className="w-16 h-16 bg-[#F1E9E0] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B8915C]/20">
                      <UploadCloud className="w-8 h-8 text-[#B8915C]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Ad-hoc Analysis</h3>
                    <p className="text-[#5A534A] dark:text-slate-400 text-sm">
                      Upload any PDF or Word document for instant analysis. Does not update your profile.
                    </p>
                    
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer ${
                        selectedFile ? 'border-[#B8915C] bg-[#F1E9E0] dark:bg-[#B8915C]/10' : 'border-[#D6CDC2] dark:border-slate-700 hover:border-[#A69A8C]'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-[#B8915C] mb-2" />
                          <span className="text-[#B8915C] font-medium truncate max-w-full">{selectedFile.name}</span>
                          <span className="text-[#A69A8C] text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-[#A69A8C]">
                          <UploadCloud className="w-6 h-6 mb-2" />
                          <span className="text-sm">Click to browse files</span>
                          <span className="text-xs mt-1">PDF, DOC, DOCX up to 5MB</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleUploadAnalysis}
                      disabled={isAnalyzing || !selectedFile}
                      className="w-full mt-4 bg-[#B8915C] hover:bg-[#a37e4c] text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-md"
                    >
                      {isAnalyzing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Analyze Uploaded Resume <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm shadow-sm"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            {!result && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-[#A69A8C] bg-white dark:bg-slate-900 border border-[#D6CDC2] dark:border-slate-800 shadow-sm rounded-2xl p-12 border-dashed">
                <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-[#2D2A24] dark:text-white mb-2">No Analysis Yet</h3>
                <p className="text-center max-w-md">
                  Select an option on the left to analyze your resume and get actionable feedback.
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-[#D6CDC2] dark:border-slate-800 shadow-sm rounded-2xl p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#F1E9E0]/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 border-4 border-[#F1E9E0] dark:border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#B8915C] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-medium text-[#2D2A24] dark:text-white mt-6 mb-2 z-10">Analyzing Resume...</h3>
                <p className="text-[#5A534A] dark:text-slate-400 text-center max-w-md z-10">
                  Our AI is currently reviewing formatting, extracting skills, and generating actionable feedback to improve your ATS match rate.
                </p>
              </div>
            )}

            {result && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-slate-900 border border-[#D6CDC2] dark:border-slate-800 shadow-sm rounded-2xl p-6 md:p-8 space-y-8"
              >
                {/* Scores Header */}
                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-[#D6CDC2] dark:border-slate-800">
                  <ScoreRing score={result.overall_score} label="Overall ATS Score" />
                  <ScoreRing score={result.formatting_score} label="Formatting Score" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-green-600 dark:text-green-500">
                      <CheckCircle2 className="w-5 h-5" /> Strengths
                    </h4>
                    <ul className="space-y-3">
                      {result.strengths.map((strength: string, i: number) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                          key={i} 
                          className="flex items-start gap-2 text-[#4A443C] dark:text-slate-300 bg-[#F9F6F0] dark:bg-slate-800 p-3 rounded-lg border border-[#D6CDC2] dark:border-slate-700"
                        >
                          <span className="text-green-600 dark:text-green-500 mt-0.5">•</span>
                          <span className="text-sm">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-500">
                      <AlertTriangle className="w-5 h-5" /> Areas to Improve
                    </h4>
                    <ul className="space-y-3">
                      {result.weaknesses.map((weakness: string, i: number) => (
                        <motion.li 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                          key={i} 
                          className="flex items-start gap-2 text-[#4A443C] dark:text-slate-300 bg-[#F9F6F0] dark:bg-slate-800 p-3 rounded-lg border border-[#D6CDC2] dark:border-slate-700"
                        >
                          <span className="text-red-600 dark:text-red-500 mt-0.5">•</span>
                          <span className="text-sm">{weakness}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-4 pt-6 border-t border-[#D6CDC2] dark:border-slate-800">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-[#B8915C]">
                    <Lightbulb className="w-5 h-5" /> Actionable Suggestions
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {result.suggestions.map((suggestion: string, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                        key={i} 
                        className="bg-[#F1E9E0] dark:bg-[#B8915C]/10 border border-[#D6CDC2] dark:border-[#B8915C]/20 p-4 rounded-xl flex items-start gap-3"
                      >
                        <div className="bg-[#B8915C] text-white rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                          {i + 1}
                        </div>
                        <p className="text-sm text-[#4A443C] dark:text-slate-300">{suggestion}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
