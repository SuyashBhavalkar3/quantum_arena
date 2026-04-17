"use client";

import { useState } from "react";
import {
  AlertCircle,
  Clock3,
  Lightbulb,
  Loader2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  hrAPI,
  RecruitmentStrategyRequest,
  RecruitmentStrategyResponse,
} from "@/lib/api";

const defaultForm: RecruitmentStrategyRequest = {
  role_to_hire_for: "",
  number_of_candidates_to_hire: 5,
  hiring_timeline_days: 30,
  company_category: "startup",
};

export default function RecruitmentStrategyPage() {
  const [form, setForm] = useState<RecruitmentStrategyRequest>(defaultForm);
  const [strategy, setStrategy] = useState<RecruitmentStrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const result = await hrAPI.generateRecruitmentStrategy(form);
      setStrategy(result);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to generate recruitment strategy."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-2 font-serif text-4xl font-medium text-[#2D2A24] dark:text-white">
          Recruitment Strategy
          
        </h1>
        <p className="mt-2 max-w-3xl text-[#5A534A] dark:text-slate-400">
          Give the role, hiring target, timeline, and company scale. The system will
          generate the funnel strategy, competition view, sourcing plan, and risks end to end.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-300" />
            <p className="text-sm text-orange-700 dark:text-orange-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
              Strategy Inputs
            </h2>
            <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
              Enter only the hiring essentials. Everything else will be inferred automatically.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="role">Role to Hire For</Label>
                <Input
                  id="role"
                  value={form.role_to_hire_for}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, role_to_hire_for: event.target.value }))
                  }
                  placeholder="Backend Developer"
                  className="border-[#D6CDC2] bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="count">Number of Candidates to Hire</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    value={form.number_of_candidates_to_hire}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        number_of_candidates_to_hire: Number(event.target.value) || 1,
                      }))
                    }
                    className="border-[#D6CDC2] bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Hiring Timeline (Days)</Label>
                  <Input
                    id="timeline"
                    type="number"
                    min={1}
                    value={form.hiring_timeline_days}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hiring_timeline_days: Number(event.target.value) || 1,
                      }))
                    }
                    className="border-[#D6CDC2] bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Scale</Label>
                <Select
                  value={form.company_category}
                  onValueChange={(value: "startup" | "mid-size" | "enterprise") =>
                    setForm((current) => ({ ...current, company_category: value }))
                  }
                >
                  <SelectTrigger className="border-[#D6CDC2] bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select company scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="mid-size">Mid-size</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Strategy
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                    Generated Strategy
                  </h2>
                  <p className="mt-1 text-sm text-[#5A534A] dark:text-slate-400">
                    Structured recommendations based on your hiring inputs.
                  </p>
                </div>

                {strategy && (
                  <Badge className="border-none bg-[#B8915C]/10 text-[#B8915C]">
                    {new Date(strategy.created_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              {!strategy ? (
                <div className="mt-6 rounded-lg bg-[#F1E9E0] p-5 text-sm text-[#5A534A] dark:bg-slate-800/50 dark:text-slate-400">
                  Submit the form to generate a hiring funnel, sourcing plan, and risk analysis.
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  <div className="rounded-xl bg-[#F1E9E0] p-5 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-[#A69A8C]">
                      Executive Summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#4A443C] dark:text-slate-300">
                      {strategy.executive_summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="border-none bg-white/70 text-[#4A443C] dark:bg-slate-900/70 dark:text-slate-300">
                        Competition: {strategy.market_competition}
                      </Badge>
                      <Badge className="border-none bg-white/70 text-[#4A443C] dark:bg-slate-900/70 dark:text-slate-300">
                        Scale: {strategy.company_category}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                    {[
                      {
                        label: "Applications",
                        value: strategy.hiring_funnel_strategy.applications,
                        icon: Users,
                      },
                      {
                        label: "Resume Screening",
                        value: strategy.hiring_funnel_strategy.resume_screening,
                        icon: Target,
                      },
                      {
                        label: "Assessment",
                        value: strategy.hiring_funnel_strategy.assessment,
                        icon: Target,
                      },
                      {
                        label: "Interview",
                        value: strategy.hiring_funnel_strategy.interview,
                        icon: Clock3,
                      },
                      {
                        label: "Final Hires",
                        value: strategy.hiring_funnel_strategy.final_hires,
                        icon: TrendingUp,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                        <item.icon className="h-4 w-4 text-[#B8915C]" />
                        <p className="mt-3 text-xs uppercase tracking-wide text-[#A69A8C]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#2D2A24] dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {strategy && (
            <div className="space-y-4">
              <Card className="border-none bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                    System-Derived Market Context
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                      <p className="flex items-center gap-2 text-sm font-medium text-[#2D2A24] dark:text-white">
                        <Lightbulb className="h-4 w-4 text-[#B8915C]" />
                        Company Offering Assumption
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#4A443C] dark:text-slate-300">
                        {strategy.company_offering}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#F1E9E0] p-4 dark:bg-slate-800/50">
                      <p className="flex items-center gap-2 text-sm font-medium text-[#2D2A24] dark:text-white">
                        <Target className="h-4 w-4 text-[#B8915C]" />
                        Competitor Offering Assumption
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#4A443C] dark:text-slate-300">
                        {strategy.competitor_offerings}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {[
                {
                  title: "Time Optimization Plan",
                  items: strategy.time_optimization_plan,
                },
                {
                  title: "Cost Optimization Suggestions",
                  items: strategy.cost_optimization_suggestions,
                },
                {
                  title: "Competitive Hiring Advice",
                  items: strategy.competitive_hiring_advice,
                },
                {
                  title: "Sourcing Strategy",
                  items: strategy.sourcing_strategy,
                },
                {
                  title: "Risk Warnings",
                  items: strategy.risk_warnings,
                },
              ].map((section) => (
                <details
                  key={section.title}
                  open
                  className="rounded-xl bg-white/70 shadow-lg backdrop-blur-sm dark:bg-slate-900/70"
                >
                  <summary className="cursor-pointer list-none px-6 py-5 text-lg font-semibold text-[#2D2A24] dark:text-white">
                    {section.title}
                  </summary>
                  <div className="px-6 pb-6">
                    <div className="space-y-3">
                      {section.items.map((item, index) => (
                        <div
                          key={`${section.title}-${index}`}
                          className="rounded-lg bg-[#F1E9E0] p-4 text-sm text-[#4A443C] dark:bg-slate-800/50 dark:text-slate-300"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
