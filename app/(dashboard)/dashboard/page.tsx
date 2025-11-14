"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useState, useEffect, useCallback, type FC } from "react";
import {
  ExternalLink,
  Sparkles,
  BookOpen,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Award,
} from "lucide-react";
import type { IJob } from "@/models/Job";
import type { IResource } from "@/models/Resource";
import type { IUser } from "@/models/User";
import { useUserType } from "@/hooks/useUserType";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import { useSession } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const pageFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: index * 0.08 },
  }),
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

interface RecommendedJob extends IJob {
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchReason?: string;
}

interface RecommendedResource extends IResource {
  matchScore?: number;
  matchedSkills?: string[];
  matchReason?: string;
}

interface DashboardData {
  user: IUser;
  stats: {
    skillsCount: number;
    savedCourses: number;
    savedJobs: number;
    missingSkillsCount: number;
  };
  bestJobs: RecommendedJob[];
  roadmapPreview: string;
  recommendedCourses: RecommendedResource[];
}

const DashboardPage: FC = () => {
  const { user: authUser, isLoading, isAuthenticated } = useAuth();
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [typingText, setTypingText] = useState("");
  const [userData, setUserData] = useState<IUser | null>(null);
  const [employerJobs, setEmployerJobs] = useState<IJob[]>([]);
  const [loadingEmployerJobs, setLoadingEmployerJobs] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use authUser for initial userType check to avoid circular dependency
  // Convert authUser to IUser format if userData is not available
  const userType = useUserType(
    userData ||
      (authUser
        ? ({
            _id: authUser.id,
            name: authUser.name || "",
            email: authUser.email || "",
            userType: authUser.userType || "job_seeker",
            image: authUser.image,
          } as IUser)
        : null)
  );

  // Typing effect animation
  useEffect(() => {
    const text = "Building your Nextgen Career";
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTypingText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    const sessionLoading = sessionStatus === "loading";
    if (isLoading || sessionLoading) {
      return;
    }

    if (!isAuthenticated && sessionStatus !== "authenticated") {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, sessionStatus, router]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setError(null);
      const token = getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/dashboard", {
        headers,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDashboardData(data.data);
        setUserData(data.data.user as IUser);
      } else {
        setError(data.error || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setError(null);
      const token = getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/user/profile", {
        headers,
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUserData(data.user);
      } else {
        setError(data.error || "Failed to load user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile. Please try again.");
    }
  }, []);

  const fetchEmployerJobs = useCallback(async () => {
    try {
      setLoadingEmployerJobs(true);
      setError(null);
      const token = getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/jobs/my-jobs", {
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        setEmployerJobs(data.jobs || []);
      } else {
        setError(data.error || "Failed to load jobs");
      }
    } catch (error) {
      console.error("Error fetching employer jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoadingEmployerJobs(false);
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && userType === "job_seeker") {
      fetchDashboardData();
    } else if (isAuthenticated && userType === "employer") {
      fetchUserProfile();
      fetchEmployerJobs();
    }
  }, [
    isAuthenticated,
    userType,
    fetchUserProfile,
    fetchEmployerJobs,
    fetchDashboardData,
  ]);

  const formatRoadmapPreview = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n");
    // Take first 10 lines or until we hit Week 3
    const preview: string[] = [];
    let weekCount = 0;
    for (const line of lines) {
      if (line.match(/^##?\s*Week\s*3/i)) break;
      preview.push(line);
      if (line.match(/^##?\s*Week\s*\d+/i)) weekCount++;
      if (weekCount >= 2 && preview.length > 8) break;
    }
    return preview.join("\n");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Employer Dashboard (keep existing)
  if (userType === "employer") {
    return (
      <motion.div
        variants={pageFade}
        initial="hidden"
        animate="visible"
        className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
      >
        <section className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8 lg:gap-10">
          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-300 hover:text-red-100"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
          {/* Hero */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-blue-400/40 to-purple-500/20 p-[2px]">
                  <Image
                    src={userData?.image || authUser?.image || "/avatar.jpg"}
                    alt={userData?.name || authUser?.name || "User"}
                    fill
                    className="rounded-2xl object-cover"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white sm:text-2xl`}
                  >
                    {userData?.companyName || userData?.name || authUser?.name}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {userData?.email || authUser?.email}
                  </p>
                </div>
              </div>
              <Link href="/jobs/post">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                  + Post New Job
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Employer Jobs */}
          <motion.section
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
          >
            <h3
              className={`${inter.className} mb-6 text-lg font-semibold text-white`}
            >
              Your Posted Jobs
            </h3>
            {loadingEmployerJobs ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : employerJobs.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-8 text-center">
                <p className="text-slate-300">No jobs posted yet</p>
                <Link href="/jobs/post">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                  >
                    Post Your First Job
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {employerJobs.slice(0, 6).map((job, index) => (
                  <Link key={job._id} href={`/jobs/${job._id}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-blue-950/20 transition hover:border-white/20"
                    >
                      <header>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {job.company}
                        </p>
                        <h4
                          className={`${inter.className} mt-2 text-lg font-semibold text-white`}
                        >
                          {job.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.jobType} • {job.location}
                        </p>
                      </header>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                        {job.requiredSkills?.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/10 px-3 py-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        </section>
      </motion.div>
    );
  }

  // Job Seeker Dashboard (Enhanced)
  const stats = dashboardData?.stats || {
    skillsCount: 0,
    savedCourses: 0,
    savedJobs: 0,
    missingSkillsCount: 0,
  };

  // Show loading state for job seeker dashboard
  if (loadingDashboard && !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold">
            Error Loading Dashboard
          </h2>
          <p className="mb-4 text-slate-300">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (userType === "job_seeker") {
                fetchDashboardData();
              } else {
                fetchUserProfile();
                fetchEmployerJobs();
              }
            }}
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <section className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8 lg:gap-10">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-red-100"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
        {/* Hero Section */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 backdrop-blur-xl shadow-xl"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1
                className={`${inter.className} mb-2 text-3xl font-bold sm:text-4xl md:text-5xl`}
              >
                Welcome back,{" "}
                {dashboardData?.user?.name || authUser?.name || "User"}! 👋
              </h1>
              <div className="flex items-center gap-2 text-lg text-slate-300">
                <span className="inline-block min-w-[280px]">
                  {typingText}
                  <span className="cursor-blink">|</span>
                </span>
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-blue-400/40 to-purple-500/20 p-[2px]">
              <Image
                src={
                  dashboardData?.user?.image || authUser?.image || "/avatar.jpg"
                }
                alt={dashboardData?.user?.name || authUser?.name || "User"}
                fill
                className="rounded-2xl object-cover"
                sizes="96px"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Skills",
              value: stats.skillsCount,
              icon: Award,
              color: "from-blue-500 to-cyan-500",
            },
            {
              label: "Saved Courses",
              value: stats.savedCourses,
              icon: BookOpen,
              color: "from-purple-500 to-pink-500",
            },
            {
              label: "Saved Jobs",
              value: stats.savedJobs,
              icon: Briefcase,
              color: "from-emerald-500 to-teal-500",
            },
            {
              label: "Missing Skills",
              value: stats.missingSkillsCount,
              icon: AlertCircle,
              color: "from-amber-500 to-orange-500",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ scale: 1.05, y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Icon className={`h-6 w-6 text-white`} />
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-r ${stat.color} opacity-20`}
                  />
                </div>
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          {/* Left Column: Roadmap Preview */}
          {dashboardData?.roadmapPreview && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={5}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl lg:p-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className={`${inter.className} text-xl font-semibold text-white`}
                >
                  Roadmap Preview
                </h2>
                <Link href="/roadmap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Continue Roadmap
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line line-clamp-8">
                  {formatRoadmapPreview(dashboardData.roadmapPreview)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Right Column: Top Job Matches */}
          {dashboardData?.bestJobs && dashboardData.bestJobs.length > 0 && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={6}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl lg:p-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className={`${inter.className} text-xl font-semibold text-white`}
                >
                  Top Job Matches
                </h2>
                <Link href="/jobs">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.bestJobs.slice(0, 3).map((job, index) => (
                  <Link key={job._id} href={`/jobs/${job._id}`}>
                    <motion.article
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4 }}
                      className="rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-white/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`${inter.className} text-lg font-semibold text-white`}
                          >
                            {job.title}
                          </h3>
                          <p className="text-sm text-slate-300">
                            {job.company}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                            <span>{job.location}</span>
                            <span>•</span>
                            <span>{job.jobType}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-1 text-lg font-bold text-emerald-400">
                            {job.matchScore}%
                          </div>
                          <div className="text-xs text-slate-400">Match</div>
                        </div>
                      </div>
                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            {job.missingSkills.length} skills to learn
                          </span>
                        </div>
                      )}
                    </motion.article>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Recommended Courses */}
        {dashboardData?.recommendedCourses &&
          dashboardData.recommendedCourses.length > 0 && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={7}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl lg:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className={`${inter.className} text-xl font-semibold text-white`}
                >
                  Recommended Courses
                </h2>
                <Link href="/resources">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboardData.recommendedCourses
                  .slice(0, 3)
                  .map((course, index) => (
                    <motion.article
                      key={course._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-white/20"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-slate-400">
                          {course.platform}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${
                            course.cost === "Free"
                              ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                              : "border-amber-400/40 text-amber-200 bg-amber-500/10"
                          }`}
                        >
                          {course.cost}
                        </span>
                      </div>
                      <h3
                        className={`${inter.className} mb-2 text-lg font-semibold text-white`}
                      >
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="mb-4 line-clamp-2 text-sm text-slate-300">
                          {course.description}
                        </p>
                      )}
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-2 text-sm text-blue-300 transition hover:text-blue-200"
                      >
                        Go to Course
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </motion.article>
                  ))}
              </div>
            </motion.div>
          )}
      </section>
    </motion.div>
  );
};

export default DashboardPage;
