"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  XCircle,
  BookOpen,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: index * 0.1 },
  }),
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

interface SkillGap {
  skill: string;
  frequency: number;
  priority: "high" | "medium" | "low";
  relatedJobs: number;
}

interface RecommendedResource {
  _id?: string;
  title: string;
  platform: string;
  url: string;
  relatedSkills: string[];
  cost: "Free" | "Paid";
  description?: string;
  duration?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  rating?: number;
}

interface SkillGapAnalysis {
  userSkills: string[];
  preferredTrack?: string;
  experienceLevel?: string;
  overallSkillGaps: SkillGap[];
  trackSpecificGaps: SkillGap[];
  recommendedResources: RecommendedResource[];
  summary: {
    totalJobsAnalyzed: number;
    totalSkillsRequired: number;
    skillsYouHave: number;
    skillsToLearn: number;
    averageMatchScore: number;
  };
}

export default function SkillGapsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [skillGapData, setSkillGapData] = useState<SkillGapAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchSkillGapAnalysis();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchSkillGapAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const response = await fetch("/api/skill-gap/analyze", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSkillGapData(data.data);
      } else {
        setError(data.error || "Failed to fetch skill gap analysis");
      }
    } catch (error) {
      console.error("Error fetching skill gap analysis:", error);
      setError("Failed to load skill gap analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-white/10 text-white/80";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading skill gap analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-screen p-4 sm:p-6 md:p-8`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </motion.button>
          </Link>
        </div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl"
        >
          <h1
            className={`${inter.className} mb-2 text-3xl font-bold text-white sm:text-4xl`}
          >
            Skill Gap Analysis
          </h1>
          <p className="text-slate-300">
            Discover which skills you need to learn to improve your job match rate
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {skillGapData && (
          <>
            {/* Summary Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={1}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-2 text-sm text-slate-400">Jobs Analyzed</div>
                <div className="text-3xl font-bold text-white">
                  {skillGapData.summary.totalJobsAnalyzed}
                </div>
              </motion.div>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={2}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-2 text-sm text-slate-400">Skills You Have</div>
                <div className="text-3xl font-bold text-green-300">
                  {skillGapData.summary.skillsYouHave}
                </div>
              </motion.div>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={3}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-2 text-sm text-slate-400">Skills to Learn</div>
                <div className="text-3xl font-bold text-amber-300">
                  {skillGapData.summary.skillsToLearn}
                </div>
              </motion.div>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={4}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-2 text-sm text-slate-400">Avg Match Score</div>
                <div className="text-3xl font-bold text-blue-300">
                  {skillGapData.summary.averageMatchScore}%
                </div>
              </motion.div>
            </div>

            {/* Your Current Skills */}
            {skillGapData.userSkills.length > 0 && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={5}
                className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 backdrop-blur-xl"
              >
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white`}
                  >
                    Your Current Skills ({skillGapData.userSkills.length})
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGapData.userSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-green-400/50 bg-green-500/20 px-4 py-2 text-sm font-medium text-green-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Missing Skills */}
            {skillGapData.overallSkillGaps.length > 0 ? (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={6}
                className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-amber-400" />
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white`}
                  >
                    Skills to Learn ({skillGapData.overallSkillGaps.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {skillGapData.overallSkillGaps.map((gap, index) => (
                    <div
                      key={gap.skill}
                      className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-amber-200">
                            {gap.skill}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getPriorityColor(
                              gap.priority
                            )}`}
                          >
                            {gap.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-amber-300">
                            Required in {gap.frequency} job{gap.frequency > 1 ? "s" : ""}
                          </div>
                          <div className="text-xs text-amber-300/70">
                            {gap.relatedJobs} job{gap.relatedJobs > 1 ? "s" : ""} total
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={6}
                className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="h-6 w-6" />
                  <p className="text-lg font-medium">
                    Great! You have all the required skills. No gaps found.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Recommended Resources */}
            {skillGapData.recommendedResources.length > 0 && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={7}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white`}
                  >
                    Recommended Learning Resources
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {skillGapData.recommendedResources.map((resource, index) => (
                    <motion.div
                      key={resource._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-white/20 hover:shadow-lg"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-slate-400">
                          {resource.platform}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${
                            resource.cost === "Free"
                              ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                              : "border-amber-400/40 text-amber-200 bg-amber-500/10"
                          }`}
                        >
                          {resource.cost}
                        </span>
                      </div>
                      <h3
                        className={`${inter.className} mb-2 text-lg font-semibold text-white`}
                      >
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-slate-300">
                          {resource.description}
                        </p>
                      )}
                      {resource.level && (
                        <div className="mb-3">
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
                            {resource.level}
                          </span>
                        </div>
                      )}
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {resource.relatedSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <motion.a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                      >
                        Go to Resource
                        <ExternalLink className="h-4 w-4" />
                      </motion.a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.main>
  );
}

