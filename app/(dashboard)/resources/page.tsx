"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Search,
  Filter,
  X,
  ExternalLink,
  BookOpen,
  DollarSign,
  Clock,
  Star,
} from "lucide-react";
import type { IResource } from "@/models/Resource";

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

export default function ResourcesPage() {
  const [resources, setResources] = useState<IResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    platform: "all",
    cost: "all",
    level: "all",
    skill: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter options
  const uniquePlatforms = useMemo(() => {
    const platforms = new Set(resources.map((resource) => resource.platform));
    return Array.from(platforms).sort();
  }, [resources]);

  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    resources.forEach((resource) => {
      resource.relatedSkills.forEach((skill) => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [resources]);

  useEffect(() => {
    fetchResources();
  }, [filters, searchQuery]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.platform !== "all") params.append("platform", filters.platform);
      if (filters.cost !== "all") params.append("cost", filters.cost);
      if (filters.level !== "all") params.append("level", filters.level);
      if (filters.skill !== "all") params.append("skill", filters.skill);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/resources?${params.toString()}`);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      platform: "all",
      cost: "all",
      level: "all",
      skill: "all",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.platform !== "all" ||
    filters.cost !== "all" ||
    filters.level !== "all" ||
    filters.skill !== "all" ||
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
            Learning Resources
          </h1>
          <p className="text-lg text-slate-300">
            Discover courses and tutorials to advance your skills
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
              placeholder="Search resources by title, platform, or skills..."
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
                  Platform
                </label>
                <select
                  value={filters.platform}
                  onChange={(e) =>
                    setFilters({ ...filters, platform: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Platforms</option>
                  {uniquePlatforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Cost
                </label>
                <select
                  value={filters.cost}
                  onChange={(e) =>
                    setFilters({ ...filters, cost: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Costs</option>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters({ ...filters, level: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Skill
                </label>
                <select
                  value={filters.skill}
                  onChange={(e) =>
                    setFilters({ ...filters, skill: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="all">All Skills</option>
                  {allSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-lg text-slate-300">No resources found</p>
            <p className="mt-2 text-sm text-slate-400">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <motion.div
                key={resource._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3
                      className={`${inter.className} mb-2 text-xl font-semibold text-white group-hover:text-blue-300`}
                    >
                      {resource.title}
                    </h3>
                    <p className="text-sm text-slate-300">{resource.platform}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      resource.cost === "Free"
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-amber-400/40 bg-amber-400/10 text-amber-200"
                    }`}
                  >
                    {resource.cost}
                  </span>
                </div>

                {resource.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                    {resource.description}
                  </p>
                )}

                <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-400">
                  {resource.level && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {resource.level}
                    </div>
                  )}
                  {resource.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resource.duration}
                    </div>
                  )}
                  {resource.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {resource.rating}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-slate-400">
                    Related Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resource.relatedSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80"
                      >
                        {skill}
                      </span>
                    ))}
                    {resource.relatedSkills.length > 3 && (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                        +{resource.relatedSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <motion.a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold text-white transition"
                >
                  Go to Course
                  <ExternalLink className="h-4 w-4" />
                </motion.a>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.main>
  );
}

