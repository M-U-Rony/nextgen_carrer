"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_20%_20%,#1e40af55,transparent_60%),radial-gradient(circle_at_80%_30%,#a855f755,transparent_55%),linear-gradient(135deg,#020617,#0f172a)]";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!email || !password) {
      return "Please fill in all fields.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
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
    console.log("Sign In:", { email, password });
    setErrors(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <main
      className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        />
        <motion.div
          className="absolute right-0 top-8 h-72 w-72 rounded-full bg-purple-600/25 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />
      </div>

      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl sm:p-10"
      >
        <div className="mb-8 text-center">
         
          <h1 className={`${inter.className} mt-6 text-2xl font-semibold sm:text-3xl`}>
            Welcome Back to Nextgen_Career
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Sign in to continue your career journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">
              Email
            </label>
            <div className="relative mt-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="peer w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="you@example.com"
              />
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-xl border border-blue-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileFocus={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="peer w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="••••••••"
              />
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-xl border border-blue-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileFocus={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

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
            Sign In
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: success ? 1 : 0, scale: success ? 1 : 0.98 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none mt-4 flex justify-center"
        >
          {success && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200"
            >
              Signed in — welcome back!
            </motion.span>
          )}
        </motion.div>

        <p className="mt-8 text-center text-sm text-slate-300">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="text-blue-300 transition hover:text-blue-200">
            Sign Up
          </Link>
        </p>
      </motion.section>
    </main>
  );
}

