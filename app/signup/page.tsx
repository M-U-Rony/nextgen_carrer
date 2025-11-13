"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useForm, type SubmitHandler, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600", "700"] });

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const backgroundGradient =
  "bg-[radial-gradient(circle_at_15%_25%,#2563eb55,transparent_55%),radial-gradient(circle_at_85%_20%,#9333ea55,transparent_60%),linear-gradient(140deg,#030712,#0f172a)]";

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(8, "Confirm your password"),
    userType: z.union([z.literal("job_seeker"), z.literal("employer")]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (values) =>
      values.userType === "job_seeker" || values.userType === "employer",
    {
      message: "Please select an account type",
      path: ["userType"],
    }
  );

type SignUpValues = z.infer<typeof signUpSchema>;

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
  const [selectedUserType, setSelectedUserType] = useState<
    "job_seeker" | "employer"
  >("job_seeker");
  const submitAttemptedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "job_seeker" as "job_seeker" | "employer",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false, // Prevent auto-focus which can cause issues
  });

  // Sync selectedUserType with form value
  const watchedUserType = watch("userType");
  useEffect(() => {
    if (watchedUserType && watchedUserType !== selectedUserType) {
      setSelectedUserType(watchedUserType);
    }
  }, [watchedUserType, selectedUserType]);

  // Show toast when validation errors appear after submit attempt
  useEffect(() => {
    if (submitAttemptedRef.current && Object.keys(errors).length > 0) {
      const errorMessages = [
        errors.fullName?.message,
        errors.email?.message,
        errors.userType?.message,
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
          userType: values.userType,
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
        router.push("/dashboard");
        router.refresh();
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

  const handleGoogleSignIn = async () => {
    setFormStatus(null);
    try {
      // For OAuth providers, signIn redirects automatically
      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setFormStatus({
        type: "error",
        message:
          "Failed to sign in with Google. Please check your credentials and try again.",
      });
    }
  };

  const onInvalid = (errors: FieldErrors<SignUpValues>) => {
    submitAttemptedRef.current = true;

    // Show toast for the first validation error found
    const errorMessages = [
      errors.fullName?.message,
      errors.email?.message,
      errors.userType?.message,
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl sm:p-10"
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
            className={`${inter.className} mt-6 text-2xl font-semibold sm:text-3xl`}
          >
            Join Nextgen_Career
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
              {...register("fullName")}
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
              {...register("email")}
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

          {/* User Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
          >
            <label className="block text-sm font-medium text-slate-200 mb-3">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedUserType("job_seeker");
                  setValue("userType", "job_seeker");
                }}
                className={`relative rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  selectedUserType === "job_seeker"
                    ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div>Job Seeker</div>
                <div className="text-xs mt-1 opacity-70">
                  Looking for opportunities
                </div>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setSelectedUserType("employer");
                  setValue("userType", "employer");
                }}
                className={`relative rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  selectedUserType === "employer"
                    ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div>Employer</div>
                <div className="text-xs mt-1 opacity-70">Hiring talent</div>
              </motion.button>
            </div>
            <input type="hidden" {...register("userType")} />
            {errors.userType && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.userType.message}
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
                {...register("password")}
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
                {...register("confirmPassword")}
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/70 px-2 text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </div>
        </motion.button>

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
