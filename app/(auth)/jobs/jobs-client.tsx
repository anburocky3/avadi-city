"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Search,
  Phone,
  MapPin,
  Plus,
  Clock,
  CheckCircle2,
  Building,
  Send,
  DollarSign,
  X,
  Users,
  Eye,
  Loader2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shared components path mapping
import { Modal, EmptyState } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface JobVacancy {
  id: string;
  role: string;
  businessName: string;
  category?: string;
  jobType?: "Full-Time" | "Part-Time" | "Contract" | string;
  workMode?: string;
  postedTime?: string;
  salary: string;
  location?: string;
  shift?: string;
  contact: string;
  ward: number;
  details: string;
  requirements?: string[];
  qualifications?: string;
  status?: string;
  totalApplications?: number;
  newApplications?: number;
  ownerId?: string;
  imageUrl?: string | null;
}

export interface JobsClientProps {
  initialJobs: JobVacancy[];
}

// Job Form Zod Schema
const jobSchema = zod.object({
  role: zod
    .string()
    .min(4, { message: "Role title must be at least 4 characters long" }),
  businessName: zod
    .string()
    .min(3, { message: "Business Name must be at least 3 characters long" }),
  salary: zod
    .string()
    .min(3, { message: "Salary range is required (e.g. ₹12,000 - ₹15,000)" }),
  shift: zod
    .string()
    .min(3, { message: "Shift timing is required (e.g. 9 AM - 6 PM)" }),
  contact: zod.string().regex(/^[6-9]\d{9}$/, {
    message: "Must enter a valid 10-digit mobile number",
  }),
  details: zod
    .string()
    .min(10, { message: "Add a brief description of requirements & criteria" }),
});

type JobFormData = zod.infer<typeof jobSchema>;

export const JobsClient: React.FC<JobsClientProps> = ({ initialJobs }) => {
  const router = useRouter();
  const t = useTranslations("jobs");
  const { activeWard, userProfile, isAuthenticated } = useWard();

  const [activeTab, setActiveTab] = useState<"explore" | "my-jobs">("explore");
  const [myJobs, setMyJobs] = useState<JobVacancy[]>([]);
  const [isLoadingMyJobs, setIsLoadingMyJobs] = useState<boolean>(false);
  const [hasLoadedMyJobs, setHasLoadedMyJobs] = useState<boolean>(false);

  const fetchMyJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingMyJobs(true);
    try {
      const res = await fetch("/api/jobs?my=true");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMyJobs(json.data);
      }
    } catch (err) {
      console.error("Failed to load user jobs:", err);
    } finally {
      setIsLoadingMyJobs(false);
      setHasLoadedMyJobs(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "my-jobs" && !hasLoadedMyJobs && isAuthenticated) {
      fetchMyJobs();
    }
  }, [activeTab, hasLoadedMyJobs, isAuthenticated, fetchMyJobs]);

  const [jobList, setJobList] = useState<JobVacancy[]>(() => {
    const seen = new Set<string>();
    return (initialJobs || []).filter((j) => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });
  });

  useEffect(() => {
    const seen = new Set<string>();
    setJobList(
      (initialJobs || []).filter((j) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      })
    );
  }, [initialJobs]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All");

  // Post modal & toast states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [justPostedIds, setJustPostedIds] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Job Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    mode: "onChange",
    defaultValues: {
      role: "",
      businessName: "",
      salary: "",
      shift: "",
      contact: userProfile?.wardNumber.toString() || "",
      details: "",
    },
  });

  // Filter jobs by search keyword & active type filter
  const filteredJobs = useMemo(() => {
    let list = jobList;

    if (activeTypeFilter !== "All") {
      list = list.filter(
        (j) =>
          (j.jobType &&
            j.jobType.toLowerCase() === activeTypeFilter.toLowerCase()) ||
          (j.category &&
            j.category.toLowerCase() === activeTypeFilter.toLowerCase()) ||
          (j.role &&
            j.role.toLowerCase().includes(activeTypeFilter.toLowerCase())),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(q) ||
          j.businessName.toLowerCase().includes(q) ||
          j.details.toLowerCase().includes(q) ||
          (j.category && j.category.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [jobList, searchQuery, activeTypeFilter]);

  const handleApplyNow = (item: JobVacancy, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMsg(
      `Submitting instant application for "${item.role}" at ${item.businessName}...`,
    );
    setTimeout(() => {
      window.location.href = `tel:${item.contact}`;
      setActionMsg(null);
    }, 1200);
  };

  const handleCallDirect = (item: JobVacancy, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${item.contact}`;
  };

  const handleJobSubmit = (data: JobFormData) => {
    const newId = `job-${Date.now()}`;
    const newJob: JobVacancy = {
      id: newId,
      role: data.role,
      businessName: data.businessName,
      jobType: "Full-Time",
      postedTime: "Just Now",
      salary: data.salary,
      location: `Ward ${activeWard.id}, Avadi`,
      shift: data.shift,
      contact: data.contact,
      ward: activeWard.id,
      details: data.details,
      requirements: data.details
        .split(".")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };

    setJobList((prev) => [newJob, ...prev]);

    // Track newly posted ID
    setJustPostedIds((prev) => [...prev, newId]);
    setTimeout(() => {
      setJustPostedIds((prev) => prev.filter((id) => id !== newId));
    }, 6000);

    reset();
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none flex items-center gap-2">
            <Briefcase className="text-primary" size={24} />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <Link
          href="/jobs/create"
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black transition flex items-center justify-center space-x-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={16} className="stroke-3" />
          <span>{t("postJobBtn")}</span>
        </Link>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("explore")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "explore"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Briefcase size={14} />
          <span>Explore Vacancies</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("my-jobs");
            if (!hasLoadedMyJobs) fetchMyJobs();
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === "my-jobs"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users size={14} />
          <span>My Job Postings</span>
          {myJobs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
              {myJobs.length}
            </span>
          )}
        </button>
      </div>

      {/* 1. Explore Jobs View */}
      {activeTab === "explore" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Full-Time", "Part-Time", "Contract"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTypeFilter === type
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {type === "All" ? t("types.all") : type}
              </button>
            ))}
          </div>

          {/* Toast Action Msg */}
          <AnimatePresence>
            {actionMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-slate-950 text-white border-2 border-primary rounded-2xl text-center text-xs font-black animate-pulse shadow-xl"
              >
                {actionMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Listings List */}
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const isJustPosted = justPostedIds.includes(job.id);
                const reqList = job.requirements || [
                  "10th / 12th Pass qualification",
                  "Basic computer & operational knowledge",
                  job.shift || "Day shift timing",
                ];

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all duration-300 space-y-4 shadow-sm hover:shadow-md ${
                      isJustPosted
                        ? "ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-500/10"
                        : "border-slate-200/90 dark:border-slate-800"
                    }`}
                  >
                    {/* Top Badge & Posted Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          {job.jobType || "FULL-TIME"}
                        </span>
                        {job.category && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {job.category}
                          </span>
                        )}
                        {isJustPosted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-600 text-white font-black uppercase animate-bounce">
                            <CheckCircle2 size={10} className="mr-1" />
                            {t("justPosted")}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {job.postedTime || t("today")}
                      </span>
                    </div>

                    {/* Role Title, Business Name & Company Logo / Job Poster */}
                    <div className="flex items-start gap-3.5">
                      {job.imageUrl ? (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs flex items-center justify-center">
                          <img
                            src={job.imageUrl}
                            alt={`${job.businessName} logo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0 flex items-center justify-center">
                          <Building size={24} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                          {job.role}
                        </h3>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-primary mt-1">
                          <Building size={14} className="shrink-0" />
                          <span className="truncate">{job.businessName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Salary & Location Box */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-sm font-black text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={16} className="shrink-0 stroke-[2.5]" />
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        <span>
                          {job.location || `Market Road, Avadi (Ward ${job.ward})`}
                        </span>
                      </div>
                    </div>

                    {/* Requirements & Qualification Section */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                          {t("requirementsLabel")}:
                        </span>
                        {job.qualifications && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Qualification: {job.qualifications}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {reqList.map((req, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-primary shrink-0"
                            />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="grid grid-cols-4 gap-2.5 pt-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="col-span-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200/80 dark:border-slate-700"
                        title="View Job Details"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">View</span>
                      </Link>

                      <Link
                        href={`/jobs/${job.id}/apply`}
                        className="col-span-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <Send size={14} />
                        <span>Apply</span>
                      </Link>

                      <button
                        onClick={(e) => handleCallDirect(job, e)}
                        className="col-span-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-primary dark:text-primary rounded-2xl text-xs font-black transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200/80 dark:border-slate-700"
                        title={t("callRecruiter")}
                      >
                        <Phone size={14} />
                        <span>{t("call")}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <EmptyState
                icon={Briefcase}
                title={t("emptyTitle")}
                description={t("emptyDesc")}
                actionText={t("postJobBtn")}
                onAction={() => router.push("/jobs/create")}
              />
            )}
          </div>
        </div>
      )}

      {/* 2. My Job Postings View */}
      {activeTab === "my-jobs" && (
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                <Lock size={22} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Sign in to view your postings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You must be logged in to manage your posted job vacancies and view candidate applications.
              </p>
              <Link
                href="/login?redirect=/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black transition shadow-md"
              >
                <span>Sign In to Continue</span>
              </Link>
            </div>
          ) : isLoadingMyJobs && !hasLoadedMyJobs ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Loader2 size={24} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading your job vacancies...</p>
            </div>
          ) : myJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="You haven't posted any job vacancies yet."
              description="Post a job vacancy to connect with candidates in Avadi."
              actionText="Post a Job Vacancy"
              onAction={() => router.push("/jobs/create")}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-bold">
                  {myJobs.length} {myJobs.length === 1 ? "Job Vacancy" : "Job Vacancies"} Posted
                </span>
                <button
                  type="button"
                  onClick={fetchMyJobs}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {myJobs.map((job) => {
                const totalApps = job.totalApplications ?? 0;
                const newApps = job.newApplications ?? 0;

                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {job.imageUrl ? (
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs flex items-center justify-center">
                            <img
                              src={job.imageUrl}
                              alt={`${job.businessName} logo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0 flex items-center justify-center">
                            <Building size={20} />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              {job.jobType || "Full-Time"}
                            </span>
                            {job.category && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {job.category}
                              </span>
                            )}
                            {job.workMode && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {job.workMode}
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                            {job.role}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary mt-0.5">
                            <Building size={14} className="shrink-0" />
                            <span className="truncate">{job.businessName}</span>
                            <span className="text-slate-400 font-normal">•</span>
                            <span className="text-slate-500 font-medium truncate">
                              {job.location || `Ward ${job.ward}, Avadi`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                          job.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : job.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {job.status === "APPROVED"
                          ? "Approved / Live"
                          : job.status === "PENDING"
                          ? "Pending Approval"
                          : "Rejected"}
                      </span>
                    </div>

                    {/* Applications Count Strip */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          Applications: {totalApps}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span
                          className={`font-bold ${
                            newApps > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-500"
                          }`}
                        >
                          New: {newApps}
                        </span>
                      </div>
                      {newApps > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                          {newApps} Unreviewed
                        </span>
                      ) : null}
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <Link
                        href={`/jobs/${job.id}/applicants`}
                        className="py-2.5 px-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Users size={14} />
                        <span>Manage Applicants</span>
                      </Link>

                      <Link
                        href={`/jobs/${job.id}`}
                        className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>View Job</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* POST JOB MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("modalTitle")}
      >
        <form
          onSubmit={handleSubmit(handleJobSubmit)}
          className="space-y-4 pt-1"
        >
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Job Role Title *
            </label>
            <input
              type="text"
              {...register("role")}
              placeholder="e.g. Billing Executive / Store Assistant"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
            />
            {errors.role && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.role.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Business / Shop Name *
            </label>
            <input
              type="text"
              {...register("businessName")}
              placeholder="e.g. Sri Balaji Supermarket"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
            />
            {errors.businessName && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Salary Range *
              </label>
              <input
                type="text"
                {...register("salary")}
                placeholder="e.g. ₹12,000 - ₹15,000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
              />
              {errors.salary && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {errors.salary.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Shift Timings *
              </label>
              <input
                type="text"
                {...register("shift")}
                placeholder="e.g. 9:00 AM - 6:00 PM"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
              />
              {errors.shift && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {errors.shift.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Contact Mobile *
            </label>
            <input
              type="tel"
              {...register("contact")}
              placeholder="10-digit mobile number"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
            />
            {errors.contact && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.contact.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Requirements & Criteria *
            </label>
            <textarea
              rows={3}
              {...register("details")}
              placeholder="Describe candidate requirements: min 10th pass, basic computer knowledge, food provided..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 dark:text-white"
            />
            {errors.details && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.details.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
          >
            Publish Job Vacancy
          </button>
        </form>
      </Modal>
    </div>
  );
};
