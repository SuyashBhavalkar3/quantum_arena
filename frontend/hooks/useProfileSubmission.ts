import { useCallback, useState } from 'react';
import {
  addExperience,
  addEducation,
  addSkill,
  addProject,
  addCertification,
  completeProfile,
  getProfileStatus,
  type ExperienceCreate,
  type EducationCreate,
  type SkillCreate,
  type ProjectCreate,
  type CertificationCreate,
} from '@/services/profileAPI';
import type { ProfileState } from './useProfileState';
import Cookies from 'js-cookie';

/**
 * Hook for managing profile submission to the backend
 * Handles validation, API calls, and submission workflow
 */
export const useProfileSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  /**
   * Submit profile data to backend
   * Saves experiences, education, skills, projects, certifications and marks profile as completed
   */
  const submitProfile = useCallback(
    async (profileState: ProfileState): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      setSubmissionError(null);

      try {
        const token = Cookies.get('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Validate that we have at least one of each required section
        if (
          profileState.experiences.length === 0 ||
          profileState.education.length === 0 ||
          profileState.skills.languages === '' &&
            profileState.skills.backendTechnologies === '' &&
            profileState.skills.databases === '' &&
            profileState.skills.aiMlFrameworks === '' &&
            profileState.skills.toolsPlatforms === '' &&
            profileState.skills.coreCompetencies === ''
        ) {
          throw new Error(
            'Profile must have at least one experience, one education, and one skill'
          );
        }

        // Submit experiences
        for (const exp of profileState.experiences) {
          const { id, ...expData } = exp;
          const experiencePayload: ExperienceCreate = {
            company_name: expData.companyName,
            job_title: expData.jobTitle,
            location: expData.location || undefined,
            start_date: expData.startDate,
            end_date: expData.endDate || undefined,
            is_current: expData.isCurrent,
            description: expData.description || undefined,
          };

          const result = await addExperience(experiencePayload, token);
          if (!result.success) {
            throw new Error(result.error || 'Failed to add experience');
          }
        }

        // Submit education
        for (const edu of profileState.education) {
          const { id, ...eduData } = edu;
          const educationPayload: EducationCreate = {
            institution: eduData.institution,
            degree: eduData.degree,
            field_of_study: eduData.fieldOfStudy || undefined,
            start_date: eduData.startDate,
            end_date: eduData.endDate || undefined,
            grade: eduData.grade || undefined,
            location: eduData.location || undefined,
          };

          const result = await addEducation(educationPayload, token);
          if (!result.success) {
            throw new Error(result.error || 'Failed to add education');
          }
        }

        // Submit skills (as a single skill entry with all categories)
        const skillsPayload: SkillCreate = {
          languages: profileState.skills.languages || undefined,
          backend_technologies: profileState.skills.backendTechnologies || undefined,
          databases: profileState.skills.databases || undefined,
          ai_ml_frameworks: profileState.skills.aiMlFrameworks || undefined,
          tools_platforms: profileState.skills.toolsPlatforms || undefined,
          core_competencies: profileState.skills.coreCompetencies || undefined,
        };

        const skillResult = await addSkill(skillsPayload, token);
        if (!skillResult.success) {
          throw new Error(skillResult.error || 'Failed to add skills');
        }

        // Submit projects (optional)
        for (const proj of profileState.projects) {
          const { id, ...projData } = proj;
          const projectPayload: ProjectCreate = {
            project_name: projData.projectName,
            description: projData.description || undefined,
            github_url: projData.githubUrl || undefined,
          };

          const result = await addProject(projectPayload, token);
          if (!result.success) {
            throw new Error(result.error || 'Failed to add project');
          }
        }

        // Submit certifications (optional)
        for (const cert of profileState.certifications) {
          const { id, ...certData } = cert;
          const certificationPayload: CertificationCreate = {
            title: certData.title,
          };

          const result = await addCertification(certificationPayload, token);
          if (!result.success) {
            throw new Error(result.error || 'Failed to add certification');
          }
        }

        // Mark profile as completed
        const completeResult = await completeProfile(token);
        if (!completeResult.success) {
          throw new Error(completeResult.error || 'Failed to complete profile');
        }

        setIsSubmitting(false);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit profile';
        setSubmissionError(errorMessage);
        setIsSubmitting(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    submitProfile,
    isSubmitting,
    submissionError,
    setSubmissionError,
  };
};
