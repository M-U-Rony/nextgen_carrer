"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import type { IJob } from "@/models/Job";
import { useAuth } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<IJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string);
    }
  }, [params.id]);

  const fetchJob = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();

      if (response.ok) {
        setJob(data.job);
      } else {
        console.error("Error fetching job:", data.error);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10 flex items-center justify-center`}>
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={`${gradientBackground} min-h-full text-white rounded-lg p-6 md:p-8 lg:p-10`}>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="mb-4 text-lg text-slate-300">Job not found</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-blue-300 transition hover:text-blue-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </div>
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
      <section className="mx-auto max-w-4xl">
        <motion.button
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </motion.button>

          <motion.article
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h1
                  className={`${inter.className} mb-2 text-2xl font-bold sm:text-3xl md:text-4xl`}
                >
                  {job.title}
                </h1>
                <p className="text-xl text-slate-300">{job.company}</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                {job.jobType}
              </span>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {job.experienceLevel}
              </div>
              {job.salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          {/* Track Badge */}
          <div className="mb-6">
            <span className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300">
              {job.track}
            </span>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2
              className={`${inter.className} mb-4 text-xl font-semibold`}
            >
              Job Description
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-line text-slate-300 leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>

          {/* Required Skills */}
          <div className="mb-8">
            <h2
              className={`${inter.className} mb-4 text-xl font-semibold`}
            >
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {job.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Application Section - Only show for job seekers */}
          {user?.userType !== "employer" && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6">
              <h3
                className={`${inter.className} mb-4 text-lg font-semibold`}
              >
                Ready to Apply?
              </h3>
              {job.applicationLink ? (
                <motion.a
                  href={job.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-6 py-3 font-semibold text-white shadow-lg transition"
                >
                  Apply Now
                  <ExternalLink className="h-4 w-4" />
                </motion.a>
              ) : (
                <p className="text-sm text-slate-400">
                  Application link not available. Please contact the company
                  directly.
                </p>
              )}
            </div>
          )}
        </motion.article>
      </section>
    </motion.main>
  );
}

