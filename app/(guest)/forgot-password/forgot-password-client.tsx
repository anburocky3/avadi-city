"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useToast from "@/hooks/useToast";

// The complete workflow order:
// Forgot Password → Email → New Password & Confirm Password → OTP Verification → Password Changed Successfully → Login
type Step = "email" | "password" | "otp" | "done";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [demoOtp, setDemoOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isPasswordReuse, setIsPasswordReuse] = useState(false);

  useEffect(() => {
    if (step === "otp" && resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  const isNetworkError = (err: any) => {
    return (
      (typeof navigator !== "undefined" && !navigator.onLine) ||
      err.name === "TypeError" ||
      err.message?.includes("fetch") ||
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("network")
    );
  };

  // STEP 1: ENTER EMAIL
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setApiError("");
    setIsPasswordReuse(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to process email.");
      }

      setStep("password");
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error("📡 Connection trouble! Check your internet and try again.");
        setApiError("📡 Connection trouble! Check your internet and try again.");
      } else {
        setApiError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: CREATE NEW PASSWORD & CONFIRM PASSWORD
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) return;

    // Minimum length requirement
    if (password.length < 6) {
      setApiError("Password must be at least 6 characters long.");
      return;
    }

    // Matching validation (Inline only, strict rule: NO toast for mismatch)
    if (password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setIsPasswordReuse(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.code === "SAME_PASSWORD_REUSE") {
          setIsPasswordReuse(true);
          // SECTION 3.D: Previous Password Reused Toast Notification
          toast.error(
            "😂 Your old password wants a comeback! Give your account something new.",
          );
          setApiError(
            "😂 Your old password wants a comeback! Give your account something new.",
          );
          return;
        }
        throw new Error(result.error || result.message || "Failed to submit new password.");
      }

      // Store resetToken which cryptographically holds the pending password hash
      setResetToken(result.resetToken || "");
      if (result.demoOtp) {
        setDemoOtp(result.demoOtp);
      }

      setOtpValues(["", "", "", ""]);
      setResendCountdown(30);
      setStep("otp");
      try {
        toast.success("Verification code sent to your email.");
      } catch {}
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error("📡 Connection trouble! Check your internet and try again.");
        setApiError("📡 Connection trouble! Check your internet and try again.");
      } else {
        setApiError(err.message || "Failed to submit new password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Resend
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resend: true,
          resetToken,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to resend code.");
      }
      if (result.demoOtp) setDemoOtp(result.demoOtp);
      setResendCountdown(30);
      try {
        toast.success("Verification code resent.");
      } catch {}
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error("📡 Connection trouble! Check your internet and try again.");
        setApiError("📡 Connection trouble! Check your internet and try again.");
      } else {
        setApiError(err.message || "Failed to resend code.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    if (val && index < 3) {
      const nextInput = document.getElementById(`fp-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`fp-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // STEP 3: VERIFY OTP AND COMMIT NEW PASSWORD
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpValues.join("");
    if (code.length !== 4) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
          resetToken,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.code === "INCORRECT_OTP") {
          // SECTION 3.B: Incorrect OTP
          toast.error("🚫 That OTP missed the target! Check the code and try again.");
          setApiError("🚫 That OTP missed the target! Check the code and try again.");
          return;
        }

        if (result.code === "EXPIRED_OTP") {
          // SECTION 3.C: Expired OTP
          toast.error("⏰ This OTP has expired. Request a fresh one and try again.");
          setApiError("⏰ This OTP has expired. Request a fresh one and try again.");
          return;
        }

        throw new Error(result.message || result.error || "Verification failed. Please try again.");
      }

      setStep("done");
      try {
        toast.success(
          "Password changed successfully! 🎉 Your account has a fresh new password.",
        );
      } catch {}
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error("📡 Connection trouble! Check your internet and try again.");
        setApiError("📡 Connection trouble! Check your internet and try again.");
      } else {
        setApiError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const isPasswordValid =
    password.length >= 6 && confirmPassword.length >= 6 && !isPasswordMismatch;

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center sm:py-8 sm:px-4 transition-colors duration-300 font-sans select-none">
      {/* Mobile-App Frame Container */}
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-0 bg-white dark:bg-slate-900 sm:border sm:border-slate-200/80 dark:sm:border-slate-800/80 sm:rounded-[36px] shadow-none sm:shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
        {/* Top App Header */}
        <div className="pt-6 pb-5 px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="AVADI CITY Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase block">
                Resident Portal · Reset Password
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global API Error Alert Banner */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              className={`mx-6 mt-4 p-4 rounded-2xl flex items-start space-x-3 text-xs font-bold transition-all shadow-xs ${
                isPasswordReuse
                  ? "bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isPasswordReuse ? (
                <span className="text-xl select-none shrink-0 mt-0.5" role="img" aria-label="laugh">
                  😂
                </span>
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                {isPasswordReuse && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      Password Reuse Detected 🔐
                    </span>
                  </div>
                )}
                <span className="flex-1 leading-relaxed block font-semibold">
                  {apiError}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-8 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* STEP 1: ENTER EMAIL */}
            {step === "email" && (
              <motion.div
                key="fp-email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Enter Email
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Enter your registered email address to start resetting your password.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setApiError("");
                        }}
                        autoFocus
                        placeholder="your@email.com"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="w-full h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Remembered your password?{" "}
                    <Link
                      href="/login"
                      className="text-primary font-bold hover:underline"
                    >
                      Back to Sign In
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CREATE NEW PASSWORD & CONFIRM PASSWORD */}
            {step === "password" && (
              <motion.div
                key="fp-password-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Create New Password
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setApiError("");
                        setIsPasswordReuse(false);
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Change email
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed truncate max-w-xs">
                    Your email:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      New Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setApiError("");
                          setIsPasswordReuse(false);
                        }}
                        autoFocus
                        placeholder="••••••••"
                        className={`w-full h-12 pl-11 pr-11 rounded-2xl border ${
                          isPasswordReuse
                            ? "border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 focus:ring-amber-400/50"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 focus:ring-primary/50"
                        } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 text-base sm:text-sm font-medium transition`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-r-2xl transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {isPasswordReuse && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pt-1">
                        <span>👉</span> Please choose a fresh, different password.
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setApiError("");
                          setIsPasswordReuse(false);
                        }}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-11 pr-11 rounded-2xl border ${
                          isPasswordMismatch
                            ? "border-rose-400 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 focus:ring-rose-400/50"
                            : isPasswordReuse
                            ? "border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 focus:ring-amber-400/50"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 focus:ring-primary/50"
                        } text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 text-base sm:text-sm font-medium transition`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-r-2xl transition"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* STRICT RULE: Inline validation message only, NO popup */}
                    {isPasswordMismatch && (
                      <p className="text-xs text-rose-500 font-semibold mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setStep("email");
                        setApiError("");
                        setIsPasswordReuse(false);
                      }}
                      className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                      title="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={!isPasswordValid || isSubmitting}
                      className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Verification</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: VERIFY OTP */}
            {step === "otp" && (
              <motion.div
                key="fp-otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Verify OTP
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("password");
                        setApiError("");
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Edit password
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed truncate max-w-xs">
                    Code sent to{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {demoOtp && (
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between px-4">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        Demo Dev Code:
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpValues(demoOtp.split(""))}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black tracking-widest transition shadow-sm cursor-pointer"
                      >
                        {demoOtp} (Click to Fill)
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-center space-x-3 sm:space-x-4 mt-2">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          id={`fp-otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={otpValues[index]}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-13 h-13 sm:w-14 sm:h-14 text-center text-xl font-extrabold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition shadow-xs"
                        />
                      ))}
                    </div>

                    <div className="text-center pt-1">
                      {resendCountdown > 0 ? (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          Resend code in{" "}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {resendCountdown}s
                          </strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleResendCode}
                          className="text-xs text-primary hover:underline font-bold cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? "Resending..." : "Resend Code"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setStep("password");
                        setApiError("");
                      }}
                      className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                      title="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={otpValues.join("").length !== 4 || isSubmitting}
                      className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Update</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: PASSWORD CHANGED SUCCESSFULLY */}
            {step === "done" && (
              <motion.div
                key="fp-done-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 text-center"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Password Changed Successfully
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                    Password changed successfully! 🎉 Your account has a fresh new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom App Footer Shell */}
        <div className="py-4 px-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500">
            back to{" "}
            <Link href="/" className="text-primary hover:underline">
              Home page
            </Link>
          </p>
        </div>
      </div>

      {/* External Desktop Municipal Attribution */}
      <div className="hidden sm:flex mt-6 text-center text-[10px] tracking-widest uppercase font-bold text-slate-400 dark:text-slate-500 flex-col items-center space-y-1">
        <span>© {new Date().getFullYear()} Avadi City Corporation</span>
      </div>
    </div>
  );
}
