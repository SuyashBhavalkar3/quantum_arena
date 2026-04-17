// Profile completion utility functions

export interface UserProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  resume?: string;
  experiences?: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
  }>;
}

export interface ProfileCompletionStatus {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
  completedFields: string[];
}

export function calculateProfileCompletion(profile: UserProfile): ProfileCompletionStatus {
  const requiredFields = [
    { key: 'fullName', label: 'Full Name', check: () => !!profile.fullName },
    { key: 'email', label: 'Email', check: () => !!profile.email },
    { key: 'phone', label: 'Phone Number', check: () => !!profile.phone },
    { key: 'location', label: 'Location', check: () => !!profile.location },
    { key: 'bio', label: 'Bio/Summary', check: () => !!profile.bio && profile.bio.length > 20 },
    { key: 'skills', label: 'Skills', check: () => !!profile.skills && profile.skills.length >= 3 },
    { key: 'resume', label: 'Resume', check: () => !!profile.resume },
  ];

  const completedFields: string[] = [];
  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    if (field.check()) {
      completedFields.push(field.label);
    } else {
      missingFields.push(field.label);
    }
  });

  const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
  const isComplete = percentage === 100;

  return {
    percentage,
    isComplete,
    missingFields,
    completedFields,
  };
}
