const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function checkProfileCompletion(): Promise<boolean> {
  try {
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/profile/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.profile_completed;
  } catch (error) {
    console.error('Profile status check failed:', error);
    return false;
  }
}

export function redirectToCompleteProfile() {
  window.location.href = '/complete-profile';
}

export async function enforceProfileCompletion(): Promise<boolean> {
  const isComplete = await checkProfileCompletion();
  
  if (!isComplete) {
    redirectToCompleteProfile();
    return false;
  }
  
  return true;
}