"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  ExternalLink,
  CheckCircle,
  XCircle,
  BookOpen,
  Save,
  Sparkles,
  FileText,
  Download,
  Copy,
  X,
  Globe,
  Lightbulb,
  Search,
} from "lucide-react";
import type { IJob } from "@/models/Job";
import type { IResource } from "@/models/Resource";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import toast from "react-hot-toast";

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

interface SkillGapData {
  job: IJob;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedResources: IResource[];
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [job, setJob] = useState<IJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillGapData, setSkillGapData] = useState<SkillGapData | null>(null);
  const [loadingSkillGap, setLoadingSkillGap] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [generatingCV, setGeneratingCV] = useState(false);
  const [customizedCV, setCustomizedCV] = useState<string | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (params.id && isAuthenticated) {
      fetchJob(params.id as string);
    }
  }, [params.id, isAuthenticated, authLoading, router]);

  const fetchJob = async (id: string) => {
    try {
      setLoading(true);
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/jobs/${id}`, {
        headers,
      });
      const data = await response.json();

      if (response.ok) {
        setJob(data.job);
        // Fetch skill gap analysis if user is a job seeker
        if (user?.userType !== "employer") {
          await fetchSkillGap(id);
        }
      } else {
        console.error("Error fetching job:", data.error);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillGap = async (jobId: string) => {
    try {
      setLoadingSkillGap(true);
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/skill-gap", {
        method: "POST",
        headers,
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setSkillGapData(data.data);
      } else {
        console.error("Error fetching skill gap:", data.error);
        // Continue to show job even if skill gap analysis fails
      }
    } catch (error) {
      console.error("Error fetching skill gap:", error);
      // Continue to show job even if skill gap analysis fails
    } finally {
      setLoadingSkillGap(false);
    }
  };

  const handleSaveJob = async () => {
    // Optional: Implement save job functionality
    setSavingJob(true);
    toast.success("Job saved! (Feature coming soon)");
    setTimeout(() => {
      setSavingJob(false);
    }, 1000);
  };

  const handleGenerateCustomizedCV = async () => {
    if (!job?._id) {
      toast.error("Job not found");
      return;
    }

    try {
      setGeneratingCV(true);
      const token = getToken();
      const response = await fetch("/api/generate-customized-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job._id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomizedCV(data.cv);
        setShowCVModal(true);
        toast.success("Customized CV generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate customized CV");
      }
    } catch (error) {
      console.error("Error generating customized CV:", error);
      toast.error("Failed to generate customized CV");
    } finally {
      setGeneratingCV(false);
    }
  };

  const handleCopyCV = async () => {
    if (!customizedCV) return;

    try {
      await navigator.clipboard.writeText(customizedCV);
      toast.success("CV copied to clipboard!");
    } catch (error) {
      console.error("Error copying CV:", error);
      toast.error("Failed to copy CV");
    }
  };

  const handleDownloadCV = () => {
    if (!customizedCV || !job) return;

    const blob = new Blob([customizedCV], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CV_${job.title.replace(/\s+/g, "_")}_${job.company.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CV downloaded successfully!");
  };

  if (loading || authLoading) {
    return (
      <div
        className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div
        className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="mb-4 text-lg text-slate-300">Job not found</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-blue-300 transition hover:text-blue-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayJob = skillGapData?.job || job;

  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <motion.button
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </motion.button>

          {/* Build Customized CV Button - Only for job seekers */}
          {user?.userType !== "employer" && job && (
            <motion.button
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              onClick={handleGenerateCustomizedCV}
              disabled={generatingCV}
              className="flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingCV ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Generating CV...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Build Customized CV
                </>
              )}
            </motion.button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Match Score Card - Only for job seekers */}
            {user?.userType !== "employer" && (job as any).matchPercentage && (
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className={`${inter.className} mb-2 text-xl font-semibold text-white`}>
                      Your Match Score
                    </h2>
                    <p className="text-sm text-slate-300">
                      Based on your profile and skills
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-4xl font-bold ${
                        (job as any).matchScore >= 70
                          ? "text-green-400"
                          : (job as any).matchScore >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {(job as any).matchPercentage}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Match</p>
                  </div>
                </div>

                {/* Match Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">Skills Match</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(job as any).skillMatchScore || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {Math.round((job as any).skillMatchScore || 0)}%
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">Experience</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-purple-500"
                          style={{ width: `${(job as any).experienceMatchScore || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {Math.round((job as any).experienceMatchScore || 0)}%
                      </span>
                    </div>
                    {(job as any).experienceMatch ? (
                      <p className="text-xs text-green-400 mt-1">✓ Aligned</p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1">✗ Mismatch</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">Track Match</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-pink-500"
                          style={{ width: `${(job as any).trackMatchScore || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {Math.round((job as any).trackMatchScore || 0)}%
                      </span>
                    </div>
                    {(job as any).trackMatch ? (
                      <p className="text-xs text-green-400 mt-1">✓ Matches</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Not aligned</p>
                    )}
                  </div>
                </div>

                {/* Match Reasons */}
                {(job as any).matchReasons && (job as any).matchReasons.length > 0 && (
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-xs font-medium text-slate-300 mb-2">Match Details:</p>
                    <ul className="space-y-1.5">
                      {(job as any).matchReasons.map((reason: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* Job Info Card */}
            <motion.article
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h1
                      className={`${inter.className} mb-2 text-2xl font-bold sm:text-3xl md:text-4xl`}
                    >
                      {displayJob.title}
                    </h1>
                    <p className="text-xl text-slate-300">
                      {displayJob.company}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                    {displayJob.jobType}
                  </span>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {displayJob.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {displayJob.experienceLevel}
                  </div>
                  {displayJob.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {displayJob.salary}
                    </div>
                  )}
                </div>
              </div>

              {/* Track Badge */}
              <div className="mb-6">
                <span className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300">
                  {displayJob.track}
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2
                  className={`${inter.className} mb-4 text-xl font-semibold`}
                >
                  Job Description
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-line text-slate-300 leading-relaxed">
                    {displayJob.description}
                  </p>
                </div>
              </div>
            </motion.article>

            {/* Skill Gap Analysis - Only for job seekers */}
            {user?.userType !== "employer" && (
              <>
                {loadingSkillGap ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
                  >
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 animate-pulse text-blue-400 mx-auto mb-2" />
                        <p className="text-slate-300">
                          Analyzing skill gap...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : skillGapData ? (
                  <>
                    {/* Matched Skills */}
                    {skillGapData.matchedSkills.length > 0 && (
                      <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                          <h2
                            className={`${inter.className} text-xl font-semibold text-white`}
                          >
                            Matched Skills ({skillGapData.matchedSkills.length})
                          </h2>
                        </div>
                        <p className="mb-4 text-sm text-slate-300">
                          Great! You already have these skills.
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {skillGapData.matchedSkills.map((skill) => (
                            <motion.span
                              key={skill}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 shadow-lg"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Skill Gap Analysis - Format: "Missing: X, Y → Recommended: Resource1, Resource2" */}
                    {skillGapData.missingSkills.length > 0 && (
                      <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-amber-500/10"
                      >
                        <div className="mb-6 flex items-center gap-2">
                          <XCircle className="h-6 w-6 text-amber-400" />
                          <h2
                            className={`${inter.className} text-xl font-semibold text-white`}
                          >
                            Skill Gap Analysis
                          </h2>
                        </div>
                        
                        {/* Format: "Missing: X, Y → Recommended: Resource1, Resource2" */}
                        <div className="rounded-lg border-2 border-amber-400/40 bg-amber-500/10 p-5 mb-6">
                          <p className="text-base leading-relaxed text-amber-100 mb-2">
                            <span className="font-bold text-amber-300">Missing:</span>{" "}
                            <span className="text-amber-200">
                              {skillGapData.missingSkills.join(", ")}
                            </span>
                          </p>
                          
                          {skillGapData.recommendedResources.length > 0 ? (
                            <p className="text-base leading-relaxed text-amber-100">
                              <span className="font-bold text-amber-300">→ Recommended:</span>{" "}
                              <span className="text-amber-200">
                                {skillGapData.recommendedResources.slice(0, 4).map((resource: any, idx: number) => {
                                  // Format resource name based on platform
                                  const resourceLabel = resource.platform === "YouTube" 
                                    ? `${resource.title} (YouTube Playlist)`
                                    : resource.platform === "Coursera" || resource.platform === "Udemy" || resource.platform === "edX"
                                    ? `${resource.title} (Course)`
                                    : `${resource.title} (${resource.platform})`;
                                  
                                  return (
                                    <span key={resource._id || idx}>
                                      {idx > 0 && ", "}
                                      <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-amber-50 hover:text-white underline font-medium"
                                      >
                                        {resourceLabel}
                                      </a>
                                    </span>
                                  );
                                })}
                                {skillGapData.recommendedResources.length > 4 && (
                                  <span className="text-amber-200/70">
                                    {", "}+{skillGapData.recommendedResources.length - 4} more
                                  </span>
                                )}
                              </span>
                            </p>
                          ) : (
                            <p className="text-base text-amber-200/70">
                              <span className="font-bold text-amber-300">→ Recommended:</span>{" "}
                              No resources found. Check back later or add skills to your profile.
                            </p>
                          )}
                        </div>
                        
                        {/* Missing Skills Badges */}
                        <div className="mb-6">
                          <p className="mb-3 text-sm font-medium text-amber-300">
                            Missing Skills Details:
                          </p>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {skillGapData.missingSkills.map((skill) => (
                              <motion.span
                                key={skill}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg"
                              >
                                <XCircle className="h-4 w-4" />
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Recommended Courses - Full List */}
                    {skillGapData.recommendedResources.length > 0 && (
                      <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
                      >
                        <div className="mb-6 flex items-center gap-2">
                          <BookOpen className="h-6 w-6 text-purple-400" />
                          <h2
                            className={`${inter.className} text-xl font-semibold text-white`}
                          >
                            All Recommended Learning Resources
                          </h2>
                        </div>
                        <p className="mb-6 text-sm text-slate-300">
                          Explore these curated resources to learn the missing skills.
                        </p>
                        <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2">
                          {skillGapData.recommendedResources.map(
                            (resource, index) => (
                              <motion.div
                                key={resource._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.4,
                                  delay: index * 0.1,
                                }}
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
                                  {resource.relatedSkills
                                    .filter((skill) =>
                                      skillGapData.missingSkills.some(
                                        (missingSkill) =>
                                          skill
                                            .toLowerCase()
                                            .includes(
                                              missingSkill.toLowerCase()
                                            ) ||
                                          missingSkill
                                            .toLowerCase()
                                            .includes(skill.toLowerCase())
                                      )
                                    )
                                    .slice(0, 3)
                                    .map((skill) => (
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
                                  Go to Course
                                  <ExternalLink className="h-4 w-4" />
                                </motion.a>
                              </motion.div>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : null}
              </>
            )}

            {/* Application Section - Only show for job seekers */}
            {user?.userType !== "employer" && displayJob.applicationLink && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={3}
                className="rounded-xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl"
              >
                <h3
                  className={`${inter.className} mb-4 text-lg font-semibold`}
                >
                  Ready to Apply?
                </h3>
                <motion.a
                  href={displayJob.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 font-semibold text-white shadow-lg transition"
                >
                  Apply Now
                  <ExternalLink className="h-4 w-4" />
                </motion.a>
              </motion.div>
            )}

            {/* Where to Apply Section - Only show for job seekers */}
            {user?.userType !== "employer" && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={4}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Search className="h-6 w-6 text-blue-400" />
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white`}
                  >
                    Where to Apply
                  </h2>
                </div>
                <p className="mb-6 text-sm text-slate-300">
                  Find similar positions on these popular job platforms. Use the search tips below to optimize your job search.
                </p>

                {/* Platform Links */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  {/* LinkedIn */}
                  <motion.a
                    href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(displayJob.title)}&location=${encodeURIComponent(displayJob.location || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-blue-400/50 hover:bg-slate-800/70"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-blue-300">LinkedIn Jobs</h3>
                      <p className="text-xs text-slate-400">Professional network</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                  </motion.a>

                  {/* BDjobs */}
                  <motion.a
                    href={`https://www.bdjobs.com/jobsearch.asp?fcatId=8&txtKeyword=${encodeURIComponent(displayJob.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-emerald-400/50 hover:bg-slate-800/70"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-emerald-300">BDjobs</h3>
                      <p className="text-xs text-slate-400">Bangladesh job portal</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-400" />
                  </motion.a>

                  {/* Glassdoor */}
                  <motion.a
                    href={`https://www.glassdoor.com/Job/jobs.htm?suggestCount=0&suggestChosen=false&clickSource=searchBtn&typedKeyword=${encodeURIComponent(displayJob.title)}&sc.keyword=${encodeURIComponent(displayJob.title)}&locT=C&locId=1147401`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-green-400/50 hover:bg-slate-800/70"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20 text-green-400">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-green-300">Glassdoor</h3>
                      <p className="text-xs text-slate-400">Company reviews & jobs</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-green-400" />
                  </motion.a>

                  {/* Indeed */}
                  <motion.a
                    href={`https://www.indeed.com/jobs?q=${encodeURIComponent(displayJob.title)}&l=${encodeURIComponent(displayJob.location || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-purple-400/50 hover:bg-slate-800/70"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
                      <Search className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-purple-300">Indeed</h3>
                      <p className="text-xs text-slate-400">Global job search</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-purple-400" />
                  </motion.a>
                </div>

                {/* Company Website (if available) */}
                {displayJob.applicationLink && (
                  <motion.a
                    href={displayJob.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-amber-400/50 hover:bg-slate-800/70"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/20 text-amber-400">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Company Website</h3>
                      <p className="text-xs text-slate-400">Apply directly at {displayJob.company}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </motion.a>
                )}

                {/* Search Tips */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    <h3 className={`${inter.className} text-sm font-semibold text-white`}>
                      Job Search Tips
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>Use specific keywords from the job description when searching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>Set up job alerts on these platforms to get notified of new opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>Customize your resume and cover letter for each application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>Research the company before applying to show genuine interest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>Network with professionals in your field on LinkedIn</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl"
            >
              <h3
                className={`${inter.className} mb-4 text-lg font-semibold text-white`}
              >
                Job Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                    Company
                  </p>
                  <p className="text-sm font-medium text-white">
                    {displayJob.company}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                    Location
                  </p>
                  <p className="text-sm font-medium text-white">
                    {displayJob.location}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                    Experience Level
                  </p>
                  <p className="text-sm font-medium text-white">
                    {displayJob.experienceLevel}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                    Job Type
                  </p>
                  <p className="text-sm font-medium text-white">
                    {displayJob.jobType}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                    Track
                  </p>
                  <p className="text-sm font-medium text-white">
                    {displayJob.track}
                  </p>
                </div>
                {displayJob.salary && (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                      Salary
                    </p>
                    <p className="text-sm font-medium text-emerald-300">
                      {displayJob.salary}
                    </p>
                  </div>
                )}
                {/* Match Score in Sidebar */}
                {(job as any).matchPercentage && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Overall Match
                      </p>
                      <span
                        className={`text-lg font-bold ${
                          (job as any).matchScore >= 70
                            ? "text-green-400"
                            : (job as any).matchScore >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {(job as any).matchPercentage}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (job as any).matchScore >= 70
                            ? "bg-gradient-to-r from-emerald-500 to-green-500"
                            : (job as any).matchScore >= 50
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-red-500 to-orange-500"
                        }`}
                        style={{
                          width: `${(job as any).matchScore || 0}%`,
                        }}
                      />
                    </div>
                    {(job as any).matchReasons && (job as any).matchReasons.length > 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        {(job as any).matchReasons[0]}
                      </p>
                    )}
                  </div>
                )}
                {skillGapData && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Skills Match
                      </p>
                      <span className="text-sm font-semibold text-white">
                        {skillGapData.matchedSkills.length}/
                        {skillGapData.matchedSkills.length +
                          skillGapData.missingSkills.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                        style={{
                          width: `${
                            skillGapData.matchedSkills.length +
                              skillGapData.missingSkills.length >
                            0
                              ? (skillGapData.matchedSkills.length /
                                  (skillGapData.matchedSkills.length +
                                    skillGapData.missingSkills.length)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {user?.userType !== "employer" && (
                  <motion.button
                    onClick={handleSaveJob}
                    disabled={savingJob}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingJob ? "Saving..." : "Save Job"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CV Modal */}
      {showCVModal && customizedCV && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowCVModal(false);
            setCustomizedCV(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl"
          >
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2
                className={`${inter.className} text-2xl font-bold text-white`}
              >
                Customized CV for {job?.title}
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleCopyCV}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  title="Copy CV"
                >
                  <Copy className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={handleDownloadCV}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  title="Download CV"
                >
                  <Download className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowCVModal(false);
                    setCustomizedCV(null);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* CV Content */}
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-white/10 bg-slate-950 p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                {customizedCV}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <motion.button
                onClick={handleCopyCV}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
                Copy CV
              </motion.button>
              <motion.button
                onClick={handleDownloadCV}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition"
              >
                <Download className="h-4 w-4" />
                Download CV
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.main>
  );
}
