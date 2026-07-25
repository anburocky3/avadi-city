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
  Calendar,
  ArrowLeft,
  ArrowRight,
  Wrench,
  Sparkles,
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
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Adjust path aliases according to your Next.js project structure
import { useWard } from "@/context/ward";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useTranslations } from "next-intl";

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
}

export interface GuideStep {
  stepTag: string;
  title: string;
  desc: string;
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

// --- STATIC CONFIGURATIONS ---

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
    text: "text-slate-700 dark:text-slate-350",
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
    stepTag: "GUIDE STEP 1 OF 4",
    title: "1. Choose Issue Category",
    desc: "Select from Sanitation, Roads, Electricity, Water or Streetlights.",
  },
  {
    stepTag: "GUIDE STEP 2 OF 4",
    title: "2. Provide Location & Evidence",
    desc: "Attach up to 2 photos & landmark description.",
  },
  {
    stepTag: "GUIDE STEP 3 OF 4",
    title: "3. Instant Grievance Tracking ID",
    desc: "Receive a unique Tracking ID to monitor resolution status.",
  },
  {
    stepTag: "GUIDE STEP 4 OF 4",
    title: "4. Zonal Action & Resolution",
    desc: "Ward Zonal Officer resolves the issue and updates completion proof.",
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

// Zod Schema Validation
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

  // Multi-step report modal wizard state
  const [reportStep, setReportStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] =
    useState<ComplaintCategory>("Garbage/Sanitation");
  const [submittedComplaint, setSubmittedComplaint] =
    useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Image preview states
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
    }, 4500);
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
    setSubmittedComplaint(created as Complaint);
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

  const statusStages = ["Submitted", "Acknowledged", "In Progress", "Resolved"];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Dynamic View Mode Switcher Header */}
      {viewMode === "overview" ? (
        /* ====================================================== */
        /* 1. CIVIC GRIEVANCE PORTAL OVERVIEW PAGE */
        /* ====================================================== */
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
                {t("complaintsTitle")}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {t("complaintsSubtitle")}
              </p>
            </div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 shrink-0">
              <MapPin size={13} />
              <span>
                {t("ward")} {String(activeWard.id).padStart(2, "0")}
              </span>
            </span>
          </div>

          {/* How Complaint Reporting Works Guide Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-500">
                <HelpCircle
                  size={18}
                  className="shrink-0 text-amber-600 dark:text-amber-500"
                />
                <h2 className="text-xs sm:text-sm font-extrabold tracking-tight">
                  How Complaint Reporting Works
                </h2>
              </div>

              <div className="flex items-center space-x-1">
                {complaintGuideSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHowSlideIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === howSlideIndex
                        ? "w-5 bg-amber-500 dark:bg-amber-400"
                        : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl border-2 border-amber-300/90 dark:border-amber-700/60 bg-amber-50/30 dark:bg-slate-900/80 p-5 sm:p-6 shadow-sm overflow-hidden min-h-[105px] flex items-center justify-center text-center">
              <button
                onClick={() =>
                  setHowSlideIndex((prev) =>
                    prev === 0 ? complaintGuideSteps.length - 1 : prev - 1,
                  )
                }
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-700/60 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center cursor-pointer absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 transition-transform active:scale-95"
                title="Previous Step"
              >
                <ChevronLeft size={16} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={howSlideIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1 max-w-md px-8"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                    {complaintGuideSteps[howSlideIndex].stepTag}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {complaintGuideSteps[howSlideIndex].title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                    {complaintGuideSteps[howSlideIndex].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() =>
                  setHowSlideIndex(
                    (prev) => (prev + 1) % complaintGuideSteps.length,
                  )
                }
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-700/60 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center cursor-pointer absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 transition-transform active:scale-95"
                title="Next Step"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Wrench size={16} className="text-primary mr-2" />
                <span>Services</span>
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                Quick civic utilities
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  name: "Report",
                  desc: "Report local problems like garbage, water, roads, or streetlights and track their status.",
                  icon: PlusCircle,
                  badgeBg: "from-orange-500 to-amber-500",
                  action: () => openReportWizard("Garbage/Sanitation"),
                },
                {
                  name: "My Complaint",
                  desc: "Report local problems like garbage, water, roads, or streetlights and track their status.",
                  icon: FileText,
                  badgeBg: "from-teal-500 to-emerald-600",
                  action: () => {
                    setActiveTab("my-complaints");
                    setViewMode("workspace");
                  },
                },
                {
                  name: "Local Alerts",
                  desc: "View useful details about your ward, nearby facilities, and local updates.",
                  icon: Bell,
                  badgeBg: "from-blue-500 to-indigo-600",
                  action: () => router.push("/notifications"),
                },
                {
                  name: "Govt Services",
                  desc: "Access important government services and ward office information.",
                  icon: Building2,
                  badgeBg: "from-purple-600 to-indigo-700",
                  action: () => router.push("/gov-services"),
                },
              ].map((srv) => {
                const SrvIcon = srv.icon;
                return (
                  <div
                    key={srv.name}
                    onClick={srv.action}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2 rounded-xl bg-gradient-to-br ${srv.badgeBg} text-white shadow-sm shrink-0`}
                      >
                        <SrvIcon size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-primary flex items-center">
                        Open <ArrowRight size={10} className="ml-0.5" />
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        {srv.name}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                        {srv.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Administration Section */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <UserCheck size={16} className="text-primary mr-2" />
                <span>Administration</span>
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                Official contact & grievance officers
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
              {/* 1. MLA */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: "MLA of Avadi Constituency",
                    role: "Avadi Constituency MLA",
                    name: "Hon. S. M. Nasar (MLA)",
                    phone: "+91 44 2638 5555",
                    email: "mla.avadi@tn.gov.in",
                    office:
                      "Avadi MLA Constituency Office, NM Road, Avadi, Chennai - 600054",
                    timings: "Mon - Sat: 10:00 AM - 6:00 PM",
                    badgeBg: "from-emerald-600 to-teal-700",
                    icon: Building,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm shrink-0">
                    <Building size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    MLA Office
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    Avadi Constituency MLA & Office
                  </p>
                </div>
              </div>

              {/* 2. MAYOR */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: "Mayor of Avadi Corporation",
                    role: "City Mayor",
                    name: "Hon. G. Riddhi (Mayor)",
                    phone: "+91 44 2638 1234",
                    email: "mayor@avadicorporation.gov.in",
                    office:
                      "Avadi Corporation Building, NM Road, Avadi, Chennai - 600054",
                    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
                    badgeBg: "from-amber-500 to-orange-600",
                    icon: Crown,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shrink-0">
                    <Crown size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Mayor
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    Avadi Corporation Mayor & Office
                  </p>
                </div>
              </div>

              {/* 3. COMMISSIONER */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: "Commissioner of Avadi Corporation",
                    role: "Municipal Corporation Commissioner",
                    name: "Dr. K. Vijay, IAS (Commissioner)",
                    phone: "1800-425-5111 / +91 44 2638 0222",
                    email: "commr.avadi@tn.gov.in",
                    office:
                      "Avadi Municipal Corporation Headquarters, New Military Road, Avadi - 600054",
                    timings: "Mon - Sat: 9:00 AM - 5:30 PM (Toll-Free 24x7)",
                    badgeBg: "from-cyan-600 to-blue-700",
                    icon: Building2,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm shrink-0">
                    <Building2 size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/60 dark:border-cyan-800/60 text-[10px] font-black text-cyan-600 dark:text-cyan-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Commissioner
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    Avadi Corporation Commissioner (IAS)
                  </p>
                </div>
              </div>

              {/* 4. WARD ADMIN */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: `Ward ${activeWard.id} Administration`,
                    role: `Ward ${activeWard.id} Admin Officer`,
                    name: "Er. K. Ramesh (Zonal Admin)",
                    phone: "+91 94454 81414",
                    email: `ward${activeWard.id}.admin@avadicorporation.gov.in`,
                    office: `Ward ${activeWard.id} Civic Center, Main Trunk Road, Avadi, Chennai`,
                    timings: "Mon - Sat: 9:00 AM - 6:00 PM",
                    badgeBg: "from-blue-600 to-indigo-700",
                    icon: UserCheck,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Ward Admin
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    Ward {activeWard.id} Zonal Officer & Admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-3 pt-3 mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Link size={16} className="text-primary mr-2" />
                <span>Quick Links</span>
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                EB & Corporation portals & helpline
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-stretch">
              {/* EB */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: "TANGEDCO / EB Electricity Board",
                    role: "Power & Electricity Utility",
                    name: "Avadi EB Executive Engineer Office",
                    phone: "1912 / +91 44 2638 0111",
                    email: "ae.eb.avadi@tnebltd.gov.in",
                    office:
                      "TNEB Sub-Station Office, CTH Road, Avadi, Chennai - 600054",
                    timings: "24x7 Power Emergency / Helpline 1912",
                    badgeBg: "from-yellow-500 to-amber-600",
                    icon: Zap,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[105px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-sm shrink-0">
                    <Zap size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    EB (Electricity Board)
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    TANGEDCO power outage & fusion helpline
                  </p>
                </div>
              </div>

              {/* Corporation Helpline */}
              <div
                onClick={() =>
                  setSelectedAdminModal({
                    title: "Avadi Municipal Corporation Info",
                    role: "Civic Head Office",
                    name: "Grievance Redressal & HQ Portal",
                    phone: "1800-425-5111 / +91 44 2638 0222",
                    email: "commr.avadi@tn.gov.in",
                    office:
                      "Avadi Municipal Corporation Headquarters, New Military Road, Avadi - 600054",
                    timings: "Mon - Sat: 9:00 AM - 5:30 PM (Toll-Free 24x7)",
                    badgeBg: "from-cyan-600 to-blue-700",
                    icon: Building2,
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[105px]"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-sm shrink-0">
                    <Building2 size={16} />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/60 dark:border-cyan-800/60 text-[10px] font-black text-cyan-600 dark:text-cyan-400 flex items-center shrink-0">
                    Contact <ArrowRight size={10} className="ml-0.5" />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Corporation Contact
                  </h4>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                    Avadi HQ Grievance & Toll-Free Helpline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ====================================================== */
        /* 2. DETAILED COMPLAINTS WORKSPACE PAGE */
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
                className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline cursor-pointer mb-1"
              >
                <ArrowLeft size={13} />
                <span>Back to Overview</span>
              </button>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
                Active Ward Grievances
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Track status updates and upvote community civic fixes.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm">
              <button
                onClick={() => setActiveTab("my-complaints")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "my-complaints"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                My Complaints ({myComplaints.length})
              </button>
              <button
                onClick={() => setActiveTab("nearby")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "nearby"
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                Nearby W{activeWard.id} ({nearbyComplaints.length})
              </button>
            </div>
          </div>

          {/* List Container */}
          {isListLoading ? (
            <SkeletonLoader type="card" count={2} />
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
                  <Card
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="p-4 sm:p-5 border-l-4 border-l-primary hover:shadow-md transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2.5 rounded-xl border ${config.bg} ${config.text} ${config.border} shrink-0`}
                        >
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                              {formattedIssueId}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Ward {complaint.ward} · {complaint.category}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white leading-snug">
                            {complaint.title}
                          </h3>
                        </div>
                      </div>

                      <Badge
                        variant={statusVariants[complaint.status] || "default"}
                        className="shrink-0"
                      >
                        {complaint.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed line-clamp-2">
                      {complaint.description}
                    </p>

                    {complaint.address && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <MapPin size={13} className="text-primary shrink-0" />
                        <span className="truncate">{complaint.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <button
                        onClick={(e) => handleUpvote(complaint.id, e)}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer text-xs font-bold"
                      >
                        <ThumbsUp
                          size={13}
                          className={
                            upvotingId === complaint.id
                              ? "animate-bounce text-orange-500"
                              : ""
                          }
                        />
                        <span>{complaint.upvotes} Upvotes</span>
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {complaint.date
                          ? new Date(complaint.date).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  </Card>
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
            className="fixed bottom-20 right-4 z-45 md:absolute md:bottom-auto md:top-0 md:right-0 md:mt-2 w-12 h-12 rounded-full bg-primary hover:bg-orange-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer"
            title="Report New Grievance"
          >
            <Plus size={24} />
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
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-4 overflow-hidden">
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
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
              Select the category below that best describes your civic problem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
              {visualCategories.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group flex flex-col justify-between bg-white dark:bg-slate-900 ${
                      isSelected
                        ? "border-primary ring-4 ring-primary/40 shadow-xl bg-orange-500/[0.04] dark:bg-orange-500/15 scale-[1.01]"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500 shadow-sm"
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
                          className={`p-1.5 rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg flex items-center space-x-2 px-3 border border-white/30`}
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

                    <div className="p-4 space-y-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/80 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                          {cat.title}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-100 leading-relaxed mt-1.5">
                          {cat.desc}
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between border-t border-slate-150 dark:border-slate-800 mt-2">
                        <span
                          className={`text-xs font-extrabold ${isSelected ? "text-primary dark:text-orange-400" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {isSelected
                            ? "✓ Ready for Next Step"
                            : "Tap to select this problem"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-black border ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isSelected ? "CHOSEN" : "SELECT"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setReportStep(2)}
              className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-black shadow-md hover:shadow-lg transition text-sm flex items-center justify-center space-x-2 cursor-pointer mt-2 tracking-wider uppercase"
            >
              <span>NEXT</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: ISSUE DETAILS & MEDIA */}
        {reportStep === 2 && (
          <form
            onSubmit={handleSubmit(handleReportSubmit)}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setReportStep(1)}
                className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Change Category</span>
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold border border-orange-500/20">
                {selectedCategory}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
                  Ward Number
                </label>
                <input
                  type="number"
                  required
                  {...register("ward")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45"
                />
                {errors.ward && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    {errors.ward.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
                  Address / Spot Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Pattabiram Railway Station"
                  {...register("address")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
                Issue Summary Title
              </label>
              <input
                type="text"
                placeholder="Brief summary (e.g. Streetlight broken for past 4 days)"
                {...register("title")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45"
              />
              {errors.title && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
                Detailed Problem Description
              </label>
              <textarea
                placeholder="Describe what needs fixing, how long it has been broken, or safety concerns..."
                rows={3}
                {...register("description")}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 placeholder-slate-400"
              />
              {errors.description && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-650 dark:text-slate-400">
                  Issue Photos
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Upload or select sample photo below
                </span>
              </div>

              <div className="flex gap-2 pb-1 overflow-x-auto">
                {sampleIssuePhotos.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSamplePhoto(sample.url)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0 transition"
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                {imagePreviews.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100"
                  >
                    <img
                      src={url}
                      alt="Attached issue"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/70 text-white flex items-center justify-center font-bold text-[8px] hover:bg-slate-900"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 3 && (
                  <label className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-750 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition cursor-pointer">
                    <Camera size={16} />
                    <span className="text-[8px] font-bold mt-1">Upload</span>
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
              className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition text-xs cursor-pointer"
            >
              Submit Grievance Report
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS ACKNOWLEDGEMENT */}
        {reportStep === 3 && submittedComplaint && (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                Grievance Submitted Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your report has been logged with Avadi Municipal Corporation &
                Zonal Officer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                Official Grievance Issue ID
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-widest">
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
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition text-xs font-bold flex items-center space-x-1"
                  title="Copy Issue ID"
                >
                  <Copy size={13} />
                  <span>{copiedId ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs">
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
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
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

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("my-complaints");
                  setViewMode("workspace");
                  setIsReportModalOpen(false);
                }}
                className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition text-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <FileText size={14} />
                <span>View in My Complaints</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
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
                className="w-20 h-20 rounded-2xl object-cover border"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {selectedComplaint.issueId ||
                      `AVD-2026-${1000 + Number(selectedComplaint.id)}`}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Ward {selectedComplaint.ward}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 leading-snug">
                  {selectedComplaint.title}
                </h3>
                {selectedComplaint.address && (
                  <p className="text-[10px] font-medium text-slate-400 flex items-center">
                    <MapPin size={10} className="mr-0.5 text-primary" />
                    <span>{selectedComplaint.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-100/50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <h4 className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-4">
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
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? "bg-primary text-white shadow-sm"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                        >
                          {isCompleted ? <Check size={14} /> : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] font-bold mt-1.5 ${
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
                <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Issue Description
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">
                  Assigned Officer
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Er. K. Ramesh (Ward {selectedComplaint.ward} Zonal Admin)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                Tracking Active
              </span>
            </div>

            <button
              onClick={() => setSelectedComplaint(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
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
            <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedAdminModal.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
              >
                <selectedAdminModal.icon size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {selectedAdminModal.role}
                </span>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-1">
                  {selectedAdminModal.name}
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Phone size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {selectedAdminModal.phone}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${selectedAdminModal.phone.replace(/\s+/g, "")}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                >
                  <Phone size={12} />
                  <span>Call</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Official Email
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[210px] block">
                      {selectedAdminModal.email}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:${selectedAdminModal.email}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shrink-0"
                >
                  <Mail size={12} />
                  <span>Email</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    Office Address
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed block">
                    {selectedAdminModal.office}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
                    🕒 {selectedAdminModal.timings}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAdminModal(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access official Tamil Nadu State & Avadi Municipal Corporation
            digital portals for tax payments, certificates, and civic services.
          </p>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
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
                desc: "Pay monthly EB electricity bills online, register power failure complaints & track service connections.",
                badge: "EB Power",
                badgeBg:
                  "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
              },
              {
                title: "TN e-Sevai Revenue Certificates Portal",
                dept: "TNeGA Government of Tamil Nadu",
                link: "https://www.tnesevai.tn.gov.in",
                desc: "Apply online for Community Certificate, Income Certificate, Native/Residence Certificate & First Graduate.",
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
              <a
                key={idx}
                href={service.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary transition-all flex items-start justify-between gap-3 group block"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${service.badgeBg}`}
                    >
                      {service.badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {service.dept}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                    {service.desc}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary flex items-center justify-center shrink-0 transition-colors mt-1">
                  <ExternalLink size={14} />
                </div>
              </a>
            ))}
          </div>

          <button
            onClick={() => setIsGovtServicesModalOpen(false)}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Complaints;
