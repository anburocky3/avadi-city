"use client";

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Trash2,
  Lightbulb,
  AlertTriangle,
  MapPin,
  Plus,
  ThumbsUp,
  Camera,
  ArrowLeft,
  ArrowRight,
  Wrench,
  Bell,
  Building2,
  FileText,
  PlusCircle,
  UserCheck,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  Map as MapIcon,
  HeartPulse,
  Droplets,
  TreePine,
  Share2,
  Search,
  CheckCircle,
  Circle,
  Info,
  Edit3,
  Link as LinkIcon,
  Check,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useWard } from "@/context/wardContext";
import {
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useWardAdminProfile } from "@/hooks/useWardAdminProfile";
import { OfficialAdminData, OFFICIALS_DIRECTORY } from "@/data/officialsData";
import { ComplaintGuideSteps } from "./complaint-guide-steps";
import { ALL_AVADI_STREETS } from "@/lib/wards";
import "leaflet/dist/leaflet.css";
import { toast } from "@/utils/toast";
import MapLocationPicker from "@/components/ui/MapLocationPicker";

// --- TYPESCRIPT INTERFACES ---
export interface Complaint {
  id: number | string;
  issueId?: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  ward: string | number;
  address?: string;
  lat?: number;
  lng?: number;
  status: "Submitted" | "Acknowledged" | "In Progress" | "Resolved" | string;
  imageUrl?: string;
  upvotes: number;
  author?: string;
  date: string;
  isUserSubmitted?: boolean;
}

// --- RICH CATEGORY & GCC DATA MAPPING ---
export const RICH_CIVIC_CATEGORIES = [
  {
    id: "Garbage",
    title: "Garbage & Sanitation",
    badge: "SANITATION",
    desc: "Overflowing bins, uncollected waste & street cleaning",
    image:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
    gradient: "from-emerald-500 to-teal-600",
    icon: Trash2,
    issues: [
      "Removal of Garbage",
      "Overflowing of Garbage Bin",
      "Removal of Debris",
      "Absenteeism of Sweepers",
      "Absenteeism of Door to door garbage Collector",
      "Improper Sweeping",
      "Provison of Garbage Bin",
      "Broken Bin",
      "Shifting of Garbage Bin",
      "Cleaning of Water Table",
      "Nuisance by Garbage Tractor/Truck",
      "Burning of Garbage",
      "Garbage Lorry without Net",
      "Spilling of Garbage from Lorry",
      "Burning of Garbage at Dumping Ground",
    ],
  },
  {
    id: "Street Light",
    title: "Streetlights & Electrical",
    badge: "ELECTRICITY",
    desc: "Non-functional lights, dark stretches & pole damage",
    image:
      "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?q=80&w=600&auto=format&fit=crop",
    gradient: "from-amber-500 to-orange-600",
    icon: Lightbulb,
    issues: [
      "Non burning of Street lights",
      "Electric shock due to street light",
      "Damage to the Electric pole",
      "New Street lights",
      "Shifting of Street light pole",
      "Overhead cable wires running in a haphazard manner",
      "Burning of street light in daytime",
      "Inadequate light in a particular location or spot/ dark spots",
    ],
  },
  {
    id: "Water & Sewage",
    title: "Water Logging & Sewage",
    badge: "SEWAGE",
    desc: "Drainage overflow, stagnant water & illegal draining",
    image:
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=600&auto=format&fit=crop",
    gradient: "from-cyan-500 to-blue-600",
    icon: Droplets,
    issues: [
      "Water entering Home/Shop",
      "EB wire cut/Spark seen",
      "Stagnation of Water",
      "Obstruction of Water Flow",
      "Desilting of Drain",
      "Desilting of Canal",
      "Repairs to Storm Water Drain",
      "Covering Manholes of Storm Water Drain",
      "New Drain Construction",
      "Disposal of Removed Silt on the Road",
      "Insufficient Barricading",
    ],
  },
  {
    id: "Road and Footpath",
    title: "Roads & Potholes",
    badge: "ROAD WORKS",
    desc: "Deep potholes, damaged tar roads & broken pavers",
    image:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop",
    gradient: "from-slate-600 to-slate-800",
    icon: MapIcon,
    issues: [
      "Pot hole fill up / Repairs to the damaged surface",
      "Relaying of Road",
      "Formation of New Road",
      "Repairs to existing Footpath",
      "Request to provide Footpath",
      "Removal of Shops in the Footpath",
      "Illegal Parking on foot path",
      "Milling/Scraping of Road before Relaying of Road",
      "Cleanliness in footpath",
      "Electrical wires/obstruction on footpath",
      "Unsafe dark spots/ corners",
    ],
  },
  {
    id: "Public Health",
    title: "Public Health & Animals",
    badge: "HEALTH",
    desc: "Street dogs, mosquito menace & health hazards",
    image:
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=600&auto=format&fit=crop",
    gradient: "from-rose-500 to-red-600",
    icon: HeartPulse,
    issues: [
      "Mosquito Menace",
      "Street Dogs",
      "Stray Cattle",
      "Stray Pigs",
      "Death of Stray Animals",
      "Public Health / Dengue / Malaria / Gastro Enteritis",
      "Open Defecation",
      "Illegal Draining of Sewage",
      "Unhygenic Restaurants",
      "Quality of food in hotels",
      "Road Side Eateries",
      "Illegal Slaughtering",
      "Biomedical waste removal",
      "Complaints regarding Corporation Hospitals",
      "Plastics Menace",
    ],
  },
  {
    id: "Parks and General",
    title: "Parks & Municipal Fixes",
    badge: "MUNICIPAL",
    desc: "Fallen trees, encroachments & park maintenance",
    image:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=600&auto=format&fit=crop",
    gradient: "from-fuchsia-500 to-purple-600",
    icon: TreePine,
    issues: [
      "Removal of Fallen Trees",
      "Complaints regarding Park",
      "Complaints regarding Playground",
      "Unauthorized Tree Cutting",
      "Cleanliness in Parks",
      "Greenary in Parks",
      "Play Equipment",
      "Opening and closing hours",
      "Toilets in parks",
      "Non functional lights in parks",
      "Tree Pruning",
      "Encroachment on the Public Property",
      "Unauthorized Advertisement Boards",
    ],
  },
  {
    id: "Revenue & Licensing",
    title: "Tax, Building & Licensing",
    badge: "ADMIN",
    desc: "Property tax, building plan approvals & trade licenses",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    gradient: "from-indigo-500 to-blue-700",
    icon: Building2,
    issues: [
      "Building Plan Sanction",
      "Violation of DCR/Building By laws",
      "Unauthorized / Illegal Construction",
      "Property Tax Complaints",
      "Professional Tax Complaints",
      "Trade Licence Complaints",
      "Online Payment Issue",
      "General Revision Objection",
      "Issue of Birth and Death Certificate",
      "Name Error (Spelling Related)",
      "Change of Address in Electoral Roll",
      "Issue of Voter ID",
    ],
  },
  {
    id: "Others",
    title: "Others / Custom Issue",
    badge: "MISCELLANEOUS",
    desc: "Don't see your issue? Enter it manually here.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop",
    gradient: "from-slate-800 to-slate-950",
    icon: Edit3,
    issues: [], // Empty implies custom text input
  },
];

const categoryConfig: Record<
  string,
  { bg: string; text: string; border: string; icon: any }
> = {
  Garbage: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/50",
    icon: Trash2,
  },
  "Street Light": {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/50",
    icon: Lightbulb,
  },
  "Road and Footpath": {
    bg: "bg-slate-100 dark:bg-slate-800/80",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700/50",
    icon: MapIcon,
  },
  "Public Health": {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-900/50",
    icon: HeartPulse,
  },
  "Water & Sewage": {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/50",
    icon: Droplets,
  },
  "Parks and General": {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900/50",
    icon: TreePine,
  },
  "Revenue & Licensing": {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-900/50",
    icon: Building2,
  },
  Others: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: Edit3,
  },
};

const complaintSchema = zod.object({
  category: zod.string(),
  subCategory: zod
    .string()
    .min(3, "Please select or describe the specific issue"),
  streetName: zod
    .string()
    .min(3, "Please enter at least 3 characters for the street name"),
  lat: zod.number(),
  lng: zod.number(),
  title: zod
    .string()
    .min(6, { message: "Title must be at least 6 characters long" }),
  description: zod
    .string()
    .min(15, { message: "Description must be at least 15 characters long" }),
  shareOnFeed: zod.boolean().default(true),
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
  const [activeTab, setActiveTab] = useState<"my-complaints" | "nearby">(
    "my-complaints",
  );
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isGovtServicesModalOpen, setIsGovtServicesModalOpen] =
    useState<boolean>(false);
  const [selectedAdminModal, setSelectedAdminModal] =
    useState<OfficialAdminData | null>(null);

  // Wizard States
  const [reportStep, setReportStep] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<
    (typeof RICH_CIVIC_CATEGORIES)[0] | null
  >(null);
  const [subSearchQuery, setSubSearchQuery] = useState<string>("");
  const [customSubCategory, setCustomSubCategory] = useState<string>("");

  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 13.1169,
    lng: 80.0972,
  });
  const [mapError, setMapError] = useState<string | null>(null);

  // Street Autocomplete States
  const [streetResults, setStreetResults] = useState<any[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] = useState<any | null>(
    null,
  );

  const [submittedComplaint, setSubmittedComplaint] =
    useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [upvotingId, setUpvotingId] = useState<number | string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    mode: "onChange",
    defaultValues: {
      category: "",
      subCategory: "",
      streetName: "",
      lat: 13.1169,
      lng: 80.0972,
      title: "",
      description: "",
    },
  });

  const watchSubCategory = watch("subCategory");
  const watchStreetName = watch("streetName");

  // Auto-Drafting Hook
  useEffect(() => {
    if (watchSubCategory && reportStep === 2) {
      const locationContext = watchStreetName || "Selected Location";
      setValue(
        "title",
        `Request for ${watchSubCategory} at ${locationContext}`,
        { shouldValidate: true },
      );
      setValue(
        "description",
        `Reporting an issue regarding ${watchSubCategory}.\n\nLocation: ${locationContext}.\n\nPlease arrange for an inspection and resolve at the earliest.`,
        { shouldValidate: true },
      );
    }
  }, [watchSubCategory, watchStreetName, mapCoords, setValue, reportStep]);

  const myComplaints = (complaints as Complaint[]).filter(
    (c) => c.author === userProfile.name || c.isUserSubmitted === true,
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

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openReportWizard = () => {
    setSelectedGroup(null);
    setSubSearchQuery("");
    setCustomSubCategory("");
    setStreetResults([]);
    setSelectedStreetItem(null);
    setReportStep(1);
    setSubmittedComplaint(null);
    setImagePreviews([]);
    reset({
      category: "",
      subCategory: "",
      streetName: "",
      lat: 13.1169,
      lng: 80.0972,
      title: "",
      description: "",
    });
    setIsReportModalOpen(true);
  };

  const handleSelectStreet = (street: any) => {
    setSelectedStreetItem(street);
    setValue("streetName", street.streetName, { shouldValidate: true });
    setStreetResults([]);
  };

  const handleReportSubmit: SubmitHandler<ComplaintFormData> = async (data) => {
    const defaultImage =
      RICH_CIVIC_CATEGORIES.find((c) => c.id === data.category)?.image ||
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60";

    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const generatedIssueId = `AVD-${new Date().getFullYear()}-${uniqueNumber}`;
    const newComplaint = {
      title: data.title,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      userWard: activeWard.id,
      streetName: data.streetName,
      address: data.streetName,
      lat: data.lat,
      lng: data.lng,
      shareOnFeed: data.shareOnFeed,
      status: "Submitted" as const,
      isUserSubmitted: true,
      imageUrl: imagePreviews[0] || defaultImage,
      author: userProfile.name || "Avadi Resident",
      date: new Date().toISOString(),
      upvotes: 1,
      issueId: generatedIssueId,
    };
    const created = await addComplaint(newComplaint);
    console.log(created);
    setSubmittedComplaint(created as unknown as Complaint);
    setReportStep(3);
    toast.success("Complaint submitted successfully!");
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Civic Grievance Redressal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Log local issues and track resolutions
              </p>
            </div>
            <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 shrink-0 w-fit">
              <MapPin size={14} />
              <span>Ward {String(activeWard.id).padStart(2, "0")}</span>
            </span>
          </div>

          <ComplaintGuideSteps />

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                <Wrench size={18} className="text-primary mr-2" />
                <span>Services & Actions</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Report Civic Issue",
                  desc: "Log local problems like garbage, water, roads, or streetlights and get a tracking ID.",
                  icon: PlusCircle,
                  badgeBg: "from-orange-500 to-amber-500",
                  action: openReportWizard,
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
              ].map((srv) => (
                <motion.div
                  key={srv.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={srv.action}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-2xl bg-linear-to-br ${srv.badgeBg} text-white shadow-md shrink-0`}
                    >
                      <srv.icon size={18} />
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
              ))}
            </div>
          </div>

          {/* Administration Section */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group min-h-40 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 z-10">
                      {data.avatar ? (
                        <div className="relative">
                          <img
                            src={data.avatar}
                            alt={data.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-300 bg-slate-100 dark:bg-slate-800"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 p-1 rounded-lg bg-linear-to-br ${data.badgeBg} text-white shadow-sm`}
                          >
                            <IconComponent size={12} />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl bg-linear-to-br ${data.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                        >
                          <IconComponent size={24} />
                        </div>
                      )}

                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center transition-colors shrink-0">
                        <span>Contact</span>
                        <ArrowRight size={11} className="ml-1" />
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 z-10">
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
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {data.name}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                          {data.role}
                        </p>
                      </div>
                    </div>
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
                <LinkIcon size={18} className="text-primary mr-2" />
                <span>Helplines & Portals</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                24x7 Emergency utilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <button
                onClick={() => setViewMode("overview")}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer mb-1"
              >
                <ArrowLeft size={16} />
                <span>Back to Overview</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Active Ward Grievances
              </h1>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("my-complaints")}
                className={`flex-1 px-4 py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${activeTab === "my-complaints" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
              >
                My Complaints ({myComplaints.length})
              </button>
              <button
                onClick={() => setActiveTab("nearby")}
                className={`flex-1 px-4 py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${activeTab === "nearby" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
              >
                Nearby W{activeWard.id} ({nearbyComplaints.length})
              </button>
            </div>
          </div>

          {displayList.length > 0 ? (
            <div className="space-y-4">
              {displayList.map((complaint) => {
                const config =
                  categoryConfig[complaint.category] ||
                  categoryConfig["Others"];
                const IconComponent = config.icon;
                const formattedIssueId =
                  complaint.issueId ||
                  `AVD-${new Date().getFullYear()}-${1000 + Number(complaint.id)}`;

                return (
                  <motion.div
                    key={complaint.id}
                    whileHover={{ scale: 1.05 }}
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
                            <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                              {formattedIssueId}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              Ward {complaint.ward} ·{" "}
                              {complaint.subCategory || complaint.category}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                            {complaint.title}
                          </h3>
                        </div>
                      </div>
                      <Badge
                        variant="warning"
                        className="shrink-0 font-extrabold text-xs"
                      >
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 pl-1">
                      {complaint.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-500">
                      <button
                        onClick={(e) => handleUpvote(complaint.id, e)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer text-xs font-extrabold active:scale-95"
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
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No complaints found"
              description="All systems look clean! Go ahead and report a local civic issue if you notice one."
              actionText="File New Issue"
              onAction={openReportWizard}
            />
          )}

          <button
            onClick={openReportWizard}
            className="fixed bottom-20 right-4 z-40 md:absolute md:bottom-auto md:top-0 md:right-0 md:mt-1 w-14 h-14 rounded-full bg-primary hover:bg-orange-600 text-white flex items-center justify-center shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={26} />
          </button>
        </motion.div>
      )}

      {/* MULTI-STEP REPORT NEW ISSUE WIZARD MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="sm:max-w-2xl md:max-w-4xl xl:max-w-5xl"
        title={
          (
            <div className="space-y-4 mr-5">
              <div className="flex items-center gap-3 w-full pr-8">
                <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black rounded-lg border border-orange-500/20 uppercase tracking-widest shrink-0">
                  Step {reportStep} of 3
                </span>
                <span className="truncate text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {reportStep === 1 && !selectedGroup && "Select Department"}
                  {reportStep === 1 &&
                    selectedGroup &&
                    `Select Issue in ${selectedGroup.title}`}
                  {reportStep === 2 && "Describe Issue Details"}
                  {reportStep === 3 && "Complaint has been registered"}
                </span>
              </div>
              {/* Step Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-0 shrink-0 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{
                    width:
                      reportStep === 1
                        ? "33%"
                        : reportStep === 2
                          ? "66%"
                          : "100%",
                  }}
                />
              </div>
            </div>
          ) as any
        }
      >
        <div className="flex flex-col h-auto max-h-[80vh] bg-white dark:bg-slate-900 rounded-b-3xl">
          {/* STEP 1: DRILL-DOWN CATEGORY SELECTION */}
          {reportStep === 1 && (
            <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden mt-4">
              <AnimatePresence mode="wait">
                {/* VIEW A: MASTER RICH CATEGORY GRID */}
                {!selectedGroup ? (
                  <motion.div
                    key="master-grid"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 shrink-0 mb-4">
                      Select the department that handles your civic problem:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 overflow-y-auto pr-2 custom-scrollbar pb-4">
                      {RICH_CIVIC_CATEGORIES.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <motion.div
                            key={cat.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedGroup(cat);
                              setValue("category", cat.id);
                              setValue("subCategory", "");
                              setSubSearchQuery("");
                              setCustomSubCategory("");
                            }}
                            className="rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 hover:border-primary shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col bg-white dark:bg-slate-900"
                          >
                            <div className="relative h-32 md:h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                              <img
                                src={cat.image}
                                alt={cat.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                                <div
                                  className={`p-2 rounded-xl bg-linear-to-br ${cat.gradient} text-white shadow-sm flex items-center space-x-2 px-3 border border-white/20`}
                                >
                                  <CatIcon size={14} />
                                  <span className="text-[10px] font-black tracking-wider uppercase">
                                    {cat.badge}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 space-y-1 border-t border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                                  {cat.title}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                  {cat.desc}
                                </p>
                              </div>
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                                  {cat.issues.length > 0
                                    ? `${cat.issues.length} Issues`
                                    : "Custom"}
                                </span>
                                <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                                  SELECT
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* VIEW B: SUB-CATEGORY LIST OR CUSTOM INPUT */
                  <motion.div
                    key="sub-list"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    <div className="shrink-0 space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedGroup(null)}
                        className="flex items-center text-xs font-black text-slate-500 hover:text-primary transition cursor-pointer"
                      >
                        <ArrowLeft size={14} className="mr-1" /> Back to
                        Departments
                      </button>

                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
                        <Info className="text-blue-500 shrink-0" size={20} />
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          You have selected the{" "}
                          <strong>{selectedGroup.title}</strong> department.
                          {selectedGroup.id === "Others"
                            ? " Please describe your issue below."
                            : " Now search or pick a specific issue inside it."}
                        </p>
                      </div>

                      {selectedGroup.id !== "Others" && (
                        <div className="relative">
                          <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <input
                            type="text"
                            placeholder={`Search inside ${selectedGroup.title}...`}
                            value={subSearchQuery}
                            onChange={(e) => setSubSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-2 max-h-96 custom-scrollbar">
                      {selectedGroup.id === "Others" ? (
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">
                            Please describe the exact nature of your issue:
                          </label>
                          <input
                            type="text"
                            autoFocus
                            placeholder="E.g., Abandoned vehicle blocking the road"
                            value={customSubCategory}
                            onChange={(e) => {
                              setCustomSubCategory(e.target.value);
                              setValue("subCategory", e.target.value);
                            }}
                            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                      ) : (
                        selectedGroup.issues
                          .filter((sub) =>
                            sub
                              .toLowerCase()
                              .includes(subSearchQuery.toLowerCase()),
                          )
                          .map((sub, i) => {
                            const isSelected = watchSubCategory === sub;
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  setValue("subCategory", sub);
                                  setTimeout(() => setReportStep(2), 300); // Auto Advance
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-orange-500/10 border-primary ring-1 ring-primary shadow-sm"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                              >
                                <span
                                  className={`text-sm font-bold ${isSelected ? "text-primary dark:text-orange-400" : "text-slate-700 dark:text-slate-200"}`}
                                >
                                  {sub}
                                </span>
                                {isSelected ? (
                                  <CheckCircle
                                    className="text-primary"
                                    size={20}
                                  />
                                ) : (
                                  <Circle
                                    className="text-slate-300 dark:text-slate-700"
                                    size={20}
                                  />
                                )}
                              </button>
                            );
                          })
                      )}

                      {selectedGroup.id !== "Others" &&
                        selectedGroup.issues.filter((sub) =>
                          sub
                            .toLowerCase()
                            .includes(subSearchQuery.toLowerCase()),
                        ).length === 0 && (
                          <div className="text-center py-10 text-slate-500 text-sm font-bold">
                            No matching issues found. Try a different keyword.
                          </div>
                        )}
                    </div>

                    <div className="shrink-0 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setReportStep(2)}
                        disabled={!watchSubCategory}
                        className="w-full sm:w-auto sm:float-right min-w-64 py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm flex items-center justify-center space-x-2 cursor-pointer tracking-wider uppercase"
                      >
                        <span>NEXT STEP</span>
                        <ArrowRight size={18} />
                      </button>
                      <div className="clear-both" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* STEP 2: ISSUE DETAILS, MAP & MEDIA */}
          {reportStep === 2 && (
            <form
              onSubmit={handleSubmit(handleReportSubmit)}
              className="flex flex-col flex-1 min-h-0 mt-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setReportStep(1)}
                  className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Change Issue</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black border border-slate-200 dark:border-slate-700 truncate max-w-40">
                    {selectedGroup?.title}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 truncate max-w-48">
                    {watchSubCategory}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6 custom-scrollbar">
                {/* LOCATION & MAP SECTION WITH AUTOCOMPLETE */}
                <div className="space-y-4">
                  <div className="space-y-2 relative">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                        <MapPin size={18} />
                      </div>
                      Street Name & Landmark
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="e.g. Near Pattabiram Railway Station"
                      {...register("streetName", {
                        onChange: (e) => {
                          setSelectedStreetItem(null);
                          const val = e.target.value;
                          if (val.trim().length < 3) {
                            setStreetResults([]);
                            return;
                          }
                          const filtered = ALL_AVADI_STREETS.filter((item) =>
                            item.streetName
                              .toLowerCase()
                              .includes(val.toLowerCase().trim()),
                          ).slice(0, 15);
                          setStreetResults(filtered);
                        },
                      })}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />

                    <AnimatePresence>
                      {streetResults.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl custom-scrollbar top-full"
                        >
                          {streetResults.map((street, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleSelectStreet(street)}
                              className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-primary cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-none flex items-center gap-2"
                            >
                              <MapPin size={14} className="text-slate-400" />
                              {street.streetName}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    {errors.streetName && (
                      <p className="text-xs text-rose-500 font-medium">
                        {errors.streetName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <MapIcon size={18} />
                      </div>
                      Pinpoint Location on Map
                    </label>
                    <MapLocationPicker
                      onLocationSelect={(lat, lng) => {
                        setValue("lat", lat);
                        setValue("lng", lng);
                        setMapCoords({ lat, lng });
                      }}
                      onError={(msg) => setMapError(msg)}
                    />
                    {mapError && (
                      <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                        {mapError}
                      </p>
                    )}
                  </div>
                </div>

                {/* ISSUE SUMMARY & DESCRIPTION */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                          <FileText size={18} />
                        </div>
                        Issue Summary Title
                      </label>
                      <span className="text-[10px] text-orange-500 font-extrabold px-2 py-0.5 bg-orange-500/10 rounded-md">
                        Auto-Drafted
                      </span>
                    </div>
                    <input
                      type="text"
                      {...register("title")}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.title && (
                      <p className="text-xs text-rose-500 font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Edit3 size={18} />
                      </div>
                      Detailed Problem Description
                    </label>
                    <textarea
                      rows={4}
                      {...register("description")}
                      className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400 resize-none min-h-32"
                    />
                    {errors.description && (
                      <p className="text-xs text-rose-500 font-medium">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* PHOTO UPLOADS */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                        <Camera size={18} />
                      </div>
                      Issue Photos (Max 3)
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center pt-2">
                    {imagePreviews.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
                      >
                        <img
                          src={url}
                          alt="Attached issue"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-950/80 text-white flex items-center justify-center font-bold text-xs hover:bg-slate-950 cursor-pointer shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < 3 && (
                      <label className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
                        <Camera size={24} className="mb-1" />
                        <span className="text-xs font-extrabold mt-1">
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
              </div>

              {/* SHARE TO COMMUNITY FEED TOGGLE */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      {...register("shareOnFeed")}
                      className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    />
                    <Check
                      size={14}
                      className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      Post to Community Feed
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      Allow other residents in Ward {activeWard.id} to see and
                      upvote this issue to escalate priority.
                    </span>
                  </div>
                </label>
              </div>

              <div className="shrink-0 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={!isValid}
                  className="w-full sm:w-auto sm:float-right min-w-64 py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm cursor-pointer tracking-wider uppercase"
                >
                  Submit Grievance Report
                </button>
                <div className="clear-both" />
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS ACKNOWLEDGEMENT & SOCIAL SHARE */}
          {reportStep === 3 && submittedComplaint && (
            <div className="flex flex-col flex-1 items-center justify-center space-y-6 text-center py-8 w-full max-w-2xl mx-auto px-4">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 size={48} />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Grievance Submitted Successfully!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
                  Your report has been securely logged and dispatched to the
                  Municipal Corporation & Zonal Officer.
                </p>
              </div>

              <div className="w-full p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 space-y-3">
                <span className="text-sm font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  Official Grievance ID
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-widest">
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
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary transition text-xs font-extrabold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                  >
                    <Copy size={16} />
                    <span>{copiedId ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Social Sharing Network */}
              <div className="w-full space-y-4 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-center gap-2">
                  <Share2 size={14} /> Share to Escalate Visibility
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`I have registered a civic grievance (ID: ${submittedComplaint.issueId || `AVD-2026-${1000 + Number(submittedComplaint.id)}`}) regarding ${watchSubCategory} via the Avadi City Portal. Let's build a better city! https://avadi.vercel.app 🏙️`)}`,
                        "_blank",
                      )
                    }
                    className="w-full sm:flex-1 py-3.5 bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I have registered a civic grievance (ID: ${submittedComplaint.issueId || `AVD-2026-${1000 + Number(submittedComplaint.id)}`}) regarding ${watchSubCategory} via the Avadi City Portal. https://avadi.vercel.app @AvadiCorp`)}`,
                        "_blank",
                      )
                    }
                    className="w-full sm:flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border border-slate-700 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    X (Twitter)
                  </button>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer order-2 sm:order-1"
                >
                  Close Window
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("my-complaints");
                    setViewMode("workspace");
                    setIsReportModalOpen(false);
                  }}
                  className="w-full py-4 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black shadow-md transition text-sm cursor-pointer flex items-center justify-center space-x-2 order-1 sm:order-2"
                >
                  <FileText size={18} />
                  <span>Track Status</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* DETAILED GRIEVANCE VIEW */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Track Grievance"
        >
          <div className="space-y-5">
            <div className="flex items-start space-x-4">
              <img
                src={selectedComplaint.imageUrl}
                alt={selectedComplaint.title}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    {selectedComplaint.issueId ||
                      `AVD-2026-${1000 + Number(selectedComplaint.id)}`}
                  </span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Ward {selectedComplaint.ward}
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                  {selectedComplaint.title}
                </h3>
                {selectedComplaint.address && (
                  <p className="text-xs font-medium text-slate-500 flex items-center pt-1">
                    <MapPin size={12} className="mr-1 text-primary shrink-0" />
                    <span className="truncate">
                      {selectedComplaint.address}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-5 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
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
                          className={`text-xs font-extrabold mt-2 text-center ${
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

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Issue Description
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-between text-sm">
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
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
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
            <div className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              {selectedAdminModal.avatar ? (
                <img
                  src={selectedAdminModal.avatar}
                  alt={selectedAdminModal.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0 bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-2xl bg-linear-to-br ${selectedAdminModal.badgeBg} text-white flex items-center justify-center shadow-md shrink-0`}
                >
                  <selectedAdminModal.icon size={30} />
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
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
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight truncate">
                  {selectedAdminModal.name}
                </h3>
                {selectedAdminModal.jurisdiction && (
                  <p className="text-xs font-semibold text-slate-400 truncate">
                    📍 {selectedAdminModal.jurisdiction}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                      {selectedAdminModal.phone}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${selectedAdminModal.phone.replace(/\s+/g, "")}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shrink-0 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>

              {selectedAdminModal.email.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Mail size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-400 block">
                        Official Email
                      </span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                        {selectedAdminModal.email}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${selectedAdminModal.email}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition flex items-center space-x-2 shrink-0 shadow-sm"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start space-x-3 shadow-sm">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    Office Address & Timings
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed block mt-1">
                    {selectedAdminModal.office}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center">
                    <Clock size={14} className="mr-1 text-amber-500" />
                    <span>{selectedAdminModal.timings}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAdminModal(null)}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
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
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Access official Tamil Nadu State & Avadi Municipal Corporation
            digital portals for tax payments, certificates, and civic services.
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                href={service.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-primary/60 transition-all flex items-start justify-between gap-3 group shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${service.badgeBg}`}
                    >
                      {service.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400 truncate">
                      {service.dept}
                    </span>
                  </div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug">
                    {service.desc}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary flex items-center justify-center shrink-0 transition-colors mt-1 shadow-sm">
                  <ExternalLink size={18} />
                </div>
              </motion.a>
            ))}
          </div>
          <button
            onClick={() => setIsGovtServicesModalOpen(false)}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Complaints;
