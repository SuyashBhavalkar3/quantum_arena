// User & Auth Types
export interface User {
  id: number;
  name: string;
  email: string;
  is_employer: boolean;
  company_name?: string;
  company_website?: string;
  company_description?: string;
  profile_completed: boolean;
  created_at: string;
}

// Job Types
export interface Job {
  id: number;
  title: string;
  description?: string;
  required_skills: string[];
  experience_required: number;
  location: string;
  salary_range: string;
  created_by: number;
  created_at: string;
  company_name?: string;
  company_website?: string;
}

// Application Types
export type ApplicationStatus = 
  | 'pending'
  | 'resume_screened'
  | 'assessment_scheduled'
  | 'assessment_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'final_review'
  | 'rejected'
  | 'accepted';

export interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  user_id: number;
  status: ApplicationStatus;
  resume_match_score?: number;
  resume_analysis?: any;
  assessment_score?: number;
  interview_score?: number;
  final_score?: number;
  hr_notes?: string;
  created_at: string;
}

export interface ApplicationDetail extends Application {
  assessment_data?: any;
  interview_transcript?: any;
  interview_feedback?: any;
  job?: Job;
}

// Experience Types
export interface Experience {
  id: number;
  candidate_id: number;
  company_name: string;
  job_title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  created_at: string;
}

// Education Types
export interface Education {
  id: number;
  candidate_id: number;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  created_at: string;
}

// Skill Types
export interface Skill {
  id: number;
  candidate_id: number;
  skill_name: string;
  proficiency?: string;
  created_at: string;
}

// Profile Status
export interface ProfileStatus {
  profile_completed: boolean;
  resume_uploaded: boolean;
  has_experience: boolean;
  has_education: boolean;
  has_skills: boolean;
}

// Schedule Types
export interface Schedule {
  id: number;
  application_id: number;
  schedule_type: 'assessment' | 'interview';
  scheduled_time: string;
  duration_minutes: number;
  reminder_sent: boolean;
  completed: boolean;
  rescheduled_count: number;
}

// Notification Types
export type NotificationType =
  | 'assessment_scheduled'
  | 'assessment_reminder'
  | 'interview_scheduled'
  | 'interview_reminder'
  | 'application_status'
  | 'general';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_jobs: number;
  total_applications: number;
  pending_review: number;
  screened: number;
  in_assessment: number;
  in_interview: number;
}

// Top Scorers
export interface TopScorersResponse {
  job_id: number;
  job_title: string;
  total_applicants: number;
  top_scorers: Array<{
    application_id: number;
    candidate_id: number;
    user_id: number;
    resume_match_score?: number;
    assessment_score?: number;
    interview_score?: number;
    final_score?: number;
    status: ApplicationStatus;
    created_at: string;
  }>;
}
