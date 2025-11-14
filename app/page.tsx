"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "../ui/landingpage";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session, status: sessionStatus } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    // Wait for both auth and session to finish loading
    if (authLoading || sessionStatus === "loading") {
      return;
    }
    
    if (sessionStatus === "authenticated" || isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, authLoading, session, sessionStatus, router]);

  // Show loading state while checking authentication
  if (authLoading || sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  // Only show landing page if not authenticated
  if (!isAuthenticated && sessionStatus !== "authenticated") {
    return <LandingPage />;
  }

  // Return null while redirecting
  return null;
}
