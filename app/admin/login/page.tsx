"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Building2,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both administrative email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          adminOnly: true, // 👈 Enforce server-side check that role is ADMIN or SUPER_ADMIN
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Authentication failed. Please verify administrative credentials.",
        );
      }

      setSuccessMessage("Administrative credentials verified. Redirecting to console...");
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 600);
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected error occurred during administrative login.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevQuickFill = () => {
    setEmail("anbuceo@gmail.com");
    setPassword("password123");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-linear-to-b from-indigo-900/30 via-violet-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar with Corporation Name and Theme */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Building2 size={20} />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Avadi City Corporation
            </span>
            <p className="text-[11px] text-slate-400 font-medium">
              Administrative Control Gateway
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Public Resident Portal →
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered Admin Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Outer Card with High-Security Styling */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-950/40 relative">
            {/* Top Security Banner */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 shadow-inner mb-3">
                <ShieldCheck size={28} />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 mb-2">
                Restricted Access
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Admin Panel Login
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Dedicated gateway for Ward Administrators & Super Administrators. Citizen accounts are not permitted.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 rounded-xl bg-rose-950/60 border border-rose-800/80 p-3.5 flex items-start gap-3 text-xs text-rose-200 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-300">Access Denied</p>
                  <p className="mt-0.5 text-rose-200/90">{errorMessage}</p>
                  {errorMessage.includes("citizen") || errorMessage.includes("denied") ? (
                    <Link
                      href="/login"
                      className="mt-2 inline-block font-semibold text-white underline hover:text-rose-200"
                    >
                      Click here for Public Citizen Login →
                    </Link>
                  ) : null}
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3.5 flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrative Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@avadi.gov.in"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Authority...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Administrative Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Dev Button */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleDevQuickFill}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-mono"
              >
                ⚡ Dev: Auto-fill Super Admin (anbuceo@gmail.com)
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldAlert size={12} className="text-amber-500" />
              All login attempts and administrative actions are logged with IP audit trails.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500">
        Avadi City Corporation Municipal Administration Console · Version 2.4-RBAC
      </footer>
    </div>
  );
}
