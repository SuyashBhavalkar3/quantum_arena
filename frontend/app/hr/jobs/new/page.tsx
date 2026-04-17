"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, DollarSign, FileText, MapPin, Save, Target, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hrAPI } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    salary: "",
    experience: "",
    description: "",
    skills: "",
  });
  const [interviewConfig, setInterviewConfig] = useState<Record<string, string>>({
    projects: "medium",
    skills: "medium",
    education: "medium",
    experience: "medium"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      await hrAPI.createJob({
        title: formData.title,
        description: formData.description,
        required_skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience_required: Number(formData.experience || 0),
        location: formData.location,
        salary_range: formData.salary,
        interview_config: interviewConfig,
      });

      router.push("/hr/jobs");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/hr/jobs">
          <Button variant="ghost" size="sm" className="text-[#5A534A] hover:text-[#2D2A24]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
          Post New Job
          
        </h1>
        <p className="mt-2 text-[#5A534A] dark:text-slate-400">
          Create a live job record in the backend for your hiring pipeline.
        </p>
      </div>

      <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Senior Frontend Developer"
                    className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder="Bengaluru / Remote"
                    className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                  <Input
                    id="salary"
                    required
                    value={formData.salary}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, salary: event.target.value }))
                    }
                    placeholder="12 LPA - 18 LPA"
                    className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Required (years)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    required
                    value={formData.experience}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, experience: event.target.value }))
                    }
                    placeholder="3"
                    className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[#A69A8C]" />
                <Textarea
                  id="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Describe the role, responsibilities, and hiring expectations..."
                  className="border-[#D6CDC2] bg-white pl-9 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills</Label>
              <Input
                id="skills"
                required
                value={formData.skills}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, skills: event.target.value }))
                }
                placeholder="React, TypeScript, Next.js, REST APIs"
                className="border-[#D6CDC2] bg-white dark:bg-slate-800"
              />
            </div>

            <div className="space-y-4 rounded-lg border border-[#D6CDC2]/50 bg-[#F8F5F0] p-5 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-[#B8915C]" />
                <h3 className="font-medium text-[#2D2A24] dark:text-white">Configure Interview Depth</h3>
              </div>
              <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-4">
                Select how deep the AI should probe in each area during the technical and behavioral interview.
              </p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {(Object.keys(interviewConfig) as Array<keyof typeof interviewConfig>).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`config-${key}`} className="capitalize">{key === 'experience' ? 'Previous Experience' : key}</Label>
                    <div className="relative">
                      <select
                        id={`config-${key}`}
                        value={interviewConfig[key]}
                        onChange={(e) => setInterviewConfig(curr => ({ ...curr, [key]: e.target.value }))}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-[#D6CDC2] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B8915C] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                      >
                        <option value="ignore">Ignore (Skip)</option>
                        <option value="light">Light (1-2 basics)</option>
                        <option value="medium">Medium (2-4 questions)</option>
                        <option value="deep">Deep Dive (Probing/Scenarios)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-3 border-t border-[#D6CDC2]/50 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#B8915C] hover:bg-[#9F7A4F]"
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Posting..." : "Post Job"}
              </Button>
              <Link href="/hr/jobs">
                <Button variant="outline" className="border-[#D6CDC2] text-[#4A443C]">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
