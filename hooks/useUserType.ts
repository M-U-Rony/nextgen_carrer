import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { IUser } from "@/models/User";

/**
 * Custom hook to reliably get the user type (job_seeker or employer)
 * 
 * This hook:
 * 1. First tries to get userType from the session
 * 2. Falls back to userData if provided
 * 3. Defaults to "job_seeker" if neither is available
 * 
 * @param userData - Optional user data from API (more reliable source)
 * @returns The user type: "job_seeker" | "employer"
 */
export function useUserType(userData?: IUser | null): "job_seeker" | "employer" {
  const { data: session } = useSession();

  return useMemo(() => {
    // Priority 1: userData from API (most reliable)
    if (userData?.userType) {
      return userData.userType;
    }
    
    // Priority 2: session userType (should always be available after auth.config.ts fix)
    if (session?.user?.userType) {
      return session.user.userType;
    }
    
    // Default fallback
    return "job_seeker";
  }, [userData, session]);
}

