"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_15%_25%,#2563eb55,transparent_55%),radial-gradient(circle_at_85%_20%,#9333ea55,transparent_60%),linear-gradient(140deg,#030712,#0f172a)]";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      return "Please complete all fields.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setErrors(validationMessage);
      setSuccess(false);
      return;
    }
    console.log("Sign Up:", { fullName, email, password });
    setErrors(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2800);
  };

  return (
    <main
      className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute -top-10 left-10 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2 }}
        />
        <motion.div
          className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-purple-600/30 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.4 }}
        />
      </div>

      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl sm:p-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 text-center"
        >
         
          <h1 className={`${inter.className} mt-6 text-2xl font-semibold sm:text-3xl`}>
            Join Nextgen_Career
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Create your profile and start building your future
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-200">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="Alex Johnson"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
          >
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="••••••••"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.45 }}
          >
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="••••••••"
            />
          </motion.div>

          {errors && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {errors}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#2563EB] to-[#9333EA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Create Account
          </motion.button>
        </form>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={success ? { scale: 1, opacity: 1 } : { opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="pointer-events-none mt-4 flex justify-center"
        >
          {success && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200"
            >
              Account created — welcome aboard!
            </motion.span>
          )}
        </motion.div>

        <p className="mt-8 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-300 transition hover:text-blue-200">
            Sign In
          </Link>
        </p>
      </motion.section>
    </main>
  );
}

