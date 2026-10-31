"use client";

import React, { useState, useRef, useEffect, useMemo, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  Heart,
  Newspaper,
  AlertTriangle,
  MessageCircle,
  Clock,
  Building2,
  Phone,
  ShieldAlert,
  FileText,
  Check,
  ExternalLink,
  Info,
  Radio,
  Search,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

// Category type definitions
export type FeedCategoryType =
  | "General"
  | "News"
  | "Complaint"
  | "Blood Request"
  | "Current Outage";

export type AudienceType = "entire-avadi" | "within-ward";

// Interruption types for Current Outage category
export const OUTAGE_INTERRUPTION_TYPES = [
  "Complete power cut",
  "Planned maintenance",
  "Low voltage",
  "Frequent power interruptions",
  "Damaged electrical wire or equipment",
  "Other electrical issue",
];

// Blood groups for Blood Request category
export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Bombay Blood Group",
];

// Complaint issue types
export const COMPLAINT_ISSUE_TYPES = [
  "Roads & Potholes",
  "Streetlights & Illumination",
  "Garbage & Solid Waste",
  "Water Supply & Leakage",
  "Drainage & Sewage Overflow",
  "Stray Animals & Cattle",
  "Noise / Public Nuisance",
  "Encroachment & Illegal Parking",
  "Other Civic Grievance",
];

// Category configuration with icons, colors, and descriptions
const CATEGORIES: {
  id: FeedCategoryType;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  activeBorder: string;
  activeBg: string;
}[] = [
  {
    id: "General",
    label: "General",
    badge: "Community",
    description: "Everyday discussions, neighborhood news, questions, & general city updates",
    icon: MessageCircle,
    color: "text-teal-600 dark:text-teal-400 bg-teal-500/10",
    activeBorder: "border-teal-500 dark:border-teal-400",
    activeBg: "bg-teal-50/50 dark:bg-teal-950/20",
  },
  {
    id: "News",
    label: "News",
    badge: "Civic Update",
    description: "Local events, public notices, civic announcements, & neighborhood alerts",
    icon: Newspaper,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
    activeBorder: "border-indigo-500 dark:border-indigo-400",
    activeBg: "bg-indigo-50/50 dark:bg-indigo-950/20",
  },
  {
    id: "Complaint",
    label: "Complaint",
    badge: "Civic Issue",
    description: "Report potholes, streetlights, garbage, water leaks, or civic issues",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    activeBorder: "border-amber-500 dark:border-amber-400",
    activeBg: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    id: "Blood Request",
    label: "Blood Request",
    badge: "Urgent SOS",
    description: "Emergency blood donor appeals for patients in local hospitals & clinics",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
    activeBorder: "border-rose-500 dark:border-rose-400",
    activeBg: "bg-rose-50/50 dark:bg-rose-950/20",
  },
  {
    id: "Current Outage",
    label: "Current Outage",
    badge: "Power / EB",
    description: "Report power cuts, low voltage, line maintenance, or electrical hazards",
    icon: Zap,
    color: "text-amber-500 dark:text-yellow-400 bg-amber-500/10",
    activeBorder: "border-amber-500 dark:border-amber-400",
    activeBg: "bg-amber-50/50 dark:bg-amber-950/20",
  },
];

// Client-side image validator and compressor (reusing established project pattern)
const validateAndCompressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.75,
): Promise<string> => {
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (
    !ALLOWED_MIME_TYPES.includes(file.type) ||
    !ALLOWED_EXTENSIONS.includes(ext)
  ) {
    throw new Error(
      "Only standard image formats (JPG, PNG, WebP) are allowed.",
    );
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File is too large. Please upload an image under 15MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to process image canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("Corrupted or invalid image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
  });
};

export default function NewFeedCreationPage() {
  const router = useRouter();
  const toast = useToast();
  const { authUser, activeWard, isAuthenticated, isLoadingAuth, refreshFeeds } =
    useWard();

  // Wizard refs & scroll
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Step State (1: Details, 2: Supporting Info, 3: Review & Publish)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Auth Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/feed/create");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // Step Navigation with smooth top-scroll
  const goToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
    setTimeout(() => {
      if (wizardTopRef.current) {
        wizardTopRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // ==========================================
  // STEP 1 STATE: ESSENTIAL FEED DETAILS
  // ==========================================
  const [category, setCategory] = useState<FeedCategoryType>("General");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<AudienceType>("entire-avadi");
  const [selectedWard, setSelectedWard] = useState<number>(activeWard?.id || 1);
  const [streetQuery, setStreetQuery] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);

  // Update selectedWard when activeWard loads
  useEffect(() => {
    if (activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48) {
      setSelectedWard((prev) => (prev === 1 ? activeWard.id : prev));
    }
  }, [activeWard?.id]);

  // ==========================================
  // STEP 2 STATE: DYNAMIC SUPPORTING INFO
  // ==========================================
  // Shared Image Attachment
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // General fields
  const [generalSupportingInfo, setGeneralSupportingInfo] = useState("");

  // News fields
  const [newsLocation, setNewsLocation] = useState("");
  const [newsSourceUrl, setNewsSourceUrl] = useState("");

  // Complaint fields
  const [complaintIssueType, setComplaintIssueType] = useState(
    COMPLAINT_ISSUE_TYPES[0],
  );
  const [complaintLandmark, setComplaintLandmark] = useState("");

  // Blood Request fields
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [bloodUrgency, setBloodUrgency] = useState("Critical / Immediate");
  const [bloodHospital, setBloodHospital] = useState("");
  const [bloodRequiredDate, setBloodRequiredDate] = useState("");
  const [bloodUnits, setBloodUnits] = useState("1 unit");
  const [bloodContactPhone, setBloodContactPhone] = useState("");

  // Current Outage fields
  const [outageInterruptionType, setOutageInterruptionType] = useState(
    OUTAGE_INTERRUPTION_TYPES[0],
  );
  const [outageStartTimeOption, setOutageStartTimeOption] =
    useState("Just now");
  const [outageCustomStartTime, setOutageCustomStartTime] = useState("");
  const [outageLandmark, setOutageLandmark] = useState("");
  const [outageScope, setOutageScope] = useState("Entire Street");
  const [outageAdditionalNotes, setOutageAdditionalNotes] = useState("");

  // ==========================================
  // STEP 3 & FORM VALIDATION STATE
  // ==========================================
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle Category Change (Cleanly clear category-specific data without stale leaks)
  const handleCategorySelect = (newCategory: FeedCategoryType) => {
    if (newCategory === category) return;
    setCategory(newCategory);

    // Clear category-specific field errors
    setFieldErrors({});

    // Reset category-specific states
    if (newCategory !== "General") setGeneralSupportingInfo("");
    if (newCategory !== "News") {
      setNewsLocation("");
      setNewsSourceUrl("");
    }
    if (newCategory !== "Complaint") {
      setComplaintIssueType(COMPLAINT_ISSUE_TYPES[0]);
      setComplaintLandmark("");
    }
    if (newCategory !== "Blood Request") {
      setBloodGroup(BLOOD_GROUPS[0]);
      setBloodHospital("");
      setBloodContactPhone("");
      setBloodRequiredDate("");
    }
    if (newCategory !== "Current Outage") {
      setOutageInterruptionType(OUTAGE_INTERRUPTION_TYPES[0]);
      setOutageLandmark("");
      setOutageAdditionalNotes("");
    }
  };

  // Street Search / Autocomplete Handler
  const handleStreetSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStreetQuery(val);
    setStreetArea(val);
    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }

    if (!val.trim() || val.trim().length < 2) {
      setStreetResults([]);
      setShowStreetDropdown(false);
      return;
    }

    const matches = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(val.toLowerCase()),
    );
    setStreetResults(matches.slice(0, 10));
    setShowStreetDropdown(matches.length > 0);
  };

  const handleSelectStreet = (item: StreetItem) => {
    setStreetQuery(item.streetName);
    setStreetArea(item.streetName);
    setSelectedWard(item.wardNo);
    setStreetResults([]);
    setShowStreetDropdown(false);
    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }
  };

  // Image Upload Handlers
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file size must be less than 15MB.");
      return;
    }

    setIsCompressing(true);
    try {
      const compressedDataUrl = await validateAndCompressImage(file);
      setImageFile(file);
      setImagePreview(compressedDataUrl);
      if (fieldErrors.image) {
        setFieldErrors((prev) => ({ ...prev, image: "" }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process image.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ==========================================
  // VALIDATION LOGIC
  // ==========================================
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!category) {
      errors.category = "Please select a category.";
    }

    if (!title.trim()) {
      errors.title = "Feed title is required.";
    } else if (title.trim().length < 4) {
      errors.title = "Title must be at least 4 characters.";
    }

    if (!description.trim()) {
      errors.description = "Feed description is required.";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }

    if (audience === "within-ward" && (!selectedWard || selectedWard < 1 || selectedWard > 48)) {
      errors.ward = "Please select a valid Avadi Municipal ward (1 to 48).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep1 = () => {
    if (validateStep1()) {
      goToStep(2);
    } else {
      toast.error("Please fill in all required fields marked with *");
    }
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (category === "Complaint") {
      if (!complaintIssueType) {
        errors.complaintIssueType = "Please select an issue type.";
      }
      if (!streetArea.trim() && !streetQuery.trim()) {
        errors.streetArea = "Please specify the affected street or area.";
      }
    }

    if (category === "Blood Request") {
      if (!bloodGroup) {
        errors.bloodGroup = "Please select the required blood group.";
      }
      if (!bloodHospital.trim()) {
        errors.bloodHospital = "Hospital or delivery location is required.";
      }
      const cleanPhone = bloodContactPhone.replace(/[^0-9]/g, "");
      if (!cleanPhone) {
        errors.bloodContactPhone = "Emergency contact phone is required.";
      } else if (cleanPhone.length < 10) {
        errors.bloodContactPhone = "Contact phone must be at least 10 digits.";
      }
    }

    if (category === "Current Outage") {
      if (!outageInterruptionType) {
        errors.outageInterruptionType = "Please select the interruption type.";
      }
      if (!streetArea.trim() && !streetQuery.trim()) {
        errors.streetArea = "Affected street or locality is required for outage reporting.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep2 = () => {
    if (validateStep2()) {
      goToStep(3);
    } else {
      toast.error("Please complete the required supporting information.");
    }
  };

  // ==========================================
  // FINAL SUBMISSION HANDLER
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setFieldErrors((prev) => ({
        ...prev,
        terms: "Please confirm community guidelines agreement before publishing.",
      }));
      toast.error("Please check the confirmation box to proceed.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build structured text representation according to category
      let structuredDetails = "";

      if (category === "Current Outage") {
        const effectiveStartTime =
          outageStartTimeOption === "Custom"
            ? outageCustomStartTime || "Not specified"
            : outageStartTimeOption;

        structuredDetails = [
          `⚡ **Interruption Type:** ${outageInterruptionType}`,
          `📍 **Affected Locality:** ${streetArea || streetQuery || `Ward ${selectedWard}`}${outageLandmark ? ` (Near ${outageLandmark})` : ""}`,
          `🕒 **Interruption Started:** ${effectiveStartTime}`,
          `📐 **Outage Scope:** ${outageScope}`,
          `📋 **Status:** Community Reported (Unverified by EB)`,
          outageAdditionalNotes ? `ℹ️ **Resident Notes:** ${outageAdditionalNotes}` : "",
          outageInterruptionType === "Damaged electrical wire or equipment"
            ? "⚠️ **HAZARD NOTICE:** Damaged wires reported. Keep away and call 1912."
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "Blood Request") {
        structuredDetails = [
          `🩸 **Blood Group Needed:** ${bloodGroup}`,
          `🚨 **Urgency:** ${bloodUrgency}`,
          `🏥 **Hospital / Location:** ${bloodHospital}`,
          `📦 **Units Needed:** ${bloodUnits}`,
          bloodRequiredDate ? `📅 **Required By:** ${bloodRequiredDate}` : "",
          `📞 **Emergency Contact:** ${bloodContactPhone}`,
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "Complaint") {
        structuredDetails = [
          `⚠️ **Civic Issue Type:** ${complaintIssueType}`,
          `📍 **Affected Area:** ${streetArea || streetQuery || `Ward ${selectedWard}`}${complaintLandmark ? ` (Landmark: ${complaintLandmark})` : ""}`,
          `📢 **Status:** Community Grievance Submitted`,
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "News") {
        structuredDetails = [
          newsLocation ? `📍 **News Location:** ${newsLocation}` : "",
          newsSourceUrl ? `🔗 **Source / Reference:** ${newsSourceUrl}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "General" && generalSupportingInfo) {
        structuredDetails = `ℹ️ **Additional Details:** ${generalSupportingInfo}`;
      }

      // Final composed body
      const fullText = structuredDetails
        ? `${description.trim()}\n\n---\n${structuredDetails}`
        : description.trim();

      const postPayload = {
        title: title.trim(),
        text: fullText,
        category: category,
        ward: audience === "entire-avadi" ? 0 : selectedWard,
        isEmergency: category === "Blood Request",
        imageUrl: imagePreview || null,
      };

      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to publish feed.");
      }

      // Refresh cached feeds in WardContext
      await refreshFeeds();

      // Show success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Submission Error:", err);
      toast.error(
        err.message || "Failed to publish feed post. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto md:max-w-full space-y-6 pb-24">
      {/* 1. Back to Feed Navigation */}
      <div>
        <Link
          href="/feed"
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft size={16} />
          <span>Back to Community Feed</span>
        </Link>
      </div>

      {/* 2. Main Wizard Card with Integrated Step Bar */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div ref={wizardTopRef} className="scroll-mt-6" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* Top Segmented Progress Bar (Matches Food & Dining Pattern) */}
          <div className="space-y-3.5 border-b border-slate-100 dark:border-slate-800 pb-5 sm:pb-6">
            {/* Horizontal Segmented Progress Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  onClick={() => {
                    if (stepNum < currentStep) goToStep(stepNum as 1 | 2 | 3);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    stepNum < currentStep
                      ? "bg-emerald-500 shadow-xs shadow-emerald-500/30 cursor-pointer hover:opacity-80"
                      : stepNum === currentStep
                        ? "bg-primary shadow-xs shadow-primary/30"
                        : "bg-slate-100 dark:bg-slate-800"
                  }`}
                  title={
                    stepNum < currentStep
                      ? `Step ${stepNum} (Completed - Click to view)`
                      : stepNum === currentStep
                        ? `Step ${stepNum} (Current)`
                        : `Step ${stepNum}`
                  }
                />
              ))}
            </div>

            {/* Step Info Row */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-orange-500 dark:text-orange-400 block">
                  STEP {currentStep} OF 3
                </span>
                <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {currentStep === 1 && "Feed Details & Category"}
                  {currentStep === 2 && `Supporting Information (${category})`}
                  {currentStep === 3 && "Review & Publish"}
                </h2>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black tracking-tight shrink-0 shadow-2xs">
                {currentStep}/3
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 1: FEED DETAILS & CATEGORY SELECTION               */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Select Category Cards (Includes Required Current Outage Card) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Select Category <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Select one category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`flex flex-col text-left p-4 rounded-2xl border transition-all select-none cursor-pointer active:scale-98 relative group ${
                          isSelected
                            ? `${cat.activeBorder} ${cat.activeBg} ring-2 ring-primary/30 shadow-sm`
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`p-2 rounded-xl ${cat.color} shrink-0`}
                          >
                            <Icon size={18} />
                          </div>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {cat.badge}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{cat.label}</span>
                            {cat.id === "Current Outage" && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-sm font-black uppercase">
                                New
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                            {cat.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.category && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.category}
                  </p>
                )}
              </div>

              {/* Feed Title */}
              <div>
                <label
                  htmlFor="feed-title-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Feed Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="feed-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title)
                      setFieldErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  placeholder={
                    category === "Current Outage"
                      ? "e.g., Sudden power cut at JB Estate 12th Street"
                      : category === "Blood Request"
                        ? "e.g., Urgent requirement of B+ Blood at Avadi GH"
                        : category === "Complaint"
                          ? "e.g., Deep potholes on HVF Main Road near junction"
                          : category === "News"
                            ? "e.g., Avadi Lake eco-park timing update for weekend"
                            : "e.g., Neighborhood clean-up drive this Saturday"
                  }
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.title
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.title && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Feed Description */}
              <div>
                <label
                  htmlFor="feed-description-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Feed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="feed-description-input"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description)
                      setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  placeholder="Provide comprehensive details of what is happening so neighbors and local responders understand the situation clearly..."
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-25 ${
                    fieldErrors.description
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.description ? (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-slate-400">
                    {description.length} characters (min 10)
                  </span>
                </div>
              </div>

              {/* Audience Selection (Reusing Established Conventions) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Audience Selection <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAudience("entire-avadi")}
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border text-left cursor-pointer transition select-none ${
                      audience === "entire-avadi"
                        ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold ring-2 ring-primary/20"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 shrink-0 mt-0.5">
                      <Globe size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-black block">
                        🌐 All Avadi Broadcast
                      </span>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight">
                        Visible to all residents across all 48 municipal wards of
                        Avadi
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience("within-ward")}
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border text-left cursor-pointer transition select-none ${
                      audience === "within-ward"
                        ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold ring-2 ring-primary/20"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 shrink-0 mt-0.5">
                      <MapPin size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-black block">
                        📍 Ward-Exclusive Feed
                      </span>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight">
                        Targeted primarily to neighbors living within a specific
                        ward
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ward or Area Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Municipal Ward Selector */}
                  <div>
                    <label
                      htmlFor="feed-ward-select"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Municipal Ward{" "}
                      {audience === "within-ward" && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <select
                      id="feed-ward-select"
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {Array.from({ length: 48 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>
                          Ward {w} {activeWard?.id === w ? "(Your Ward)" : ""}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.ward && (
                      <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.ward}
                      </p>
                    )}
                  </div>

                  {/* Locality / Street Quick Finder (from ALL_AVADI_STREETS) */}
                  <div className="relative">
                    <label
                      htmlFor="street-search-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Locality / Street{" "}
                      <span className="text-slate-400 font-normal">
                        (Search Avadi streets)
                      </span>
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="street-search-input"
                        type="text"
                        value={streetQuery}
                        onChange={handleStreetSearchChange}
                        onFocus={() => {
                          if (streetResults.length > 0)
                            setShowStreetDropdown(true);
                        }}
                        placeholder="e.g. JB Estate, Muthapudupet, Gandhi St..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showStreetDropdown && streetResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1">
                        {streetResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectStreet(item)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold truncate">
                              {item.streetName}
                            </span>
                            <span className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              Ward {item.wardNo}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleContinueStep1}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SUPPORTING INFORMATION (DYNAMIC PER CATEGORY)   */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Category-Specific Header Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-bold text-slate-500">
                    Category:
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    {category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="text-xs font-bold text-slate-400 hover:text-primary transition"
                >
                  Change Category
                </button>
              </div>

              {/* ---------------------------------------------------- */}
              {/* 2A. CURRENT OUTAGE (REQUIRED NEW CATEGORY)           */}
              {/* ---------------------------------------------------- */}
              {category === "Current Outage" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Status & Safety Warning Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                        <Zap size={15} />
                        <span>Community Power Outage Report</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Status: Community Reported
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                      ⚠️ Note: This report will be tagged as{" "}
                      <strong>Community Reported</strong> with Cause marked as{" "}
                      <strong>Unknown / Not Yet Verified</strong>. Please do not
                      claim official TNEB / EB confirmation or invent official
                      restoration estimates.
                    </p>
                  </div>

                  {/* HIGH VISIBILITY SAFETY WARNING FOR HAZARDS */}
                  {outageInterruptionType ===
                    "Damaged electrical wire or equipment" && (
                    <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center space-x-2 font-black text-xs uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                        <ShieldAlert size={18} />
                        <span>DANGER: Electrical Hazard Safety Warning</span>
                      </div>
                      <p className="text-xs leading-relaxed font-semibold">
                        Keep completely away from downed power lines, damaged
                        poles, or sparking transformers! Keep children and pets
                        at a safe distance. Do not touch anything in contact
                        with wires. Immediately notify the TANGEDCO / TNEB 24/7
                        Helpline at <strong>1912</strong> or{" "}
                        <strong>94987 94987</strong>.
                      </p>
                    </div>
                  )}

                  {/* 1. Interruption Type */}
                  <div>
                    <label
                      htmlFor="outage-type-select"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Interruption Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="outage-type-select"
                      value={outageInterruptionType}
                      onChange={(e) =>
                        setOutageInterruptionType(e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {OUTAGE_INTERRUPTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Affected Locality & Landmark */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="outage-street-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Affected Street / Locality{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="outage-street-input"
                        type="text"
                        value={streetArea}
                        onChange={(e) => setStreetArea(e.target.value)}
                        placeholder="e.g. JB Estate 12th Street"
                        className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                          fieldErrors.streetArea
                            ? "border-rose-400 focus:ring-rose-400"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {fieldErrors.streetArea && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} /> {fieldErrors.streetArea}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="outage-landmark-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Nearby Landmark{" "}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="outage-landmark-input"
                        type="text"
                        value={outageLandmark}
                        onChange={(e) => setOutageLandmark(e.target.value)}
                        placeholder="e.g. Near EB Transformer / Mosque St"
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 3. Start Date and Time & Scope */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="outage-time-option"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        When did the interruption start?
                      </label>
                      <select
                        id="outage-time-option"
                        value={outageStartTimeOption}
                        onChange={(e) =>
                          setOutageStartTimeOption(e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer mb-2"
                      >
                        <option value="Just now">Just now</option>
                        <option value="15 minutes ago">15 minutes ago</option>
                        <option value="30 minutes ago">30 minutes ago</option>
                        <option value="1 hour ago">1 hour ago</option>
                        <option value="Over 2 hours ago">Over 2 hours ago</option>
                        <option value="Custom">Specify custom date & time</option>
                      </select>

                      {outageStartTimeOption === "Custom" && (
                        <input
                          type="datetime-local"
                          value={outageCustomStartTime}
                          onChange={(e) =>
                            setOutageCustomStartTime(e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="outage-scope-select"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Outage Scope
                      </label>
                      <select
                        id="outage-scope-select"
                        value={outageScope}
                        onChange={(e) => setOutageScope(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        <option value="Entire Street">Entire Street</option>
                        <option value="Single Phase Only">Single Phase Only</option>
                        <option value="Multiple Streets">Multiple Streets</option>
                        <option value="Entire Ward">Entire Ward</option>
                        <option value="Streetlights Only">Streetlights Only</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Additional Experience / Notes */}
                  <div>
                    <label
                      htmlFor="outage-notes-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Additional Resident Observation{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="outage-notes-input"
                      rows={2}
                      value={outageAdditionalNotes}
                      onChange={(e) => setOutageAdditionalNotes(e.target.value)}
                      placeholder="e.g. Heard a loud noise from the pole transformer; neighbors report supply cut across 10th to 14th street."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2B. GENERAL                                          */}
              {/* ---------------------------------------------------- */}
              {category === "General" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="general-info-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Additional Supporting Information{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="general-info-input"
                      rows={3}
                      value={generalSupportingInfo}
                      onChange={(e) => setGeneralSupportingInfo(e.target.value)}
                      placeholder="e.g. Meeting time, venue details, agenda points, or relevant context for your neighbors..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2C. NEWS                                             */}
              {/* ---------------------------------------------------- */}
              {category === "News" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="news-location-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      News Location / Locality{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      id="news-location-input"
                      type="text"
                      value={newsLocation}
                      onChange={(e) => setNewsLocation(e.target.value)}
                      placeholder="e.g. Avadi Checkpost, Paruthipattu Lake, Market Road"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="news-source-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Source URL or Reference{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      id="news-source-input"
                      type="text"
                      value={newsSourceUrl}
                      onChange={(e) => setNewsSourceUrl(e.target.value)}
                      placeholder="e.g. Official Corporation Notice, https://avadicity.org/..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2D. COMPLAINT                                        */}
              {/* ---------------------------------------------------- */}
              {category === "Complaint" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="complaint-type-select"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Issue Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="complaint-type-select"
                      value={complaintIssueType}
                      onChange={(e) => setComplaintIssueType(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {COMPLAINT_ISSUE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="complaint-street-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Affected Street / Area{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="complaint-street-input"
                        type="text"
                        value={streetArea}
                        onChange={(e) => setStreetArea(e.target.value)}
                        placeholder="e.g. Nehru Nagar 3rd Cross Street"
                        className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                          fieldErrors.streetArea
                            ? "border-rose-400 focus:ring-rose-400"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {fieldErrors.streetArea && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} /> {fieldErrors.streetArea}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="complaint-landmark-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Nearby Landmark{" "}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="complaint-landmark-input"
                        type="text"
                        value={complaintLandmark}
                        onChange={(e) => setComplaintLandmark(e.target.value)}
                        placeholder="e.g. Opposite Ration Shop"
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium flex items-start gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Civic grievance reports are displayed on the community feed
                      and made accessible to ward members.
                    </span>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* 2E. BLOOD REQUEST                                    */}
              {/* ---------------------------------------------------- */}
              {category === "Blood Request" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                    </span>
                    <span>
                      Emergency Blood Donation appeals will carry high-priority
                      Live SOS visibility.
                    </span>
                  </div>

                  {/* Blood Group Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                      Blood Group Required{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg)}
                          className={`p-2.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                            bloodGroup === bg
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="blood-urgency-select"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Urgency Level <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="blood-urgency-select"
                        value={bloodUrgency}
                        onChange={(e) => setBloodUrgency(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        <option value="Critical / Immediate">
                          🚨 Critical / Immediate (Within 2-4 Hours)
                        </option>
                        <option value="Within 24 Hours">
                          ⚡ Urgent (Within 24 Hours)
                        </option>
                        <option value="Planned (2-3 Days)">
                          📅 Planned (Next 2-3 Days)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="blood-units-select"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Units Needed
                      </label>
                      <select
                        id="blood-units-select"
                        value={bloodUnits}
                        onChange={(e) => setBloodUnits(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        <option value="1 unit">1 unit</option>
                        <option value="2 units">2 units</option>
                        <option value="3+ units">3+ units</option>
                        <option value="Platelets">Single Donor Platelets (SDP)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="blood-hospital-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Hospital / Location Name{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="blood-hospital-input"
                        type="text"
                        value={bloodHospital}
                        onChange={(e) => setBloodHospital(e.target.value)}
                        placeholder="e.g. Avadi GH / Sir Ivan Stedeford Hospital"
                        className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                          fieldErrors.bloodHospital
                            ? "border-rose-400 focus:ring-rose-400"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {fieldErrors.bloodHospital && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} /> {fieldErrors.bloodHospital}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="blood-contact-input"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                      >
                        Patient Attendant Phone{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          id="blood-contact-input"
                          type="tel"
                          value={bloodContactPhone}
                          onChange={(e) =>
                            setBloodContactPhone(e.target.value)
                          }
                          placeholder="e.g. 9876543210"
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                            fieldErrors.bloodContactPhone
                              ? "border-rose-400 focus:ring-rose-400"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        />
                      </div>
                      {fieldErrors.bloodContactPhone && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} />{" "}
                          {fieldErrors.bloodContactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SHARED IMAGE ATTACHMENT COMPONENT                    */}
              {/* ---------------------------------------------------- */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Photo Attachment{" "}
                  <span className="text-slate-400 font-normal">
                    (Optional evidence or supporting photograph)
                  </span>
                </label>

                {imagePreview ? (
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                      className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <X size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition p-4 text-center group bg-slate-50/50 dark:bg-slate-950/50"
                  >
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary transition-colors mb-2">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Upload supporting photo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, WebP up to 15MB (compressed automatically)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting || isCompressing}
                />

                {isCompressing && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Optimizing and compressing photograph...</span>
                  </div>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueStep2}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <span>Review Feed</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: REVIEW & PUBLISH                                 */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Feed Preview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review how your post will appear to neighbors across Avadi
                  before publishing.
                </p>
              </div>

              {/* COMPREHENSIVE FEED POST PREVIEW CARD */}
              <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                {/* Author Info & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                      <Image
                        src={authUser?.avatar || "/default-avatar.png"}
                        alt="Author Avatar"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {authUser?.name || "Avadi Resident"}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          ✓ Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-medium">
                        <span>Just now</span>
                        <span>•</span>
                        <span>
                          {audience === "entire-avadi"
                            ? "All Avadi"
                            : `Ward ${selectedWard}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                    #{category}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    {title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>

                {/* Category-Specific Preview Summary */}
                {category === "Current Outage" && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Zap size={14} />
                        <span>Power Interruption Summary</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Community Reported
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Interruption Type
                        </span>
                        <span className="font-bold">
                          {outageInterruptionType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Location
                        </span>
                        <span className="font-bold">
                          {streetArea || streetQuery || `Ward ${selectedWard}`}
                          {outageLandmark ? ` (${outageLandmark})` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Started
                        </span>
                        <span className="font-bold">
                          {outageStartTimeOption === "Custom"
                            ? outageCustomStartTime || "Not specified"
                            : outageStartTimeOption}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Scope
                        </span>
                        <span className="font-bold">{outageScope}</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      ⚠️ Cause is marked as{" "}
                      <strong>Unknown / Not Yet Verified</strong>. Official
                      restoration status will be updated as TNEB confirms.
                    </div>
                  </div>
                )}

                {category === "Blood Request" && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <Heart size={14} />
                        <span>Emergency Blood Request</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white uppercase">
                        {bloodGroup} • {bloodUnits}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Hospital
                        </span>
                        <span className="font-bold">{bloodHospital}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Urgency
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {bloodUrgency}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Attendant Contact
                        </span>
                        <span className="font-bold">{bloodContactPhone}</span>
                      </div>
                    </div>
                  </div>
                )}

                {category === "Complaint" && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-400">
                      <span>Grievance: {complaintIssueType}</span>
                      <span>Ward {selectedWard}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Location: {streetArea || streetQuery || `Ward ${selectedWard}`}
                      {complaintLandmark ? ` (Near ${complaintLandmark})` : ""}
                    </p>
                  </div>
                )}

                {/* Attached Photo Preview */}
                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden max-h-60 border border-slate-200 dark:border-slate-800 bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Attached preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Audience Badge */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    {audience === "entire-avadi" ? (
                      <>
                        <Globe size={12} className="text-teal-500" />
                        <span>Broadcasting to all of Avadi City</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={12} className="text-orange-500" />
                        <span>Targeted to Ward {selectedWard} residents</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Terms & Community Guidelines Consent */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="feed-terms-checkbox"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked && fieldErrors.terms) {
                        setFieldErrors((prev) => ({ ...prev, terms: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-1 w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary cursor-pointer accent-primary shrink-0"
                  />
                  <label
                    htmlFor="feed-terms-checkbox"
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer select-none font-medium"
                  >
                    I confirm that this report is genuine, respectful of
                    community guidelines, and accurate to the best of my
                    knowledge. I understand that misleading reports or false
                    emergency claims violate civic platform rules.
                  </label>
                </div>

                {fieldErrors.terms && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pl-8">
                    <AlertCircle size={13} /> {fieldErrors.terms}
                  </p>
                )}
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Edit</span>
                </button>

                <button
                  type="submit"
                  disabled={!termsAccepted || isSubmitting}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
                    termsAccepted && !isSubmitting
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer active:scale-98"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Publishing Feed...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Publish Feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* 4. Success Modal Popup (Matches Food & Dining Pattern) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Feed Published Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                ✅{" "}
                <span className="text-primary font-bold">
                  {title || "Your post"}
                </span>{" "}
                has been published to the Avadi Community Feed under #{category}.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/feed")}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm transition cursor-pointer active:scale-98"
              >
                Go to Community Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
