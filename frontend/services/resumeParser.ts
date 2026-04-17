const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface ResumeParserResponse {
  success: boolean;
  data?: {
    id?: number;
    user_id?: number;
    phone?: string;
    linkedin_url?: string;
    resume_url?: string;
    profile_photo_url?: string;
    bio?: string;
    profile_completed?: boolean;
    parsed_data?: any;
    experiences?: any[];
    education?: any[];
    skills?: any[];
    projects?: any[];
    certifications?: any[];
  };
  error?: string;
}

/**
 * Upload resume file to backend parser API
 * @param resumeFile - The resume file (PDF, DOC, DOCX)
 * @param profilePhoto - Optional profile photo file
 * @param phone - Phone number
 * @param linkedinUrl - LinkedIn profile URL
 * @param bio - Short bio
 * @param token - Authentication token
 * @returns Parsed resume data
 */
export async function uploadAndParseResume(
  resumeFile: File,
  profilePhoto: File,
  phone: string,
  linkedinUrl: string,
  bio: string | null,
  token: string
): Promise<ResumeParserResponse> {
  try {
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('profile_photo', profilePhoto);
    formData.append('phone', phone);
    formData.append('linkedin_url', linkedinUrl);
    if (bio) {
      formData.append('bio', bio);
    }
    
    const response = await fetch(`${API_BASE_URL}/resume/upload-resume/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform backend response to include parsed_data
    // The backend returns experiences, education, skills, etc. as separate arrays
    const transformedData = {
      ...data,
      parsed_data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        linkedin_url: data.linkedin_url,
        experiences: data.experiences || [],
        education: data.education || [],
        skills: data.skills,
        projects: data.projects || [],
        certifications: data.certifications || [],
      },
    };
    
    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    console.error('Resume upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload and parse resume',
    };
  }
}

/**
 * Validate resume file before upload
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB',
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be PDF, DOC, or DOCX format',
    };
  }
  
  return { valid: true };
}

/**
 * Validate profile photo file
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateProfilePhoto(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 2MB',
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Image must be JPEG, PNG, JPG, or WEBP format',
    };
  }
  
  return { valid: true };
}
