"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useForm, type SubmitHandler, type FieldErrors } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_15%_25%,#2563eb55,transparent_55%),radial-gradient(circle_at_85%_20%,#9333ea55,transparent_60%),linear-gradient(140deg,#030712,#0f172a)]";

type SignUpValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const submitAttemptedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    trigger,
  } = useForm<SignUpValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: false, // Prevent auto-focus which can cause issues
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  // Trigger confirmPassword validation when password changes
  useEffect(() => {
    if (watchedConfirmPassword) {
      trigger("confirmPassword");
    }
  }, [watchedPassword, watchedConfirmPassword, trigger]);

  // Show toast when validation errors appear after submit attempt
  useEffect(() => {
    if (submitAttemptedRef.current && Object.keys(errors).length > 0) {
      const errorMessages = [
        errors.fullName?.message,
        errors.email?.message,
        errors.password?.message,
        errors.confirmPassword?.message,
      ].filter(Boolean) as string[];

      if (errorMessages.length > 0) {
        toast.error(errorMessages[0], {
          duration: 4000,
        });
        submitAttemptedRef.current = false; // Reset after showing toast
      }
    }
  }, [errors]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
    setTimeout(() => {
      confirmPasswordInputRef.current?.focus();
    }, 0);
  };

  const onSubmit: SubmitHandler<SignUpValues> = async (values) => {
    submitAttemptedRef.current = false; // Reset on successful validation
    setFormStatus(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.fullName,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate email error
        if (data.error && data.error.toLowerCase().includes("already exists")) {
          toast.error(
            "This email is already registered. Please use a different email or sign in."
          );
        } else {
          toast.error(data.error || "Something went wrong. Please try again.");
        }
        setFormStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
        return;
      }

      // Auto sign in after successful signup
      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        toast.success("Account created successfully! Welcome!");
        reset({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        // Use window.location for a full page reload to ensure session is properly loaded
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else {
        toast.success("Account created! Please sign in.");
        setFormStatus({
          type: "success",
          message: "Account created! Please sign in.",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(
        "Something went wrong while creating your account. Please try again."
      );
      setFormStatus({
        type: "error",
        message:
          "Something went wrong while creating your account. Please try again.",
      });
    }
  };


  const onInvalid = (errors: FieldErrors<SignUpValues>) => {
    submitAttemptedRef.current = true;

    // Show toast for the first validation error found
    const errorMessages = [
      errors.fullName?.message,
      errors.email?.message,
      errors.password?.message,
      errors.confirmPassword?.message,
    ].filter(Boolean) as string[];

    if (errorMessages.length > 0) {
      // Show the first error message in a toast
      toast.error(errorMessages[0], {
        duration: 4000,
      });
    } else {
      // Fallback message if no specific error message found
      toast.error("Please fix the highlighted errors to continue.", {
        duration: 4000,
      });
    }

    setFormStatus({
      type: "error",
      message: "Please fix the highlighted errors to continue.",
    });
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl sm:p-8 md:p-10"
      >
        {formStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              formStatus.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {formStatus.message}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1
            className={`${inter.className} mt-4 text-2xl font-semibold sm:text-3xl`}
          >
            Join NextGen Career
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Create your profile and start building your future
          </p>
        </motion.div>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-5"
          noValidate
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-slate-200"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              {...register("fullName", {
                required: "Enter your full name",
                minLength: {
                  value: 2,
                  message: "Enter your full name",
                },
              })}
              onFocus={() => formStatus && setFormStatus(null)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="Alex Johnson"
              aria-invalid={errors.fullName ? "true" : "false"}
            />
            {errors.fullName && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Enter a valid email address",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              onFocus={() => formStatus && setFormStatus(null)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
              placeholder="you@example.com"
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-200"
            >
              Password
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1
              special character
            </p>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
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
                ref={(e) => {
                  register("password").ref(e);
                  passwordInputRef.current = e;
                }}
                onFocus={() => formStatus && setFormStatus(null)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
              />
              <motion.button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-white focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: showPassword ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-slate-300" />
                  ) : (
                    <Eye size={18} className="text-slate-300" />
                  )}
                </motion.div>
              </motion.button>
            </div>
            {errors.password && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.45 }}
          >
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
                    value === watchedPassword || "Passwords do not match",
                  onChange: () => trigger("confirmPassword"),
                })}
                ref={(e) => {
                  register("confirmPassword").ref(e);
                  confirmPasswordInputRef.current = e;
                }}
                onFocus={() => formStatus && setFormStatus(null)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white shadow-inner transition focus:border-blue-400/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                placeholder="••••••••"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
              <motion.button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-white focus:outline-none"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: showConfirmPassword ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} className="text-slate-300" />
                  ) : (
                    <Eye size={18} className="text-slate-300" />
                  )}
                </motion.div>
              </motion.button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </motion.div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            onClick={async () => {
              submitAttemptedRef.current = true;
              // Manually trigger validation to ensure errors are populated
              await trigger();
            }}
            className="relative w-full overflow-hidden rounded-xl bg-linear-to-r from-[#2563EB] to-[#9333EA] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-300">
          Already have an account?{" "}
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
