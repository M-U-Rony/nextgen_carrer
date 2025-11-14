"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useForm, type SubmitHandler } from "react-hook-form";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_20%_20%,#1e40af55,transparent_60%),radial-gradient(circle_at_80%_30%,#a855f755,transparent_55%),linear-gradient(135deg,#020617,#0f172a)]";

type ResetPasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm<ResetPasswordValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchedNewPassword = watch("newPassword");
  const watchedConfirmPassword = watch("confirmPassword");

  // Trigger confirmPassword validation when newPassword changes
  useEffect(() => {
    if (watchedConfirmPassword) {
      trigger("confirmPassword");
    }
  }, [watchedNewPassword, watchedConfirmPassword, trigger]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidatingToken(false);
      setTokenValid(false);
      return;
    }

    // Token validation could be done here if needed
    // For now, we'll validate it when submitting the form
    setIsValidatingToken(false);
    setTokenValid(true);
  }, [token]);

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (values) => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to reset password");
        if (data.error?.includes("expired") || data.error?.includes("Invalid")) {
          // Redirect to forgot password page if token is invalid
          setTimeout(() => {
            router.push("/forgot-password");
          }, 2000);
        }
        return;
      }

      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset password. Please try again.");
    }
  };

  if (isValidatingToken) {
    return (
      <main
        className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
      >
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p>Validating reset link...</p>
        </div>
      </main>
    );
  }

  if (!token || !tokenValid) {
    return (
      <main
        className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
      >
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl sm:p-8 md:p-10"
        >
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10"
            >
              <Lock size={24} className="text-rose-400" />
            </motion.div>
            <h1
              className={`${inter.className} text-2xl font-semibold sm:text-3xl`}
            >
              Invalid Reset Link
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <Link href="/forgot-password">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition"
            >
              Request New Reset Link
            </motion.button>
          </Link>

          <p className="mt-6 text-center text-sm text-slate-300">
            <Link
              href="/signin"
              className="text-blue-300 transition hover:text-blue-200"
            >
              Back to Sign In
            </Link>
          </p>
        </motion.section>
      </main>
    );
  }

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
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl sm:p-8 md:p-10"
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
            <Lock size={24} className="text-blue-400" />
          </motion.div>
          <h1
            className={`${inter.className} text-2xl font-semibold sm:text-3xl`}
          >
            Reset Your Password
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-200"
            >
              New Password
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1
              special character
            </p>
            <div className="relative mt-2">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                {...register("newPassword", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  validate: {
                    hasLowercase: (value) =>
                      /[a-z]/.test(value) ||
                      "Password must contain at least one lowercase letter",
                    hasUppercase: (value) =>
                      /[A-Z]/.test(value) ||
                      "Password must contain at least one uppercase letter",
                    hasSpecial: (value) =>
                      /[^a-zA-Z0-9]/.test(value) ||
                      "Password must contain at least one special character",
                  },
                  onChange: () => {
                    if (watchedConfirmPassword) {
                      trigger("confirmPassword");
                    }
                  },
                })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="••••••••"
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-white"
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-300" />
                ) : (
                  <Eye size={18} className="text-slate-300" />
                )}
              </motion.button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-200"
            >
              Confirm Password
            </label>
            <div className="relative mt-2">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Confirm your password",
                  minLength: {
                    value: 8,
                    message: "Confirm your password",
                  },
                  validate: (value) =>
                    value === watchedNewPassword || "Passwords do not match",
                  onChange: () => trigger("confirmPassword"),
                })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="••••••••"
              />
              <motion.button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} className="text-slate-300" />
                ) : (
                  <Eye size={18} className="text-slate-300" />
                )}
              </motion.button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.confirmPassword.message}
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
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </motion.button>
        </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          className={`${backgroundGradient} relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-white`}
        >
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p>Loading...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
