"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getToken, clearTokens, setTokens } from "@/lib/api-client";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  userType?: "job_seeker" | "employer" | null;
  image?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    setTokens(accessToken, refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    // Clear JWT tokens (for email/password users)
    clearTokens();
    setUser(null);
    
    // Sign out from NextAuth session (for Google OAuth users)
    if (session) {
      await signOut({ 
        redirect: false,
        callbackUrl: "/signin"
      });
    }
    
    // Redirect to sign-in page with full page reload to ensure all state is cleared
    window.location.href = "/signin";
  };

  const checkAuth = async () => {
    // Wait for session to finish loading before checking
    if (sessionStatus === "loading") {
      setIsLoading(true); // Keep loading state while session is loading
      return; // Still loading, don't update yet
    }

    // First check for NextAuth session (for Google OAuth users)
    if (session?.user) {
      const sessionUser: User = {
        id: session.user.id || "",
        name: session.user.name || null,
        email: session.user.email || null,
        userType: session.user.userType || null,
        image: session.user.image || null,
      };
      setUser(sessionUser);
      setIsLoading(false);
      return;
    }

    // Fallback to JWT token check (for email/password users)
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Verify token by fetching user profile
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          clearTokens();
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth when component mounts and when session status changes
  useEffect(() => {
    checkAuth();
  }, [session, sessionStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

