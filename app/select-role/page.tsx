"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Briefcase, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_20%_20%,#1e40af55,transparent_60%),radial-gradient(circle_at_80%_30%,#a855f755,transparent_55%),linear-gradient(135deg,#020617,#0f172a)]";

export default function SelectRolePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<"job_seeker" | "employer" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirected = useRef(false);

  const handleRoleSelect = async (role: "job_seeker" | "employer") => {
    if (isSubmitting || hasRedirected.current) return;

    setSelectedRole(role);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userType: role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      // Update the session to reflect the new role
      // This will trigger a new JWT callback which will clear needsRoleSelection flag
      await update();

      // Wait a bit for the session to fully update
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(
        role === "employer"
          ? "Welcome! Your employer account is ready."
          : "Welcome! Your job seeker account is ready."
      );

      // Set redirect flag to prevent multiple redirects
      hasRedirected.current = true;

      // Redirect to dashboard after a short delay
      // Use window.location for a full page reload to ensure session is properly loaded
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error updating role:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update your role. Please try again.";
      toast.error(errorMessage);
      setSelectedRole(null);
      setIsSubmitting(false);
    }
  };

  // Redirect checks using useEffect to prevent render loop
  useEffect(() => {
    if (hasRedirected.current) return; // Don't redirect if we're already redirecting

    // If not authenticated, redirect to sign in
    if (!session) {
      router.push("/signin");
      return;
    }

    // If user doesn't need role selection, redirect to dashboard
    if (session?.user) {
      const needsSelection = (session.user as any).needsRoleSelection;
      // If user has selected employer role or doesn't need role selection, redirect to dashboard
      if (session.user.userType === "employer" || !needsSelection) {
        router.push("/dashboard");
        hasRedirected.current = true;
      }
    }
  }, [session, router]);

  return (
    <main
      className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />
        <motion.div
          className="absolute right-0 top-8 h-72 w-72 rounded-full bg-purple-600/25 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />
      </div>

      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl sm:p-8 md:p-10"
      >
        <div className="mb-8 text-center">
          <h1
            className={`${inter.className} mt-4 text-2xl font-semibold sm:text-3xl md:text-4xl`}
          >
            Choose Your Role
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Select how you&rsquo;d like to use NextGen Career
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {/* Job Seeker Card */}
          <motion.button
            onClick={() => handleRoleSelect("job_seeker")}
            disabled={isSubmitting}
            whileHover={selectedRole !== "job_seeker" && !isSubmitting ? { scale: 1.02 } : {}}
            whileTap={selectedRole !== "job_seeker" && !isSubmitting ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all ${
              selectedRole === "job_seeker"
                ? "border-blue-500 bg-blue-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {selectedRole === "job_seeker" && isSubmitting && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-blue-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </motion.div>
            )}
            <div className="flex flex-col items-start gap-4">
              <div className="rounded-lg bg-blue-500/20 p-3">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h3 className={`${inter.className} text-xl font-semibold text-white`}>
                  Job Seeker
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Find opportunities, explore career paths, and access learning resources
                </p>
              </div>
            </div>
          </motion.button>

          {/* Employer Card */}
          <motion.button
            onClick={() => handleRoleSelect("employer")}
            disabled={isSubmitting}
            whileHover={selectedRole !== "employer" && !isSubmitting ? { scale: 1.02 } : {}}
            whileTap={selectedRole !== "employer" && !isSubmitting ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all ${
              selectedRole === "employer"
                ? "border-purple-500 bg-purple-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {selectedRole === "employer" && isSubmitting && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-purple-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </motion.div>
            )}
            <div className="flex flex-col items-start gap-4">
              <div className="rounded-lg bg-purple-500/20 p-3">
                <Briefcase className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className={`${inter.className} text-xl font-semibold text-white`}>
                  Employer
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Post jobs, find talent, and manage your hiring process
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          You can update this later in your profile settings
        </p>
      </motion.section>
    </main>
  );
}

