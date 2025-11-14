"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Inter } from "next/font/google";
import {
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  User,
  Bot,
  Save,
  X,
  Sparkles,
  Briefcase,
  Map,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const bubbleVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

interface Message {
  _id?: string;
  userId: string;
  role: "user" | "assistant" | "system";
  text: string;
  conversationId?: string;
  saved?: boolean;
  createdAt?: string | Date;
}

interface Conversation {
  _id: string;
  lastMessage: Date;
  messageCount: number;
  saved?: boolean;
}

const quickQuestions = [
  "What skills should I learn next?",
  "What are my biggest skill gaps?",
  "Am I ready for jobs in my field?",
  "What projects should I build?",
  "How to prepare for interviews?",
  "What's the best learning path?",
];

export default function CareerBotPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [skillGapSummary, setSkillGapSummary] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    if (isAuthenticated) {
      fetchUserProfile();
      fetchHistory();
      fetchConversations();
    }
  }, [isAuthenticated, authLoading, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUserProfile(data.user);
        // Fetch skill gap summary if user is a job seeker
        if (data.user.userType === "job_seeker") {
          fetchSkillGapSummary();
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchSkillGapSummary = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/skill-gap/analyze", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        setSkillGapSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching skill gap summary:", error);
    }
  };

  const fetchHistory = async (convId?: string) => {
    try {
      const token = getToken();
      const query = convId
        ? `?conversationId=${convId}`
        : "";
      const response = await fetch(`/api/careerbot/history${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          setConversationId(data.messages[0].conversationId || null);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = getToken();
      const response = await fetch("/api/careerbot/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || loading) return;

    setInputText("");
    setLoading(true);

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/careerbot/send", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: messageText,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(data.messages || []);
        setConversationId(data.conversationId);
        fetchConversations(); // Refresh conversation list
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear this conversation?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch("/api/careerbot/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages([]);
        setConversationId(null);
        fetchConversations();
        toast.success("Conversation cleared");
      } else {
        toast.error(data.error || "Failed to clear conversation");
      }
    } catch (error) {
      console.error("Error clearing conversation:", error);
      toast.error("Failed to clear conversation");
    }
  };

  const handleCopy = async () => {
    if (messages.length === 0) {
      toast.error("No messages to copy");
      return;
    }

    const text = messages
      .map((msg) => `${msg.role === "user" ? "You" : "CareerBot"}: ${msg.text}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Conversation copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying conversation:", error);
      toast.error("Failed to copy conversation");
    }
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (authLoading) {
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
      <div className="mx-auto max-w-7xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <h1
              className={`${inter.className} text-3xl font-bold sm:text-4xl md:text-5xl`}
            >
              CareerBot
            </h1>
          </div>
          <p className="text-lg text-slate-300">
            Your AI career mentor — ask me anything about your career journey!
          </p>
        </motion.div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Sidebar - Conversations */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-64 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl overflow-y-auto"
          >
            <h2
              className={`${inter.className} mb-4 text-lg font-semibold text-white flex items-center gap-2`}
            >
              <MessageSquare className="h-5 w-5" />
              Conversations
            </h2>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => fetchHistory(conv._id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    conversationId === conv._id
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="text-sm font-medium text-white truncate">
                    {conv.messageCount} messages
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(conv.lastMessage)}
                  </div>
                </button>
              ))}
            </div>
          </motion.aside>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <Bot className="h-16 w-16 text-blue-400 mb-4" />
                    <h2
                      className={`${inter.className} mb-2 text-2xl font-semibold text-white`}
                    >
                      Welcome to CareerBot!
                    </h2>
                    <p className="mb-6 text-slate-300 max-w-md">
                      I'm your skill gap guide! I'll help you identify which skills you need to develop 
                      to advance your career. Ask me about your skill gaps, learning paths, or career readiness.
                    </p>
                    
                    {/* Quick Action Buttons */}
                    <div className="mb-6 flex flex-wrap gap-3 justify-center">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSend("What are my biggest skill gaps?")}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-green-400/30 bg-green-500/20 text-sm font-medium text-green-200 transition hover:bg-green-500/30 hover:border-green-400/50"
                      >
                        <Sparkles className="h-4 w-4" />
                        Analyze My Skill Gaps
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                      <Link href="/jobs">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-blue-400/30 bg-blue-500/20 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30 hover:border-blue-400/50"
                        >
                          <Briefcase className="h-4 w-4" />
                          Show Me Jobs
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      </Link>
                      <Link href="/roadmap">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-purple-400/30 bg-purple-500/20 text-sm font-medium text-purple-200 transition hover:bg-purple-500/30 hover:border-purple-400/50"
                        >
                          <Map className="h-4 w-4" />
                          Generate Roadmap
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      </Link>
                    </div>
                    
                    {/* Disclaimer */}
                    <div className="mb-6 max-w-md rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                      <p className="text-xs text-amber-200 leading-relaxed">
                        <strong className="font-semibold">Disclaimer:</strong> CareerBot provides guidance and suggestions only. 
                        Job placement and career outcomes depend on various factors including market conditions, 
                        individual effort, and opportunity availability. All advice is for informational purposes.
                      </p>
                    </div>
                    
                    {/* Quick Questions */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickQuestions.map((question, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.1 }}
                          onClick={() => handleSend(question)}
                          className="px-4 py-2 rounded-full border border-white/20 bg-white/5 text-sm text-white transition hover:bg-white/10 hover:border-white/30"
                        >
                          {question}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={message._id || index}
                      variants={bubbleVariants}
                      initial="hidden"
                      animate="visible"
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-3 max-w-[80%] ${
                          message.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === "user"
                              ? "bg-blue-500/20 border border-blue-500/30"
                              : "bg-purple-500/20 border border-purple-500/30"
                          }`}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4 text-blue-300" />
                          ) : (
                            <Bot className="h-4 w-4 text-purple-300" />
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-blue-500/20 border border-blue-500/30 text-blue-100"
                              : "bg-slate-900/70 border border-white/10 text-slate-200"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.text}
                          </p>
                          <p className="mt-2 text-xs opacity-60">
                            {formatTime(message.createdAt || new Date())}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-300" />
                    </div>
                    <div className="rounded-2xl bg-slate-900/70 border border-white/10 px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-3 mb-2">
                {messages.length > 0 && (
                  <>
                    <motion.button
                      onClick={handleClear}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      onClick={handleCopy}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </motion.button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask CareerBot anything..."
                  rows={2}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  disabled={loading}
                />
                <motion.button
                  onClick={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  whileHover={{ scale: loading || !inputText.trim() ? 1 : 1.05 }}
                  whileTap={{ scale: loading || !inputText.trim() ? 1 : 0.95 }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - User Profile Summary */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden xl:block w-64 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl overflow-y-auto"
          >
            <h2
              className={`${inter.className} mb-4 text-lg font-semibold text-white flex items-center gap-2`}
            >
              <User className="h-5 w-5" />
              Your Profile
            </h2>
            {userProfile && (
              <div className="space-y-4">
                {userProfile.skills && userProfile.skills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.slice(0, 6).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userProfile.preferredTrack && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">
                      Preferred Track
                    </p>
                    <p className="text-sm font-medium text-white">
                      {userProfile.preferredTrack}
                    </p>
                  </div>
                )}
                {userProfile.experienceLevel && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">
                      Experience Level
                    </p>
                    <p className="text-sm font-medium text-white">
                      {userProfile.experienceLevel}
                    </p>
                  </div>
                )}
                {skillGapSummary && skillGapSummary.overallSkillGaps.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-400/20 bg-amber-500/10">
                    <p className="mb-2 text-xs uppercase tracking-wider text-amber-300 font-semibold">
                      Skill Gap Insights
                    </p>
                    <p className="text-xs text-amber-200 mb-2">
                      {skillGapSummary.summary.skillsToLearn} skills to learn
                    </p>
                    <p className="text-xs text-slate-300 mb-2">
                      Avg. Match: {skillGapSummary.summary.averageMatchScore}%
                    </p>
                    {skillGapSummary.overallSkillGaps
                      .filter((gap: any) => gap.priority === "high")
                      .slice(0, 3)
                      .map((gap: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs text-amber-200 mb-1 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          {gap.skill}
                        </div>
                      ))}
                    <button
                      onClick={() => handleSend("What are my biggest skill gaps?")}
                      className="mt-2 w-full text-xs px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/30"
                    >
                      Get Full Analysis
                    </button>
                  </div>
                )}
                <Link
                  href="/profile"
                  className="block mt-4 text-center px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                >
                  Update Profile
                </Link>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </motion.main>
  );
}

