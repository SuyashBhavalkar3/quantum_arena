"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Briefcase, DollarSign, MapPin, PlusCircle, Search, Users } from "lucide-react";

import { getCurrentUser, hrAPI, HRJob } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export default function JobsPage() {
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const currentUser = await getCurrentUser(token);
        const response = await hrAPI.getJobs();
        const filteredJobs = response.jobs.filter((job) => job.created_by === currentUser.id);

        if (mounted) {
          setJobs(filteredJobs);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load jobs.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return jobs;
    }

    return jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(query) ||
        (job.location || "").toLowerCase().includes(query) ||
        (job.description || "").toLowerCase().includes(query)
      );
    });
  }, [jobs, searchTerm]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
            Job Listings
          </h1>
          <p className="mt-2 text-[#5A534A] dark:text-slate-400">
            Manage the jobs returned for your HR account.
          </p>
        </div>
        <Link href="/hr/jobs/new">
          <Button className="bg-[#B8915C] hover:bg-[#9F7A4F]">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-300" />
            <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A69A8C]" />
            <Input
              placeholder="Search jobs by title, description, or location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="border-[#D6CDC2] bg-white pl-10 dark:bg-slate-800"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <Skeleton className="mb-3 h-6 w-56" />
                  <Skeleton className="mb-2 h-4 w-80" />
                  <Skeleton className="h-4 w-64" />
                </CardContent>
              </Card>
            ))
          : filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="border-none bg-white/70 shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-slate-900/70"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                          {job.title}
                        </h2>
                        <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                          Active
                        </Badge>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-[#5A534A] dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-[#B8915C]" />
                          {job.experience_required ? `${job.experience_required}+ years` : "Experience flexible"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-[#B8915C]" />
                          {job.location || "Location not specified"}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-[#B8915C]" />
                          {job.salary_range || "Salary range not specified"}
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-2 text-sm text-[#5A534A] dark:text-slate-400">
                        {job.description || "No description has been provided for this role yet."}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {(job.required_skills || []).slice(0, 5).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="border-[#D6CDC2] bg-white/60 text-[#4A443C] dark:bg-slate-800/60 dark:text-slate-300"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/hr/applicants?job=${job.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                        >
                          <Users className="mr-2 h-4 w-4 text-[#B8915C]" />
                          Applicants
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!loading && filteredJobs.length === 0 && (
        <Card className="mt-4 border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
          <CardContent className="p-6 text-sm text-[#5A534A] dark:text-slate-400">
            No jobs matched your current search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
