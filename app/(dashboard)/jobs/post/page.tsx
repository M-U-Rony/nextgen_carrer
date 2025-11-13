"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Save, ArrowLeft, X, Plus } from "lucide-react";
import type { IUser } from "@/models/User";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

// Available tracks
const availableTracks = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Design",
  "DevOps",
  "Quality Assurance",
  "Content",
  "Marketing",
  "Business",
];

// Experience levels
const experienceLevels = ["Fresher", "Junior", "Mid"];

// Job types
const jobTypes = ["Internship", "Part-time", "Full-time", "Freelance"];

// Available skills
const availableSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "HTML",
  "CSS",
  "TailwindCSS",
  "Python",
  "Java",
  "C++",
  "MongoDB",
  "PostgreSQL",
  "Express",
  "Docker",
  "Git",
  "Figma",
  "Adobe XD",
  "UI/UX Design",
  "Data Analysis",
  "Machine Learning",
  "Excel",
  "Communication",
  "Leadership",
  "Project Management",
];

export default function PostJobPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [jobType, setJobType] = useState("");
  const [track, setTrack] = useState("");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/signin");
      return;
    }

    // Check if user is employer
    fetchUserProfile();
  }, [session, status, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        if (data.user.userType !== "employer") {
          router.push("/dashboard");
          return;
        }
        // Pre-fill company name from profile
        if (data.user.companyName) {
          setCompany(data.user.companyName);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          company,
          location,
          requiredSkills: selectedSkills,
          experienceLevel,
          jobType,
          track,
          description,
          salary: salary || undefined,
          applicationLink: applicationLink || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Job posted successfully!");
        setTimeout(() => {
          router.push("/jobs");
        }, 2000);
      } else {
        setErrorMessage(data.error || "Failed to post job");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      setErrorMessage("Failed to post job. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10 flex items-center justify-center`}>
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || user?.userType !== "employer") {
    return null;
  }

  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <section className="mx-auto max-w-4xl">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className={`${inter.className} mb-4 text-4xl font-bold sm:text-5xl`}>
            Post a New Job
          </h1>
          <p className="text-lg text-slate-300">
            Create a job posting to attract the best talent for your company
          </p>
        </motion.div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-100"
          >
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-100"
          >
            {errorMessage}
          </motion.div>
        )}

        <motion.form
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          {/* Job Title */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Job Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Frontend Developer"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Company Name */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Company Name *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., TechNova Labs"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Location */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Remote, New York, NY"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Track */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Career Track *
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Select a track...
              </option>
              {availableTracks.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Experience Level *
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Select experience level...
              </option>
              {experienceLevels.map((level) => (
                <option key={level} value={level} className="bg-slate-900 text-white">
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Job Type *
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Select job type...
              </option>
              {jobTypes.map((type) => (
                <option key={type} value={type} className="bg-slate-900 text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Required Skills */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Required Skills * ({selectedSkills.length} selected)
            </label>
            <p className="mb-4 text-sm text-slate-400">
              Select skills required for this position
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mb-4">
              {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <motion.button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "border-blue-400/50 bg-blue-500/20 text-blue-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    {isSelected ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4 opacity-50" />
                    )}
                    {skill}
                  </motion.button>
                );
              })}
            </div>
            {/* Custom Skill Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                placeholder="Add custom skill..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <motion.button
                type="button"
                onClick={addCustomSkill}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Add
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Job Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              required
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          {/* Salary */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Salary (Optional)
            </label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g., $50,000 - $70,000/year or Competitive"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Application Link */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Application Link (Optional)
            </label>
            <input
              type="url"
              value={applicationLink}
              onChange={(e) => setApplicationLink(e.target.value)}
              placeholder="https://yourcompany.com/apply"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <p className="mt-2 text-sm text-slate-400">
              If not provided, applicants will contact you through the platform
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Cancel
            </Link>
            <motion.button
              type="submit"
              disabled={saving || selectedSkills.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Posting..." : "Post Job"}
            </motion.button>
          </div>
        </motion.form>
      </section>
    </motion.main>
  );
}

