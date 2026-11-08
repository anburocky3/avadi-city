"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Wrench,
  Users,
  Building2,
  Sparkles,
  Loader2,
  ShieldAlert,
  ExternalLink,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GuestFooter } from "@/components/navigation/GuestFooter";

// Form Schema
const contactFormSchema = zod.object({
  fullName: zod.string().min(2, { message: "Full name is required" }),
  email: zod.string().email({ message: "Enter a valid email address" }),
  phone: zod
    .string()
    .regex(/^[6-9]\d{9}$/, { message: "Enter a valid 10-digit mobile number" })
    .optional()
    .or(zod.literal("")),
  category: zod.enum(
    ["technical", "collaboration", "feedback", "civic_issue"],
    {
      error: "Select a category",
    },
  ),
  wardNumber: zod.number().optional(),
  message: zod
    .string()
    .min(10, { message: "Message must be at least 10 characters long" }),
});

type ContactFormData = zod.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      category: "feedback",
      message: "",
    },
  });

  const selectedCategory = watch("category");

  const categories = [
    {
      id: "feedback",
      label: "General Feedback",
      icon: MessageSquare,
      desc: "Share thoughts to improve Avadi City App",
    },
    {
      id: "technical",
      label: "Technical Support",
      icon: Wrench,
      desc: "Report app bugs or login issues",
    },
    {
      id: "collaboration",
      label: "Partnership & Ads",
      icon: Users,
      desc: "List local businesses or volunteer",
    },
    {
      id: "civic_issue",
      label: "Civic Query",
      icon: Building2,
      desc: "Ward administrative inquiries",
    },
  ] as const;

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(result.message);
        reset();
      } else {
        setSubmitError(result.message || "Failed to send message.");
      }
    } catch (err) {
      setSubmitError("Network error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-amber-500/10 dark:bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/60 relative z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src={"/logo.png"}
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
                CONNECTING AVADIANS
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form & Information Grid */}
      <main className="relative z-10 my-auto py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="px-3.5 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest border border-orange-200 dark:border-orange-500/30">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
            We&apos;re Here to Help
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Have feedback, technical issues, or collaboration proposals? Drop us
            a message or reach out directly via official Avadi civic helplines.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Contact & Civic Directory */}
          <div className="lg:col-span-5 space-y-6">
            {/* Official Avadi Municipal Corporation Box */}
            <div className="py-6 px-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-500" />
                  <span>Official Civic Helplines</span>
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
              </div>

              <div className="text-xs flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                  <Users size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-slate-900 dark:text-white block">
                    Merchant & Ad Partnerships
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                    For listing local shops or ward volunteer programs, select
                    the Partnership category.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Municipal HQ */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 dark:text-white block">
                      Avadi City Municipal Corporation
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      Corporation Office, New Military Road (N.M. Road), Avadi,
                      Chennai – 600054
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-3 font-bold">
                      <a
                        href="tel:04426554440"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone size={12} />
                        <span>044-2655 4440</span>
                      </a>
                      <a
                        href="mailto:commr.avadi@tn.gov.in"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Mail size={12} />
                        <span>commr.avadi@tn.gov.in</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Toll-Free Grievance */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <Phone size={16} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Municipal Grievance Line
                    </span>
                  </div>
                  <a
                    href="tel:18004255111"
                    className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black tracking-wide"
                  >
                    1800-425-5111
                  </a>
                </div>

                {/* Police Commissionerate */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      <ShieldAlert size={16} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Avadi Police Control Room
                    </span>
                  </div>
                  <a
                    href="tel:100"
                    className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black tracking-wide"
                  >
                    DIAL 100 / 112
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-6 px-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6"
            >
              {/* Submission Banners */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start space-x-3 text-xs font-bold"
                  >
                    <CheckCircle2
                      size={18}
                      className="shrink-0 mt-0.5 text-emerald-500"
                    />
                    <span>{submitSuccess}</span>
                  </motion.div>
                )}

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start space-x-3 text-xs font-bold"
                  >
                    <AlertCircle
                      size={18}
                      className="shrink-0 mt-0.5 text-rose-500"
                    />
                    <span>{submitError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Category Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Select Inquiry Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setValue("category", cat.id as any, {
                              shouldValidate: true,
                            })
                          }
                          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                            isSelected
                              ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20 shadow-xs"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon size={18} />
                            {isSelected && (
                              <CheckCircle2
                                size={16}
                                className="text-orange-500"
                              />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs leading-tight block">
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block leading-normal">
                              {cat.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Anbu Selvan"
                      {...register("fullName")}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition"
                    />
                    {errors.fullName && (
                      <p className="text-[10px] text-rose-500 font-bold">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition"
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-500 font-bold">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Ward Optional Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      {...register("phone")}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition"
                    />
                    {errors.phone && (
                      <p className="text-[10px] text-rose-500 font-bold">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ward Number (Optional)
                    </label>
                    <select
                      {...register("wardNumber", { valueAsNumber: true })}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition cursor-pointer"
                    >
                      <option value="">Select your Ward (1 to 48)</option>
                      {Array.from({ length: 48 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            Ward {num}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Message / Details *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed feedback, bug steps, or civic inquiry details..."
                    {...register("message")}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition resize-y"
                  />
                  {errors.message && (
                    <p className="text-[10px] text-rose-500 font-bold">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full py-4 px-4 bg-linear-to-r from-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>
                <Link href="/credits" className="block text-center sm:hidden">
                  <small className="text-xs text-slate-500 dark:text-slate-400 font-semibold underline">
                    Who created this?
                  </small>
                </Link>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <GuestFooter />
    </div>
  );
}
