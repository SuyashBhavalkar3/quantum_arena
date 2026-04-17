"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Edit, ArrowRight, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ResumeUploadFlow from '@/components/candidate/ResumeUploadFlow';
import ManualProfileForm from '@/components/candidate/ManualProfileForm';
import { useProfileState } from '@/hooks/useProfileState';

type ProfileCreationMode = 'selection' | 'upload' | 'manual';

export default function ProfileCreationPage() {
  const [mode, setMode] = useState<ProfileCreationMode>('selection');
  const profileState = useProfileState();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] via-[#FFF8F0] to-[#F9F6F0] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {mode === 'selection' && (
            <SelectionScreen onSelectMode={setMode} />
          )}
          
          {mode === 'upload' && (
            <ResumeUploadFlow 
              profileState={profileState}
              onBack={() => setMode('selection')}
            />
          )}
          
          {mode === 'manual' && (
            <ManualProfileForm 
              profileState={profileState}
              onBack={() => setMode('selection')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SelectionScreenProps {
  onSelectMode: (mode: ProfileCreationMode) => void;
}

function SelectionScreen({ onSelectMode }: SelectionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#B8915C] to-[#8B6F47] bg-clip-text text-transparent">
            Create Your Profile
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Choose how you'd like to build your professional profile
        </motion.p>
      </div>
      
      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Upload Resume Option */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="group relative overflow-hidden border-2 border-transparent hover:border-[#B8915C] transition-all duration-300 cursor-pointer h-full"
            onClick={() => onSelectMode('upload')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#B8915C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-8 space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8915C] to-[#8B6F47] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Upload Resume
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upload your resume and let our AI automatically extract and populate your profile information. Quick and effortless.
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B8915C]" />
                  <span>AI-powered data extraction</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B8915C]" />
                  <span>Auto-fill all fields</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B8915C]" />
                  <span>Edit before submitting</span>
                </li>
              </ul>
              
              {/* Button */}
              <Button 
                className="w-full bg-gradient-to-r from-[#B8915C] to-[#8B6F47] hover:from-[#8B6F47] hover:to-[#B8915C] text-white group-hover:shadow-lg transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload Resume
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>
        
        {/* Manual Entry Option */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="group relative overflow-hidden border-2 border-transparent hover:border-[#B8915C] transition-all duration-300 cursor-pointer h-full"
            onClick={() => onSelectMode('manual')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#B8915C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-8 space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Edit className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Proceed Manually
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fill in your profile information manually with complete control over every detail. Perfect for customization.
                </p>
              </div>
              
              {/* Features */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>Complete control</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>Step-by-step guidance</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span>Customize every field</span>
                </li>
              </ul>
              
              {/* Button */}
              <Button 
                className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white group-hover:shadow-lg transition-all duration-300"
              >
                <User className="w-4 h-4 mr-2" />
                Manual Entry
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                💡 Pro Tip
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Uploading your resume is faster, but you can always edit the auto-filled information before submitting. 
                Both methods lead to the same comprehensive profile.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
