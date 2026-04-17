"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface CandidateProfileData {
  profile_completed: boolean;
  profile_photo_url: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  bio: string | null;
  experiences: Array<{
    company_name: string;
    job_title: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    grade: string;
  }>;
  skills: Array<{
    languages: string;
    backend_technologies: string;
    databases: string;
    ai_ml_frameworks: string;
    tools_platforms: string;
    core_competencies: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
    link: string;
  }>;
  certifications?: Array<{
    title: string;
    issuer: string;
    date: string;
  }>;
}

export default function CandidateProfile() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<CandidateProfileData | null>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const [dataLoadedSuccessfully, setDataLoadedSuccessfully] = useState(false);

  // Generate decorative particles
  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  // Fetch profile data from API
  useEffect(() => {
    let mounted = true;

    const fetchProfileData = async () => {
      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }
        const token = getAuthToken();

        if (!token) {
          throw new Error("No authentication token found. Please log in again.");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch profile data (${response.status})`);
          }

          const data = await response.json();
          
          if (mounted) {
            setProfileData(data);
            setDataLoadedSuccessfully(true);
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === "AbortError") {
            throw new Error("Request timeout. Please check your connection and try again.");
          }
          throw fetchErr;
        }
      } catch (err: any) {
        if (mounted) {
          const errorMsg = err.message || "Error loading profile. Please try again.";
          setError(errorMsg);
          console.error("Profile fetch error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();
    
    return () => {
      mounted = false;
    };
  }, []);


  // GSAP entrance animations
  useEffect(() => {
    if (!loading && profileData) {
      const ctx = gsap.context(() => {
        gsap.from(".profile-card", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        });
      }, pageRef);
      return () => ctx.revert();
    }
  }, [loading, profileData]);

  // Show loading state only on initial load (not after data has been loaded)
  if (loading && !dataLoadedSuccessfully) {
    return (
      <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#B8915C]" />
          <p className="text-[#4A443C] font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state only if initial load failed (no data at all)
  if ((error || !profileData) && !dataLoadedSuccessfully) {
    return (
      <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Profile</h3>
                <p className="text-red-700 dark:text-red-300 mt-1">{error || "Unable to load profile data."}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // profileData is null but dataLoadedSuccessfully is true — should not normally
  // happen, but guard against it anyway by showing the spinner instead of blank.
  if (!profileData) {
    return (
      <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#B8915C]" />
          <p className="text-[#4A443C] font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show incomplete profile message only if profile_completed is false
  if (!profileData.profile_completed) {
    const handleRefresh = () => {
      // Reset fetch ref and reload data
      setLoading(true);
      setError(null);
      setDataLoadedSuccessfully(false);
      
      // Trigger a new fetch by re-running the effect
      let mounted = true;
      const fetchProfileData = async () => {
        try {
          const token = getAuthToken();
          if (!token) {
            throw new Error("No authentication token found. Please log in again.");
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.detail || `Failed to fetch profile data (${response.status})`);
            }

            const data = await response.json();
            
            if (mounted) {
              setProfileData(data);
              setDataLoadedSuccessfully(true);
            }
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            if (fetchErr.name === "AbortError") {
              throw new Error("Request timeout. Please check your connection and try again.");
            }
            throw fetchErr;
          }
        } catch (err: any) {
          if (mounted) {
            const errorMsg = err.message || "Error loading profile. Please try again.";
            setError(errorMsg);
            console.error("Profile fetch error:", err);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      fetchProfileData();
      
      return () => {
        mounted = false;
      };
    };

    return (
      <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-6 text-[#4A443C] hover:bg-white/60"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-8 p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#D6CDC2] text-center"
          >
            <h1 className="text-3xl font-bold text-[#2D2A24] mb-4">Profile Incomplete</h1>
            <p className="text-[#4A443C] mb-6">
              Your profile is not yet complete. Please complete your profile to view it here.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => router.push("/complete-profile")}
                className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white font-medium rounded-xl shadow-lg shadow-[#B8915C]/20"
              >
                Complete Profile
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-[#B8915C] text-[#B8915C] hover:bg-[#B8915C]/5 font-medium rounded-xl"
              >
                Refresh
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show complete profile
  return (
    <div ref={pageRef} className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4 text-[#4A443C] hover:bg-white/60"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-[#2D2A24]">Your Profile</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Photo & Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
          >
            <div className="flex gap-8">
              {/* Photo */}
              {profileData.profile_photo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={profileData.profile_photo_url}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#B8915C] shadow-lg"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-[#2D2A24] mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {profileData.phone && (
                    <div>
                      <p className="text-[#A69A8C] text-sm font-medium">Phone</p>
                      <p className="text-[#2D2A24]">{profileData.phone}</p>
                    </div>
                  )}
                  {profileData.linkedin_url && (
                    <div>
                      <p className="text-[#A69A8C] text-sm font-medium">LinkedIn</p>
                      <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#B8915C] hover:underline">
                        {profileData.linkedin_url}
                      </a>
                    </div>
                  )}
                  {profileData.github_url && (
                    <div>
                      <p className="text-[#A69A8C] text-sm font-medium">GitHub</p>
                      <a href={profileData.github_url} target="_blank" rel="noopener noreferrer" className="text-[#B8915C] hover:underline">
                        {profileData.github_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profileData.bio && (
              <div className="mt-6 pt-6 border-t border-[#D6CDC2]">
                <h3 className="font-semibold text-[#2D2A24] mb-2">Bio</h3>
                <p className="text-[#4A443C] leading-relaxed">{profileData.bio}</p>
              </div>
            )}
          </motion.div>

          {/* Experience */}
          {profileData.experiences && profileData.experiences.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-[#2D2A24] mb-6">Experience</h2>
              <div className="space-y-6">
                {profileData.experiences.map((exp, index) => (
                  <div key={index} className="pb-6" style={{ borderBottom: index < profileData.experiences.length - 1 ? "1px solid #D6CDC2" : "none" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-[#2D2A24]">{exp.job_title}</h3>
                        <p className="text-[#B8915C]">{exp.company_name}</p>
                      </div>
                      <span className="text-[#A69A8C] text-sm whitespace-nowrap ml-4">
                        {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                      </span>
                    </div>
                    {exp.location && <p className="text-[#4A443C] text-sm mb-2">{exp.location}</p>}
                    {exp.description && <p className="text-[#4A443C] leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Education */}
          {profileData.education && profileData.education.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-[#2D2A24] mb-6">Education</h2>
              <div className="space-y-6">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="pb-6" style={{ borderBottom: index < profileData.education.length - 1 ? "1px solid #D6CDC2" : "none" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-[#2D2A24]">{edu.degree}</h3>
                        <p className="text-[#B8915C]">{edu.institution}</p>
                      </div>
                      <span className="text-[#A69A8C] text-sm whitespace-nowrap ml-4">
                        {edu.start_date} - {edu.end_date}
                      </span>
                    </div>
                    {edu.field_of_study && <p className="text-[#4A443C] text-sm mb-2">Field: {edu.field_of_study}</p>}
                    {edu.grade && <p className="text-[#4A443C] text-sm">Grade: {edu.grade}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Skills */}
          {profileData.skills && profileData.skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-[#2D2A24] mb-6">Skills</h2>
              <div className="space-y-6">
                {profileData.skills.map((skillSet, index) => (
                  <div key={index} className="pb-6" style={{ borderBottom: index < profileData.skills.length - 1 ? "1px solid #D6CDC2" : "none" }}>
                    {skillSet.languages && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">Languages</p>
                        <p className="text-[#2D2A24]">{skillSet.languages}</p>
                      </div>
                    )}
                    {skillSet.backend_technologies && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">Backend Technologies</p>
                        <p className="text-[#2D2A24]">{skillSet.backend_technologies}</p>
                      </div>
                    )}
                    {skillSet.databases && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">Databases</p>
                        <p className="text-[#2D2A24]">{skillSet.databases}</p>
                      </div>
                    )}
                    {skillSet.ai_ml_frameworks && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">AI/ML Frameworks</p>
                        <p className="text-[#2D2A24]">{skillSet.ai_ml_frameworks}</p>
                      </div>
                    )}
                    {skillSet.tools_platforms && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">Tools & Platforms</p>
                        <p className="text-[#2D2A24]">{skillSet.tools_platforms}</p>
                      </div>
                    )}
                    {skillSet.core_competencies && (
                      <div className="mb-4">
                        <p className="text-[#A69A8C] text-sm font-medium">Core Competencies</p>
                        <p className="text-[#2D2A24]">{skillSet.core_competencies}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Projects */}
          {profileData.projects && profileData.projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-[#2D2A24] mb-6">Projects</h2>
              <div className="space-y-6">
                {profileData.projects.map((project, index) => (
                  <div key={index} className="pb-6" style={{ borderBottom: index < (profileData.projects?.length ?? 0) - 1 ? "1px solid #D6CDC2" : "none" }}>
                    <h3 className="font-semibold text-[#2D2A24] mb-2">{project.title}</h3>
                    <p className="text-[#4A443C] mb-2">{project.description}</p>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[#B8915C] hover:underline text-sm">
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certifications */}
          {profileData.certifications && profileData.certifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="profile-card bg-white/60 backdrop-blur-sm border border-[#D6CDC2] rounded-2xl p-8"
            >
              <h2 className="text-2xl font-semibold text-[#2D2A24] mb-6">Certifications</h2>
              <div className="space-y-6">
                {profileData.certifications.map((cert, index) => (
                  <div key={index} className="pb-6" style={{ borderBottom: index < (profileData.certifications?.length ?? 0) - 1 ? "1px solid #D6CDC2" : "none" }}>
                    <h3 className="font-semibold text-[#2D2A24] mb-1">{cert.title}</h3>
                    <p className="text-[#B8915C] text-sm mb-1">{cert.issuer}</p>
                    <p className="text-[#A69A8C] text-sm">{cert.date}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}