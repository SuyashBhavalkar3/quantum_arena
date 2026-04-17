"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadAndParseResume, validateResumeFile, validateProfilePhoto } from '@/services/resumeParser';
import { useProfileState } from '@/hooks/useProfileState';
import { useProfileSubmission } from '@/hooks/useProfileSubmission';
import { getProfileStatus } from '@/services/profileAPI';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import ProfileFormFields from './ProfileFormFields';

interface ResumeUploadFlowProps {
  profileState: ReturnType<typeof useProfileState>;
  onBack: () => void;
}

type UploadStep = 'profile-check' | 'choose-method' | 'upload' | 'parsing' | 'review' | 'submitting' | 'complete';

export default function ResumeUploadFlow({ profileState, onBack }: ResumeUploadFlowProps) {
  const [step, setStep] = useState<UploadStep>('profile-check');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { submitProfile, isSubmitting, submissionError } = useProfileSubmission();

  // Check profile status on mount
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const token = Cookies.get('auth_token');
        if (!token) {
          setError('Authentication required');
          setIsInitializing(false);
          return;
        }

        const result = await getProfileStatus(token);
        if (result.success && result.data) {
          // If profile is already complete, navigate away
          if (result.data.profile_completed) {
            router.push('/candidate');
            return;
          }

          // If resume is already uploaded, go to review
          if (result.data.resume_uploaded) {
            setStep('review');
          } else {
            // Show option to upload resume or fill manually
            setStep('choose-method');
          }
        }
        setIsInitializing(false);
      } catch (err) {
        console.error('Error checking profile status:', err);
        setStep('choose-method');
        setIsInitializing(false);
      }
    };

    checkProfileStatus();
  }, [router]);
  
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setResumeFile(file);
    setError(null);
  };
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateProfilePhoto(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image');
      return;
    }
    
    setProfilePhoto(file);
    setError(null);
  };
  
  const handleUploadAndParse = async () => {
    if (!resumeFile || !profilePhoto || !phone || !linkedinUrl) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setStep('parsing');
    
    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const result = await uploadAndParseResume(
        resumeFile,
        profilePhoto,
        phone,
        linkedinUrl,
        bio || null,
        token
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Load parsed data into profile state
      if (result.data && result.data.parsed_data) {
        profileState.loadParsedData(result.data.parsed_data);
      }
      
      // Store files
      profileState.setResumeFile(resumeFile);
      profileState.setProfilePhoto(profilePhoto);
      
      // Update personal info with additional fields
      profileState.updatePersonalInfo({
        phone,
        linkedinUrl,
        bio: bio || '',
      });
      
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualEntry = () => {
    // User chose to fill manually without resume
    setStep('review');
  };

  const handleProfileSubmit = async () => {
    if (!profileState.profileState.personalInfo.name) {
      setError('Please fill in at least your name');
      return;
    }

    setError(null);
    setStep('submitting');
    
    const result = await submitProfile(profileState.profileState);
    if (result.success) {
      setStep('complete');
    } else {
      setError(result.error || 'Failed to submit profile');
      setStep('review');
    }
  };

  if (isInitializing) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-[#B8915C]/20 border-t-[#B8915C] animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Loading Profile
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Checking your profile status...
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
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
            {step === 'choose-method' && 'Complete Your Profile'}
            {step === 'upload' && 'Upload Resume'}
            {step === 'parsing' && 'Parsing Resume'}
            {step === 'review' && 'Review Profile'}
            {step === 'submitting' && 'Submitting Profile'}
            {step === 'complete' && 'Profile Complete'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {step === 'choose-method' && 'Choose how you\'d like to complete your profile'}
            {step === 'upload' && 'Upload your resume and photo to auto-fill your profile'}
            {step === 'parsing' && 'Parsing your resume...'}
            {step === 'review' && 'Review and edit your information'}
            {step === 'submitting' && 'Saving your profile...'}
            {step === 'complete' && 'Your profile has been created successfully!'}
          </p>
        </div>
      </div>
      
      {/* Progress Steps */}
      {step !== 'choose-method' && (
        <div className="flex items-center gap-2 max-w-md">
          <StepIndicator active={step === 'upload'} completed={['parsing', 'review', 'submitting', 'complete'].includes(step)} label="Upload" />
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <StepIndicator active={step === 'parsing'} completed={['review', 'submitting', 'complete'].includes(step)} label="Parse" />
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <StepIndicator active={step === 'review'} completed={['submitting', 'complete'].includes(step)} label="Review" />
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <StepIndicator active={step === 'submitting'} completed={step === 'complete'} label="Submit" />
        </div>
      )}
      
      {/* Content */}
      {step === 'choose-method' && (
        <ChooseMethodStep onUploadResume={() => setStep('upload')} onManualEntry={handleManualEntry} />
      )}
      
      {step === 'upload' && (
        <UploadStep
          resumeFile={resumeFile}
          profilePhoto={profilePhoto}
          phone={phone}
          linkedinUrl={linkedinUrl}
          bio={bio}
          error={error}
          isUploading={isUploading}
          onResumeSelect={handleResumeSelect}
          onPhotoSelect={handlePhotoSelect}
          onPhoneChange={setPhone}
          onLinkedinChange={setLinkedinUrl}
          onBioChange={setBio}
          onUpload={handleUploadAndParse}
          resumeInputRef={resumeInputRef}
          photoInputRef={photoInputRef}
        />
      )}
      
      {step === 'parsing' && (
        <ParsingStep />
      )}
      
      {step === 'review' && (
        <ReviewStep 
          profileState={profileState} 
          error={error}
          onSubmit={handleProfileSubmit}
        />
      )}

      {step === 'submitting' && (
        <SubmittingStep />
      )}
      
      {step === 'complete' && (
        <CompleteStep onNavigate={() => router.push('/candidate')} />
      )}
    </motion.div>
  );
}

function StepIndicator({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        completed ? 'bg-green-500' : active ? 'bg-[#B8915C]' : 'bg-slate-200 dark:bg-slate-700'
      }`}>
        {completed ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : (
          <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>
            {label[0]}
          </span>
        )}
      </div>
      <span className={`text-xs ${active || completed ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

interface UploadStepProps {
  resumeFile: File | null;
  profilePhoto: File | null;
  phone: string;
  linkedinUrl: string;
  bio: string;
  error: string | null;
  isUploading: boolean;
  onResumeSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onUpload: () => void;
  resumeInputRef: React.RefObject<HTMLInputElement | null>;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
}

function UploadStep({
  resumeFile,
  profilePhoto,
  phone,
  linkedinUrl,
  bio,
  error,
  isUploading,
  onResumeSelect,
  onPhotoSelect,
  onPhoneChange,
  onLinkedinChange,
  onBioChange,
  onUpload,
  resumeInputRef,
  photoInputRef,
}: UploadStepProps) {
  return (
    <Card className="p-6 space-y-6">
      {/* Resume Upload */}
      <div className="space-y-2">
        <Label htmlFor="resume">Resume (PDF, DOC, DOCX) *</Label>
        <input
          ref={resumeInputRef}
          type="file"
          id="resume"
          accept=".pdf,.doc,.docx"
          onChange={onResumeSelect}
          className="hidden"
        />
        <div
          onClick={() => resumeInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#B8915C] transition-colors"
        >
          {resumeFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-[#B8915C]" />
              <div className="text-left">
                <p className="font-medium text-slate-900 dark:text-white">{resumeFile.name}</p>
                <p className="text-sm text-slate-500">{(resumeFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">Click to upload resume</p>
              <p className="text-xs text-slate-500">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Profile Photo */}
      <div className="space-y-2">
        <Label htmlFor="photo">Profile Photo *</Label>
        <input
          ref={photoInputRef}
          type="file"
          id="photo"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={onPhotoSelect}
          className="hidden"
        />
        <div
          onClick={() => photoInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#B8915C] transition-colors"
        >
          {profilePhoto ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#B8915C] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900 dark:text-white">{profilePhoto.name}</p>
                <p className="text-sm text-slate-500">{(profilePhoto.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">Click to upload photo</p>
              <p className="text-xs text-slate-500">JPEG, PNG, JPG, or WEBP (max 2MB)</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 234 567 8900"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>
      
      {/* LinkedIn */}
      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn URL *</Label>
        <Input
          id="linkedin"
          type="url"
          placeholder="https://linkedin.com/in/yourprofile"
          value={linkedinUrl}
          onChange={(e) => onLinkedinChange(e.target.value)}
        />
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          rows={3}
        />
      </div>
      
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Upload Button */}
      <Button
        onClick={onUpload}
        disabled={!resumeFile || !profilePhoto || !phone || !linkedinUrl || isUploading}
        className="w-full bg-[#B8915C] hover:bg-[#A07A4A] text-white transition-all shadow-sm"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload & Parse Resume
          </>
        )}
      </Button>
    </Card>
  );
}

function ParsingStep() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-[#B8915C]/20 border-t-[#B8915C] animate-spin" />
          <FileText className="w-10 h-10 text-[#B8915C] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Parsing Your Resume
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Our AI is extracting your information. This will take just a moment...
          </p>
        </div>
      </div>
    </Card>
  );
}

function ChooseMethodStep({
  onUploadResume,
  onManualEntry,
}: {
  onUploadResume: () => void;
  onManualEntry: () => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Upload Resume Option */}
      <Card className="p-6 space-y-4 cursor-pointer hover:border-[#B8915C] transition-colors border-2" onClick={onUploadResume}>
        <div className="w-12 h-12 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-[#B8915C]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Upload Resume
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload your resume and photo. Our AI will automatically extract and populate your profile information.
          </p>
        </div>
        <Button className="w-full bg-[#B8915C] hover:bg-[#A07A4A] text-white mt-4">
          <Upload className="w-4 h-4 mr-2" />
          Upload Resume
        </Button>
      </Card>

      {/* Manual Entry Option */}
      <Card className="p-6 space-y-4 cursor-pointer hover:border-[#B8915C] transition-colors border-2" onClick={onManualEntry}>
        <div className="w-12 h-12 rounded-lg bg-[#B8915C]/10 flex items-center justify-center">
          <Edit className="w-6 h-6 text-[#B8915C]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Fill Profile Manually
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manually fill in your profile information. You can add details about your experience, education, and skills.
          </p>
        </div>
        <Button variant="outline" className="w-full mt-4">
          <Edit className="w-4 h-4 mr-2" />
          Fill Manually
        </Button>
      </Card>
    </div>
  );
}

function SubmittingStep() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-[#B8915C]/20 border-t-[#B8915C] animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Submitting Your Profile
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Saving your profile information...
          </p>
        </div>
      </div>
    </Card>
  );
}

interface ReviewStepProps {
  profileState: ReturnType<typeof useProfileState>;
  error?: string | null;
  onSubmit: () => void;
}

function ReviewStep({ profileState, error, onSubmit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Review Your Information</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Edit any fields and then submit to save</p>
          </div>
        </div>
        
        <ProfileFormFields profileState={profileState} />
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Edit Again
        </Button>
        <Button
          onClick={onSubmit}
          className="bg-[#B8915C] hover:bg-[#A07A4A] text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Submit Profile
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Profile Created Successfully!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your profile has been created and you can now start applying for jobs.
          </p>
        </div>
        <Button
          onClick={onNavigate}
          className="bg-[#B8915C] hover:bg-[#A07A4A] text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </Card>
  );
}
