"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Globe,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  Zap,
  Heart,
  Newspaper,
  AlertTriangle,
  MessageCircle,
  Phone,
  ShieldAlert,
  Info,
  Search,
  Send,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

// Category type definitions
export type FeedCategoryType =
  "General" | "News" | "Complaint" | "Blood Request" | "Current Outage";

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

// Category configuration with icons and colors
const CATEGORIES: {
  id: FeedCategoryType;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    id: "General",
    label: "General",
    badge: "Community",
    icon: MessageCircle,
    color: "text-teal-600 dark:text-teal-400",
    activeBg: "bg-teal-500 text-white",
    activeBorder: "border-teal-500",
  },
  {
    id: "News",
    label: "News",
    badge: "Civic Notice",
    icon: Newspaper,
    color: "text-indigo-600 dark:text-indigo-400",
    activeBg: "bg-indigo-500 text-white",
    activeBorder: "border-indigo-500",
  },
  {
    id: "Complaint",
    label: "Complaint",
    badge: "Civic Issue",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-500 text-white",
    activeBorder: "border-amber-500",
  },
  {
    id: "Blood Request",
    label: "Blood Request",
    badge: "Urgent SOS",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    activeBg: "bg-rose-600 text-white",
    activeBorder: "border-rose-600",
  },
  {
    id: "Current Outage",
    label: "Current Outage",
    badge: "Power / EB",
    icon: Zap,
    color: "text-amber-500 dark:text-yellow-400",
    activeBg: "bg-amber-500 text-white",
    activeBorder: "border-amber-500",
  },
];

// Client-side image validator and compressor
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

export default function FeedCreate() {
  const router = useRouter();
  const toast = useToast();
  const { authUser, activeWard, isAuthenticated, isLoadingAuth, refreshFeeds } =
    useWard();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/feed/create");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // Form State: Open composer without "Feed Title *"
  const [category, setCategory] = useState<FeedCategoryType>("General");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<AudienceType>("entire-avadi");
  const [selectedWard, setSelectedWard] = useState<number>(activeWard?.id || 1);
  const [streetQuery, setStreetQuery] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const [showComplaintStreetDropdown, setShowComplaintStreetDropdown] =
    useState(false);
  const [showOutageStreetDropdown, setShowOutageStreetDropdown] =
    useState(false);
  const [showNewsStreetDropdown, setShowNewsStreetDropdown] = useState(false);

  // Close street dropdowns on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".street-dropdown-container")) {
        setShowStreetDropdown(false);
        setShowComplaintStreetDropdown(false);
        setShowOutageStreetDropdown(false);
        setShowNewsStreetDropdown(false);
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  // Synchronize ward from activeWard when it loads
  useEffect(() => {
    if (activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48) {
      setSelectedWard((prev) => (prev === 1 ? activeWard.id : prev));
    }
  }, [activeWard?.id]);

  // Image Attachment State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Category-specific fields
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

  // Confirmation & submission state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle Category Change (Cleanly reset category-specific states)
  const handleCategorySelect = (newCategory: FeedCategoryType) => {
    if (newCategory === category) return;
    setCategory(newCategory);
    setFieldErrors({});

    // Reset non-applicable category data
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
  const handleStreetSearchChange = (
    val: string,
    target: "audience" | "complaint" | "outage" | "news" = "audience",
  ) => {
    setStreetQuery(val);
    setStreetArea(val);
    if (
      fieldErrors.streetArea ||
      fieldErrors.street ||
      fieldErrors.complaintStreet ||
      fieldErrors.outageStreet
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        streetArea: "",
        street: "",
        complaintStreet: "",
        outageStreet: "",
      }));
    }

    if (!val.trim() || val.trim().length < 2) {
      setStreetResults([]);
      setShowStreetDropdown(false);
      setShowComplaintStreetDropdown(false);
      setShowOutageStreetDropdown(false);
      setShowNewsStreetDropdown(false);
      return;
    }

    const matches = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(val.toLowerCase()),
    );
    setStreetResults(matches.slice(0, 10));
    if (target === "complaint") {
      setShowComplaintStreetDropdown(matches.length > 0);
      setShowStreetDropdown(false);
      setShowOutageStreetDropdown(false);
      setShowNewsStreetDropdown(false);
    } else if (target === "outage") {
      setShowOutageStreetDropdown(matches.length > 0);
      setShowStreetDropdown(false);
      setShowComplaintStreetDropdown(false);
      setShowNewsStreetDropdown(false);
    } else if (target === "news") {
      setShowNewsStreetDropdown(matches.length > 0);
      setShowStreetDropdown(false);
      setShowComplaintStreetDropdown(false);
      setShowOutageStreetDropdown(false);
    } else {
      setShowStreetDropdown(matches.length > 0);
      setShowComplaintStreetDropdown(false);
      setShowOutageStreetDropdown(false);
      setShowNewsStreetDropdown(false);
    }
  };

  const handleSelectStreet = (item: StreetItem) => {
    setStreetQuery(item.streetName);
    setStreetArea(item.streetName);
    setSelectedWard(item.wardNo);
    setStreetResults([]);
    setShowStreetDropdown(false);
    setShowComplaintStreetDropdown(false);
    setShowOutageStreetDropdown(false);
    setShowNewsStreetDropdown(false);
    if (
      fieldErrors.streetArea ||
      fieldErrors.street ||
      fieldErrors.complaintStreet ||
      fieldErrors.outageStreet
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        streetArea: "",
        street: "",
        complaintStreet: "",
        outageStreet: "",
      }));
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

  // Validation Logic (No "Feed Title *" required)
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!description.trim() && !imagePreview) {
      errors.description = "Please write something or attach a photo to post.";
    }

    // Dynamic Audience Selection Validation: Locality / Street is required ONLY when Ward-Exclusive is selected
    if (audience === "within-ward") {
      if (!streetArea.trim() && !streetQuery.trim()) {
        errors.street =
          "Locality / Street is required for Ward-Exclusive Feed.";
      }
    }

    // Category-specific Validation
    if (category === "Complaint") {
      if (!complaintIssueType) {
        errors.complaintIssueType = "Please select an issue type.";
      }
      if (!streetArea.trim() && !streetQuery.trim()) {
        errors.complaintStreet = "Please specify the affected street or area.";
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
        errors.outageStreet =
          "Affected street or locality is required for outage reporting.";
      }
    }

    // Dynamic Confirmation Checkbox Validation:
    // General and Blood Request posts do NOT require confirmation checkbox.
    // Mandatory for official civic categories (News, Complaint, Current Outage).
    if (
      category !== "General" &&
      category !== "Blood Request" &&
      !termsAccepted
    ) {
      errors.terms =
        "Please confirm community guidelines agreement before publishing.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Direct Submission Handler (Single-Page Post Action)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build structured details per category with rich, relevant emojis and clean text (no harsh markdown asterisks)
      let structuredDetails = "";

      if (category === "Current Outage") {
        const effectiveStartTime =
          outageStartTimeOption === "Custom"
            ? outageCustomStartTime || "Not specified"
            : outageStartTimeOption;

        structuredDetails = [
          `⚡ Outage Type: ${outageInterruptionType}`,
          `📍 Affected Locality: ${streetArea || streetQuery || `Ward ${selectedWard}`}${outageLandmark ? ` (Near ${outageLandmark})` : ""}`,
          `🕒 Interruption Started: ${effectiveStartTime}`,
          `📐 Outage Scope: ${outageScope}`,
          `📋 Status: Community Reported (Unverified by EB)`,
          outageAdditionalNotes
            ? `ℹ️ Resident Notes: ${outageAdditionalNotes}`
            : "",
          outageInterruptionType === "Damaged electrical wire or equipment"
            ? "⚠️ HAZARD NOTICE: Damaged wires reported. Keep away and call 1912."
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "Blood Request") {
        structuredDetails = [
          `🩸 Blood Group Needed: ${bloodGroup}`,
          `🚨 Urgency: ${bloodUrgency}`,
          `🏥 Hospital / Location: ${bloodHospital}`,
          `📦 Units Needed: ${bloodUnits}`,
          bloodRequiredDate ? `📅 Required By: ${bloodRequiredDate}` : "",
          `📞 Emergency Contact: ${bloodContactPhone}`,
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "Complaint") {
        const issueEmoji = complaintIssueType.includes("Road")
          ? "🚧"
          : complaintIssueType.includes("Streetlight") ||
              complaintIssueType.includes("Dark")
            ? "💡"
            : complaintIssueType.includes("Garbage") ||
                complaintIssueType.includes("Waste")
              ? "🗑️"
              : complaintIssueType.includes("Water") ||
                  complaintIssueType.includes("Leak")
                ? "🚰"
                : complaintIssueType.includes("Drainage") ||
                    complaintIssueType.includes("Sewage")
                  ? "🌊"
                  : complaintIssueType.includes("Animal") ||
                      complaintIssueType.includes("Dog")
                    ? "🐕"
                    : complaintIssueType.includes("Park") ||
                        complaintIssueType.includes("Playground")
                      ? "🌳"
                      : complaintIssueType.includes("Encroach")
                        ? "🚫"
                        : "⚠️";

        structuredDetails = [
          `${issueEmoji} Civic Issue: ${complaintIssueType}`,
          `📍 Affected Area: ${streetArea || streetQuery || `Ward ${selectedWard}`}${complaintLandmark ? ` (Landmark: ${complaintLandmark})` : ""}`,
          `📢 Status: Community Grievance Submitted 📋`,
        ]
          .filter(Boolean)
          .join("\n");
      } else if (category === "News") {
        structuredDetails = [
          newsLocation ? `📍 News Location: ${newsLocation}` : "",
          newsSourceUrl ? `🔗 Source / Reference: ${newsSourceUrl}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }

      // Final composed body with clean spacing
      const fullText = structuredDetails
        ? description.trim()
          ? `${description.trim()}\n\n${structuredDetails}`
          : structuredDetails
        : description.trim();

      // Determine proper Avadi Ward (1-48), never assign Ward 0
      const effectiveWard =
        selectedWard && selectedWard >= 1 && selectedWard <= 48
          ? selectedWard
          : authUser?.wardNumber &&
              authUser.wardNumber >= 1 &&
              authUser.wardNumber <= 48
            ? authUser.wardNumber
            : activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48
              ? activeWard.id
              : 1;

      const postPayload = {
        title: "",
        text: fullText,
        category: category,
        ward: effectiveWard,
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

      // Refresh feeds in WardContext
      await refreshFeeds();

      // Show success notification and navigate directly to community feed
      toast.success("Feed published successfully!");
      router.push("/feed");
    } catch (err: any) {
      console.error("Submission Error:", err);
      toast.error(
        err.message || "Failed to publish feed post. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = authUser?.name?.split(" ")[0] || "there";

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-2xl mx-auto space-y-4 pb-24">
      {/* 1. Header: New post title on left, X button on right */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          New post
        </h1>

        <Link
          href="/feed"
          className="p-2 -mr-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close composer"
        >
          <X size={22} />
        </Link>
      </div>

      {/* 2. Main Facebook-Style Post Composer Card */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          {/* User Profile Header */}
          <div className="flex items-start space-x-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              <Image
                src={authUser?.avatar || "/default-avatar.png"}
                alt="Author Avatar"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 pt-0.5 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {authUser?.name || "Avadi Resident"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  ✓ Verified
                </span>
              </div>

              {/* Audience Pill directly under user name */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                {audience === "entire-avadi" ? (
                  <>
                    <Globe
                      size={11}
                      className="text-teal-600 dark:text-teal-400"
                    />
                    <span>Public · All Avadi</span>
                  </>
                ) : (
                  <>
                    <MapPin
                      size={11}
                      className="text-orange-600 dark:text-orange-400"
                    />
                    <span>Ward {selectedWard} Exclusive</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Quick Pills (Like Reference 1: Music, People, Location -> Categories) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-none select-none">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    isSelected
                      ? `${cat.activeBg} border-transparent shadow-xs`
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    size={14}
                    className={isSelected ? "text-white" : cat.color}
                  />
                  <span>{cat.label}</span>
                  {cat.id === "Current Outage" && !isSelected && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-sm font-black uppercase">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Natural, Open Post Content Area (No Feed Title box) */}
          <div className="pt-2">
            <textarea
              id="feed-description-input"
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
              placeholder={
                category === "Current Outage"
                  ? "Describe the power interruption or electrical issue in your area..."
                  : category === "Blood Request"
                    ? "Describe the urgent blood donor appeal details..."
                    : category === "Complaint"
                      ? "Describe the civic grievance you want resolved..."
                      : category === "News"
                        ? "What local news or announcement would you like to share?"
                        : `What's on your mind, ${firstName}?`
              }
              className="w-full text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0 resize-y min-h-28 leading-relaxed"
            />

            {fieldErrors.description && (
              <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                <AlertCircle size={13} /> {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Attached Image Preview */}
          {imagePreview && (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
              <img
                src={imagePreview}
                alt="Attachment preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isSubmitting}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition cursor-pointer"
                aria-label="Remove attached photo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {isCompressing && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Optimizing photo...</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CATEGORY-SPECIFIC DETAILS (EMBEDDED CLEANLY)             */}
          {/* ======================================================== */}

          {/* 1. NEWS */}
          {category === "News" && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
                <Newspaper size={15} />
                <span>News Notice Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative street-dropdown-container">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={newsLocation}
                      onChange={(e) => {
                        setNewsLocation(e.target.value);
                        handleStreetSearchChange(e.target.value, "news");
                      }}
                      onFocus={() => {
                        if (streetResults.length > 0)
                          setShowNewsStreetDropdown(true);
                      }}
                      placeholder="News Location / Street (e.g. JB Estate, Avadi Checkpost)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {showNewsStreetDropdown && streetResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-0.5">
                      {streetResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNewsLocation(item.streetName);
                            handleSelectStreet(item);
                            setShowNewsStreetDropdown(false);
                          }}
                          className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-semibold truncate">
                            {item.streetName}
                          </span>
                          <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                            Ward {item.wardNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newsSourceUrl}
                  onChange={(e) => setNewsSourceUrl(e.target.value)}
                  placeholder="Source URL or Reference (Optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* 2. COMPLAINT */}
          {category === "Complaint" && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                <AlertTriangle size={15} />
                <span>Civic Complaint Details</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Issue Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={complaintIssueType}
                  onChange={(e) => setComplaintIssueType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {COMPLAINT_ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative street-dropdown-container">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={streetArea || streetQuery}
                      onChange={(e) =>
                        handleStreetSearchChange(e.target.value, "complaint")
                      }
                      onFocus={() => {
                        if (streetResults.length > 0)
                          setShowComplaintStreetDropdown(true);
                      }}
                      placeholder="Affected Street / Area *"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.complaintStreet
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.complaintStreet && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {fieldErrors.complaintStreet}
                    </p>
                  )}

                  {showComplaintStreetDropdown && streetResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-0.5">
                      {streetResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectStreet(item)}
                          className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
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

                <input
                  type="text"
                  value={complaintLandmark}
                  onChange={(e) => setComplaintLandmark(e.target.value)}
                  placeholder="Nearby Landmark (Optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* 3. BLOOD REQUEST */}
          {category === "Blood Request" && (
            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
                  <Heart size={15} />
                  <span>Emergency Blood Request</span>
                </div>
                <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase">
                  Live SOS
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Blood Group Required <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`p-2 rounded-xl border text-xs font-black transition cursor-pointer ${
                        bloodGroup === bg
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={bloodUrgency}
                  onChange={(e) => setBloodUrgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Critical / Immediate">
                    🚨 Critical / Immediate (2-4 hrs)
                  </option>
                  <option value="Within 24 Hours">
                    ⚡ Urgent (Within 24 hrs)
                  </option>
                  <option value="Planned (2-3 Days)">
                    📅 Planned (Next 2-3 Days)
                  </option>
                </select>

                <select
                  value={bloodUnits}
                  onChange={(e) => setBloodUnits(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="1 unit">1 unit needed</option>
                  <option value="2 units">2 units needed</option>
                  <option value="3+ units">3+ units needed</option>
                  <option value="Platelets">
                    Single Donor Platelets (SDP)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={bloodHospital}
                    onChange={(e) => {
                      setBloodHospital(e.target.value);
                      if (fieldErrors.bloodHospital) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          bloodHospital: "",
                        }));
                      }
                    }}
                    placeholder="Hospital / Clinic Name *"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${
                      fieldErrors.bloodHospital
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.bloodHospital && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {fieldErrors.bloodHospital}
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      value={bloodContactPhone}
                      onChange={(e) => {
                        setBloodContactPhone(e.target.value);
                        if (fieldErrors.bloodContactPhone) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            bloodContactPhone: "",
                          }));
                        }
                      }}
                      placeholder="Attendant Phone Number *"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${
                        fieldErrors.bloodContactPhone
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.bloodContactPhone && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {fieldErrors.bloodContactPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. CURRENT OUTAGE */}
          {category === "Current Outage" && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Zap size={15} />
                  <span>Power Outage Details</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Community Reported
                </span>
              </div>

              {outageInterruptionType ===
                "Damaged electrical wire or equipment" && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <ShieldAlert
                    size={16}
                    className="text-rose-600 shrink-0 mt-0.5"
                  />
                  <span>
                    DANGER: Downed power line hazard! Keep back and notify
                    TANGEDCO / TNEB 24/7 helpline at <strong>1912</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Interruption Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={outageInterruptionType}
                  onChange={(e) => setOutageInterruptionType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  {OUTAGE_INTERRUPTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative street-dropdown-container">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={streetArea || streetQuery}
                      onChange={(e) =>
                        handleStreetSearchChange(e.target.value, "outage")
                      }
                      onFocus={() => {
                        if (streetResults.length > 0)
                          setShowOutageStreetDropdown(true);
                      }}
                      placeholder="Affected Street / Locality *"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.outageStreet
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.outageStreet && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {fieldErrors.outageStreet}
                    </p>
                  )}

                  {showOutageStreetDropdown && streetResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-0.5">
                      {streetResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectStreet(item)}
                          className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
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

                <input
                  type="text"
                  value={outageLandmark}
                  onChange={(e) => setOutageLandmark(e.target.value)}
                  placeholder="Nearby Landmark (Optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={outageStartTimeOption}
                  onChange={(e) => setOutageStartTimeOption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Just now">Started: Just now</option>
                  <option value="15 minutes ago">
                    Started: 15 minutes ago
                  </option>
                  <option value="30 minutes ago">
                    Started: 30 minutes ago
                  </option>
                  <option value="1 hour ago">Started: 1 hour ago</option>
                  <option value="Over 2 hours ago">
                    Started: Over 2 hours ago
                  </option>
                  <option value="Custom">Specify custom date & time</option>
                </select>

                <select
                  value={outageScope}
                  onChange={(e) => setOutageScope(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Entire Street">Scope: Entire Street</option>
                  <option value="Single Phase Only">
                    Scope: Single Phase Only
                  </option>
                  <option value="Multiple Streets">
                    Scope: Multiple Streets
                  </option>
                  <option value="Entire Ward">Scope: Entire Ward</option>
                  <option value="Streetlights Only">
                    Scope: Streetlights Only
                  </option>
                </select>
              </div>

              {outageStartTimeOption === "Custom" && (
                <input
                  type="datetime-local"
                  value={outageCustomStartTime}
                  onChange={(e) => setOutageCustomStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* POST SETTINGS LIST (Matches Reference 2)                 */}
          {/* ======================================================== */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            {/* Setting Item 1: Post Audience */}
            <div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Post audience
                </span>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAudience("entire-avadi")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      audience === "entire-avadi"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    🌐 All Avadi
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience("within-ward")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      audience === "within-ward"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    📍 Ward-Exclusive
                  </button>
                </div>
              </div>

              {/* Dynamic Locality/Street: Shown ONLY when Ward-Exclusive is selected */}
              {audience === "within-ward" && (
                <div className="mt-2.5 p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 relative street-dropdown-container">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Locality / Street <span className="text-rose-500">*</span>
                    </label>
                    {selectedWard && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        Auto-assigned to Ward {selectedWard}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={streetQuery}
                      onChange={(e) =>
                        handleStreetSearchChange(e.target.value, "audience")
                      }
                      onFocus={() => {
                        if (streetResults.length > 0)
                          setShowStreetDropdown(true);
                      }}
                      placeholder="Search Avadi streets (e.g. JB Estate, Muthapudupet...)"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${
                        fieldErrors.street
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>

                  {fieldErrors.street && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {fieldErrors.street}
                    </p>
                  )}

                  {showStreetDropdown && streetResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-44 overflow-y-auto p-1 space-y-0.5">
                      {streetResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectStreet(item)}
                          className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between"
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
              )}
            </div>

            {/* Setting Item 2: Add Photo */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Attach photo
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <ImageIcon size={14} className="text-emerald-500" />
                <span>{imagePreview ? "Change Photo" : "Add Photo"}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting || isCompressing}
              />
            </div>
          </div>

          {/* Dynamic Confirmation Checkbox: Excluded for General and Blood Request */}
          {category !== "General" && category !== "Blood Request" && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
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
                  className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary cursor-pointer accent-primary shrink-0"
                />
                <label
                  htmlFor="feed-terms-checkbox"
                  className="text-xs text-slate-700 dark:text-slate-300 leading-snug cursor-pointer select-none font-medium"
                >
                  I confirm that the information provided is accurate and
                  appropriate for the Avadi community.
                </label>
              </div>

              {fieldErrors.terms && (
                <p className="mt-1 text-xs font-semibold text-rose-500 pl-2">
                  {fieldErrors.terms}
                </p>
              )}
            </div>
          )}

          {/* Bottom Facebook-Style Full Width Post Button (Matches Reference 2) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isCompressing ||
                (category !== "General" &&
                  category !== "Blood Request" &&
                  !termsAccepted)
              }
              className={`w-full py-3.5 rounded-2xl font-black text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
                !isSubmitting &&
                !isCompressing &&
                (category === "General" ||
                  category === "Blood Request" ||
                  termsAccepted)
                  ? "bg-primary hover:bg-primary/90 text-white cursor-pointer active:scale-98"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
