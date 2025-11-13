"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_20%_20%,#1e40af55,transparent_60%),radial-gradient(circle_at_80%_30%,#a855f755,transparent_55%),linear-gradient(135deg,#020617,#0f172a)]";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async (values) => {
    setFormStatus(null);
    try {
      console.log("Reset password requested for:", values.email);
      reset();
      setIsSubmitted(true);
      setFormStatus({
        type: "success",
        message: "If an account exists with this email, you'll receive password reset instructions shortly.",
      });
    } catch (error) {
      console.error(error);
      setFormStatus({
        type: "error",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  const onInvalid = () => {
    setFormStatus({
      type: "error",
      message: "Please enter a valid email address.",
    });
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
        <Link
          href="/signin"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>

        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5"
          >
            <Mail size={24} className="text-blue-400" />
          </motion.div>
          <h1
            className={`${inter.className} text-2xl font-semibold sm:text-3xl`}
          >
            Forgot Password?
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            No worries! Enter your email address and we&rsquo;ll send you a link
            to reset your password.
          </p>
        </div>

        {formStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              formStatus.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {formStatus.message}
          </motion.div>
        )}

        {!isSubmitted ? (
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200"
              >
                Email Address
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  onFocus={() => formStatus && setFormStatus(null)}
                  className="peer w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? "true" : "false"}
                />
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-xl border border-blue-500/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileFocus={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-rose-200" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </motion.button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
              <Mail size={32} className="mx-auto mb-3 text-emerald-300" />
              <p className="text-sm text-emerald-100">
                Check your inbox for password reset instructions.
              </p>
            </div>
            <Link
              href="/signin"
              className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Return to Sign In
            </Link>
          </motion.div>
        )}

        <p className="mt-8 text-center text-sm text-slate-300">
          Remember your password?{" "}
          <Link
            href="/signin"
            className="text-blue-300 transition hover:text-blue-200"
          >
            Sign In
          </Link>
        </p>
      </motion.section>
    </main>
  );
}


