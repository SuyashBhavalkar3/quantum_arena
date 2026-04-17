// API client for backend communication

import Cookies from 'js-cookie';
import { removeAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  is_employer: boolean;
  company?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  is_employer: boolean;
  company?: string;
  created_at: string;
}

export interface HRDashboardStats {
  total_jobs: number;
  total_applications: number;
  pending_review: number;
  in_assessment: number;
  in_interview: number;
  hired_total: number;
  rejected: number;
  hired_this_month: number;
  applications_this_month: number;
}

export interface HRRecentApplicant {
  id: number;
  candidate_id: number;
  job_title: string;
  status: string;
  resume_score: number | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  applied_at: string;
}

export interface HRPendingActionItem {
  id: number;
  job_title: string;
  candidate_id: number;
  applied_at?: string;
  assessment_score?: number | null;
  interview_score?: number | null;
}

export interface HRPendingActions {
  pending_review: HRPendingActionItem[];
  assessment_completed: HRPendingActionItem[];
  interview_completed: HRPendingActionItem[];
}

export interface CandidateReport {
  id: number;
  application_id: number;
  report_type: string;
  status: string;
  pdf_path?: string | null;
  pdf_url?: string | null;
  llm_summary_json?: Record<string, unknown> | null;
  chart_metadata_json?: Record<string, unknown> | null;
  generated_at?: string | null;
  error_message?: string | null;
  created_at: string;
  subject?: {
    candidate_name: string;
    candidate_id?: number | null;
    job_title: string;
    job_id?: number | null;
    application_status?: string | null;
  } | null;
  assessment?: {
    score: number;
    accuracy_percent: number;
    duration_minutes: number;
    violation_count: number;
    violations: Array<Record<string, unknown>>;
    section_scores: Record<string, number>;
    time_spent_by_section: Record<string, number>;
  } | null;
  interview?: {
    score: number;
    duration_minutes: number;
    status: string;
    violation_count: number;
    violations: Array<Record<string, unknown>>;
    response_count: number;
    skill_ratings: Record<string, number>;
    topic_coverage: Record<string, number>;
    summary: string;
  } | null;
  strengths?: string[];
  weaknesses?: string[];
  behavioral_observations?: string[];
  final_recommendation?: string | null;
  candidate_summary?: string | null;
  interview_summary?: string | null;
  chart_images?: Record<string, string> | null;
}

export interface HRJob {
  id: number;
  title: string;
  description?: string | null;
  required_skills?: string[] | null;
  experience_required?: number | null;
  location?: string | null;
  salary_range?: string | null;
  created_by: number;
  created_at: string;
}

export interface HRJobsResponse {
  total_jobs: number;
  jobs: HRJob[];
}

export interface HRApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  user_id: number;
  candidate_name?: string | null;
  candidate_email?: string | null;
  status: string;
  resume_match_score: number | null;
  resume_analysis?: Record<string, unknown> | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  hr_notes?: string | null;
  assessment_data?: Record<string, unknown> | null;
  interview_feedback?: Record<string, unknown> | null;
  assessment_available_at?: string | null;
  assessment_expires_at?: string | null;
  created_at: string;
}

export interface HRApplicationDetail extends HRApplication {
  interview_transcript?: Record<string, unknown> | null;
  job?: {
    id: number;
    title: string;
    description?: string | null;
    location?: string | null;
  } | null;
}

export interface CreateHRJobPayload {
  title: string;
  description?: string;
  required_skills: string[];
  experience_required: number;
  location: string;
  salary_range: string;
}

export interface CandidateProfileStatus {
  profile_completed: boolean;
  resume_uploaded?: boolean;
  has_experience?: boolean;
  has_education?: boolean;
  has_skills?: boolean;
}

export interface AssessmentMCQQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  topic?: string | null;
  difficulty?: string | null;
  marks: number;
}

export interface AssessmentCodingQuestion {
  id: number;
  question_text: string;
  topic?: string | null;
  difficulty?: string | null;
  example_input?: string | null;
  example_output?: string | null;
  expected_time_complexity?: string | null;
  expected_space_complexity?: string | null;
  constraints?: string | null;
  expected_function_signature?: string | null;
  marks: number;
}

export interface AssessmentStartResponse {
  id: number;
  application_id: number;
  mcq_questions: AssessmentMCQQuestion[];
  coding_questions: AssessmentCodingQuestion[];
  started_at?: string | null;
  completed: boolean;
}

export interface AssessmentSubmitRequest {
  mcq_answers: Array<{
    question_id: number;
    selected_option: string;
  }>;
  coding_submissions: Array<{
    question_id: number;
    code: string;
    language: string;
  }>;
  forced_by_violation?: boolean;
}

export interface AssessmentSubmitResponse {
  id: number;
  application_id: number;
  mcq_score: number;
  coding_score: number;
  total_score: number;
  mcq_correct: number;
  total_mcq: number;
  coding_test_cases_passed: number;
  total_coding_test_cases: number;
  qualifies_for_interview: boolean;
  next_status?: string | null;
  completed_at?: string | null;
}

export interface CandidateJob {
  id: number;
  title: string;
  description?: string | null;
  required_skills?: string[] | null;
  experience_required?: number | null;
  location?: string | null;
  salary_range?: string | null;
  created_by: number;
  created_at: string;
}

export interface CandidateJobsResponse {
  total_jobs: number;
  jobs: CandidateJob[];
}

export interface CandidateDashboardStats {
  total_applications: number;
  applications_this_week: number;
  in_progress: number;
  interviews_total: number;
  upcoming_interviews: number;
  offers_received: number;
  offers_pending_response: number;
  unread_notifications: number;
}

export interface CandidateDashboardActivity {
  id: number;
  job_id: number;
  job_title: string;
  status: string;
  updated_at?: string | null;
  resume_score: number | null;
  assessment_score: number | null;
  screening_status: "pending" | "passed" | "not_selected";
  screening_threshold: number;
  resume_screened: boolean;
  passed_screening: boolean;
  next_step_message: string;
}

export interface CandidateSchedule {
  id: number;
  application_id: number;
  schedule_type: "assessment" | "interview";
  scheduled_time: string;
  duration_minutes: number;
  reminder_sent: boolean;
  completed: boolean;
  rescheduled_count: number;
}

export interface RecruitmentStrategyRequest {
  role_to_hire_for: string;
  number_of_candidates_to_hire: number;
  hiring_timeline_days: number;
  company_category: "startup" | "mid-size" | "enterprise";
}

export interface RecruitmentStrategyResponse {
  id: number;
  role_to_hire_for: string;
  number_of_candidates_to_hire: number;
  hiring_timeline_days: number;
  market_competition: string;
  company_category: string;
  company_offering: string;
  competitor_offerings: string;
  executive_summary: string;
  hiring_funnel_strategy: {
    applications: number;
    resume_screening: number;
    assessment: number;
    interview: number;
    final_hires: number;
  };
  time_optimization_plan: string[];
  cost_optimization_suggestions: string[];
  competitive_hiring_advice: string[];
  sourcing_strategy: string[];
  risk_warnings: string[];
  raw_strategy_json: Record<string, unknown>;
  created_at: string;
}

export interface HRAICommandResponse {
  message: string;
  action: string;
  data?: Array<Record<string, unknown>> | null;
}

export async function registerUser(data: RegisterData): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.fullName,
      email: data.email,
      password: data.password,
      is_employer: data.is_employer,
      ...(data.company && { company: data.company }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // token invalid
    removeAuthToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return response.json();
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = Cookies.get('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Profile API
export const profileAPI = {
  getCandidateStatus: async (): Promise<CandidateProfileStatus> => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/profile-status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch candidate profile status');
    return res.json();
  },

  getStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/api/profile/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile status');
    return res.json();
  },

  saveProfile: async (profileData: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/api/profile/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  parseResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
      : null;
    
    const res = await fetch(`${API_BASE_URL}/api/resume/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to parse resume');
    return res.json();
  },
};

// Dashboard API
export const dashboardAPI = {
  getCandidateStats: async (): Promise<CandidateDashboardStats> => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getCandidateActivity: async (limit: number = 10): Promise<CandidateDashboardActivity[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/dashboard/activity?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  getHRStats: async (): Promise<HRDashboardStats> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getRecentApplicants: async (limit: number = 10): Promise<HRRecentApplicant[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/recent-applicants?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  getTopCandidates: async (limit: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/top-candidates?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  getPendingActions: async (): Promise<HRPendingActions> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/pending-actions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pending actions');
    return res.json();
  },
};

export const hrAPI = {
  getJobs: async (): Promise<HRJobsResponse> => {
    const res = await fetch(`${API_BASE_URL}/jobs/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  createJob: async (payload: CreateHRJobPayload): Promise<{ message: string; job: HRJob }> => {
    const res = await fetch(`${API_BASE_URL}/jobs/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  getJobApplicants: async (jobId: number): Promise<HRApplication[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/job/${jobId}/applicants`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  getApplicationDetail: async (applicationId: number): Promise<HRApplicationDetail> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/application/${applicationId}/detail`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch application details');
    return res.json();
  },

  updateApplicationStatus: async (
    applicationId: number,
    payload: { status?: string; hr_notes?: string }
  ): Promise<HRApplication> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/application/${applicationId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
  },

  updateProfile: async (payload: {
    name?: string;
    email?: string;
    company_name?: string;
    company_website?: string;
    company_description?: string;
  }): Promise<UserData> => {
    const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  getCandidateReport: async (applicationId: number): Promise<CandidateReport> => {
    const res = await fetch(`${API_BASE_URL}/v1/reports/application/${applicationId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch candidate report');
    }
    return res.json();
  },

  generateCandidateReport: async (
    applicationId: number
  ): Promise<{ message: string; application_id: number; status: string }> => {
    const res = await fetch(`${API_BASE_URL}/v1/reports/application/${applicationId}/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to generate candidate report');
    }
    return res.json();
  },

  downloadCandidateReport: async (reportId: number): Promise<Blob> => {
    const res = await fetch(`${API_BASE_URL}/v1/reports/${reportId}/download`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to download candidate report');
    }
    return res.blob();
  },

  generateRecruitmentStrategy: async (
    payload: RecruitmentStrategyRequest
  ): Promise<RecruitmentStrategyResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/recruitment-strategy/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to generate recruitment strategy');
    }
    return res.json();
  },

  runAICommand: async (query: string): Promise<HRAICommandResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/ai-command`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to execute HR AI command');
    }
    return res.json();
  },
};

export const jobsAPI = {
  getAllJobs: async (): Promise<CandidateJobsResponse> => {
    const res = await fetch(`${API_BASE_URL}/jobs/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },
};

export const applicationsAPI = {
  applyForJob: async (jobId: number): Promise<HRApplication> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ job_id: jobId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to apply for job');
    }
    return res.json();
  },

  getMyApplications: async (): Promise<HRApplication[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/my-applications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },

  getMyApplicationDetail: async (applicationId: number): Promise<HRApplicationDetail> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/my-applications/${applicationId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch application detail');
    }
    return res.json();
  },
};

export const assessmentAPI = {
  startAssessment: async (applicationId: number): Promise<AssessmentStartResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/assessment/start/${applicationId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to start assessment');
    }
    return res.json();
  },

  submitAssessment: async (
    applicationId: number,
    payload: AssessmentSubmitRequest
  ): Promise<AssessmentSubmitResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/assessment/submit/${applicationId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to submit assessment');
    }
    return res.json();
  },
};

export const schedulingAPI = {
  getMySchedules: async (): Promise<CandidateSchedule[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/scheduling/my-schedules`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return res.json();
  },
};


// HR Actions API
export const hrActionsAPI = {
  sendOffer: async (applicationId: number, offerDetails: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/actions/offer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ application_id: applicationId, offer_details: offerDetails }),
    });
    if (!res.ok) throw new Error('Failed to send offer');
    return res.json();
  },

  rejectCandidate: async (applicationId: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/actions/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ application_id: applicationId, reason }),
    });
    if (!res.ok) throw new Error('Failed to reject candidate');
    return res.json();
  },
};

// Proctoring API
export const proctoringAPI = {
  reportViolation: async (
    applicationId: number,
    violationType: string,
    timestamp: string,
    details: string,
    stage: "assessment" | "interview" = "assessment"
  ) => {
    const res = await fetch(`${API_BASE_URL}/v1/proctoring/report-violation`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        application_id: applicationId,
        violation_type: violationType,
        timestamp,
        details,
        stage,
      }),
    });
    if (!res.ok) throw new Error('Failed to report violation');
    return res.json();
  },

  getViolations: async (applicationId: number) => {
    const res = await fetch(`${API_BASE_URL}/v1/proctoring/violations/${applicationId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch violations');
    return res.json();
  },

  terminateSession: async (
    applicationId: number,
    stage: "assessment" | "interview",
    status: string,
    reason: string,
    violations: number
  ) => {
    const res = await fetch(`${API_BASE_URL}/v1/proctoring/terminate-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        application_id: applicationId,
        stage,
        status,
        reason,
        violations,
      }),
    });
    if (!res.ok) throw new Error('Failed to terminate session');
    return res.json();
  },
};
