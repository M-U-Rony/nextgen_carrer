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

export default function RoadmapPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [roadmap, setRoadmap] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchUserProfileAndGenerateRoadmap();
    }
  }, [isAuthenticated, authLoading, router]);

  const detectTargetRoleFromSkills = (skills: string[], preferredTrack?: string): string => {
    // First try preferred track
    if (preferredTrack) {
      const trackToRole: Record<string, string> = {
        "frontend": "Frontend Developer",
        "backend": "Backend Developer",
        "fullstack": "Full Stack Developer",
        "full stack": "Full Stack Developer",
        "data": "Data Analyst",
        "data-science": "Data Scientist",
        "design": "UI/UX Designer",
        "devops": "DevOps Engineer",
        "mobile": "Mobile Developer",
        "software": "Software Engineer",
      };
      const lowerTrack = preferredTrack.toLowerCase();
      for (const [key, role] of Object.entries(trackToRole)) {
        if (lowerTrack.includes(key)) {
          return role;
        }
      }
    }

    // Analyze skills to determine role
    const skillsLower = skills.map(s => s.toLowerCase());
    
    const frontendSkills = ["react", "vue", "angular", "html", "css", "javascript", "typescript", "next.js", "tailwind"];
    const backendSkills = ["node.js", "express", "python", "django", "flask", "java", "spring", "php", "ruby"];
    const dataSkills = ["python", "sql", "pandas", "numpy", "tableau", "power bi"];
    
    const hasFrontend = frontendSkills.some(skill => skillsLower.some(s => s.includes(skill)));
    const hasBackend = backendSkills.some(skill => skillsLower.some(s => s.includes(skill)));
    const hasData = dataSkills.some(skill => skillsLower.some(s => s.includes(skill)));
    
    if (hasFrontend && hasBackend) return "Full Stack Developer";
    if (hasFrontend) return "Frontend Developer";
    if (hasBackend) return "Backend Developer";
    if (hasData) return "Data Analyst";
    
    return "Software Engineer";
  };

  const fetchUserProfileAndGenerateRoadmap = async () => {
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
        const skills = data.user.skills || [];
        setUserSkills(skills);

        // Check if roadmap already exists
        if (data.user.roadmap) {
          setRoadmap(data.user.roadmap);
          setLoading(false);
          return;
        }

        // Auto-generate if skills exist
        if (skills.length > 0) {
          const role = detectTargetRoleFromSkills(skills, data.user.preferredTrack);
          setTargetRole(role);
          await autoGenerateRoadmap(role, skills);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    }
  };

  const autoGenerateRoadmap = async (targetRole: string, skills: string[]) => {
    try {
      setGenerating(true);
      const token = getToken();
      
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetRole,
          timeline: "6-month",
          dailyHours: undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRoadmap(data.roadmapText);
        toast.success("6-month roadmap generated based on your tech stack!");
      } else {
        toast.error(data.error || "Failed to generate roadmap");
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Failed to generate roadmap");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (userSkills.length === 0) {
      toast.error("No skills found. Please add skills to your profile first.");
      return;
    }
    setRoadmap("");
    const role = detectTargetRoleFromSkills(userSkills);
    setTargetRole(role);
    await autoGenerateRoadmap(role, userSkills);
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
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
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
            Your AI-generated 6-month roadmap based on your current tech stack
          </p>
        </motion.div>

        {/* Loading/Generating State */}
        {(loading || generating) ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl shadow-xl text-center"
          >
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
            <h2
              className={`${inter.className} mb-2 text-2xl font-semibold text-white`}
            >
              {generating ? "Generating Your 6-Month Roadmap..." : "Loading..."}
            </h2>
            {generating && userSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-slate-400 mb-2">
                  Creating a personalized roadmap based on your tech stack:
                </p>
                <p className="font-medium text-blue-300">
                  {userSkills.slice(0, 5).join(", ")}
                  {userSkills.length > 5 && ` +${userSkills.length - 5} more`}
                </p>
                {targetRole && (
                  <p className="mt-2 text-sm text-slate-500">
                    Target Role: {targetRole}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : !roadmap && userSkills.length === 0 ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 backdrop-blur-xl shadow-xl text-center"
          >
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h2
              className={`${inter.className} mb-4 text-2xl font-semibold text-white`}
            >
              No Skills Found
            </h2>
            <p className="mb-6 text-slate-300">
              Please add skills to your profile first to generate a personalized 6-month roadmap.
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              Go to Profile
            </Link>
          </motion.div>
        ) : roadmap ? (
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
                onClick={handleRegenerate}
                disabled={generating || userSkills.length === 0}
                whileHover={{ scale: generating || userSkills.length === 0 ? 1 : 1.02 }}
                whileTap={{ scale: generating || userSkills.length === 0 ? 1 : 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Roadmap
                  </>
                )}
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
        ) : null}
      </div>
    </motion.main>
  );
}

