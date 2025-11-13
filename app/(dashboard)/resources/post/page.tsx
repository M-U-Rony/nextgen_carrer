"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { Save, ArrowLeft, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

// Available platforms
const availablePlatforms = [
  "Udemy",
  "YouTube",
  "freeCodeCamp",
  "Coursera",
  "edX",
  "Pluralsight",
  "Frontend Masters",
  "Codecademy",
  "Khan Academy",
  "LinkedIn Learning",
  "Other",
];

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

// Resource levels
const resourceLevels = ["Beginner", "Intermediate", "Advanced"];

export default function PostResourcePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [cost, setCost] = useState<"Free" | "Paid">("Free");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("");
  const [rating, setRating] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, isLoading, router]);

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
      const token = getToken();
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          platform,
          url,
          relatedSkills: selectedSkills,
          cost,
          description: description || undefined,
          duration: duration || undefined,
          level: level || undefined,
          rating: rating ? Number(rating) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Resource posted successfully!");
        setTimeout(() => {
          router.push("/resources");
        }, 2000);
      } else {
        setErrorMessage(data.error || "Failed to post resource");
      }
    } catch (error) {
      console.error("Error posting resource:", error);
      setErrorMessage("Failed to post resource. Please try again.");
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
            href="/resources"
            className="mb-6 inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>
          <h1
            className={`${inter.className} mb-4 text-3xl font-bold sm:text-4xl md:text-5xl`}
          >
            Post a Learning Resource
          </h1>
          <p className="text-lg text-slate-300">
            Share a helpful course, tutorial, or learning material with the
            community
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
          className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur"
        >
          {/* Title */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Resource Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete React Developer Course"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Platform */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Select a platform...
              </option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* URL */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Resource URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/course"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <p className="mt-2 text-sm text-slate-400">
              The direct link to the learning resource
            </p>
          </div>

          {/* Related Skills */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Related Skills * ({selectedSkills.length} selected)
            </label>
            <p className="mb-4 text-sm text-slate-400">
              Select skills that this resource teaches or relates to
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 mb-4">
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

          {/* Cost */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Cost *
            </label>
            <div className="flex gap-4">
              <motion.button
                type="button"
                onClick={() => setCost("Free")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-xl border-2 p-4 text-center transition ${
                  cost === "Free"
                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">🆓</div>
                <div className="font-semibold">Free</div>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setCost("Paid")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-xl border-2 p-4 text-center transition ${
                  cost === "Paid"
                    ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold">Paid</div>
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this resource covers and why it's helpful..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          {/* Duration */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Duration (Optional)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 40+ hours, 8 weeks, 4 hours"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Level */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Difficulty Level (Optional)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                Select level...
              </option>
              {resourceLevels.map((l) => (
                <option key={l} value={l} className="bg-slate-900 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="mb-8">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Rating (Optional)
            </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="0-5"
              min="0"
              max="5"
              step="0.1"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <p className="mt-2 text-sm text-slate-400">
              Rate this resource from 0 to 5 (optional)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/resources"
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
              {saving ? "Posting..." : "Post Resource"}
            </motion.button>
          </div>
        </motion.form>
      </section>
    </motion.main>
  );
}

