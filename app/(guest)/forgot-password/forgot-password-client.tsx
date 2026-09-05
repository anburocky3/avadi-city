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
} from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useToast from "@/hooks/useToast";

type Step = "email" | "otp" | "reset" | "done";

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

  const [resendCountdown, setResendCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (step === "otp" && resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  // STEP 1: REQUEST RESET CODE
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send verification code.");
      }

      if (result.demoOtp) {
        setDemoOtp(result.demoOtp);
      }

      setOtpValues(["", "", "", ""]);
      setResendCountdown(30);
      setStep("otp");
      try {
        toast.success(`If that email is registered, a code has been sent.`);
      } catch {}
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to resend code.");
      if (result.demoOtp) setDemoOtp(result.demoOtp);
      setResendCountdown(30);
      try {
        toast.success("Verification code resent.");
      } catch {}
    } catch (err: any) {
      setApiError(err.message || "Failed to resend code.");
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

  // STEP 2: VERIFY OTP
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
        body: JSON.stringify({ email, otp: code }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Invalid verification code.");
      }

      setResetToken(result.resetToken);
      setStep("reset");
      try {
        toast.success("Code verified. Set your new password.");
      } catch {}
    } catch (err: any) {
      setApiError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: SET NEW PASSWORD
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (password.length < 6) {
      setApiError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to reset password.");
      }

      setStep("done");
      try {
        toast.success("Password updated successfully.");
      } catch {}
    } catch (err: any) {
      setApiError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center sm:py-8 sm:px-4 transition-colors duration-300 font-sans select-none">
      {/* Mobile-App Frame Container (Matching Login / Get-Started UI) */}
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-2.5 text-rose-600 dark:text-rose-400 text-xs font-bold"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span className="flex-1 leading-snug">{apiError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-8 flex flex-col justify-center">
          <AnimatePresence mode="wait">
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
                    Forgot password?
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Enter your registered email address and we&apos;ll send
                    you a verification code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleRequestCode} className="space-y-5">
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
                        placeholder="your@beautiful.com"
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
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Send Reset Code</span>
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
                      Enter code
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setApiError("");
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Change email
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
                      onClick={() => setStep("email")}
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
                          <span>Verify Code</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.div
                key="fp-reset-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Set new password
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Choose a new password for{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      New Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setApiError("");
                        }}
                        autoFocus
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </span>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setApiError("");
                        }}
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={
                        isSubmitting || !password.trim() || !confirmPassword.trim()
                      }
                      className="w-full h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Update Password</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

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
                    Password updated
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    You can now sign in with your new password.
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
