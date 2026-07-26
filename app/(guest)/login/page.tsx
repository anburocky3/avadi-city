"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Key,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 2-Step Login Navigation: "email" -> "password"
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // API & Network States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // STEP 1: CHECK IF EMAIL EXISTS
  const handleCheckEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong during lookup.");
      }

      if (data.exists) {
        setStep("password");
      } else {
        // Unknown email -> Automatically redirect to get-started with prefilled query param
        router.push(`/get-started?email=${encodeURIComponent(email.trim())}`);
      }
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: AUTHENTICATE PASSWORD & LOGIN
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials provided.");
      }

      // Update React Query auth cache instantly
      queryClient.setQueryData(["authUser"], data.user);
      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      setApiError(err.message || "Sign in failed. Please check your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center sm:py-8 sm:px-4 transition-colors duration-300 font-sans select-none">
      {/* Mobile-App Frame Container (Matching Get-Started UI) */}
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-0 bg-white dark:bg-slate-900 sm:border sm:border-slate-200/80 dark:sm:border-slate-800/80 sm:rounded-[36px] shadow-none sm:shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
        {/* Top App Header */}
        <div className="pt-6 pb-5 px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={"/logo.png"}
                alt="AVADI CITY Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase block">
                Resident Portal · Sign In
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
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
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    Enter your registered email address to access your ward
                    account.
                  </p>
                </div>

                <form onSubmit={handleCheckEmail} className="space-y-5">
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
                        placeholder="yourname@example.com"
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
                          <span>Continue</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/get-started"
                      className="text-primary font-bold hover:underline"
                    >
                      Register now
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="password-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Enter password
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
                    Signing in as{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Key size={18} />
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setApiError("");
                        }}
                        placeholder="••••••••"
                        className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-sm font-medium transition"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setStep("email");
                        setApiError("");
                      }}
                      className="h-13 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-sm flex items-center justify-center cursor-pointer"
                      title="Back"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !password.trim()}
                      className="flex-1 h-13 bg-primary hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center space-x-2 text-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
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
