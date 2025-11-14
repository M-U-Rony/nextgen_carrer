"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  Download,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

const targetRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "UI/UX Designer",
  "DevOps Engineer",
  "Mobile Developer",
  "Software Engineer",
  "Product Manager",
  "QA Engineer",
  "Cybersecurity Specialist",
  "Machine Learning Engineer",
  "Cloud Architect",
];

export default function RoadmapPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [roadmap, setRoadmap] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [targetRole, setTargetRole] = useState("");
  const [timeline, setTimeline] = useState<"3-month" | "6-month">("3-month");
  const [dailyHours, setDailyHours] = useState<number | "">("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchRoadmap();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchRoadmap = async () => {
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
        setRoadmap(data.user.roadmap || "");
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetRole) {
      toast.error("Please select a target role");
      return;
    }

    setGenerating(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetRole,
          timeline,
          dailyHours: dailyHours || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRoadmap(data.roadmapText);
        toast.success("Roadmap generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate roadmap");
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!roadmap) {
      toast.error("No roadmap to save");
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
        body: JSON.stringify({ roadmap }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Roadmap saved successfully!");
      } else {
        toast.error(data.error || "Failed to save roadmap");
      }
    } catch (error) {
      console.error("Error saving roadmap:", error);
      toast.error("Failed to save roadmap");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!roadmap) {
      toast.error("No roadmap to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(roadmap);
      setCopied(true);
      toast.success("Roadmap copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying roadmap:", error);
      toast.error("Failed to copy roadmap");
    }
  };

  const handleExportPDF = async () => {
    if (!roadmap) {
      toast.error("No roadmap to export");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch("/api/roadmap/download", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "career-roadmap.pdf";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success("PDF downloaded successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const formatRoadmapText = (text: string) => {
    // Split by lines and format
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="mb-4 ml-6 list-disc space-y-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-lg leading-relaxed text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Check for headers
      if (trimmedLine.startsWith("# ")) {
        flushList();
        elements.push(
          <h1
            key={index}
            className={`${inter.className} mt-8 mb-4 text-3xl font-bold text-white first:mt-0 border-b border-white/10 pb-2`}
          >
            {trimmedLine.substring(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={index}
            className={`${inter.className} mt-6 mb-3 text-2xl font-semibold text-white border-b border-white/5 pb-2`}
          >
            {trimmedLine.substring(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={index}
            className={`${inter.className} mt-4 mb-2 text-xl font-semibold text-blue-300`}
          >
            {trimmedLine.substring(4)}
          </h3>
        );
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === "") {
        flushList();
        elements.push(<div key={`space-${index}`} className="mb-4" />);
      } else if (trimmedLine.length > 0) {
        flushList();
        elements.push(
          <p key={index} className="mb-3 text-lg leading-relaxed text-slate-300">
            {line}
          </p>
        );
      }
    });

    // Flush any remaining list items
    flushList();

    return elements;
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
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1
              className={`${inter.className} text-3xl font-bold sm:text-4xl md:text-5xl`}
            >
              AI Career Roadmap
            </h1>
          </div>
          <p className="text-lg text-slate-300">
            Get a personalized roadmap to reach your career goals
          </p>
        </motion.div>

        {/* Generate Form or Display Roadmap */}
        {!roadmap ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
          >
            <h2
              className={`${inter.className} mb-6 text-2xl font-semibold text-white`}
            >
              Generate Your Career Roadmap
            </h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Target Role */}
              <div>
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Target Role *
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Select a target role...
                  </option>
                  {targetRoles.map((role) => (
                    <option key={role} value={role} className="bg-slate-900 text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline */}
              <div>
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Timeline *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setTimeline("3-month")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      timeline === "3-month"
                        ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold">3 Months</div>
                    <div className="mt-1 text-xs opacity-70">
                      Fast-track learning
                    </div>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setTimeline("6-month")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      timeline === "6-month"
                        ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold">6 Months</div>
                    <div className="mt-1 text-xs opacity-70">
                      Comprehensive learning
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Daily Hours */}
              <div>
                <label
                  className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
                >
                  Daily Hours Available (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) =>
                    setDailyHours(
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  placeholder="e.g., 2 (hours per day)"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <p className="mt-2 text-sm text-slate-400">
                  How many hours per day can you dedicate to learning? (Optional)
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={generating || !targetRole}
                whileHover={{ scale: generating || !targetRole ? 1 : 1.02 }}
                whileTap={{ scale: generating || !targetRole ? 1 : 0.98 }}
                className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-4 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Roadmap...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generate Roadmap
                  </span>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <>
            {/* Action Buttons */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="mb-6 flex flex-wrap gap-3"
            >
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Roadmap
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Roadmap"}
              </motion.button>
              <motion.button
                onClick={() => {
                  setRoadmap("");
                  setTargetRole("");
                  setTimeline("3-month");
                  setDailyHours("");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </motion.button>
              <motion.button
                onClick={handleExportPDF}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </motion.button>
            </motion.div>

            {/* Roadmap Display */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 lg:p-12 backdrop-blur-xl shadow-xl"
            >
              <div className="prose prose-invert max-w-none">
                <div className="text-lg leading-relaxed text-slate-300">
                  {formatRoadmapText(roadmap)}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.main>
  );
}

