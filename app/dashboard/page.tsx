"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useMemo, type FC } from "react";

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

const user = {
  name: "Ayesha Rahman",
  email: "ayesha@example.com",
  education: "BSc in Computer Science",
  experienceLevel: "Fresher",
  preferredTrack: "Web Development",
  skills: ["JavaScript", "React", "HTML", "CSS", "TailwindCSS", "TypeScript"],
  profileCompletion: 72,
};

const recommendedJobs = [
  {
    id: "job-1",
    title: "Frontend Developer Intern",
    company: "TechNova Labs",
    type: "Internship",
    location: "Remote",
    matchedSkills: ["React", "TypeScript", "CSS"],
    matchScore: 86,
  },
  {
    id: "job-2",
    title: "Junior UI Engineer",
    company: "BrightSpark Studios",
    type: "Full-time",
    location: "Dhaka, Bangladesh",
    matchedSkills: ["JavaScript", "HTML", "TailwindCSS"],
    matchScore: 78,
  },
  {
    id: "job-3",
    title: "Associate Web Specialist",
    company: "FutureWorks",
    type: "Full-time",
    location: "Hybrid",
    matchedSkills: ["React", "Next.js", "TypeScript"],
    matchScore: 81,
  },
];

const learningResources = [
  {
    id: "lr-1",
    title: "Advanced React Patterns",
    platform: "Frontend Masters",
    cost: "Paid",
    skills: ["React", "Hooks", "Performance"],
    url: "https://frontendmasters.com/",
  },
  {
    id: "lr-2",
    title: "TypeScript Essentials",
    platform: "Scrimba",
    cost: "Free",
    skills: ["TypeScript", "JavaScript"],
    url: "https://scrimba.com/",
  },
  {
    id: "lr-3",
    title: "Design Systems with TailwindCSS",
    platform: "Egghead",
    cost: "Paid",
    skills: ["TailwindCSS", "Design Systems"],
    url: "https://egghead.io/",
  },
];

const skillsUsage = [
  { label: "React", percent: 78, color: "from-blue-500 to-blue-400" },
  { label: "TypeScript", percent: 65, color: "from-violet-500 to-purple-500" },
  { label: "TailwindCSS", percent: 54, color: "from-sky-500 to-cyan-500" },
  { label: "HTML", percent: 92, color: "from-orange-500 to-amber-500" },
  { label: "CSS", percent: 88, color: "from-emerald-500 to-teal-500" },
];

const gradientBackground =
  "bg-[radial-gradient(circle_at_20%_20%,#2563EB22,transparent_55%),radial-gradient(circle_at_80%_0%,#9333EA22,transparent_60%),linear-gradient(115deg,#020617,#0f172a)]";

const DashboardPage: FC = () => {
  const skillsColumns = useMemo(() => {
    const midpoint = Math.ceil(user.skills.length / 2);
    return [user.skills.slice(0, midpoint), user.skills.slice(midpoint)];
  }, []);

  return (
    <motion.main
      variants={pageFade}
      initial="hidden"
      animate="visible"
      className={`${gradientBackground} min-h-screen text-white`}
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className={`${inter.className} text-lg font-semibold tracking-[0.3em] uppercase text-white`}
          >
            Nextgen_Career
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6">
            {["Dashboard", "Jobs", "Resources", "Profile", "Logout"].map(
              (item) => (
                <Link
                  key={item}
                  href={item === "Dashboard" ? "/dashboard" : "#"}
                  className="group relative px-1"
                >
                  <span className="transition group-hover:text-blue-200">
                    {item}
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-[-6px] h-0.5 origin-center scale-x-0 rounded-full bg-linear-to-r from-[#2563EB] to-[#9333EA] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
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
                    src="https://i.pravatar.cc/120?img=5"
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
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-900/40 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Edit Profile
              </motion.button>
            </div>

            <div className="mt-6 grid gap-4 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Education
                </p>
                <p className="mt-1">{user.education}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Experience Level
                </p>
                <p className="mt-1">{user.experienceLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Preferred Track
                </p>
                <p className="mt-1">{user.preferredTrack}</p>
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
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-white/30"
              >
                + Add Skill
              </motion.button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {skillsColumns.map((column, columnIndex) => (
                <div
                  key={`column-${columnIndex}`}
                  className="flex flex-wrap gap-2"
                >
                  {column.map((skill) => (
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h4 className="text-sm font-semibold text-white/90">
                Top Skill Usage
              </h4>
              <div className="mt-4 space-y-3">
                {skillsUsage.map((skill) => (
                  <div key={skill.label}>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{skill.label}</span>
                      <span>{skill.percent}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full bg-linear-to-r ${skill.color}`}
                        style={{ width: `${skill.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              href="#"
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              View all jobs →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedJobs.map((job, index) => (
              <motion.article
                key={job.id}
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
                    {job.type} • {job.location}
                  </p>
                </header>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                  {job.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white/10 px-3 py-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Match Score</span>
                    <span>{job.matchScore}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-[#2563EB] via-indigo-500 to-[#9333EA]"
                      style={{ width: `${job.matchScore}%` }}
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40"
                >
                  View Details
                </motion.button>
              </motion.article>
            ))}
          </div>
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
              href="#"
              className="text-sm text-blue-300 transition hover:text-blue-200"
            >
              See all resources →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {learningResources.map((resource) => (
              <motion.article
                key={resource.id}
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                  {resource.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white/10 px-3 py-1"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <motion.a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-2 text-sm font-semibold text-white transition"
                >
                  Go to Course
                </motion.a>
              </motion.article>
            ))}
          </div>
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
      </section>

      <footer className="border-t border-white/10 bg-slate-950/70 py-6 text-sm text-slate-400 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <p>© 2025 Nextgen_Career. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="#" className="transition hover:text-white">
              About
            </Link>
            <Link href="#" className="transition hover:text-white">
              Contact
            </Link>
            <Link href="#" className="transition hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </motion.main>
  );
};

export default DashboardPage;
