"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Save, ArrowLeft, Check, X } from "lucide-react";
import type { IUser } from "@/models/User";

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
  const { data: session, status } = useSession();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [preferredTrack, setPreferredTrack] = useState("");
  const [education, setEducation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/signin");
      return;
    }

    fetchUserProfile();
  }, [session, status, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        setSelectedSkills(data.user.skills || []);
        setPreferredTrack(data.user.preferredTrack || "");
        setEducation(data.user.education || "");
        setExperienceLevel(data.user.experienceLevel || "");
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skills: selectedSkills,
          preferredTrack,
          education,
          experienceLevel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Profile updated successfully!");
        setUser(data.user);
        setTimeout(() => {
          setSuccessMessage(null);
          router.push("/dashboard");
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

  if (!session) {
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
            className={`${inter.className} mb-4 text-4xl font-bold sm:text-5xl`}
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
          className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select a track...</option>
              {availableTracks.map((track) => (
                <option key={track} value={track}>
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select experience level...</option>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
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
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
              Select all skills that apply to you. This helps us match you with
              relevant opportunities.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
    </main>
  );
}

