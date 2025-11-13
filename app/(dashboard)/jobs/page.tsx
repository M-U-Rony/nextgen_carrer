"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  X,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import type { IJob } from "@/models/Job";
import type { IUser } from "@/models/User";
import { useUserType } from "@/hooks/useUserType";
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

export default function JobsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    track: "all",
    jobType: "all",
    experienceLevel: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const userType = useUserType(userData);

  // Get unique values for filter options
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(jobs.map((job) => job.track));
    return Array.from(tracks).sort();
  }, [jobs]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, userType]);

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const token = getToken();
      // If employer, fetch their own jobs
      if (userType === "employer") {
        const response = await fetch("/api/jobs/my-jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setJobs(data.jobs || []);
        }
      } else {
        // Job seekers see all jobs with filters
        const params = new URLSearchParams();

        if (filters.track !== "all") params.append("track", filters.track);
        if (filters.jobType !== "all")
          params.append("jobType", filters.jobType);
        if (filters.experienceLevel !== "all")
          params.append("experienceLevel", filters.experienceLevel);
        if (searchQuery) params.append("search", searchQuery);

        const response = await fetch(`/api/jobs?${params.toString()}`);
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      const token = getToken();
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setJobs((prev) => prev.filter((job) => job._id !== jobId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setDeletingJobId(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      track: "all",
      jobType: "all",
      experienceLevel: "all",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.track !== "all" ||
    filters.jobType !== "all" ||
    filters.experienceLevel !== "all" ||
    searchQuery !== "";

  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <section className="mx-auto max-w-7xl">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className={`${inter.className} mb-2 sm:mb-4 text-3xl font-bold sm:text-4xl md:text-5xl`}
              >
                {userType === "employer"
                  ? "My Job Postings"
                  : "Jobs & Opportunities"}
              </h1>
              <p className="text-base sm:text-lg text-slate-300">
                {userType === "employer"
                  ? "Manage your job postings"
                  : "Discover your next career opportunity"}
              </p>
            </div>
            {userType === "employer" && (
              <Link href="/jobs/post">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  Post Job
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Search Bar - Only for job seekers */}
        {userType !== "employer" && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-12 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </motion.div>
        )}

        {/* Filter Toggle - Only for job seekers */}
        {userType !== "employer" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs">
                    Active
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Track
                    </label>
                    <select
                      value={filters.track}
                      onChange={(e) =>
                        setFilters({ ...filters, track: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="all">All Tracks</option>
                      {uniqueTracks.map((track) => (
                        <option key={track} value={track}>
                          {track}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Job Type
                    </label>
                    <select
                      value={filters.jobType}
                      onChange={(e) =>
                        setFilters({ ...filters, jobType: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="Internship">Internship</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Experience
                    </label>
                    <select
                      value={filters.experienceLevel}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          experienceLevel: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                    >
                      <option value="all">All Levels</option>
                      <option value="Fresher">Fresher</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-slate-300">
              {userType === "employer" ? "No jobs posted yet" : "No jobs found"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {userType === "employer" ? (
                <>
                  Start posting jobs to find the right talent.{" "}
                  <Link
                    href="/jobs/post"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Post your first job
                  </Link>
                </>
              ) : (
                "Try adjusting your filters or search query"
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <motion.div
                key={job._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                className={`group rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10 ${
                  userType === "employer" ? "" : "cursor-pointer"
                }`}
                onClick={
                  userType !== "employer"
                    ? () => router.push(`/jobs/${job._id}`)
                    : undefined
                }
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3
                      className={`${inter.className} mb-2 text-xl font-semibold text-white group-hover:text-blue-300`}
                    >
                      {job.title}
                    </h3>
                    <p className="text-sm text-slate-300">{job.company}</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    {job.jobType}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.experienceLevel}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-slate-400">
                    Track
                  </p>
                  <span className="rounded-lg bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                    {job.track}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-slate-400">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                        +{job.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {job.salary && (
                  <p className="mb-4 text-sm font-medium text-emerald-300">
                    {job.salary}
                  </p>
                )}

                {userType === "employer" ? (
                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href={`/jobs/${job._id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                    <motion.button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteJob(job._id!);
                      }}
                      disabled={deletingJobId === job._id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-sm text-blue-300 transition group-hover:text-blue-200">
                    View Details →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.main>
  );
}
