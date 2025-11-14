"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Upload,
  FileText,
  X,
  Save,
  Loader2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

interface ExtractionResult {
  skills: string[];
  tools: string[];
  suggestedRoles: string[];
  summary: string;
}

export default function CVExtractPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [extractedTextPreview, setExtractedTextPreview] = useState("");

  // Editable state for tags
  const [skills, setSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [summary, setSummary] = useState("");

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push("/signin");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setTextInput(""); // Clear text input when file is selected
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!file && !textInput.trim()) {
      toast.error("Please upload a PDF or enter CV text");
      return;
    }

    setExtracting(true);
    setResult(null);
    setSkills([]);
    setTools([]);
    setSuggestedRoles([]);
    setSummary("");

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("text", textInput);
      }

      const token = getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/extract-cv", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to extract CV information");
        return;
      }

      if (data.success && data.data) {
        const extractionData = data.data;
        setResult(extractionData);
        setSkills(extractionData.skills || []);
        setTools(extractionData.tools || []);
        setSuggestedRoles(extractionData.suggestedRoles || []);
        setSummary(extractionData.summary || "");
        setExtractedTextPreview(data.extractedText || "");
        toast.success("CV extracted successfully!");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to extract CV information");
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveTag = (
    tag: string,
    category: "skills" | "tools" | "suggestedRoles"
  ) => {
    if (category === "skills") {
      setSkills((prev) => prev.filter((s) => s !== tag));
    } else if (category === "tools") {
      setTools((prev) => prev.filter((t) => t !== tag));
    } else if (category === "suggestedRoles") {
      setSuggestedRoles((prev) => prev.filter((r) => r !== tag));
    }
  };

  const handleAddTag = (
    value: string,
    category: "skills" | "tools" | "suggestedRoles"
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (category === "skills") {
      if (!skills.includes(trimmed)) {
        setSkills((prev) => [...prev, trimmed]);
      }
    } else if (category === "tools") {
      if (!tools.includes(trimmed)) {
        setTools((prev) => [...prev, trimmed]);
      }
    } else if (category === "suggestedRoles") {
      if (!suggestedRoles.includes(trimmed)) {
        setSuggestedRoles((prev) => [...prev, trimmed]);
      }
    }
  };

  const handleSave = async () => {
    if (skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      
      // Prepare data to save - include both skills and summary
      const updateData: { skills: string[]; cvSummary?: string } = {
        skills: skills,
      };
      
      // Include summary if it exists
      if (summary && summary.trim()) {
        updateData.cvSummary = summary.trim();
      }

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
        const savedItems = [];
        if (skills.length > 0) {
          savedItems.push(`${skills.length} skill${skills.length > 1 ? 's' : ''}`);
        }
        if (summary && summary.trim()) {
          savedItems.push("professional summary");
        }
        
        toast.success(
          `Successfully saved ${savedItems.join(' and ')} to your profile!`,
          { duration: 3000 }
        );
        
        // Redirect to profile page after a short delay
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        toast.error(data.error || "Failed to save profile data");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <section className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
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
              CV Skill Extraction
            </h1>
          </div>
          <p className="text-lg text-slate-300">
            Upload your CV or paste text to automatically extract skills, tools,
            and job roles using AI
          </p>
        </div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur"
        >
          <div className="mb-6">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Upload PDF CV
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="cv-upload"
              />
              <label
                htmlFor="cv-upload"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition"
              >
                <Upload className="h-5 w-5" />
                {file ? file.name : "Choose PDF File"}
              </label>
              {file && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleRemoveFile}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 transition"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Maximum file size: 10MB. PDF files only.
            </p>
          </div>

          <div className="mb-6">
            <div className="relative mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/5 px-2 text-slate-400">Or</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label
              className={`${inter.className} mb-3 block text-lg font-semibold text-white`}
            >
              Paste CV Text
            </label>
            <textarea
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setFile(null); // Clear file when text is entered
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              placeholder="Paste your CV content here..."
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              disabled={!!file}
            />
          </div>

          <motion.button
            onClick={handleExtract}
            disabled={extracting || (!file && !textInput.trim())}
            whileHover={{ scale: extracting ? 1 : 1.02 }}
            whileTap={{ scale: extracting ? 1 : 0.98 }}
            className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-6 py-4 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extracting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Extracting Skills...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Extract Skills
              </span>
            )}
          </motion.button>
        </motion.div>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur"
          >
            <h2
              className={`${inter.className} mb-6 text-2xl font-semibold text-white`}
            >
              Extracted Information
            </h2>

            {/* Text Preview */}
            {extractedTextPreview && (
              <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/70 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-300">
                  Text Preview
                </h3>
                <p className="text-sm text-slate-400 line-clamp-3">
                  {extractedTextPreview}
                </p>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Professional Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>
            )}

            {/* Skills */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-white">
                Skills ({skills.length})
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm text-blue-200"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveTag(skill, "skills")}
                      className="hover:text-white transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add a skill..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(e.currentTarget.value, "skills");
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Tools */}
            {tools.length > 0 && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-white">
                  Tools ({tools.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <motion.span
                      key={tool}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-4 py-2 text-sm text-purple-200"
                    >
                      {tool}
                      <button
                        onClick={() => handleRemoveTag(tool, "tools")}
                        className="hover:text-white transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Roles */}
            {suggestedRoles.length > 0 && (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-white">
                  Suggested Roles ({suggestedRoles.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedRoles.map((role) => (
                    <motion.span
                      key={role}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-sm text-amber-200"
                    >
                      {role}
                      <button
                        onClick={() =>
                          handleRemoveTag(role, "suggestedRoles")
                        }
                        className="hover:text-white transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-end gap-4">
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </Link>
              <motion.button
                onClick={handleSave}
                disabled={saving || skills.length === 0}
                whileHover={{ scale: saving || skills.length === 0 ? 1 : 1.02 }}
                whileTap={{ scale: saving || skills.length === 0 ? 1 : 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Skills to Profile"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}

