"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

type ExperienceFormItem = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

interface WorkExperienceCardProps {
  isEditing: boolean;
  experiences: ExperienceFormItem[];
  setExperiences: React.Dispatch<React.SetStateAction<ExperienceFormItem[]>>;
}

export default function WorkExperienceCard({
  isEditing,
  experiences,
  setExperiences,
}: WorkExperienceCardProps) {
  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const updateExperience = (id: string, field: keyof ExperienceFormItem, value: string) => {
    setExperiences((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperience = (id: string) => {
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  return (
    <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
            Work Experience (Optional)
          </CardTitle>
          {isEditing && (
            <Button
              onClick={addExperience}
              size="sm"
              variant="outline"
              className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {experiences.length === 0 ? (
          <p className="text-[#5A534A] text-center py-4">No work experience added</p>
        ) : (
          experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-4 border border-[#D6CDC2] dark:border-slate-700 rounded-lg space-y-3 bg-white/50 dark:bg-slate-800/50"
            >
              {isEditing ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#4A443C] dark:text-slate-300">Job Title</Label>
                      <Input
                        value={exp.jobTitle}
                        onChange={(e) => updateExperience(exp.id, "jobTitle", e.target.value)}
                        placeholder="e.g. Senior Developer"
                        className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#4A443C] dark:text-slate-300">Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        placeholder="e.g. Tech Corp"
                        className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#4A443C] dark:text-slate-300">Start Date</Label>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                        className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#4A443C] dark:text-slate-300">End Date</Label>
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                        placeholder="Leave empty if current"
                        className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[#4A443C] dark:text-slate-300">Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                        placeholder="Describe your responsibilities and achievements..."
                        rows={3}
                        className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-semibold text-[#2D2A24] dark:text-white">{exp.jobTitle}</h4>
                    <p className="text-[#5A534A] dark:text-slate-400">{exp.company}</p>
                    <p className="text-sm text-[#A69A8C]">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-[#5A534A] dark:text-slate-400">{exp.description}</p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
