import { useMemo } from "react";
import type { IUser } from "@/models/User";
import { useAuth } from "./useAuth";

/**
 * Custom hook to reliably get the user type (job_seeker or employer)
 * 
 * This hook:
 * 1. First tries to get userType from userData (from API)
 * 2. Falls back to auth context user
 * 3. Defaults to "job_seeker" if neither is available
 * 
 * @param userData - Optional user data from API (more reliable source)
 * @returns The user type: "job_seeker" | "employer"
 */
export function useUserType(userData?: IUser | null): "job_seeker" | "employer" {
  const { user } = useAuth();

  return useMemo(() => {
    // Priority 1: userData from API (most reliable)
    if (userData?.userType) {
      return userData.userType;
    }
    
    // Priority 2: auth context user
    if (user?.userType) {
      return user.userType;
    }
    
    // Default fallback
    return "job_seeker";
  }, [userData, user]);
}

