import { useState, useCallback } from 'react';

// Centralized Profile State Interface
export interface ProfileState {
  // Personal Information
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    linkedinUrl: string;
  };
  
  // Skills
  skills: {
    languages: string;
    backendTechnologies: string;
    databases: string;
    aiMlFrameworks: string;
    toolsPlatforms: string;
    coreCompetencies: string;
  };
  
  // Experience
  experiences: Array<{
    id: string;
    companyName: string;
    jobTitle: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }>;
  
  // Education
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    grade: string;
    location: string;
  }>;
  
  // Projects
  projects: Array<{
    id: string;
    projectName: string;
    description: string;
    githubUrl: string;
  }>;
  
  // Certifications
  certifications: Array<{
    id: string;
    title: string;
  }>;
  
  // Resume File
  resumeFile: File | null;
  profilePhoto: File | null;
}

// Parser Response Interface (from backend)
export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  linkedin_url?: string;
  skills?: string[] | {
    languages?: string;
    backend_technologies?: string;
    databases?: string;
    ai_ml_frameworks?: string;
    tools_platforms?: string;
    core_competencies?: string;
  };
  experiences?: Array<{
    company?: string;
    company_name?: string;
    role?: string;
    job_title?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field_of_study?: string;
    field?: string;
    start_date?: string;
    end_date?: string;
    year?: string;
    grade?: string;
    location?: string;
  }>;
  projects?: Array<{
    title?: string;
    project_name?: string;
    name?: string;
    description?: string;
    github_url?: string;
    url?: string;
  }>;
  certifications?: Array<{
    title?: string;
    name?: string;
  }>;
}

// Initial empty state
const getInitialState = (): ProfileState => ({
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    linkedinUrl: '',
  },
  skills: {
    languages: '',
    backendTechnologies: '',
    databases: '',
    aiMlFrameworks: '',
    toolsPlatforms: '',
    coreCompetencies: '',
  },
  experiences: [],
  education: [],
  projects: [],
  certifications: [],
  resumeFile: null,
  profilePhoto: null,
});

// Data Mapping Layer: Parser JSON → Profile State
const mapParsedDataToProfileState = (parsedData: ParsedResumeData): Partial<ProfileState> => {
  const mapped: Partial<ProfileState> = {};
  
  // Map Personal Info
  if (parsedData.name || parsedData.email || parsedData.phone || parsedData.location || parsedData.bio || parsedData.linkedin_url) {
    mapped.personalInfo = {
      name: parsedData.name || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      location: parsedData.location || '',
      bio: parsedData.bio || '',
      linkedinUrl: parsedData.linkedin_url || '',
    };
  }
  
  // Map Skills
  if (parsedData.skills) {
    if (Array.isArray(parsedData.skills)) {
      // If skills is an array, join them
      mapped.skills = {
        languages: '',
        backendTechnologies: '',
        databases: '',
        aiMlFrameworks: '',
        toolsPlatforms: '',
        coreCompetencies: parsedData.skills.join(', '),
      };
    } else if (typeof parsedData.skills === 'object') {
      // If skills is an object with categories
      mapped.skills = {
        languages: parsedData.skills.languages || '',
        backendTechnologies: parsedData.skills.backend_technologies || '',
        databases: parsedData.skills.databases || '',
        aiMlFrameworks: parsedData.skills.ai_ml_frameworks || '',
        toolsPlatforms: parsedData.skills.tools_platforms || '',
        coreCompetencies: parsedData.skills.core_competencies || '',
      };
    }
  }
  
  // Map Experiences
  if (parsedData.experiences && Array.isArray(parsedData.experiences)) {
    mapped.experiences = parsedData.experiences.map((exp, index) => ({
      id: `exp-${Date.now()}-${index}`,
      companyName: exp.company_name || exp.company || '',
      jobTitle: exp.job_title || exp.role || '',
      location: exp.location || '',
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
      isCurrent: exp.is_current || false,
      description: exp.description || '',
    }));
  }
  
  // Map Education
  if (parsedData.education && Array.isArray(parsedData.education)) {
    mapped.education = parsedData.education.map((edu, index) => ({
      id: `edu-${Date.now()}-${index}`,
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.field_of_study || edu.field || '',
      startDate: edu.start_date || '',
      endDate: edu.end_date || edu.year || '',
      grade: edu.grade || '',
      location: edu.location || '',
    }));
  }
  
  // Map Projects
  if (parsedData.projects && Array.isArray(parsedData.projects)) {
    mapped.projects = parsedData.projects.map((proj, index) => ({
      id: `proj-${Date.now()}-${index}`,
      projectName: proj.project_name || proj.title || proj.name || '',
      description: proj.description || '',
      githubUrl: proj.github_url || proj.url || '',
    }));
  }
  
  // Map Certifications
  if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
    mapped.certifications = parsedData.certifications.map((cert, index) => ({
      id: `cert-${Date.now()}-${index}`,
      title: cert.title || cert.name || '',
    }));
  }
  
  return mapped;
};

// Custom Hook for Profile State Management
export const useProfileState = () => {
  const [profileState, setProfileState] = useState<ProfileState>(getInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update personal info
  const updatePersonalInfo = useCallback((updates: Partial<ProfileState['personalInfo']>) => {
    setProfileState(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updates }
    }));
  }, []);
  
  // Update skills
  const updateSkills = useCallback((updates: Partial<ProfileState['skills']>) => {
    setProfileState(prev => ({
      ...prev,
      skills: { ...prev.skills, ...updates }
    }));
  }, []);
  
  // Add experience
  const addExperience = useCallback((experience: Omit<ProfileState['experiences'][0], 'id'>) => {
    setProfileState(prev => ({
      ...prev,
      experiences: [...prev.experiences, { ...experience, id: `exp-${Date.now()}` }]
    }));
  }, []);
  
  // Update experience
  const updateExperience = useCallback((id: string, updates: Partial<ProfileState['experiences'][0]>) => {
    setProfileState(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => 
        exp.id === id ? { ...exp, ...updates } : exp
      )
    }));
  }, []);
  
  // Remove experience
  const removeExperience = useCallback((id: string) => {
    setProfileState(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }));
  }, []);
  
  // Add education
  const addEducation = useCallback((education: Omit<ProfileState['education'][0], 'id'>) => {
    setProfileState(prev => ({
      ...prev,
      education: [...prev.education, { ...education, id: `edu-${Date.now()}` }]
    }));
  }, []);
  
  // Update education
  const updateEducation = useCallback((id: string, updates: Partial<ProfileState['education'][0]>) => {
    setProfileState(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, ...updates } : edu
      )
    }));
  }, []);
  
  // Remove education
  const removeEducation = useCallback((id: string) => {
    setProfileState(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  }, []);
  
  // Add project
  const addProject = useCallback((project: Omit<ProfileState['projects'][0], 'id'>) => {
    setProfileState(prev => ({
      ...prev,
      projects: [...prev.projects, { ...project, id: `proj-${Date.now()}` }]
    }));
  }, []);
  
  // Update project
  const updateProject = useCallback((id: string, updates: Partial<ProfileState['projects'][0]>) => {
    setProfileState(prev => ({
      ...prev,
      projects: prev.projects.map(proj => 
        proj.id === id ? { ...proj, ...updates } : proj
      )
    }));
  }, []);
  
  // Remove project
  const removeProject = useCallback((id: string) => {
    setProfileState(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  }, []);
  
  // Add certification
  const addCertification = useCallback((certification: Omit<ProfileState['certifications'][0], 'id'>) => {
    setProfileState(prev => ({
      ...prev,
      certifications: [...prev.certifications, { ...certification, id: `cert-${Date.now()}` }]
    }));
  }, []);
  
  // Update certification
  const updateCertification = useCallback((id: string, updates: Partial<ProfileState['certifications'][0]>) => {
    setProfileState(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, ...updates } : cert
      )
    }));
  }, []);
  
  // Remove certification
  const removeCertification = useCallback((id: string) => {
    setProfileState(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  }, []);
  
  // Set resume file
  const setResumeFile = useCallback((file: File | null) => {
    setProfileState(prev => ({ ...prev, resumeFile: file }));
  }, []);
  
  // Set profile photo
  const setProfilePhoto = useCallback((file: File | null) => {
    setProfileState(prev => ({ ...prev, profilePhoto: file }));
  }, []);
  
  // Load parsed resume data
  const loadParsedData = useCallback((parsedData: ParsedResumeData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const mappedData = mapParsedDataToProfileState(parsedData);
      
      setProfileState(prev => ({
        ...prev,
        ...mappedData,
        // Preserve files if they exist
        resumeFile: prev.resumeFile,
        profilePhoto: prev.profilePhoto,
      }));
      
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load parsed resume data');
      setIsLoading(false);
      console.error('Error loading parsed data:', err);
    }
  }, []);
  
  // Reset state
  const resetProfile = useCallback(() => {
    setProfileState(getInitialState());
    setError(null);
  }, []);
  
  return {
    profileState,
    isLoading,
    error,
    updatePersonalInfo,
    updateSkills,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    addCertification,
    updateCertification,
    removeCertification,
    setResumeFile,
    setProfilePhoto,
    loadParsedData,
    resetProfile,
  };
};
