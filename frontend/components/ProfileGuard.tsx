"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { Loader2 } from "lucide-react";

interface ProfileGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProfileGuard({ children, redirectTo = "/complete-profile" }: ProfileGuardProps) {
  const { profileStatus, loading } = useProfileStatus();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!profileStatus || !profileStatus.profile_completed) {
        setRedirecting(true);
        router.push(redirectTo);
      }
    }
  }, [loading, profileStatus, router, redirectTo]);

  // Show spinner while: (a) still loading status, or (b) about to redirect,
  // or (c) profile is not complete (avoids the null flash between states).
  if (loading || redirecting || !profileStatus?.profile_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  return <>{children}</>;
}