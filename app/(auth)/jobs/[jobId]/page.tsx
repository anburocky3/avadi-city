import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Users,
  Send,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { initialJobsData } from "@/data/jobSpots";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;

  // 1. Check current logged-in user
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;
  let currentUserId: string | null = null;
  if (token) {
    const session = await verifyAuthToken(token);
    if (session?.userId) currentUserId = session.userId;
  }

  // 2. Fetch from database
  let job: any = null;
  try {
    job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });
  } catch (err) {
    console.error("Error looking up job vacancy:", err);
  }

  // Fallback to seed data
  if (!job) {
    const seed = initialJobsData.find((j) => j.id === jobId);
    if (seed) {
      job = {
        id: seed.id,
        role: seed.role,
        businessName: seed.businessName,
        category: "Retail",
        jobType: seed.jobType || "Full-Time",
        workMode: "On-site",
        experience: "0–1 Years",
        salary: seed.salary,
        salaryType: "Per Month",
        details: seed.details,
        requirements: JSON.stringify(seed.requirements || []),
        location: seed.location,
        ward: seed.ward,
        address: seed.location,
        contact: seed.contact,
        status: "APPROVED",
        openings: 1,
        _count: { applications: 0 },
      };
    }
  }

  if (!job) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto text-center space-y-4 pt-16">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Job Vacancy Not Found
        </h1>
        <p className="text-xs text-slate-500">
          The requested job vacancy does not exist or may have expired.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500 text-white text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Return to Job Vacancies</span>
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(currentUserId && job.ownerId && job.ownerId === currentUserId);

  let requirementsList: string[] = [];
  if (job.requirements) {
    try {
      requirementsList = JSON.parse(job.requirements);
    } catch {
      requirementsList = job.requirements.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Local Job Vacancies</span>
        </Link>
      </div>

      {/* Main Job Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
            {job.imageUrl ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs flex items-center justify-center">
                <img
                  src={job.imageUrl}
                  alt={`${job.businessName} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0 flex items-center justify-center">
                <Building size={32} />
              </div>
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  {job.jobType || "Full-Time"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {job.workMode || "On-site"}
                </span>
                {job.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {job.category}
                  </span>
                )}
                {isOwner && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      job.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : job.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    Status: {job.status}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {job.role}
              </h1>

              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Building size={14} className="shrink-0" />
                <span>{job.businessName}</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            {isOwner ? (
              <Link
                href={`/jobs/${job.id}/applicants`}
                className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Users size={16} />
                <span>Manage Applicants</span>
              </Link>
            ) : (
              <Link
                href={`/jobs/${job.id}/apply`}
                className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Send size={15} />
                <span>Apply for this Job</span>
              </Link>
            )}
          </div>
        </div>

        {/* Salary & Location Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <DollarSign size={18} className="shrink-0 stroke-[2.5]" />
            <div>
              <span className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider block">
                Offered Pay
              </span>
              <span className="text-sm font-black">{job.salary}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <MapPin size={18} className="shrink-0 text-slate-400" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Location
              </span>
              <span className="text-xs font-bold">
                {job.location || `Ward ${job.ward}, Avadi`} (Ward {job.ward})
              </span>
            </div>
          </div>
        </div>

        {/* Overview Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {job.experience && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Experience
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{job.experience}</span>
            </div>
          )}
          {job.openings && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Vacancies
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{job.openings} Openings</span>
            </div>
          )}
          {job.shift && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shift / Timings
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{job.shift}</span>
            </div>
          )}
          {job.workingDays && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Working Days
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{job.workingDays}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description & Requirements */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Job Description & Responsibilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
            {job.details}
          </p>
        </div>

        {requirementsList.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
              Requirements & Skills
            </h2>
            <div className="space-y-2">
              {requirementsList.map((req, idx) => (
                <div key={`${req}-${idx}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {job.qualifications && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Minimum Qualification
            </h2>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {job.qualifications}
            </p>
          </div>
        )}

        {/* Address */}
        {job.address && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Detailed Work Address
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {job.address}
            </p>
          </div>
        )}
      </div>

      {/* Contact & Apply Footer */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Employer Contact
          </span>
          <p className="text-sm font-extrabold">{job.contact}</p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link
              href={`/jobs/${job.id}/applicants`}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users size={16} />
              <span>Manage Applicants</span>
            </Link>
          ) : (
            <Link
              href={`/jobs/${job.id}/apply`}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Send size={15} />
              <span>Apply Now</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
