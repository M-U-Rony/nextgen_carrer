"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Save, ArrowLeft, Check, X } from "lucide-react";
import type { IUser } from "@/models/User";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

// Available skills (can be expanded)
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
const experienceLevels = ["Fresher", "Junior", "Mid", "Senior"];

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state - User Type
  const [userType, setUserType] = useState<"job_seeker" | "employer">("job_seeker");

  // Form state - Job Seeker
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [preferredTrack, setPreferredTrack] = useState("");
  const [education, setEducation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  // Form state - Employer
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    fetchUserProfile();
  }, [isAuthenticated, isLoading, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        // Set user type
        setUserType(data.user.userType || "job_seeker");
        // Set form state based on user type
        if (data.user.userType === "employer") {
          setCompanyName(data.user.companyName || "");
          setCompanyWebsite(data.user.companyWebsite || "");
          setCompanyDescription(data.user.companyDescription || "");
        } else {
          setSelectedSkills(data.user.skills || []);
          setPreferredTrack(data.user.preferredTrack || "");
          setEducation(data.user.education || "");
          setExperienceLevel(data.user.experienceLevel || "");
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
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);

      const updateData: any = {
        userType,
      };

      // Check if userType is changing
      const isUserTypeChanging = user?.userType && user.userType !== userType;

      if (userType === "employer") {
        updateData.companyName = companyName;
        updateData.companyWebsite = companyWebsite;
        updateData.companyDescription = companyDescription;
        // Clear job seeker fields only when switching to employer
        if (isUserTypeChanging) {
          updateData.skills = [];
          updateData.preferredTrack = "";
          updateData.education = "";
          updateData.experienceLevel = "";
        }
      } else {
        updateData.skills = selectedSkills;
        updateData.preferredTrack = preferredTrack;
        updateData.education = education;
        updateData.experienceLevel = experienceLevel;
        // Clear employer fields only when switching to job seeker
        if (isUserTypeChanging) {
          updateData.companyName = "";
          updateData.companyWebsite = "";
          updateData.companyDescription = "";
        }
      }

      const token = getToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Profile updated successfully!");
        setUser(data.user);
        // Update userType state to reflect the change
        if (data.user.userType) {
          setUserType(data.user.userType);
        }
        // Refresh the page to update session and show correct form
        setTimeout(() => {
          setSuccessMessage(null);
          window.location.href = "/profile";
        }, 2000);
      } else {
        setSuccessMessage(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSuccessMessage("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div
        className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10 flex items-center justify-center`}
      >
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
          <h1
            className={`${inter.className} mb-4 text-3xl font-bold sm:text-4xl md:text-5xl`}
          >
            Profile Settings
          </h1>
          <p className="text-lg text-slate-300">
            Update your skills and career preferences to get personalized
            recommendations
          </p>
        </motion.div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl border px-4 py-3 ${
              successMessage.includes("successfully")
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {successMessage}
          </motion.div>
        )}

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur"
        >
          {/* User Type Selection */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Account Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setUserType("job_seeker")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  userType === "job_seeker"
                    ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-semibold">Job Seeker</div>
                <div className="text-xs mt-1 opacity-70">
                  Looking for opportunities
                </div>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setUserType("employer")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  userType === "employer"
                    ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold">Employer</div>
                <div className="text-xs mt-1 opacity-70">Hiring talent</div>
              </motion.button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Select how you want to use NextGen Carrer. You can change this anytime.
            </p>
          </div>

          {userType === "employer" ? (
            // Employer Profile Form
            <>
              {/* Company Name */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., TechNova Labs"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Your company or organization name
                </p>
              </div>

              {/* Company Website */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Company Website
                </label>
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Your company website URL
                </p>
              </div>

              {/* Company Description */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Company Description
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Tell us about your company, its mission, and what makes it unique..."
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
                <p className="mt-2 text-sm text-slate-400">
                  A brief description of your company
                </p>
              </div>
            </>
          ) : (
            // Job Seeker Profile Form
            <>
              {/* Preferred Track */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Preferred Career Track
                </label>
                <select
                  value={preferredTrack}
                  onChange={(e) => setPreferredTrack(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Select a track...
                  </option>
                  {availableTracks.map((track) => (
                    <option
                      key={track}
                      value={track}
                      className="bg-slate-900 text-white"
                    >
                      {track}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-slate-400">
                  This helps us recommend relevant jobs and learning resources
                </p>
              </div>

              {/* Experience Level */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Select experience level...
                  </option>
                  {experienceLevels.map((level) => (
                    <option
                      key={level}
                      value={level}
                      className="bg-slate-900 text-white"
                    >
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Education
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g., BSc in Computer Science"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Skills Selection */}
              <div className="mb-8">
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Your Skills ({selectedSkills.length} selected)
                </label>
                <p className="mb-4 text-sm text-slate-400">
                  Select all skills that apply to you. This helps us match you
                  with relevant opportunities.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4 opacity-50" />
                        )}
                        {skill}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Cancel
            </Link>
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </motion.div>
      </section>
    </motion.main>
  );
}
