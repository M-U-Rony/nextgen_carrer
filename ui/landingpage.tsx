"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";

const steps = [
  {
    title: "Create your profile",
    description:
      "Tell us about your interests, education, and the kind of opportunities you want to explore.",
    icon: "👤",
  },
  {
    title: "Add your skills and goals",
    description:
      "Showcase what you know today and the skills you want to build next to unlock a tailored journey.",
    icon: "🎯",
  },
  {
    title: "Get matched with jobs & courses",
    description:
      "Discover roles, internships, and learning paths that match your strengths, powered by AI insights.",
    icon: "🚀",
  },
];

const features = [
  {
    title: "Personalized Dashboard",
    description:
      "Track your applications, skill progress, and recommended actions in a clean, focused workspace.",
  },
  {
    title: "Smart Job Matching",
    description:
      "Let our AI surface roles and internships aligned with your strengths, goals, and growth plan.",
  },
  {
    title: "Learning Recommendations",
    description:
      "Get curated courses, certificates, and projects that build the skills hiring managers want most.",
  },
  {
    title: "Profile Management",
    description:
      "Keep your portfolio, achievements, and certifications updated with streamlined editing tools.",
  },
];

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const testimonials = [
  {
    quote: "Nextgen Carrer helped me land my first internship!",
    name: "Amina, Software Intern",
  },
  {
    quote: "Now I know exactly what skills to learn next.",
    name: "Jared, Data Science Student",
  },
];

const typingTitle = "Nextgen_Career";

function AnimatedTitle() {
  const letterDelay = 0.09;

  return (
    <motion.h1
      className={`${inter.className} mx-auto mt-20 flex w-full max-w-6xl flex-wrap items-center justify-start gap-2 px-4 text-left text-4xl font-semibold tracking-[0.24em] text-white sm:mt-24 sm:px-6 sm:text-6xl lg:text-7xl`}
      initial="hidden"
      animate="visible"
    >
      {typingTitle.split("").map((char, index) => {
        const isLastCharacter = index === typingTitle.length - 1;

        return (
          <motion.span
            key={`${char}-${index}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * letterDelay,
              duration: 0.42,
              ease: "easeOut",
            }}
            onAnimationComplete={() => {
              if (isLastCharacter) {
                setTimeout(() => {
                  const cursorElement = document.querySelector(
                    "[data-title-cursor]"
                  );

                  if (cursorElement) {
                    cursorElement.classList.remove("opacity-0");
                  }
                }, 120);
              }
            }}
          >
            {char}
          </motion.span>
        );
      })}
      <motion.span
        data-title-cursor
        className="ml-1 inline-block h-8 w-[3px] rounded bg-white cursor-blink opacity-0 sm:ml-2 sm:h-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{
          delay: typingTitle.length * letterDelay + 0.5,
          duration: 1.4,
          repeat: Infinity,
          repeatDelay: 0.6,
        }}
      />
    </motion.h1>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`block ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 17 7-7-7-7" />
      <path d="M4 17h16" />
    </svg>
  );
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="m5 18 .5 1.5L7 20l-1.5.5L5 22l-.5-1.5L3 20l1.5-.5L5 18z" />
      <path d="m19 15 .5 1.5L21 17l-1.5.5L19 19l-.5-1.5L17 17l1.5-.5L19 15z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-950 to-indigo-950">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        </div>

        <AnimatedTitle />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 pb-16 pt-10 sm:gap-16 sm:px-6 sm:pb-20 sm:pt-12 lg:flex-row lg:items-center lg:gap-24 lg:pb-24 lg:pt-16">
          <div className="max-w-xl space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
              <SparkIcon className="h-4 w-4 text-cyan-400" />
              AI-Powered Career Roadmaps
            </span>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Connect Your Skills to Real Opportunities
            </h1>
            <p className="text-base text-slate-200 sm:text-lg">
              Nextgen Carrer helps you discover jobs, learn in-demand skills,
              and build your dream career — all in one place.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/signin"
                className="group inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:px-6 sm:py-3 sm:text-base"
              >
                Get Started
                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/60 hover:text-white sm:px-6 sm:py-3 sm:text-base"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <div className="relative z-10 w-full max-w-lg">
              <div className="absolute inset-0 -translate-y-6 rounded-[2.5rem] bg-linear-to-br from-cyan-400/30 via-indigo-500/20 to-fuchsia-500/30 blur-2xl" />
              <div className="relative rounded-4xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem] sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 backdrop-blur flex items-center justify-center">
                      <SparkIcon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">
                        Matching You With
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        AI-Picked Roles
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                    LIVE
                  </span>
                </div>

                <ul className="mt-8 space-y-5">
                  {[
                    "Product Design Intern",
                    "Data Analyst Fellowship",
                    "Frontend Trainee",
                  ].map((role) => (
                    <li
                      key={role}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-sm transition hover:border-white/20 hover:bg-white/10"
                    >
                      <span>{role}</span>
                      <span className="text-xs text-cyan-300">New</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 grid gap-4 rounded-2xl bg-white/5 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Skills Focus
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Design Thinking
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-3/4 rounded-full bg-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      Confidence
                    </p>
                    <p className="text-sm font-semibold text-white">Level Up</p>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-4/5 rounded-full bg-fuchsia-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Plan, build, and launch your future in three focused steps.
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Nextgen Carrer combines coaching expertise with AI to guide you from
            where you are to where you want to be.
          </p>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map(({ title, description, icon }, index) => (
            <div
              key={title}
              className="group relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition duration-300 hover:-translate-y-2 hover:border-cyan-400/60 hover:shadow-cyan-500/20 sm:p-8"
            >
              <div className="absolute -top-6 left-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-slate-950 font-semibold sm:left-8">
                {index + 1}
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="rounded-2xl bg-cyan-500/10 px-3 py-2 text-xl text-cyan-300">
                  {icon}
                </div>
                <ArrowIcon className="h-5 w-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/5 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Platform Features
              </span>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Everything you need to map your next move.
              </h2>
              <p className="mt-4 text-base text-slate-300">
                From live job insights to guided skill-building, Nextgen Carrer
                keeps you motivated, on track, and connected to what matters
                most.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition duration-300 hover:-translate-y-2 hover:border-cyan-400/60 hover:shadow-cyan-500/20"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {feature.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 opacity-0 transition group-hover:opacity-100">
                    Explore
                    <ArrowIcon className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Trusted by Emerging Talent
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Stories from the community.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.quote}
              className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl transition hover:-translate-y-2 hover:border-cyan-400/50 hover:shadow-cyan-500/20 sm:p-8"
            >
              <p className="text-lg font-semibold text-white">
                “{testimonial.quote}”
              </p>
              <p className="mt-4 text-sm text-slate-300">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative flex justify-center overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-24">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[160%] -translate-x-1/2 bg-linear-to-br from-cyan-500/20 via-blue-500/10 to-fuchsia-500/20 opacity-80 blur-3xl" />
        <div className="relative z-10 w-full max-w-5xl rounded-4xl border border-white/10 bg-slate-900/85 p-8 text-center shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem] sm:p-10 lg:rounded-[3rem] lg:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Your career journey starts today.
          </h2>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Join students and job seekers using Nextgen Carrer to open doors,
            grow skills, and seize the opportunities they deserve.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:px-7 sm:py-3 sm:text-base"
            >
              Join Nextgen Carrer
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80 py-6 text-center sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:px-6">
          <p className="w-full text-center">
            © {new Date().getFullYear()} Nextgen Carrer. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
