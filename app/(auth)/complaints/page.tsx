"use client";

import React, { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Trash2,
  Lightbulb,
  HelpCircle,
  Droplet,
  AlertTriangle,
  MapPin,
  Plus,
  ThumbsUp,
  Camera,
  Check,
  ArrowLeft,
  ArrowRight,
  Wrench,
  Bell,
  Building2,
  FileText,
  PlusCircle,
  Crown,
  UserCheck,
  Phone,
  Mail,
  Building,
  Zap,
  Link,
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

// Adjust path aliases according to your Next.js project structure
import { useWard } from "@/context/wardContext";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useWardAdminProfile } from "@/hooks/useWardAdminProfile";

// --- TYPESCRIPT INTERFACES & TYPES ---

export type ComplaintCategory =
  | "Garbage/Sanitation"
  | "Streetlights"
  | "Roads/Potholes"
  | "Drainage/Sewage"
  | "Water Supply"
  | "Others";

export interface Complaint {
  id: number | string;
  issueId?: string;
  title: string;
  description: string;
  category: ComplaintCategory | string;
  ward: string | number;
  address?: string;
  status: "Submitted" | "Acknowledged" | "In Progress" | "Resolved" | string;
  imageUrl?: string;
  upvotes: number;
  author?: string;
  date: string;
  isUserSubmitted?: boolean;
}

export interface GuideStep {
  stepTag: string;
  title: string;
  desc: string;
  icon: LucideIcon | React.ElementType;
  illustrationBg: string;
}

export interface VisualCategoryItem {
  id: ComplaintCategory;
  title: string;
  desc: string;
  badge: string;
  image: string;
  gradient: string;
  icon: LucideIcon | React.ElementType;
}

export interface CategoryConfigItem {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon | React.ElementType;
}

// --- STATIC DATA & DIRECTORIES ---

// MLA should have political info but others are administrators with official contact details. This directory can be expanded as needed.
export interface AdminModalData {
  title: string;
  role: string;
  name: string;
  phone: string;
  email: string;
  office: string;
  timings: string;
  badgeBg: string;
  icon: LucideIcon | React.ElementType;
  avatar?: string;
  deputy?: {
    name: string;
    phone: string;
    avatar?: string;
  };
  party?: string;
  partyStyle?: string;
  department?: string;
  jurisdiction?: string;
}

export const OFFICIALS_DIRECTORY: Record<string, AdminModalData> = {
  mla: {
    title: "MLA of Avadi Constituency",
    role: "Avadi Constituency (MLA)",
    name: "Hon. R. Ramesh Kumar",
    avatar: "/img/officials/avadi-mla.jpg",
    party: "TVK",
    partyStyle:
      "bg-linear-to-r from-red-900 to-red-950 text-amber-300 border border-amber-400/40 shadow-sm",
    jurisdiction: "Avadi Assembly Constituency (TN-006)",
    phone: "+91 44 2638 5555",
    email: "mla.avadi@tn.gov.in",
    office: "Avadi MLA Constituency Office, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Sat: 10:00 AM - 6:00 PM",
    badgeBg: "from-emerald-600 to-teal-700",
    icon: Building,
  },
  mayor: {
    title: "Mayor of Avadi Corporation",
    role: "Mayor",
    name: "Thiru.G.Udhayakumar",
    avatar: "/img/officials/avadi-mayor.jpeg",
    deputy: {
      name: "Thiru.S.Suryakumar",
      phone: "+919382222323",
      avatar: "/img/officials/avadi-deputy-mayor.jpeg",
    },
    department: "Avadi Corporation Office",
    jurisdiction: "All 48 Wards · Avadi Corporation",
    phone: "+919710086560",
    email: "commr.avadi@tn.gov.in",
    office: "Avadi Corporation Building, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
    badgeBg: "from-amber-500 to-orange-600",
    icon: Building2,
  },
  commissioner: {
    title: "Corporation Commissioner",
    role: "Commissioner",
    name: "Tmt.R.SARANYA, IAS",
    avatar: "/img/officials/avadi-comissioner.jpeg",
    department: "Avadi Corporation Office",
    jurisdiction: "All 48 Wards · Avadi Corporation",
    phone: "+91 044-26554440",
    email: "commr.avadi@tn.gov.in",
    office: "Avadi Corporation Building, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
    badgeBg: "from-amber-500 to-orange-600",
    icon: Crown,
  },
  eb: {
    title: "TANGEDCO / EB Electricity Board",
    role: "Power & Electricity Utility",
    name: "Avadi EB Executive Engineer Office",
    department: "TANGEDCO West Zone",
    phone: "1912 / +91 44 2638 0111",
    email: "ae.eb.avadi@tnebltd.gov.in",
    office: "TNEB Sub-Station Office, CTH Road, Avadi, Chennai - 600054",
    timings: "24x7 Power Emergency / Helpline 1912",
    badgeBg: "from-yellow-500 to-amber-600",
    icon: Zap,
  },
  corporationHQ: {
    title: "Avadi Municipal Corporation Info",
    role: "Civic Head Office",
    name: "Grievance Redressal & HQ Portal",
    department: "Public Grievance Cell",
    phone: "1800-425-5111 / +91 44 2638 0222",
    email: "commr.avadi@tn.gov.in",
    office:
      "Avadi Municipal Corporation Headquarters, New Military Road, Avadi - 600054",
    timings: "Mon - Sat: 9:00 AM - 5:30 PM (Toll-Free 24x7)",
    badgeBg: "from-cyan-600 to-blue-700",
    icon: Building2,
  },
};

const categoryConfig: Record<string, CategoryConfigItem> = {
  "Garbage/Sanitation": {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/50",
    icon: Trash2,
  },
  Streetlights: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/50",
    icon: Lightbulb,
  },
  "Roads/Potholes": {
    bg: "bg-slate-100 dark:bg-slate-800/80",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700/50",
    icon: AlertTriangle,
  },
  "Drainage/Sewage": {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900/50",
    icon: AlertTriangle,
  },
  "Water Supply": {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/50",
    icon: Droplet,
  },
  Others: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900/50",
    icon: HelpCircle,
  },
};

const complaintGuideSteps: GuideStep[] = [
  {
    stepTag: "STEP 1 OF 4 · SELECT",
    title: "Choose Issue Category",
    desc: "Pick from Sanitation, Roads, Electricity, Water or Streetlights.",
    icon: PlusCircle,
    illustrationBg: "from-orange-500 to-amber-500",
  },
  {
    stepTag: "STEP 2 OF 4 · EVIDENCE",
    title: "Provide Location & Photos",
    desc: "Attach up to 3 photos and a clear spot landmark description.",
    icon: Camera,
    illustrationBg: "from-blue-600 to-cyan-600",
  },
  {
    stepTag: "STEP 3 OF 4 · TRACKING",
    title: "Instant Grievance ID",
    desc: "Receive a unique Tracking ID to monitor resolution status.",
    icon: ShieldCheck,
    illustrationBg: "from-purple-600 to-indigo-600",
  },
  {
    stepTag: "STEP 4 OF 4 · ACTION",
    title: "Zonal Action & Proof",
    desc: "Ward Officer resolves the problem and logs completion proof.",
    icon: CheckCircle2,
    illustrationBg: "from-emerald-600 to-teal-600",
  },
];

const visualCategories: VisualCategoryItem[] = [
  {
    id: "Garbage/Sanitation",
    title: "Garbage & Sanitation",
    desc: "Overflowing bins, uncollected waste & street cleaning",
    badge: "Sanitation",
    image:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
    gradient: "from-emerald-600 to-teal-700",
    icon: Trash2,
  },
  {
    id: "Streetlights",
    title: "Streetlights & Electrical",
    desc: "Non-functional lights, dark stretches & pole damage",
    badge: "Electricity",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
    gradient: "from-amber-500 to-orange-600",
    icon: Zap,
  },
  {
    id: "Roads/Potholes",
    title: "Roads & Potholes",
    desc: "Deep potholes, damaged tar roads & broken pavers",
    badge: "Road Works",
    image:
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80",
    gradient: "from-slate-700 to-slate-900",
    icon: AlertTriangle,
  },
  {
    id: "Drainage/Sewage",
    title: "Drainage & Sewage",
    desc: "Blocked storm drains, sewage leaks & manhole repairs",
    badge: "Sewage",
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop&q=80",
    gradient: "from-orange-600 to-amber-700",
    icon: Droplet,
  },
  {
    id: "Water Supply",
    title: "Water Supply & Leakage",
    desc: "Pipeline bursts, low pressure & dirty drinking water",
    badge: "Water Board",
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4e?w=800&auto=format&fit=crop&q=80",
    gradient: "from-blue-600 to-cyan-600",
    icon: Droplet,
  },
  {
    id: "Others",
    title: "Others / General Civic",
    desc: "Stray animal issues, park repair & general civic fixes",
    badge: "Municipal Fixes",
    image:
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80",
    gradient: "from-purple-600 to-indigo-700",
    icon: HelpCircle,
  },
];

const sampleIssuePhotos = [
  {
    label: "Garbage Overflow",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Broken Streetlight",
    url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Road Potholes",
    url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80",
  },
];

const complaintSchema = zod.object({
  ward: zod.preprocess((val) => Number(val), zod.number().min(1).max(48)),
  category: zod.enum([
    "Garbage/Sanitation",
    "Streetlights",
    "Roads/Potholes",
    "Drainage/Sewage",
    "Water Supply",
    "Others",
  ]),
  address: zod.string().optional(),
  title: zod
    .string()
    .min(6, { message: "Title must be at least 6 characters long" }),
  description: zod
    .string()
    .min(15, { message: "Description must be at least 15 characters long" }),
});

export type ComplaintFormData = zod.infer<typeof complaintSchema>;

export const Complaints: React.FC = () => {
  const { userProfile, activeWard, complaints, addComplaint, upvoteComplaint } =
    useWard();
  const t = useTranslations();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"overview" | "workspace">(
    "overview",
  );
  const [howSlideIndex, setHowSlideIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"my-complaints" | "nearby">(
    "my-complaints",
  );
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedAdminModal, setSelectedAdminModal] =
    useState<AdminModalData | null>(null);
  const [isGovtServicesModalOpen, setIsGovtServicesModalOpen] =
    useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState<boolean>(false);

  const [reportStep, setReportStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] =
    useState<ComplaintCategory>("Garbage/Sanitation");
  const [submittedComplaint, setSubmittedComplaint] =
    useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [upvotingId, setUpvotingId] = useState<number | string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    mode: "onChange",
    defaultValues: {
      ward: Number(activeWard.id),
      category: "Garbage/Sanitation" as const,
      address: "",
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    setValue("ward", activeWard.id);
  }, [activeWard.id, setValue]);

  useEffect(() => {
    setValue("category", selectedCategory);
  }, [selectedCategory, setValue]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHowSlideIndex((prev) => (prev + 1) % complaintGuideSteps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const myComplaints = (complaints as Complaint[]).filter(
    (c) =>
      c.author === (userProfile.name || "Krithik Balan") ||
      c.author === "Dhanush" ||
      c.isUserSubmitted === true,
  );
  const nearbyComplaints = (complaints as Complaint[]).filter(
    (c) => parseInt(String(c.ward), 10) === activeWard.id,
  );

  const displayList =
    activeTab === "my-complaints" ? myComplaints : nearbyComplaints;

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - imagePreviews.length);
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...urls]);
  };

  const handleSelectSamplePhoto = (url: string) => {
    if (!imagePreviews.includes(url) && imagePreviews.length < 3) {
      setImagePreviews((prev) => [...prev, url]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openReportWizard = (
    initialCat: ComplaintCategory = "Garbage/Sanitation",
  ) => {
    setSelectedCategory(initialCat);
    setReportStep(1);
    setSubmittedComplaint(null);
    setImagePreviews([]);
    reset({
      ward: activeWard.id,
      category: initialCat,
      address: `Main Road, Ward ${activeWard.id}, Avadi`,
      title: "",
      description: "",
    });
    setIsReportModalOpen(true);
  };

  const handleReportSubmit: SubmitHandler<ComplaintFormData> = (data) => {
    const defaultImage =
      visualCategories.find((c) => c.id === data.category)?.image ||
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60";

    const newComplaint = {
      title: data.title,
      description: data.description,
      category: data.category,
      ward: data.ward,
      address: data.address || `Ward ${data.ward}, Avadi Municipality`,
      status: "Submitted" as const,
      isUserSubmitted: true,
      imageUrl: imagePreviews[0] || defaultImage,
      author: userProfile.name || "Avadi Resident",
      date: new Date().toISOString(),
      upvotes: 1,
    };

    const created = addComplaint(newComplaint);
    setSubmittedComplaint(created as unknown as Complaint);
    setReportStep(3);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleUpvote = (
    id: number | string,
    e: MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    setUpvotingId(id);
    upvoteComplaint(id);
    setTimeout(() => setUpvotingId(null), 500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-sans select-none">
      {viewMode === "overview" ? (
        /* ====================================================== */
        /* 1. CIVIC GRIEVANCE PORTAL OVERVIEW PAGE                */
        /* ====================================================== */
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {t("complaintsTitle")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {t("complaintsSubtitle")}
              </p>
            </div>
            <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 shrink-0 w-fit">
              <MapPin size={14} />
              <span>
                {t("ward")} {String(activeWard.id).padStart(2, "0")}
              </span>
            </span>
          </div>

          {/* Reimagined Illustrated Guide Banner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <Sparkles
                  size={18}
                  className="text-amber-500 shrink-0 animate-pulse"
                />
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  How Complaint Reporting Works
                </h2>
              </div>

              <div className="flex items-center space-x-1.5">
                {complaintGuideSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHowSlideIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      i === howSlideIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to guide step ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl min-h-[160px] sm:min-h-[180px] flex items-center">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-20 -bottom-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

              <button
                onClick={() =>
                  setHowSlideIndex((prev) =>
                    prev === 0 ? complaintGuideSteps.length - 1 : prev - 1,
                  )
                }
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer absolute left-3 sm:left-4 z-20 transition active:scale-90"
                title="Previous Step"
              >
                <ChevronLeft size={18} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={howSlideIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col sm:flex-row items-center justify-between px-14 sm:px-16 py-6 gap-4 z-10"
                >
                  <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400 block">
                      {complaintGuideSteps[howSlideIndex].stepTag}
                    </span>
                    <h3 className="font-black text-base sm:text-xl text-white leading-tight">
                      {complaintGuideSteps[howSlideIndex].title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-lg">
                      {complaintGuideSteps[howSlideIndex].desc}
                    </p>
                  </div>

                  <div className="shrink-0 hidden xs:flex">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br ${complaintGuideSteps[howSlideIndex].illustrationBg} text-white flex items-center justify-center shadow-lg shadow-black/30 border border-white/20`}
                    >
                      {React.createElement(
                        complaintGuideSteps[howSlideIndex].icon,
                        {
                          size: 28,
                        },
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() =>
                  setHowSlideIndex(
                    (prev) => (prev + 1) % complaintGuideSteps.length,
                  )
                }
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer absolute right-3 sm:right-4 z-20 transition active:scale-90"
                title="Next Step"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <Wrench size={18} className="text-primary mr-2" />
                <span>Services & Actions</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Quick civic utilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  name: "Report Civic Issue",
                  desc: "Log local problems like garbage, water, roads, or streetlights and get a tracking ID.",
                  icon: PlusCircle,
                  badgeBg: "from-orange-500 to-amber-500",
                  action: () => openReportWizard("Garbage/Sanitation"),
                },
                {
                  name: "My Complaints",
                  desc: "Track active status updates, zonal officer replies, and resolution proof photos.",
                  icon: FileText,
                  badgeBg: "from-teal-500 to-emerald-600",
                  action: () => {
                    setActiveTab("my-complaints");
                    setViewMode("workspace");
                  },
                },
                {
                  name: "Govt e-Services",
                  desc: "Access property tax payment, EB bills, birth certificates, and RTO portals.",
                  icon: Building2,
                  badgeBg: "from-purple-600 to-indigo-700",
                  action: () => setIsGovtServicesModalOpen(true),
                },
                {
                  name: "Local Ward Alerts",
                  desc: "View urgent weather advisories, water supply cuts, and road closure notices.",
                  icon: Bell,
                  badgeBg: "from-blue-500 to-indigo-600",
                  action: () => router.push("/notifications"),
                },
              ].map((srv) => {
                const SrvIcon = srv.icon;
                return (
                  <motion.div
                    key={srv.name}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={srv.action}
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2.5 rounded-2xl bg-linear-to-br ${srv.badgeBg} text-white shadow-md shrink-0`}
                      >
                        <SrvIcon size={18} />
                      </div>
                      <span className="text-xs font-bold text-primary flex items-center">
                        Open <ArrowRight size={12} className="ml-1" />
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {srv.name}
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug mt-1">
                        {srv.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Administration Section (Refactored from Structured Data) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <UserCheck size={18} className="text-primary mr-2" />
                <span>Administration & Officials</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Grievance officers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { key: "MLA Office", data: OFFICIALS_DIRECTORY.mla },
                { key: "Mayor Office", data: OFFICIALS_DIRECTORY.mayor },
                { key: "Commissioner", data: OFFICIALS_DIRECTORY.commissioner },
                { key: "Ward Admin", data: useWardAdminProfile() },
              ].map(({ key, data }) => {
                const IconComponent = data.icon;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAdminModal(data)}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group min-h-[160px] relative overflow-hidden"
                  >
                    {/* Top Header: Avatar Portrait & Action Badge */}
                    <div className="flex items-start justify-between gap-2 z-10">
                      {data.avatar ? (
                        <div className="relative">
                          <img
                            src={data.avatar}
                            alt={data.name}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-100 dark:bg-slate-800"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 p-1 rounded-lg bg-linear-to-br ${data.badgeBg} text-white shadow-xs`}
                          >
                            <IconComponent size={12} />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-13 h-13 rounded-2xl bg-linear-to-br ${data.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                        >
                          <IconComponent size={24} />
                        </div>
                      )}

                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center transition-colors shrink-0">
                        <span>Contact</span>
                        <ArrowRight size={11} className="ml-1" />
                      </span>
                    </div>

                    {/* Middle: Domain / Political Party Pill */}
                    <div className="mt-3.5 space-y-1.5 z-10">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {data.party ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              data.partyStyle ||
                              "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}
                          >
                            ★ Party: {data.party}
                          </span>
                        ) : data.department ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate max-w-full">
                            {data.department}
                          </span>
                        ) : null}
                      </div>

                      {/* Official Name & Role */}
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {data.name}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                          {data.role}
                        </p>
                      </div>
                    </div>

                    {/* Subtle Background Glow on Hover */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-3 pt-2 mb-10">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <Link size={18} className="text-primary mr-2" />
                <span>Helplines & Portals</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                24x7 Emergency utilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  name: "EB (Electricity Board)",
                  desc: "TANGEDCO power outage & fuse failure helpline",
                  data: OFFICIALS_DIRECTORY.eb,
                  badgeBg: "from-yellow-500 to-amber-600",
                },
                {
                  name: "Corporation Contact",
                  desc: "Avadi HQ Grievance & Toll-Free Helpline",
                  data: OFFICIALS_DIRECTORY.corporationHQ,
                  badgeBg: "from-cyan-600 to-blue-700",
                },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAdminModal(item.data)}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-2xl bg-linear-to-br ${item.badgeBg} text-white shadow-sm shrink-0`}
                    >
                      <Zap size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    View
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        /* ====================================================== */
        /* 2. DETAILED COMPLAINTS WORKSPACE PAGE                  */
        /* ====================================================== */
        <motion.div
          key="workspace"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Navigation & Workspace Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <button
                onClick={() => setViewMode("overview")}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer mb-1"
              >
                <ArrowLeft size={16} />
                <span>Back to Overview</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Active Ward Grievances
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track status updates and upvote community civic fixes.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md">
              <button
                onClick={() => setActiveTab("my-complaints")}
                className={`flex-1 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeTab === "my-complaints"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-800"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                My Complaints ({myComplaints.length})
              </button>
              <button
                onClick={() => setActiveTab("nearby")}
                className={`flex-1 px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeTab === "nearby"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-800"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                Nearby W{activeWard.id} ({nearbyComplaints.length})
              </button>
            </div>
          </div>

          {/* List Container */}
          {isListLoading ? (
            <SkeletonLoader count={2} type="card" />
          ) : displayList.length > 0 ? (
            <div className="space-y-4">
              {displayList.map((complaint) => {
                const config = categoryConfig[complaint.category] || {
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                  border: "border-slate-200",
                  icon: HelpCircle,
                };
                const IconComponent = config.icon;

                const statusVariants: Record<
                  string,
                  "warning" | "info" | "primary" | "success" | "default"
                > = {
                  Submitted: "warning",
                  Acknowledged: "info",
                  "In Progress": "primary",
                  Resolved: "success",
                };

                const formattedIssueId =
                  complaint.issueId ||
                  `AVD-2026-${1000 + Number(complaint.id)}`;

                return (
                  <motion.div
                    key={complaint.id}
                    whileHover={{ scale: 1.005 }}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-primary hover:shadow-md transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <div
                          className={`p-3 rounded-2xl border ${config.bg} ${config.text} ${config.border} shrink-0 mt-0.5`}
                        >
                          <IconComponent size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] sm:text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                              {formattedIssueId}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              Ward {complaint.ward} · {complaint.category}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                            {complaint.title}
                          </h3>
                        </div>
                      </div>

                      <Badge
                        variant={statusVariants[complaint.status] || "default"}
                        className="shrink-0 font-extrabold text-xs"
                      >
                        {complaint.status}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 pl-1">
                      {complaint.description}
                    </p>

                    {complaint.address && (
                      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <span className="truncate">{complaint.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-500">
                      <button
                        onClick={(e) => handleUpvote(complaint.id, e)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer text-xs font-extrabold active:scale-95"
                      >
                        <ThumbsUp
                          size={14}
                          className={
                            upvotingId === complaint.id
                              ? "animate-bounce text-orange-500"
                              : ""
                          }
                        />
                        <span>{complaint.upvotes} Upvotes</span>
                      </button>
                      <span className="text-xs text-slate-400 font-medium">
                        {complaint.date
                          ? new Date(complaint.date).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title={
                activeTab === "my-complaints"
                  ? "No complaints filed by you yet"
                  : `No complaints in Ward ${activeWard.id}`
              }
              description={
                activeTab === "my-complaints"
                  ? "Have a broken streetlight, pothole or rubbish pile near your location? Report it in 3 quick steps."
                  : "All systems look clean! Go ahead and report a local civic issue if you notice one."
              }
              actionText="File New Issue"
              onAction={() => openReportWizard("Garbage/Sanitation")}
            />
          )}

          {/* Floating "+" Button */}
          <button
            onClick={() => openReportWizard("Garbage/Sanitation")}
            className="fixed bottom-20 right-4 z-40 md:absolute md:bottom-auto md:top-0 md:right-0 md:mt-1 w-14 h-14 rounded-full bg-primary hover:bg-orange-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
            title="Report New Grievance"
          >
            <Plus size={26} />
          </button>
        </motion.div>
      )}

      {/* MULTI-STEP REPORT NEW ISSUE WIZARD MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={
          reportStep === 1
            ? "Step 1 of 3: Select Issue Category"
            : reportStep === 2
              ? "Step 2 of 3: Describe Issue & Location"
              : "Step 3 of 3: Grievance Registered"
        }
      >
        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{
              width:
                reportStep === 1 ? "33%" : reportStep === 2 ? "66%" : "100%",
            }}
          />
        </div>

        {/* STEP 1: VISUAL CATEGORY SELECTION */}
        {reportStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              Select the category below that best describes your civic problem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
              {visualCategories.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <motion.div
                    key={cat.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-3xl overflow-hidden border-2 transition-all cursor-pointer group flex flex-col justify-between bg-white dark:bg-slate-900 ${
                      isSelected
                        ? "border-primary ring-4 ring-primary/20 shadow-xl bg-orange-500/5 dark:bg-orange-500/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 shadow-xs"
                    }`}
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <div
                          className={`p-1.5 rounded-xl bg-linear-to-br ${cat.gradient} text-white shadow-md flex items-center space-x-2 px-3 border border-white/20`}
                        >
                          <CatIcon size={16} />
                          <span className="text-xs font-black tracking-wider uppercase">
                            {cat.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-lg border border-white/40">
                            <CheckCircle2 size={15} />
                            <span>SELECTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                          {cat.title}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          {cat.desc}
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
                        <span
                          className={`text-xs font-extrabold ${
                            isSelected
                              ? "text-primary dark:text-orange-400"
                              : "text-slate-400"
                          }`}
                        >
                          {isSelected
                            ? "✓ Ready for Next Step"
                            : "Tap to select"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black border ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isSelected ? "CHOSEN" : "SELECT"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setReportStep(2)}
              className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm flex items-center justify-center space-x-2 cursor-pointer mt-3 tracking-wider uppercase active:scale-98"
            >
              <span>NEXT STEP</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: ISSUE DETAILS & MEDIA */}
        {reportStep === 2 && (
          <form
            onSubmit={handleSubmit(handleReportSubmit)}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setReportStep(1)}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Change Category</span>
              </button>

              <span className="px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20">
                {selectedCategory}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ward Number
                </label>
                <input
                  type="number"
                  required
                  {...register("ward")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.ward && (
                  <p className="text-xs text-rose-500 font-medium">
                    {errors.ward.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Address / Spot Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Pattabiram Railway Station"
                  {...register("address")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Issue Summary Title
              </label>
              <input
                type="text"
                placeholder="Brief summary (e.g. Streetlight broken for past 4 days)"
                {...register("title")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors.title && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Problem Description
              </label>
              <textarea
                placeholder="Describe what needs fixing, how long it has been broken, or safety concerns..."
                rows={3}
                {...register("description")}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400"
              />
              {errors.description && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Issue Photos
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  Upload or select sample photo below
                </span>
              </div>

              <div className="flex gap-2 pb-1 overflow-x-auto">
                {sampleIssuePhotos.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSamplePhoto(sample.url)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 transition"
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 items-center pt-1">
                {imagePreviews.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 shadow-sm"
                  >
                    <img
                      src={url}
                      alt="Attached issue"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center font-bold text-xs hover:bg-slate-900 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 3 && (
                  <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
                    <Camera size={20} />
                    <span className="text-[10px] font-extrabold mt-1">
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-3.5 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm cursor-pointer mt-2 tracking-wider uppercase active:scale-98"
            >
              Submit Grievance Report
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS ACKNOWLEDGEMENT */}
        {reportStep === 3 && submittedComplaint && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Grievance Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your report has been logged with Avadi Municipal Corporation &
                Zonal Officer.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-orange-500/10 border border-orange-500/20 space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                Official Grievance Issue ID
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-widest">
                  {submittedComplaint.issueId ||
                    `AVD-2026-${1000 + Number(submittedComplaint.id)}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      submittedComplaint.issueId ||
                        `AVD-2026-${1000 + Number(submittedComplaint.id)}`,
                    )
                  }
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary transition text-xs font-extrabold flex items-center space-x-1.5 shadow-2xs"
                  title="Copy Issue ID"
                >
                  <Copy size={14} />
                  <span>{copiedId ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Category:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {submittedComplaint.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  Ward & Spot:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                  Ward {submittedComplaint.ward} · {submittedComplaint.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  Initial Status:
                </span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  Submitted (Logged)
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("my-complaints");
                  setViewMode("workspace");
                  setIsReportModalOpen(false);
                }}
                className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black shadow-md transition text-xs sm:text-sm cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
              >
                <FileText size={16} />
                <span>View in My Complaints</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition text-xs sm:text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DETAILED GRIEVANCE VIEW WITH STEPPER */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Track Grievance"
        >
          <div className="space-y-5">
            <div className="flex items-start space-x-3.5">
              <img
                src={selectedComplaint.imageUrl}
                alt={selectedComplaint.title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] sm:text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    {selectedComplaint.issueId ||
                      `AVD-2026-${1000 + Number(selectedComplaint.id)}`}
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Ward {selectedComplaint.ward}
                  </span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                  {selectedComplaint.title}
                </h3>
                {selectedComplaint.address && (
                  <p className="text-xs font-medium text-slate-500 flex items-center pt-0.5">
                    <MapPin size={12} className="mr-1 text-primary shrink-0" />
                    <span className="truncate">
                      {selectedComplaint.address}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
              <h4 className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-5">
                Resolution Stepper Tracker
              </h4>

              <div className="flex items-center justify-between relative px-2">
                {["Submitted", "Acknowledged", "In Progress", "Resolved"].map(
                  (stage, idx) => {
                    const currentStageIdx = [
                      "Submitted",
                      "Acknowledged",
                      "In Progress",
                      "Resolved",
                    ].indexOf(selectedComplaint.status);
                    const isCompleted =
                      idx <= (currentStageIdx === -1 ? 0 : currentStageIdx);
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div
                        key={stage}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isCompleted
                              ? "bg-primary text-white shadow-md shadow-primary/30"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                        >
                          {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-extrabold mt-2 text-center max-w-[64px] sm:max-w-none ${
                            isCurrent
                              ? "text-primary font-black"
                              : isCompleted
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-slate-400"
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  },
                )}
                <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Issue Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  Assigned Officer
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  Er. K. Ramesh (Ward {selectedComplaint.ward} Zonal Admin)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/20 shrink-0">
                Tracking Active
              </span>
            </div>

            <button
              onClick={() => setSelectedComplaint(null)}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-xs sm:text-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Admin Contact Details Modal */}
      {selectedAdminModal && (
        <Modal
          isOpen={!!selectedAdminModal}
          onClose={() => setSelectedAdminModal(null)}
          title={selectedAdminModal.title}
        >
          <div className="space-y-5">
            {/* Hero Banner inside Modal */}
            <div className="flex items-center space-x-4 p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              {selectedAdminModal.avatar ? (
                <img
                  src={selectedAdminModal.avatar}
                  alt={selectedAdminModal.name}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0 bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-2xl bg-linear-to-br ${selectedAdminModal.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                >
                  <selectedAdminModal.icon size={30} />
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {selectedAdminModal.role}
                  </span>
                  {selectedAdminModal.party && (
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        selectedAdminModal.partyStyle ||
                        "bg-red-500/10 text-red-600"
                      }`}
                    >
                      Party: {selectedAdminModal.party}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                  {selectedAdminModal.name}
                </h3>
                {selectedAdminModal.jurisdiction && (
                  <p className="text-xs font-semibold text-slate-400 truncate">
                    📍 {selectedAdminModal.jurisdiction}
                  </p>
                )}
              </div>
            </div>

            {selectedAdminModal.deputy && (
              <div className="flex items-center space-x-4 p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="space-y-1 min-w-0 flex-1">
                  {selectedAdminModal.deputy.name}{" "}
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      Deputy MAYOR
                    </span>
                  </h3>
                </div>
              </div>
            )}

            {/* Contact Action Tiles */}
            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                      {selectedAdminModal.phone}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${selectedAdminModal.phone.replace(/\s+/g, "")}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 shrink-0 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>

              {selectedAdminModal.email.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">
                        Official Email
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                        {selectedAdminModal.email}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${selectedAdminModal.email}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 shrink-0 shadow-sm"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start space-x-3 shadow-2xs">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">
                    Office Address & Timings
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed block mt-0.5">
                    {selectedAdminModal.office}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 block items-center">
                    <Clock size={13} className="mr-1 text-amber-500 inline" />
                    <span>{selectedAdminModal.timings}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAdminModal(null)}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-xs sm:text-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Govt e-Services Modal */}
      <Modal
        isOpen={isGovtServicesModalOpen}
        onClose={() => setIsGovtServicesModalOpen(false)}
        title="Official Government & Municipal e-Services"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Access official Tamil Nadu State & Avadi Municipal Corporation
            digital portals for tax payments, certificates, and civic services.
          </p>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {[
              {
                title: "Property & Water Tax Online Payment",
                dept: "Avadi Municipal Corporation (TN Urban e-Pay)",
                link: "https://www.tnurbanepay.tn.gov.in",
                desc: "Pay property tax, water charges, professional tax online & download receipts instantly.",
                badge: "Tax e-Pay",
                badgeBg:
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
              },
              {
                title: "TANGEDCO Electricity Bill Payment & Outages",
                dept: "Tamil Nadu Electricity Board (TNEB)",
                link: "https://www.tangedco.gov.in",
                desc: "Pay monthly EB electricity bills online, register power failure complaints & track connections.",
                badge: "EB Power",
                badgeBg:
                  "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
              },
              {
                title: "TN e-Sevai Revenue Certificates Portal",
                dept: "TNeGA Government of Tamil Nadu",
                link: "https://www.tnesevai.tn.gov.in",
                desc: "Apply online for Community Certificate, Income Certificate, Residence Certificate & First Graduate.",
                badge: "e-Sevai",
                badgeBg:
                  "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
              },
              {
                title: "Birth & Death Certificate Download",
                dept: "Avadi Corporation Public Health Department",
                link: "https://www.tnurbanepay.tn.gov.in",
                desc: "Search, verify and download official birth and death certificates issued by Avadi Corporation.",
                badge: "Civil Registry",
                badgeBg:
                  "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
              },
              {
                title: "Parivahan RTO Vehicle & DL e-Services",
                dept: "Ministry of Road Transport & RTO Avadi (TN-12)",
                link: "https://parivahan.gov.in",
                desc: "Apply for Driving License, Learner's License, Vehicle Registration RC renewal & pay road tax.",
                badge: "RTO TN-12",
                badgeBg:
                  "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
              },
            ].map((service, idx) => (
              <motion.a
                key={idx}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                href={service.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary/60 transition-all flex items-start justify-between gap-3 group shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${service.badgeBg}`}
                    >
                      {service.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400 truncate">
                      {service.dept}
                    </span>
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug">
                    {service.desc}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary flex items-center justify-center shrink-0 transition-colors mt-1 shadow-xs">
                  <ExternalLink size={16} />
                </div>
              </motion.a>
            ))}
          </div>

          <button
            onClick={() => setIsGovtServicesModalOpen(false)}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-xs sm:text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Complaints;
