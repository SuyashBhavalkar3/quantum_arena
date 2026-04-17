"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Plus, X, Loader2, AlertCircle, CheckCircle, Camera } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Experience {
  company_name: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  grade: string;
}

interface Skill {
  languages: string;
  backend_technologies: string;
  databases: string;
  ai_ml_frameworks: string;
  tools_platforms: string;
  core_competencies: string;
}

export default function CompleteProfile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile information fields
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  // Profile data sections
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, JPG and WEBP images are allowed");
        return;
      }
      setProfilePhoto(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/profile/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Resume parsing failed. Please try again.');
      }
      
      const parsedData = await response.json();
      
      // Map parsed data to form state - backend returns singular field names
      // Map 'experience' to 'experiences' array
      if (parsedData.experience && Array.isArray(parsedData.experience)) {
        setExperiences(parsedData.experience);
      }
      
      // Map 'education' array
      if (parsedData.education && Array.isArray(parsedData.education)) {
        setEducation(parsedData.education);
      }
      
      // Map 'skills' object - wrap in array since backend returns single object
      if (parsedData.skills && typeof parsedData.skills === 'object') {
        setSkills([parsedData.skills]);
      }
      
      setUploadSuccess(true);
      setTimeout(() => {
        setActiveTab("manual");
        setUploadSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume. Please check the file and try again.');
    } finally {
      setLoading(false);
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      company_name: "",
      job_title: "",
      location: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: ""
    }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducation([...education, {
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      grade: ""
    }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    setSkills([...skills, {
      languages: "",
      backend_technologies: "",
      databases: "",
      ai_ml_frameworks: "",
      tools_platforms: "",
      core_competencies: ""
    }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required profile information
    if (!phone?.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!linkedinUrl?.trim()) {
      setError("LinkedIn URL is required");
      return;
    }

    // Validate that at least one entry exists
    if (experiences.length === 0 || education.length === 0 || skills.length === 0) {
      setError("Please add at least one entry for experience, education, and skills");
      return;
    }

    // Validate required fields in experiences
    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      if (!exp.company_name?.trim()) {
        setError(`Experience ${i + 1}: Company name is required`);
        return;
      }
      if (!exp.job_title?.trim()) {
        setError(`Experience ${i + 1}: Job title is required`);
        return;
      }
      if (!exp.start_date?.trim()) {
        setError(`Experience ${i + 1}: Start date is required`);
        return;
      }
    }

    // Validate required fields in education
    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      if (!edu.institution?.trim()) {
        setError(`Education ${i + 1}: Institution is required`);
        return;
      }
      if (!edu.degree?.trim()) {
        setError(`Education ${i + 1}: Degree is required`);
        return;
      }
      if (!edu.start_date?.trim()) {
        setError(`Education ${i + 1}: Start date is required`);
        return;
      }
    }

    // Validate that at least one skill category has content
    const hasAnySkill = skills.some(skill =>
      skill.languages?.trim() ||
      skill.backend_technologies?.trim() ||
      skill.databases?.trim() ||
      skill.ai_ml_frameworks?.trim() ||
      skill.tools_platforms?.trim() ||
      skill.core_competencies?.trim()
    );

    if (!hasAnySkill) {
      setError("Please add at least one skill in the skills section");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      
      // Add form fields
      formData.append('phone', phone);
      formData.append('linkedin_url', linkedinUrl);
      if (githubUrl) formData.append('github_url', githubUrl);
      if (bio) formData.append('bio', bio);
      
      // Add profile photo if selected
      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      }
      
      // Add JSON data as form fields
      formData.append('experiences_json', JSON.stringify(experiences));
      formData.append('education_json', JSON.stringify(education));
      formData.append('skills_json', JSON.stringify(skills));
      
      const response = await fetch(`${API_BASE_URL}/api/profile/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save profile. Please try again.');
      }
      
      // Profile saved successfully, redirect to candidate dashboard
      router.push('/candidate');
    } catch (err: any) {
      setError(err.message || 'Profile submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#F9F6F0]">
      {/* Artistic background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#E6D7C3] rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D9C5B3] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-20 w-[500px] h-[500px] bg-[#C7B5A0] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none" />

      {/* Main card - scrollable on smaller screens */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/50 shadow-2xl"
      >
        {/* Left side – artistic branding */}
        <div className="relative hidden lg:flex flex-col justify-center p-16 bg-[#F1E9E0]/80 backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20">
            <svg className="absolute top-10 left-10 w-64 h-64" viewBox="0 0 200 200" fill="none">
              <path d="M50 100C50 70 70 50 100 50C130 50 150 70 150 100C150 130 130 150 100 150C70 150 50 130 50 100Z" fill="#B8915C" />
              <circle cx="120" cy="80" r="40" fill="#C17C5A" />
            </svg>
          </div>
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-serif text-5xl font-medium tracking-tight text-[#2D2A24] mb-4"
            >
              HireFlow
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg text-[#4A443C] leading-relaxed max-w-sm"
            >
              Build your professional profile with ease — showcase your true <span className="font-medium">potential</span>.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-12 h-px w-16 bg-[#B8915C]/40"
            />
          </div>
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-16 right-16 w-32 h-32 opacity-20"
          >
            <svg viewBox="0 0 100 100" fill="none" stroke="#2D2A24" strokeWidth="1">
              <path d="M20 80 Q 40 20, 80 30" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* Right side – form content with scrolling area */}
        <div className="p-8 lg:p-12 backdrop-blur-xl bg-white/70 overflow-y-auto max-h-screen lg:max-h-none">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-3xl font-medium text-[#2D2A24]">HireFlow</h1>
            </div>

            {/* Header */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <h2 className="text-2xl font-medium text-[#2D2A24] mb-2">Complete Your Profile</h2>
              <p className="text-[#5A534A]">Add your professional information and details</p>
            </motion.div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Profile Information Section */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-8 space-y-4"
            >
              {/* Profile Photo Upload */}
              <motion.div variants={itemVariants}>
                <Label className="text-[#2D2A24] font-semibold block mb-2">Profile Photo</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                    id="profile-photo-input"
                  />
                  <label
                    htmlFor="profile-photo-input"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[#D6CDC2] rounded-2xl cursor-pointer hover:border-[#B8915C] transition-colors bg-white/40 backdrop-blur-sm"
                  >
                    {profilePhotoUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        <img
                          src={profilePhotoUrl}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <p className="text-xs text-[#A69A8C] mt-2">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Camera className="h-6 w-6 text-[#B8915C]/60 mb-1" />
                        <p className="text-sm text-[#4A443C]">Upload Photo</p>
                        <p className="text-xs text-[#A69A8C]">PNG, JPG, JPEG, WEBP</p>
                      </div>
                    )}
                  </label>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div variants={itemVariants}>
                <Label htmlFor="phone" className="text-sm font-medium text-[#4A443C] mb-1.5 block">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                />
              </motion.div>

              {/* LinkedIn URL */}
              <motion.div variants={itemVariants}>
                <Label htmlFor="linkedin" className="text-sm font-medium text-[#4A443C] mb-1.5 block">
                  LinkedIn URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                />
              </motion.div>

              {/* GitHub URL */}
              <motion.div variants={itemVariants}>
                <Label htmlFor="github" className="text-sm font-medium text-[#4A443C] mb-1.5 block">
                  GitHub URL
                </Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/yourprofile"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                />
              </motion.div>

              {/* Bio */}
              <motion.div variants={itemVariants}>
                <Label htmlFor="bio" className="text-sm font-medium text-[#4A443C] mb-1.5 block">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C] resize-none"
                />
              </motion.div>
            </motion.div>

            {/* Tab buttons */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mb-6 flex gap-2"
            >
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "upload"
                    ? "bg-[#B8915C] text-white shadow-lg shadow-[#B8915C]/20"
                    : "bg-white/60 backdrop-blur-sm text-[#4A443C] border border-[#D6CDC2] hover:bg-white/80"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Resume
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "manual"
                    ? "bg-[#B8915C] text-white shadow-lg shadow-[#B8915C]/20"
                    : "bg-white/60 backdrop-blur-sm text-[#4A443C] border border-[#D6CDC2] hover:bg-white/80"
                }`}
              >
                <FileText className="h-4 w-4" />
                Fill Manually
              </button>
            </motion.div>

            {/* Upload Success Alert */}
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-start gap-2"
              >
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">Resume parsed successfully! Review and edit your information.</p>
              </motion.div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <motion.div
                key="upload-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants}>
                    <div className="border-2 border-dashed border-[#D6CDC2] rounded-2xl p-8 text-center bg-white/40 backdrop-blur-sm hover:border-[#B8915C] transition-colors duration-200">
                      <Upload className="h-12 w-12 text-[#B8915C]/60 mx-auto mb-4" />
                      <p className="text-[#4A443C] font-medium mb-1">Upload Your Resume</p>
                      <p className="text-[#A69A8C] text-sm mb-4">PDF, DOC, or DOCX format</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                        id="resume-upload"
                        disabled={loading}
                      />
                      <label htmlFor="resume-upload">
                        <Button
                          disabled={loading}
                          className="cursor-pointer bg-[#B8915C] hover:bg-[#9F7A4F] text-white font-medium rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200"
                          asChild
                        >
                          <div>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                              </>
                            )}
                          </div>
                        </Button>
                      </label>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Manual Tab */}
            {activeTab === "manual" && (
              <motion.div
                key="manual-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pb-8"
              >
                {/* Experience Section */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <Label className="text-[#2D2A24] font-semibold">Experience</Label>
                    <Button
                      onClick={addExperience}
                      size="sm"
                      className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white rounded-lg h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </motion.div>

                  {experiences.map((exp, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Company</Label>
                              <Input
                                value={exp.company_name}
                                onChange={(e) => {
                                  const updated = [...experiences];
                                  updated[index].company_name = e.target.value;
                                  setExperiences(updated);
                                }}
                                placeholder="Company name"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Job Title</Label>
                              <Input
                                value={exp.job_title}
                                onChange={(e) => {
                                  const updated = [...experiences];
                                  updated[index].job_title = e.target.value;
                                  setExperiences(updated);
                                }}
                                placeholder="Job title"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => {
                                const updated = [...experiences];
                                updated[index].location = e.target.value;
                                setExperiences(updated);
                              }}
                              placeholder="City, Country"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Start Date</Label>
                              <Input
                                value={exp.start_date}
                                onChange={(e) => {
                                  const updated = [...experiences];
                                  updated[index].start_date = e.target.value;
                                  setExperiences(updated);
                                }}
                                placeholder="MM/YYYY"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">End Date</Label>
                              <Input
                                value={exp.end_date}
                                onChange={(e) => {
                                  const updated = [...experiences];
                                  updated[index].end_date = e.target.value;
                                  setExperiences(updated);
                                }}
                                placeholder="MM/YYYY"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => {
                                const updated = [...experiences];
                                updated[index].description = e.target.value;
                                setExperiences(updated);
                              }}
                              placeholder="Describe your role and achievements..."
                              className="bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C] resize-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeExperience(index)}
                          className="ml-2 text-[#A69A8C] hover:text-red-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Education Section */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <Label className="text-[#2D2A24] font-semibold">Education</Label>
                    <Button
                      onClick={addEducation}
                      size="sm"
                      className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white rounded-lg h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </motion.div>

                  {education.map((edu, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[index].institution = e.target.value;
                                  setEducation(updated);
                                }}
                                placeholder="School/University name"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[index].degree = e.target.value;
                                  setEducation(updated);
                                }}
                                placeholder="Degree type"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Field of Study</Label>
                            <Input
                              value={edu.field_of_study}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[index].field_of_study = e.target.value;
                                setEducation(updated);
                              }}
                              placeholder="Major/Field"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Start Date</Label>
                              <Input
                                value={edu.start_date}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[index].start_date = e.target.value;
                                  setEducation(updated);
                                }}
                                placeholder="MM/YYYY"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-[#4A443C] mb-1 block">End Date</Label>
                              <Input
                                value={edu.end_date}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[index].end_date = e.target.value;
                                  setEducation(updated);
                                }}
                                placeholder="MM/YYYY"
                                className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Grade/GPA</Label>
                            <Input
                              value={edu.grade}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[index].grade = e.target.value;
                                setEducation(updated);
                              }}
                              placeholder="e.g., 3.8 or A"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeEducation(index)}
                          className="ml-2 text-[#A69A8C] hover:text-red-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Skills Section */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <Label className="text-[#2D2A24] font-semibold">Skills</Label>
                    <Button
                      onClick={addSkill}
                      size="sm"
                      className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white rounded-lg h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </motion.div>

                  {skills.map((skill, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Languages</Label>
                            <Input
                              value={skill.languages}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].languages = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., English, Spanish, Mandarin"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Backend Technologies</Label>
                            <Input
                              value={skill.backend_technologies}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].backend_technologies = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., Python, Node.js, Java"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Databases</Label>
                            <Input
                              value={skill.databases}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].databases = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., PostgreSQL, MongoDB, Redis"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">AI/ML Frameworks</Label>
                            <Input
                              value={skill.ai_ml_frameworks}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].ai_ml_frameworks = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., TensorFlow, PyTorch, scikit-learn"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Tools & Platforms</Label>
                            <Input
                              value={skill.tools_platforms}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].tools_platforms = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., Docker, Git, AWS, Azure"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-[#4A443C] mb-1 block">Core Competencies</Label>
                            <Input
                              value={skill.core_competencies}
                              onChange={(e) => {
                                const updated = [...skills];
                                updated[index].core_competencies = e.target.value;
                                setSkills(updated);
                              }}
                              placeholder="e.g., Problem Solving, Leadership, Communication"
                              className="h-10 bg-white/60 backdrop-blur-sm border-[#D6CDC2] focus:border-[#B8915C] focus:ring-[#B8915C]/20 rounded-lg placeholder:text-[#A69A8C]"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeSkill(index)}
                          className="ml-2 text-[#A69A8C] hover:text-red-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-12 bg-[#B8915C] hover:bg-[#9F7A4F] text-white font-medium rounded-xl shadow-lg shadow-[#B8915C]/20 hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      "Complete Profile"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Custom keyframes for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}