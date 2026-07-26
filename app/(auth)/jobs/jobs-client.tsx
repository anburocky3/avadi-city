"use client";

import React, { useState, useMemo } from "react";
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
  jobType?: "Full-Time" | "Part-Time" | "Contract" | string;
  postedTime?: string;
  salary: string;
  location?: string;
  shift?: string;
  contact: string;
  ward: number;
  details: string;
  requirements?: string[];
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
  const t = useTranslations("jobs");
  const { activeWard, userProfile } = useWard();

  const [jobList, setJobList] = useState<JobVacancy[]>(initialJobs);
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
          j.details.toLowerCase().includes(q),
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black transition flex items-center justify-center space-x-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={16} className="stroke-3" />
          <span>{t("postJobBtn")}</span>
        </button>
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
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
        />
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
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {job.jobType || "FULL-TIME"}
                    </span>
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

                {/* Role Title & Business Name */}
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                    {job.role}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-primary mt-1">
                    <Building size={14} className="shrink-0" />
                    <span>{job.businessName}</span>
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

                {/* Requirements Section */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                    {t("requirementsLabel")}:
                  </span>
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
                  <button
                    onClick={(e) => handleApplyNow(job, e)}
                    className="col-span-3 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{t("applyNow")}</span>
                  </button>

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
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:fixed md:bottom-8 md:right-8 px-4 py-3 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center space-x-1.5 shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-800 text-xs font-black"
        title={t("postJobBtn")}
      >
        <Plus size={18} className="stroke-3" />
        <span>{t("postJobShort")}</span>
      </button>

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
