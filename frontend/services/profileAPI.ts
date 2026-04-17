const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ============================================================================
// PROFILE STATUS
// ============================================================================

export interface ProfileStatus {
  profile_completed: boolean;
  resume_uploaded: boolean;
  has_experience: boolean;
  has_education: boolean;
  has_skills: boolean;
}

/**
 * Fetch user's profile status from backend
 * Determines whether profile is complete and what sections are filled
 */
export async function getProfileStatus(token: string): Promise<{
  success: boolean;
  data?: ProfileStatus;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/profile-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 403/404 errors mean profile doesn't exist yet, which is valid
      if (response.status === 403 || response.status === 404) {
        return {
          success: true,
          data: {
            profile_completed: false,
            resume_uploaded: false,
            has_experience: false,
            has_education: false,
            has_skills: false,
          },
        };
      }
      throw new Error(errorData.detail || `Failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching profile status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile status',
    };
  }
}

// ============================================================================
// EXPERIENCES
// ============================================================================

export interface ExperienceCreate {
  company_name: string;
  job_title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  marks?: string;
}

export interface ExperienceResponse extends ExperienceCreate {
  id: number;
  candidate_id: number;
  created_at: string;
}

/**
 * Add a new experience to the profile
 */
export async function addExperience(
  experience: ExperienceCreate,
  token: string
): Promise<{ success: boolean; data?: ExperienceResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/experiences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experience),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add experience');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding experience:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add experience',
    };
  }
}

/**
 * Get all experiences for the user
 */
export async function getExperiences(token: string): Promise<{
  success: boolean;
  data?: ExperienceResponse[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/experiences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch experiences');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch experiences',
    };
  }
}

/**
 * Update an experience
 */
export async function updateExperience(
  id: number,
  experience: ExperienceCreate,
  token: string
): Promise<{ success: boolean; data?: ExperienceResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/experiences/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experience),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update experience');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating experience:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update experience',
    };
  }
}

/**
 * Delete an experience
 */
export async function deleteExperience(id: number, token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/experiences/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete experience');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting experience:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete experience',
    };
  }
}

// ============================================================================
// EDUCATION
// ============================================================================

export interface EducationCreate {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  graduation_date?: string;
  marks?: string;
  location?: string;
}

export interface EducationResponse extends EducationCreate {
  id: number;
  candidate_id: number;
  created_at: string;
}

/**
 * Add a new education entry
 */
export async function addEducation(
  education: EducationCreate,
  token: string
): Promise<{ success: boolean; data?: EducationResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/education`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(education),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add education');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding education:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add education',
    };
  }
}

/**
 * Get all education entries
 */
export async function getEducation(token: string): Promise<{
  success: boolean;
  data?: EducationResponse[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/education`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch education');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching education:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch education',
    };
  }
}

/**
 * Delete an education entry
 */
export async function deleteEducation(id: number, token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/education/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete education');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting education:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete education',
    };
  }
}

// ============================================================================
// SKILLS
// ============================================================================

export interface SkillCreate {
  languages?: string;
  backend_technologies?: string;
  databases?: string;
  ai_ml_frameworks?: string;
  tools_platforms?: string;
  core_competencies?: string;
}

export interface SkillResponse extends SkillCreate {
  id: number;
  candidate_id: number;
  created_at: string;
}

/**
 * Add skills to profile
 */
export async function addSkill(
  skill: SkillCreate,
  token: string
): Promise<{ success: boolean; data?: SkillResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/skills`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(skill),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add skill');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add skill',
    };
  }
}

/**
 * Get all skills
 */
export async function getSkills(token: string): Promise<{
  success: boolean;
  data?: SkillResponse[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/skills`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch skills');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching skills:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch skills',
    };
  }
}

/**
 * Update skills
 */
export async function updateSkill(
  id: number,
  skill: SkillCreate,
  token: string
): Promise<{ success: boolean; data?: SkillResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/skills/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(skill),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update skill');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update skill',
    };
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(id: number, token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/skills/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete skill');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete skill',
    };
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface ProjectCreate {
  project_name: string;
  description?: string;
  github_url?: string;
}

export interface ProjectResponse extends ProjectCreate {
  id: number;
  candidate_id: number;
  created_at: string;
}

/**
 * Add a new project
 */
export async function addProject(
  project: ProjectCreate,
  token: string
): Promise<{ success: boolean; data?: ProjectResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add project');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add project',
    };
  }
}

/**
 * Get all projects
 */
export async function getProjects(token: string): Promise<{
  success: boolean;
  data?: ProjectResponse[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch projects');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    };
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: number,
  project: ProjectCreate,
  token: string
): Promise<{ success: boolean; data?: ProjectResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update project');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: number, token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete project');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export interface CertificationCreate {
  title: string;
}

export interface CertificationResponse extends CertificationCreate {
  id: number;
  candidate_id: number;
  created_at: string;
}

/**
 * Add a certification
 */
export async function addCertification(
  certification: CertificationCreate,
  token: string
): Promise<{ success: boolean; data?: CertificationResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/certifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certification),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add certification');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding certification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add certification',
    };
  }
}

/**
 * Get all certifications
 */
export async function getCertifications(token: string): Promise<{
  success: boolean;
  data?: CertificationResponse[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/certifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch certifications');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch certifications',
    };
  }
}

/**
 * Delete a certification
 */
export async function deleteCertification(id: number, token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/certifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete certification');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting certification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete certification',
    };
  }
}

// ============================================================================
// PROFILE COMPLETION
// ============================================================================

/**
 * Mark profile as completed
 * This validates that the profile has required sections filled (experience, education, skills)
 */
export async function completeProfile(token: string): Promise<{
  success: boolean;
  data?: { message: string; profile_completed: boolean };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/candidate/complete-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to complete profile');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error completing profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete profile',
    };
  }
}
