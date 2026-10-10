"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Download,
  Eye,
  Clock,
  Briefcase,
  Building,
  MapPin,
  Filter,
  User,
  GraduationCap,
  ChevronDown,
  Loader2,
} from "lucide-react";
import useToast from "@/hooks/useToast";

export type ApplicationStatusType =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "HIRED"
  | "REJECTED";

export interface ApplicantItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter?: string | null;
  qualification?: string | null;
  experience?: string | null;
  skills?: string | null;
  portfolioUrl?: string | null;
  resumeFileName?: string | null;
  status: ApplicationStatusType;
  createdAt: string;
  updatedAt?: string;
}

export interface JobMeta {
  id: string;
  role: string;
  businessName: string;
  location?: string | null;
  ward: number;
  status: string;
  jobType?: string;
  workMode?: string;
}

interface ApplicantsClientProps {
  job: JobMeta;
  initialApplications: ApplicantItem[];
}

const STATUS_CONFIG: Record<
  ApplicationStatusType,
  { label: string; badgeClass: string; dotClass: string }
> = {
  SUBMITTED: {
    label: "New",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  INTERVIEW: {
    label: "Interview",
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  HIRED: {
    label: "Hired",
    badgeClass: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    dotClass: "bg-teal-500",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
};

export default function ApplicantsClient({
  job,
  initialApplications,
}: ApplicantsClientProps) {
  const toast = useToast();
  const [applications, setApplications] = useState<ApplicantItem[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status Counts
  const counts = useMemo(() => {
    const total = applications.length;
    const newCount = applications.filter((a) => a.status === "SUBMITTED").length;
    const underReview = applications.filter((a) => a.status === "UNDER_REVIEW").length;
    const shortlisted = applications.filter((a) => a.status === "SHORTLISTED").length;
    const interview = applications.filter((a) => a.status === "INTERVIEW").length;
    const hired = applications.filter((a) => a.status === "HIRED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    return { total, newCount, underReview, shortlisted, interview, hired, rejected };
  }, [applications]);

  // Filtered & Sorted Applications
  const filteredApplicants = useMemo(() => {
    let result = [...applications];

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const nameMatch = a.fullName.toLowerCase().includes(q);
        const emailMatch = a.email.toLowerCase().includes(q);
        const phoneMatch = a.phone.includes(q);
        const skillsMatch = a.skills?.toLowerCase().includes(q) || false;
        return nameMatch || emailMatch || phoneMatch || skillsMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "NEWEST" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [applications, statusFilter, searchQuery, sortBy]);

  // Handle status update
  const handleStatusChange = async (
    applicantId: string,
    newStatus: ApplicationStatusType
  ) => {
    const prevStatus = applications.find((a) => a.id === applicantId)?.status;
    if (prevStatus === newStatus) return;

    // Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicantId ? { ...app, status: newStatus } : app
      )
    );
    setUpdatingId(applicantId);

    try {
      const res = await fetch(`/api/jobs/${job.id}/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      toast.success(`Candidate status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}.`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Could not update the application status. Your changes have not been saved.");
      // Rollback
      if (prevStatus) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicantId ? { ...app, status: prevStatus } : app
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-28 md:pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Local Job Vacancies</span>
        </Link>
        <Link
          href={`/jobs/${job.id}`}
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
        >
          <span>View Job Post</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
              Employer Applicant Management
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
              Applicants — {job.role}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1 text-slate-900 dark:text-slate-200">
                <Building size={14} className="text-orange-500" />
                <span>{job.businessName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                <span>{job.location || `Ward ${job.ward}, Avadi`}</span>
              </span>
              {job.jobType && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                    {job.jobType}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                job.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : job.status === "PENDING"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              Vacancy: {job.status}
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">{counts.total}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">New</span>
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">{counts.newCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Shortlisted</span>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{counts.shortlisted}</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-center">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Interview</span>
            <p className="text-lg font-black text-purple-700 dark:text-purple-300">{counts.interview}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicants by name, email, phone, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition shadow-sm"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "NEWEST" | "OLDEST")}
              className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-sm"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("SUBMITTED")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "SUBMITTED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            New ({counts.newCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("UNDER_REVIEW")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "UNDER_REVIEW"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Under Review ({counts.underReview})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("SHORTLISTED")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "SHORTLISTED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Shortlisted ({counts.shortlisted})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INTERVIEW")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "INTERVIEW"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Interview ({counts.interview})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("HIRED")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "HIRED"
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Hired ({counts.hired})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
              statusFilter === "REJECTED"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>
      </div>

      {/* Applicant Cards List */}
      <div className="space-y-4">
        {filteredApplicants.length > 0 ? (
          filteredApplicants.map((app) => {
            const currentStatusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.SUBMITTED;
            const isUpdating = updatingId === app.id;

            return (
              <div
                key={app.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition duration-200"
              >
                {/* Top Row: Name, Status Dropdown, and Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
                      {app.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                        {app.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mt-0.5">
                        <Clock size={12} />
                        <span>Applied {formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status:
                    </label>
                    <div className="relative">
                      <select
                        value={app.status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as ApplicationStatusType)
                        }
                        className={`text-xs font-bold pl-3 pr-8 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 transition appearance-none ${
                          currentStatusCfg.badgeClass
                        } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <option value="SUBMITTED">New</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                      />
                    </div>
                    {isUpdating && <Loader2 size={14} className="animate-spin text-orange-500" />}
                  </div>
                </div>

                {/* Candidate Contact Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone size={14} className="text-orange-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {app.phone}
                    </span>
                    <a
                      href={`tel:${app.phone}`}
                      className="text-[10px] font-black text-orange-600 hover:underline shrink-0 ml-auto"
                    >
                      Call
                    </a>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail size={14} className="text-orange-500 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {app.email}
                    </span>
                    <a
                      href={`mailto:${app.email}`}
                      className="text-[10px] font-black text-orange-600 hover:underline shrink-0 ml-auto"
                    >
                      Email
                    </a>
                  </div>
                </div>

                {/* Experience & Qualifications (if provided) */}
                {(app.qualification || app.experience || app.skills || app.portfolioUrl) && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex flex-wrap gap-3">
                      {app.qualification && (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <GraduationCap size={14} className="text-slate-400 shrink-0" />
                          <span>
                            Qualification: <strong className="font-black">{app.qualification}</strong>
                          </span>
                        </div>
                      )}
                      {app.experience && (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Briefcase size={14} className="text-slate-400 shrink-0" />
                          <span>
                            Experience: <strong className="font-black">{app.experience}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Skills pills */}
                    {app.skills && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Skills:
                        </span>
                        {app.skills.split(",").map((s, idx) => (
                          <span
                            key={`${s.trim()}-${idx}`}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Portfolio / LinkedIn link */}
                    {app.portfolioUrl && (
                      <div className="pt-1">
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          <ExternalLink size={13} />
                          <span>Portfolio / Profile: {app.portfolioUrl}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Cover Letter (if provided) */}
                {app.coverLetter && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Cover Letter / Note:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                      {app.coverLetter}
                    </p>
                  </div>
                )}

                {/* Resume Card & Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Resume file info */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white truncate block">
                        {app.resumeFileName || "Candidate Resume.pdf"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Stored securely
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`/api/jobs/${job.id}/applicants/${app.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                    >
                      <Eye size={13} />
                      <span>View Resume</span>
                    </a>
                    <a
                      href={`/api/jobs/${job.id}/applicants/${app.id}/resume?download=true`}
                      className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : applications.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <User size={24} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              No applications have been received for this job yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              When candidates apply for this vacancy, their profiles, cover letters, and resumes will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Filter size={20} className="text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              No applications match the current filter or search criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="text-xs font-black text-orange-500 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
