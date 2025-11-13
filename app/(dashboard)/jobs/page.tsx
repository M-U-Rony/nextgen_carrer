"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Search, MapPin, Briefcase, Filter, X } from "lucide-react";
import type { IJob } from "@/models/Job";

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
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    track: "all",
    location: "all",
    jobType: "all",
    experienceLevel: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter options
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(jobs.map((job) => job.track));
    return Array.from(tracks).sort();
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(jobs.map((job) => job.location));
    return Array.from(locations).sort();
  }, [jobs]);

  useEffect(() => {
    fetchJobs();
  }, [filters, searchQuery]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.track !== "all") params.append("track", filters.track);
      if (filters.location !== "all") params.append("location", filters.location);
      if (filters.jobType !== "all") params.append("jobType", filters.jobType);
      if (filters.experienceLevel !== "all")
        params.append("experienceLevel", filters.experienceLevel);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      track: "all",
      location: "all",
      jobType: "all",
      experienceLevel: "all",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.track !== "all" ||
    filters.location !== "all" ||
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
          <h1
            className={`${inter.className} mb-4 text-4xl font-bold sm:text-5xl`}
          >
            Jobs & Opportunities
          </h1>
          <p className="text-lg text-slate-300">
            Discover your next career opportunity
          </p>
        </motion.div>

        {/* Search Bar */}
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

        {/* Filter Toggle */}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Track
                </label>
                <select
                  value={filters.track}
                  onChange={(e) =>
                    setFilters({ ...filters, track: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({ ...filters, location: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                    setFilters({ ...filters, experienceLevel: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-slate-300">No jobs found</p>
            <p className="mt-2 text-sm text-slate-400">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <motion.div
                key={job._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
                onClick={() => router.push(`/jobs/${job._id}`)}
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
                  <div className="flex flex-wrap gap-2">
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

                <div className="text-sm text-blue-300 transition group-hover:text-blue-200">
                  View Details →
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

