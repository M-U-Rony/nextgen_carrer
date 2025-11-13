"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useMemo, useState, useEffect, type FC } from "react";
import { ExternalLink } from "lucide-react";
import type { IJob } from "@/models/Job";
import type { IResource } from "@/models/Resource";
import type { IUser } from "@/models/User";
import { useUserType } from "@/hooks/useUserType";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const pageFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: index * 0.08 },
  }),
};

// Default user data - only used as fallback for display, not for new users
const defaultUserData = {
  education: "",
  experienceLevel: "",
  preferredTrack: "",
  skills: [],
  profileCompletion: 0,
};


const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

interface RecommendedJob extends IJob {
  matchScore?: number;
  matchedSkills?: string[];
  matchReason?: string;
}

interface RecommendedResource extends IResource {
  matchScore?: number;
  matchedSkills?: string[];
  matchReason?: string;
}

const DashboardPage: FC = () => {
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated: () => {
      // This will be handled by the redirect below
    },
  });
  const router = useRouter();
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<
    RecommendedResource[]
  >([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingResources, setLoadingResources] = useState(true);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [employerJobs, setEmployerJobs] = useState<IJob[]>([]);
  const [loadingEmployerJobs, setLoadingEmployerJobs] = useState(true);

  const calculateProfileCompletion = (user: IUser | null): number => {
    if (!user) return 0;
    let completed = 0;
    const total = 5; // name, email, skills, preferredTrack, experienceLevel

    if (user.name) completed++;
    if (user.email) completed++;
    if (user.skills && user.skills.length > 0) completed++;
    if (user.preferredTrack) completed++;
    if (user.experienceLevel) completed++;

    return Math.round((completed / total) * 100);
  };

  const user = useMemo(() => {
    if (userData) {
      return {
        name: userData.name || session?.user?.name || "User",
        email: userData.email || session?.user?.email || "",
        image:
          userData.image ||
          session?.user?.image ||
          "https://i.pravatar.cc/120?img=5",
        skills: userData.skills || [],
        preferredTrack: userData.preferredTrack || "",
        education: userData.education || "",
        experienceLevel: userData.experienceLevel || "",
        profileCompletion: calculateProfileCompletion(userData),
      };
    }
    if (session?.user) {
      return {
        name: session.user.name || "User",
        email: session.user.email || "",
        image: session.user.image || "https://i.pravatar.cc/120?img=5",
        skills: [],
        preferredTrack: "",
        education: "",
        experienceLevel: "",
        profileCompletion: 0,
      };
    }
    return {
      name: "User",
      email: "",
      image: "https://i.pravatar.cc/120?img=5",
      skills: [],
      preferredTrack: "",
      education: "",
      experienceLevel: "",
      profileCompletion: 0,
    };
  }, [session, userData]);

  const userType = useUserType(userData);

  const isProfileIncomplete = useMemo(() => {
    if (userType === "employer") {
      return !userData || !userData.companyName;
    }
    // Job seeker profile incomplete check
    return (
      !userData ||
      !userData.skills ||
      userData.skills.length === 0 ||
      !userData.preferredTrack ||
      !userData.experienceLevel
    );
  }, [userData, userType]);

  const skillsColumns = useMemo(() => {
    const midpoint = Math.ceil(user.skills.length / 2);
    return [user.skills.slice(0, midpoint), user.skills.slice(midpoint)];
  }, [user.skills]);

  // Fetch user profile and recommendations
  useEffect(() => {
    if (session) {
      fetchUserProfile();
      // Only fetch recommendations for job seekers
      if (session.user?.userType === "job_seeker" || !session.user?.userType) {
        fetchRecommendedJobs();
        fetchRecommendedResources();
      }
      // Fetch employer jobs for employers
      if (session.user?.userType === "employer") {
        fetchEmployerJobs();
      }
    }
  }, [session]);

  // Also fetch employer jobs when userData changes and user is employer
  useEffect(() => {
    if (userType === "employer" && userData) {
      fetchEmployerJobs();
    }
  }, [userType, userData]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (response.ok && data.user) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await fetch("/api/recommendations/jobs");
      const data = await response.json();
      if (response.ok) {
        setRecommendedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchRecommendedResources = async () => {
    try {
      setLoadingResources(true);
      const response = await fetch("/api/recommendations/resources");
      const data = await response.json();
      if (response.ok) {
        setRecommendedResources(data.resources || []);
      }
    } catch (error) {
      console.error("Error fetching recommended resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchEmployerJobs = async () => {
    try {
      setLoadingEmployerJobs(true);
      const response = await fetch("/api/jobs/my-jobs");
      const data = await response.json();
      if (response.ok) {
        setEmployerJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching employer jobs:", error);
    } finally {
      setLoadingEmployerJobs(false);
    }
  };


  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/signin");
    return null;
  }

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}
    >
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6 backdrop-blur"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className={`${inter.className} mb-2 text-xl font-semibold text-white`}>
                  Complete Your Profile
                </h3>
                <p className="text-sm text-slate-200">
                  To get personalized job recommendations and learning resources, please fill out your profile with your skills, preferred career track, and experience level.
                </p>
              </div>
              <Link href="/profile">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                  Complete Profile
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Conditional Rendering Based on User Type */}
        {userType === "employer" ? (
          // Employer Dashboard
          <>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-linear-to-br from-blue-400/40 to-purple-500/20 p-[2px]">
                    <Image
                      src={user.image}
                      alt={user.name}
                      fill
                      className="rounded-2xl object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div>
                    <h2 className={`${inter.className} text-xl font-semibold text-white sm:text-2xl`}>
                      {userData?.companyName || user.name}
                    </h2>
                    <p className="text-sm text-slate-300">{user.email}</p>
                    {userData?.companyWebsite && (
                      <a
                        href={userData.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {userData.companyWebsite}
                      </a>
                    )}
                  </div>
                </div>
                <Link href="/profile">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-900/40 transition"
                  >
                    Edit Profile
                  </motion.button>
                </Link>
              </div>

              {userData?.companyDescription && (
                <div className="mt-6">
                  <p className="text-sm text-slate-300">{userData.companyDescription}</p>
                </div>
              )}

              <div className="mt-6">
                <Link href="/jobs/post">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                  >
                    + Post New Job
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.section
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className={`${inter.className} text-lg font-semibold text-white`}>
                    Your Posted Jobs
                  </h3>
                  <p className="text-sm text-slate-300">
                    Manage and track your job postings ({employerJobs.length})
                  </p>
                </div>
                <Link
                  href="/jobs"
                  className="text-sm text-blue-300 transition hover:text-blue-200"
                >
                  View all jobs →
                </Link>
              </div>

              {loadingEmployerJobs ? (
                <div className="mt-6 flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : employerJobs.length === 0 ? (
                <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/70 p-8 text-center">
                  <p className="text-slate-300">No jobs posted yet</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Start posting jobs to find the right talent for your company
                  </p>
                  <Link href="/jobs/post">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                    >
                      Post Your First Job
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {employerJobs.slice(0, 6).map((job, index) => (
                    <motion.article
                      key={job._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.1 }}
                      className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-blue-950/20 transition hover:border-white/20"
                    >
                      <header>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {job.company}
                        </p>
                        <h4
                          className={`${inter.className} mt-2 text-lg font-semibold text-white`}
                        >
                          {job.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.jobType} • {job.location}
                        </p>
                      </header>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                        {job.requiredSkills?.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/10 px-3 py-1"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills && job.requiredSkills.length > 3 && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-400">
                            +{job.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                        <span>{job.track}</span>
                        <span>{job.experienceLevel}</span>
                      </div>
                      <Link href={`/jobs/${job._id}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-5 w-full inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40"
                        >
                          View Details
                        </motion.button>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.section>
          </>
        ) : (
          // Job Seeker Dashboard (existing content)
          <>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="grid gap-6 lg:grid-cols-[1.2fr,1fr]"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/15 bg-linear-to-br from-blue-400/40 to-purple-500/20 p-[2px]">
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    className="rounded-2xl object-cover"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h2
                    className={`${inter.className} text-xl font-semibold text-white sm:text-2xl`}
                  >
                    {user.name}
                  </h2>
                  <p className="text-sm text-slate-300">{user.email}</p>
                </div>
              </div>
              <Link href="/profile">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-900/40 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  Edit Profile
                </motion.button>
              </Link>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Education
                </p>
                <p className="mt-1">
                  {user.education || (
                    <span className="text-slate-500 italic">Not set - Please update your profile</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Experience Level
                </p>
                <p className="mt-1">
                  {user.experienceLevel || (
                    <span className="text-slate-500 italic">Not set - Please update your profile</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Preferred Track
                </p>
                <p className="mt-1">
                  {user.preferredTrack || (
                    <span className="text-slate-500 italic">Not set - Please update your profile</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Profile Completion
                </p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-[#2563EB] to-[#9333EA]"
                    style={{ width: `${user.profileCompletion}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {user.profileCompletion}% completed
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8">
            <div className="flex items-center justify-between">
              <h3
                className={`${inter.className} text-lg font-semibold text-white`}
              >
                Your Skills
              </h3>
              <Link href="/profile">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-white/30"
                >
                  Edit Profile
                </motion.button>
              </Link>
            </div>

            {user.skills.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {skillsColumns.map((column, columnIndex) => (
                  <div
                    key={`column-${columnIndex}`}
                    className="flex flex-wrap gap-2"
                  >
                    {column.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-sm text-slate-400">
                  No skills added yet.{" "}
                  <Link
                    href="/profile"
                    className="text-blue-400 transition hover:text-blue-300 underline"
                  >
                    Add your skills
                  </Link>{" "}
                  to get personalized recommendations.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.section
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3
                className={`${inter.className} text-lg font-semibold text-white`}
              >
                Recommended Jobs
              </h3>
              <p className="text-sm text-slate-300">
                Tailored opportunities based on your skills and goals.
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              View all jobs →
            </Link>
          </div>

          {loadingJobs ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/70 p-8 text-center">
              <p className="text-slate-300">No job recommendations available</p>
              <p className="mt-2 text-sm text-slate-400">
                Update your skills and preferred track to get personalized
                recommendations
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedJobs.map((job, index) => (
                <motion.article
                  key={job._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-blue-950/20 transition hover:border-white/20"
                >
                  <header>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {job.company}
                    </p>
                    <h4
                      className={`${inter.className} mt-2 text-lg font-semibold text-white`}
                    >
                      {job.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-300">
                      {job.jobType} • {job.location}
                    </p>
                  </header>
                  {job.matchReason && (
                    <div className="mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                      <p className="text-xs text-blue-200">{job.matchReason}</p>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                    {(job.matchedSkills || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white/10 px-3 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills &&
                      job.requiredSkills.length >
                        (job.matchedSkills?.length || 0) && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-400">
                          +
                          {job.requiredSkills.length -
                            (job.matchedSkills?.length || 0)}{" "}
                          more
                        </span>
                      )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Match Score</span>
                      <span>{job.matchScore || 0}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-linear-to-r from-[#2563EB] via-indigo-500 to-[#9333EA]"
                        style={{ width: `${job.matchScore || 0}%` }}
                      />
                    </div>
                  </div>
                  <Link href={`/jobs/${job._id}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-5 w-full inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40"
                    >
                      View Details
                    </motion.button>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3
                className={`${inter.className} text-lg font-semibold text-white`}
              >
                Learning Resources
              </h3>
              <p className="text-sm text-slate-300">
                Keep growing with curated courses and challenges.
              </p>
            </div>
            <Link
              href="/resources"
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              See all resources →
            </Link>
          </div>

          {loadingResources ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : recommendedResources.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/70 p-8 text-center">
              <p className="text-slate-300">
                No resource recommendations available
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Update your skills and preferred track to get personalized
                recommendations
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {recommendedResources.map((resource, index) => (
                <motion.article
                  key={resource._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>{resource.platform}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${
                        resource.cost === "Free"
                          ? "border-emerald-400/40 text-emerald-200"
                          : "border-amber-400/40 text-amber-200"
                      }`}
                    >
                      {resource.cost}
                    </span>
                  </div>
                  <h4
                    className={`${inter.className} mt-3 text-lg font-semibold text-white`}
                  >
                    {resource.title}
                  </h4>
                  {resource.matchReason && (
                    <div className="mt-2 rounded-lg bg-purple-500/10 border border-purple-500/20 p-2">
                      <p className="text-xs text-purple-200">
                        {resource.matchReason}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                    {(resource.matchedSkills || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white/10 px-3 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                    {resource.relatedSkills &&
                      resource.relatedSkills.length >
                        (resource.matchedSkills?.length || 0) && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-400">
                          +
                          {resource.relatedSkills.length -
                            (resource.matchedSkills?.length || 0)}{" "}
                          more
                        </span>
                      )}
                  </div>
                  {resource.matchScore && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Match Score</span>
                        <span>{resource.matchScore}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-linear-to-r from-[#2563EB] to-[#9333EA]"
                          style={{ width: `${resource.matchScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <motion.a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold text-white transition"
                  >
                    Go to Course
                    <ExternalLink className="h-4 w-4" />
                  </motion.a>
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={3}
          className="rounded-3xl border border-white/10 bg-linear-to-r from-[#2563EB]/20 to-[#9333EA]/20 p-6 text-white backdrop-blur lg:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`${inter.className} text-xl font-semibold`}>
                Career Insights
              </h3>
              <p className="mt-2 text-sm text-slate-100">
                You are missing 2 skills for your preferred Frontend Developer
                role.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-2 text-sm font-semibold transition hover:border-white/40"
            >
              Learn Now
            </motion.button>
          </div>
        </motion.section>
          </>
        )}
      </section>
    </motion.div>
  );
};

export default DashboardPage;
