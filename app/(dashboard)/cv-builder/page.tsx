"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  FileText,
  Sparkles,
  Save,
  Copy,
  RefreshCw,
  Download,
  Check,
  Plus,
  X,
  GripVertical,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import type { IUser } from "@/models/User";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

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

const experienceLevels = ["Fresher", "Junior", "Mid", "Senior"];

export default function CVBuilderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // User profile data
  const [userProfile, setUserProfile] = useState<IUser | null>(null);
  const [hasProfileData, setHasProfileData] = useState(false);

  // Wizard form state (if no profile data)
  const [wizardData, setWizardData] = useState({
    education: "",
    experienceLevel: "",
    skills: [] as string[],
    projects: [] as string[],
    projectInput: "",
  });

  // Generated CV content
  const [summary, setSummary] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, authLoading, router]);

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
        setUserProfile(data.user);
        const hasData =
          (data.user.skills && data.user.skills.length > 0) ||
          data.user.education ||
          data.user.experienceLevel;

        setHasProfileData(hasData);

        // If user has saved CV content, load it
        if (data.user.cvSummary || (data.user.cvBullets && data.user.cvBullets.length > 0)) {
          setSummary(data.user.cvSummary || "");
          setBullets(data.user.cvBullets || []);
          setHasProfileData(true); // Ensure this is set
        }

        // Pre-fill wizard if no profile data
        if (!hasData) {
          setWizardData({
            education: data.user.education || "",
            experienceLevel: data.user.experienceLevel || "",
            skills: data.user.skills || [],
            projects: data.user.projects || [],
            projectInput: "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (useWizardData = false) => {
    if (useWizardData && wizardData.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    setGenerating(true);
    try {
      // First, save wizard data if needed
      if (useWizardData) {
        await saveWizardData();
        await fetchUserProfile(); // Refresh profile
      }

      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSummary(data.data.summary || "");
        setBullets(data.data.bullets || []);
        setSuggestedTitles(data.data.suggestedTitles || []);
        toast.success("CV content generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate CV content");
      }
    } catch (error) {
      console.error("Error generating CV:", error);
      toast.error("Failed to generate CV content");
    } finally {
      setGenerating(false);
    }
  };

  const saveWizardData = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          education: wizardData.education,
          experienceLevel: wizardData.experienceLevel,
          skills: wizardData.skills,
          projects: wizardData.projects,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile data");
      }
    } catch (error) {
      console.error("Error saving wizard data:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!summary && bullets.length === 0) {
      toast.error("No CV content to save");
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cvSummary: summary,
          cvBullets: bullets,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("CV content saved successfully!");
      } else {
        toast.error(data.error || "Failed to save CV content");
      }
    } catch (error) {
      console.error("Error saving CV:", error);
      toast.error("Failed to save CV content");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const cvText = `${summary}\n\n${bullets.map((b) => `• ${b}`).join("\n")}`;

    try {
      await navigator.clipboard.writeText(cvText);
      setCopied(true);
      toast.success("CV content copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying CV:", error);
      toast.error("Failed to copy CV content");
    }
  };

  const handleExportPDF = async () => {
    if (!userProfile && (!summary || bullets.length === 0)) {
      toast.error("Please generate CV content first");
      return;
    }

    try {
      // Import PDF generator dynamically (client-side only)
      const { generateCVPDF } = await import("@/lib/pdf-generator");

      // Prepare CV data
      const cvData = {
        name: userProfile?.name || "Your Name",
        email: userProfile?.email || "",
        location: (userProfile as any)?.location || "",
        phone: "",
        linkedIn: "",
        summary: summary || "Professional summary will appear here",
        skills: userProfile?.skills || [],
        workExperience: userProfile?.workExperience || [],
        education: userProfile?.education || "",
        projects: userProfile?.projects || [],
        bullets: bullets.length > 0 ? bullets : undefined,
      };

      // Generate PDF
      const doc = generateCVPDF(cvData);

      // Generate filename
      const date = new Date().toISOString().split("T")[0];
      const fileName = `CV_${cvData.name.replace(/\s+/g, "_")}_${date}.pdf`;

      // Save PDF
      doc.save(fileName);
      toast.success("CV exported as PDF successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const addBullet = () => {
    setBullets([...bullets, "New bullet point"]);
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const updateBullet = (index: number, value: string) => {
    const updated = [...bullets];
    updated[index] = value;
    setBullets(updated);
  };

  const moveBullet = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === bullets.length - 1)
    ) {
      return;
    }

    const updated = [...bullets];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setBullets(updated);
  };

  const toggleSkill = (skill: string) => {
    setWizardData({
      ...wizardData,
      skills: wizardData.skills.includes(skill)
        ? wizardData.skills.filter((s) => s !== skill)
        : [...wizardData.skills, skill],
    });
  };

  const addProject = () => {
    if (wizardData.projectInput.trim()) {
      setWizardData({
        ...wizardData,
        projects: [...wizardData.projects, wizardData.projectInput.trim()],
        projectInput: "",
      });
    }
  };

  const removeProject = (index: number) => {
    setWizardData({
      ...wizardData,
      projects: wizardData.projects.filter((_, i) => i !== index),
    });
  };

  const selectJobTitle = async (title: string) => {
    try {
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredTrack: title }),
      });

      if (response.ok) {
        toast.success(`Selected "${title}" as your target role`);
      }
    } catch (error) {
      console.error("Error selecting job title:", error);
    }
  };

  if (authLoading || loading) {
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

  return (
    <motion.main
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
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
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-400" />
            <h1
              className={`${inter.className} text-3xl font-bold sm:text-4xl md:text-5xl`}
            >
              AI CV Builder
            </h1>
          </div>
          <p className="text-lg text-slate-300">
            Generate a professional CV summary and bullet points powered by AI
          </p>
        </motion.div>

        {/* Wizard (if no profile data and no CV content) */}
        {!hasProfileData && !summary && bullets.length === 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
          >
            <h2
              className={`${inter.className} mb-6 text-2xl font-semibold text-white`}
            >
              Quick Setup
            </h2>
            <div className="space-y-6">
              {/* Education */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Education
                </label>
                <input
                  type="text"
                  value={wizardData.education}
                  onChange={(e) =>
                    setWizardData({ ...wizardData, education: e.target.value })
                  }
                  placeholder="e.g., BSc in Computer Science"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Experience Level
                </label>
                <select
                  value={wizardData.experienceLevel}
                  onChange={(e) =>
                    setWizardData({
                      ...wizardData,
                      experienceLevel: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Select experience level...</option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-white">
                  Skills ({wizardData.skills.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        wizardData.skills.includes(skill)
                          ? "border-blue-400/50 bg-blue-500/20 text-blue-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Projects ({wizardData.projects.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={wizardData.projectInput}
                    onChange={(e) =>
                      setWizardData({
                        ...wizardData,
                        projectInput: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProject();
                      }
                    }}
                    placeholder="Add a project..."
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button
                    type="button"
                    onClick={addProject}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:bg-white/10"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {wizardData.projects.map((project, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white"
                    >
                      {project}
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="hover:text-red-300 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={() => handleGenerate(true)}
                disabled={generating || wizardData.skills.length === 0}
                whileHover={{ scale: generating ? 1 : 1.02 }}
                whileTap={{ scale: generating ? 1 : 0.98 }}
                className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-4 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Generating CV...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generate CV
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Main CV Builder */}
        {(hasProfileData || summary || bullets.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            {/* Left: CV Preview */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
            >
              {!summary && bullets.length === 0 && (
                <div className="mb-6 text-center">
                  <p className="mb-4 text-slate-300">
                    No CV content yet. Click Generate to create your professional
                    CV.
                  </p>
                  <motion.button
                    onClick={() => handleGenerate(false)}
                    disabled={generating}
                    whileHover={{ scale: generating ? 1 : 1.02 }}
                    whileTap={{ scale: generating ? 1 : 0.98 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate CV Content
                      </>
                    )}
                  </motion.button>
                </div>
              )}
              <div className="space-y-6">
                {/* Professional Summary */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-white">
                    Professional Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-lg leading-relaxed text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                    placeholder="Professional summary will appear here..."
                  />
                </div>

                {/* Bullet Points */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-white">
                      CV Bullet Points ({bullets.length})
                    </label>
                    <motion.button
                      onClick={addBullet}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white transition hover:bg-white/10"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {bullets.map((bullet, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 group"
                      >
                        <div className="flex flex-col gap-1 mt-2">
                          <button
                            type="button"
                            onClick={() => moveBullet(index, "up")}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <GripVertical className="h-4 w-4 rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBullet(index, "down")}
                            disabled={index === bullets.length - 1}
                            className="text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <GripVertical className="h-4 w-4 -rotate-90" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(index, e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          placeholder="Bullet point..."
                        />
                        <button
                          type="button"
                          onClick={() => removeBullet(index)}
                          className="p-2 text-slate-400 hover:text-red-300 transition opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Controls & Suggestions */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl"
              >
                <h3
                  className={`${inter.className} mb-4 text-lg font-semibold text-white`}
                >
                  Actions
                </h3>
                <div className="space-y-3">
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save to Profile"}
                  </motion.button>
                  <motion.button
                    onClick={handleCopy}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => handleGenerate(false)}
                    disabled={generating}
                    whileHover={{ scale: generating ? 1 : 1.02 }}
                    whileTap={{ scale: generating ? 1 : 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
                    />
                    Regenerate
                  </motion.button>
                  <motion.button
                    onClick={handleExportPDF}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" />
                    Export as PDF
                  </motion.button>
                </div>
              </motion.div>

              {/* Suggested Job Titles */}
              {suggestedTitles.length > 0 && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl"
                >
                  <h3
                    className={`${inter.className} mb-4 text-lg font-semibold text-white`}
                  >
                    Suggested Job Titles
                  </h3>
                  <div className="space-y-2">
                    {suggestedTitles.map((title, index) => (
                      <motion.button
                        key={index}
                        onClick={() => selectJobTitle(title)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20 hover:border-blue-500/50"
                      >
                        {title}
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Click to set as your preferred track
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
}

