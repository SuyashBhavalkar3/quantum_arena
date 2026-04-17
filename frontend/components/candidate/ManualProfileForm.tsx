"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProfileState } from '@/hooks/useProfileState';
import { useRouter } from 'next/navigation';
import ProfileFormFields from './ProfileFormFields';

interface ManualProfileFormProps {
  profileState: ReturnType<typeof useProfileState>;
  onBack: () => void;
}

export default function ManualProfileForm({ profileState, onBack }: ManualProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navigate to dashboard
    router.push('/candidate');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manual Profile Entry
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fill in your profile information manually
          </p>
        </div>
      </div>
      
      {/* Form */}
      <Card className="p-6">
        <ProfileFormFields profileState={profileState} />
      </Card>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#B8915C] hover:bg-[#A07A4A] text-white transition-all shadow-sm"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Profile...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Profile
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
