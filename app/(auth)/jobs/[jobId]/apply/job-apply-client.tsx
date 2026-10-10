"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Briefcase,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  GraduationCap,
  Globe,
  Plus,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";

export interface JobDetailSummary {
  id: string;
  role: string;
  businessName: string;
  location?: string;
  salary?: string;
  jobType?: string;
  workMode?: string;
  qualifications?: string;
  details?: string;
}

interface JobApplyClientProps {
  job: JobDetailSummary;
}

const QUALIFICATION_CHOICES = [
  "Prefer not to specify",
  "10th Pass",
  "12th Pass",
  "Diploma",
  "ITI",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
  "Other",
];

export const JobApplyClient: React.FC<JobApplyClientProps> = ({ job }) => {
  const router = useRouter();
  const toast = useToast();
  const { userProfile } = useWard();

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Form State
  const [fullName, setFullName] = useState(userProfile?.name || "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(userProfile?.wardNumber ? "" : "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // State flags
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);

  // Prefill user profile name if authenticated
  useEffect(() => {
    if (userProfile?.name && !fullName) {
      setFullName(userProfile.name);
    }
  }, [userProfile?.name, fullName]);

  // Skill additions
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    if (skills.length >= 10) {
      toast.error("Maximum 10 skills allowed.");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Resume File Selection
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setFieldErrors((prev) => ({
        ...prev,
        resume: "Invalid file format. Please upload PDF, DOC, or DOCX files.",
      }));
      toast.error("Only PDF, DOC, or DOCX files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        resume: "File size exceeds 5MB limit. Please upload a smaller file.",
      }));
      toast.error("Resume file size must be less than 5MB.");
      return;
    }

    setResumeFile(file);
    if (fieldErrors.resume) {
      setFieldErrors((prev) => ({ ...prev, resume: "" }));
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  // Scroll to first invalid field
  const scrollToFirstError = (errorKeys: string[]) => {
    if (!errorKeys || errorKeys.length === 0) return;
    const fieldIdMap: Record<string, string> = {
      fullName: "field-full-name",
      email: "field-email",
      phone: "field-phone",
      resume: "field-resume",
      portfolioUrl: "field-portfolio",
    };

    const firstKey = errorKeys[0];
    const targetId = fieldIdMap[firstKey] || firstKey;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
      if (input) {
        setTimeout(() => input.focus(), 250);
      }
    }
  };

  // Validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (!fullName.trim()) {
      errors.fullName = "Full Name is required.";
      errorKeys.push("fullName");
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full Name must be at least 2 characters.";
      errorKeys.push("fullName");
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
      errorKeys.push("email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
      errorKeys.push("email");
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required.";
      errorKeys.push("phone");
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
      errorKeys.push("phone");
    }

    if (!resumeFile) {
      errors.resume = "Resume / CV file is required (PDF, DOC, or DOCX).";
      errorKeys.push("resume");
    }

    if (portfolioUrl.trim()) {
      if (!portfolioUrl.startsWith("http://") && !portfolioUrl.startsWith("https://")) {
        errors.portfolioUrl = "URL must start with http:// or https://";
        errorKeys.push("portfolioUrl");
      }
    }

    setFieldErrors(errors);
    return { isValid: errorKeys.length === 0, errors: errorKeys };
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors } = validateForm();
    if (!isValid) {
      toast.error("Please fill in all required fields and upload your resume.");
      scrollToFirstError(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.replace(/[^0-9]/g, ""));
      if (resumeFile) formData.append("resume", resumeFile);
      if (coverLetter.trim()) formData.append("coverLetter", coverLetter.trim());
      if (highestQualification) formData.append("qualification", highestQualification);
      if (experienceText.trim()) formData.append("experience", experienceText.trim());
      if (skills.length > 0) formData.append("skills", skills.join(", "));
      if (portfolioUrl.trim()) formData.append("portfolioUrl", portfolioUrl.trim());

      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to submit application.");
        if (data.errors) {
          setFieldErrors((prev) => ({ ...prev, ...data.errors }));
          const firstErrKey = Object.keys(data.errors)[0];
          if (firstErrKey) scrollToFirstError([firstErrKey]);
        }
        return;
      }

      // Success Confirmation
      setIsSubmittedSuccess(true);
      setSubmittedApplicationId(data.applicationId || null);
      toast.success("Application submitted successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SUCCESS SCREEN (Requirement 17)
  // ==========================================
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 transition-colors">
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-10 text-center space-y-6">
            {/* Animated Success Badge */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-500/5 shadow-inner">
              <CheckCircle2 size={44} className="stroke-3" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Application Submitted
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Application Sent Successfully!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Your application for <span className="font-bold text-slate-800 dark:text-slate-200">{job.role}</span> at{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{job.businessName}</span> has been received.
              </p>
            </div>

            {/* Application Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Applicant:</span>
                <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Contact Email:</span>
                <span className="font-bold text-slate-900 dark:text-white">{email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Contact Phone:</span>
                <span className="font-bold text-slate-900 dark:text-white">{phone}</span>
              </div>
              {resumeFile && (
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Resume Attached:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <FileText size={12} />
                    {resumeFile.name}
                  </span>
                </div>
              )}
              {submittedApplicationId && (
                <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <span>Application Reference:</span>
                  <span className="font-mono">{submittedApplicationId.substring(0, 12)}...</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/jobs"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/25 text-center cursor-pointer active:scale-95"
              >
                Back to Job Vacancies
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN APPLICATION FORM
  // ==========================================
  return (
    <div
      ref={formTopRef}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Back to Jobs</span>
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-orange-500">
            Job Application
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Job Header Card */}
        <div className="bg-[#0b1120] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden space-y-3">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <Briefcase size={14} />
            <span>Apply for Vacancy</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Apply for {job.role}
          </h1>

          <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-slate-300 pt-1">
            <div className="flex items-center space-x-1.5">
              <Building size={14} className="text-slate-400" />
              <span className="font-bold text-white">{job.businessName}</span>
            </div>
            {job.location && (
              <div className="flex items-center space-x-1.5">
                <MapPin size={14} className="text-slate-400" />
                <span>{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <DollarSign size={14} />
                <span>{job.salary}</span>
              </div>
            )}
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {job.jobType && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white/10 text-white border border-white/15">
                {job.jobType}
              </span>
            )}
            {job.workMode && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white/10 text-white border border-white/15">
                {job.workMode}
              </span>
            )}
            {job.qualifications && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Qualification: {job.qualifications}
              </span>
            )}
          </div>
        </div>

        {/* Application Form Container */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* SECTION 1: REQUIRED CANDIDATE DETAILS */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Candidate Details</span>
                  <span className="text-xs font-semibold text-rose-500">* Required</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Provide your contact information so the employer can reach you directly.
                </p>
              </div>

              {/* 1. Full Name */}
              <div id="field-full-name" className="space-y-1.5">
                <label
                  htmlFor="full-name-input"
                  className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1"
                >
                  <span>Full Name</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                    }
                  }}
                  placeholder="e.g. Anand Kumar"
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                    fieldErrors.fullName
                      ? "border-rose-500 ring-1 ring-rose-500/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* 2. Email & 3. Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div id="field-email" className="space-y-1.5">
                  <label
                    htmlFor="email-input"
                    className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1"
                  >
                    <span>Email Address</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="e.g. anand@gmail.com"
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                      fieldErrors.email
                        ? "border-rose-500 ring-1 ring-rose-500/30"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div id="field-phone" className="space-y-1.5">
                  <label
                    htmlFor="phone-input"
                    className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1"
                  >
                    <span>Phone Number</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ""));
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                      fieldErrors.phone
                        ? "border-rose-500 ring-1 ring-rose-500/30"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Resume / CV Upload Area (Requirement 8 & 10) */}
              <div id="field-resume" className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>Resume / CV</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    PDF, DOC, DOCX (Max 5 MB)
                  </span>
                </div>

                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeChange}
                  className="hidden"
                  id="resume-file-input"
                />

                {!resumeFile ? (
                  <div
                    onClick={() => resumeInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all hover:border-orange-500/60 hover:bg-orange-500/5 ${
                      fieldErrors.resume
                        ? "border-rose-500 bg-rose-500/5"
                        : "border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1">
                      Upload Resume / CV
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                      Upload PDF, DOC or DOCX (maximum 5 MB)
                    </p>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {resumeFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {(resumeFile.size / 1024).toFixed(0)} KB · Ready to submit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {fieldErrors.resume && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.resume}</span>
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: OPTIONAL APPLICATION DETAILS (Requirement 9) */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-orange-500" />
                  <span>Additional Details</span>
                  <span className="text-xs font-medium text-slate-400">(Optional)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight your qualifications, experience, and skills to help the employer evaluate your profile.
                </p>
              </div>

              {/* Cover Letter / Introduction */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white block">
                  Why are you suitable for this job?
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself, your availability, and why you are interested in this position..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              {/* Highest Qualification */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-orange-500" />
                  <span>Highest Qualification</span>
                </label>
                <select
                  value={highestQualification}
                  onChange={(e) => setHighestQualification(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
                >
                  <option value="">Select your completed qualification</option>
                  {QUALIFICATION_CHOICES.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Relevant Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white block">
                  Relevant Experience
                </label>
                <input
                  type="text"
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  placeholder="e.g. 2 years at supermarket counter or Fresher ready to learn"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              {/* Key Skills */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white block">
                  Key Skills
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Type skill & press Add (e.g. Tally, Billing, Driving)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1.5 text-orange-600/60 dark:text-orange-400/60 hover:text-rose-500 p-0.5 rounded-full cursor-pointer transition"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio / LinkedIn URL */}
              <div id="field-portfolio" className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe size={14} className="text-orange-500" />
                  <span>Portfolio or Profile URL</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => {
                    setPortfolioUrl(e.target.value);
                    if (fieldErrors.portfolioUrl) {
                      setFieldErrors((prev) => ({ ...prev, portfolioUrl: "" }));
                    }
                  }}
                  placeholder="https://linkedin.com/in/yourprofile or portfolio link"
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                    fieldErrors.portfolioUrl
                      ? "border-rose-500 ring-1 ring-rose-500/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.portfolioUrl && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{fieldErrors.portfolioUrl}</span>
                  </p>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON BAR */}
            <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/jobs")}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
