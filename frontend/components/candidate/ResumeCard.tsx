"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
export interface ValidationErrors {
  name?: string;      // Error message for full name field
  email?: string;     // Error message for email (though read-only, still validated)
  phone?: string;     // Error message for phone number
  bio?: string;       // Error message for bio/summary
  skills?: string;    // Error message for skills list
  resume?: string;    // Error message for resume file
}

interface ResumeCardProps {
  isEditing: boolean;
  resumeFile: File | null;
  onResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
}

export default function ResumeCard({
  isEditing,
  resumeFile,
  onResumeUpload,
  errors,
  touched,
}: ResumeCardProps) {
  return (
    <Card className="info-card border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
      <CardHeader>
        <CardTitle className="font-serif text-xl text-[#2D2A24] dark:text-white">
          Resume <span className="text-red-500">*</span>
        </CardTitle>
      </CardHeader>
      <CardContent id="field-resume">
        {resumeFile || !isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-[#F1E9E0] dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#B8915C]/10 rounded">
                  <FileText className="h-5 w-5 text-[#B8915C]" />
                </div>
                <div>
                  <p className="font-medium text-[#2D2A24] dark:text-white">
                    {resumeFile ? resumeFile.name : "No resume uploaded"}
                  </p>
                  {resumeFile && (
                    <p className="text-sm text-[#5A534A] dark:text-slate-400">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={onResumeUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => document.getElementById("resume-upload")?.click()}
                      className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {resumeFile ? "Update" : "Upload"}
                    </Button>
                  </label>
                </div>
              )}
            </div>
            {isEditing && touched.resume && errors.resume && (
              <p className="text-sm text-red-600 mt-1">{errors.resume}</p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#D6CDC2] rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={onResumeUpload}
              className="hidden"
              id="resume-upload-empty"
            />
            <Upload className="h-12 w-12 text-[#A69A8C] mx-auto mb-4" />
            <p className="text-[#2D2A24] dark:text-white mb-2">Upload your resume</p>
            <p className="text-sm text-[#5A534A] dark:text-slate-400 mb-4">
              PDF, DOC, or DOCX (max 5MB)
            </p>
            <label htmlFor="resume-upload-empty">
              <Button
                type="button"
                onClick={() => {
                  document.getElementById("resume-upload-empty")?.click();
                }}
                className="bg-[#B8915C] hover:bg-[#9F7A4F]"
              >
                Choose File
              </Button>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}