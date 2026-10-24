"use client";

import React, { useState, useTransition, useId } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ChefHat,
  HeartPulse,
  Wrench,
  Building2,
  Briefcase,
  Gift,
  Bus,
  PackageSearch,
  AlertTriangle,
  LifeBuoy,
  MessageSquare,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  Send,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import { submitSupportTicket } from "@/app/api/actions/support-actions";
import { toast } from "@/utils/toast";
import { Modal } from "@/components/shared-components";

// --- CATEGORY CONFIGURATION & MAPPINGS ---
export type SupportFeatureKey =
  | "EXPLORE_PLACES"
  | "FOOD_DINING"
  | "HOSPITALS_PHARMACIES"
  | "LOCAL_SERVICES"
  | "RENT_PROPERTIES"
  | "JOB_VACANCIES"
  | "DONATIONS"
  | "TRAVEL_TRANSPORT"
  | "LOST_FOUND"
  | "COMPLAINTS"
  | "SOS"
  | "FEED"
  | "OTHER";

interface CategoryMeta {
  key: SupportFeatureKey;
  label: string;
  icon: React.ElementType;
  badge: string;
  description: string;
  subCategories: string[];
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "EXPLORE_PLACES",
    label: "Explore Places",
    icon: Compass,
    badge: "Places",
    description: "Parks, lake viewpoints, Vijayanta Tank memorial, and heritage spots",
    subCategories: [
      "Location / GPS coordinates inaccurate",
      "Opening timings incorrect",
      "Place missing from directory",
      "Entry fee or visitor details outdated",
      "Place permanently closed or restricted",
      "Other explore places issue",
    ],
  },
  {
    key: "FOOD_DINING",
    label: "Food & Dining",
    icon: ChefHat,
    badge: "Food",
    description: "Restaurants, eateries, street stalls, bakeries, and cafes",
    subCategories: [
      "Restaurant permanently closed",
      "Wrong contact phone number",
      "Veg / Non-veg label incorrect",
      "Menu pricing or timings outdated",
      "Inappropriate food listing",
      "New restaurant registration request",
      "Other dining feedback",
    ],
  },
  {
    key: "HOSPITALS_PHARMACIES",
    label: "Hospitals & Pharmacies",
    icon: HeartPulse,
    badge: "Health",
    description: "24/7 hospitals, clinics, diagnostic centers, and medical stores",
    subCategories: [
      "Hospital phone number not reachable",
      "Ambulance / ICU emergency contact invalid",
      "24/7 emergency status inaccurate",
      "Pharmacy permanently closed or moved",
      "Doctor specialty / OPD timings missing",
      "Hospital location pinned wrongly",
      "Other healthcare directory issue",
    ],
  },
  {
    key: "LOCAL_SERVICES",
    label: "Local Services",
    icon: Wrench,
    badge: "Services",
    description: "Electricians, plumbers, carpenters, AC mechanics, and appliance technicians",
    subCategories: [
      "Service worker phone not reachable",
      "Incorrect service category / skills",
      "Visiting charge or rate outdated",
      "Worker no longer serves this ward",
      "Suspicious or unverified profile",
      "New service worker registration",
      "Other local services feedback",
    ],
  },
  {
    key: "RENT_PROPERTIES",
    label: "Rent & Properties",
    icon: Building2,
    badge: "Rentals",
    description: "Houses, flats, bachelor rooms, and commercial rentals in Avadi",
    subCategories: [
      "Property already rented / unavailable",
      "Rent amount or advance deposit incorrect",
      "Owner / broker contact number wrong",
      "Misleading property photos",
      "Inappropriate rental listing",
      "Other rental directory issue",
    ],
  },
  {
    key: "JOB_VACANCIES",
    label: "Local Job Vacancies",
    icon: Briefcase,
    badge: "Jobs",
    description: "Hyperlocal jobs, retail openings, and delivery / office vacancies",
    subCategories: [
      "Job vacancy expired / position filled",
      "Employer contact number not working",
      "Salary or working hours misleading",
      "Suspicious or fraudulent job post",
      "Cannot submit job application",
      "Other job vacancy feedback",
    ],
  },
  {
    key: "DONATIONS",
    label: "Donations",
    icon: Gift,
    badge: "Donations",
    description: "Urgent blood requests, community relief drives, and volunteer aid",
    subCategories: [
      "Urgent blood request fulfilled (close alert)",
      "Blood donor contact number invalid",
      "Hospital details wrong for blood alert",
      "Suspicious donation request / fake alert",
      "Notification not received for blood drive",
      "Other donation feedback",
    ],
  },
  {
    key: "TRAVEL_TRANSPORT",
    label: "Travel & Transport",
    icon: Bus,
    badge: "Transport",
    description: "MTC bus routes, suburban railway timings, and petrol bunks",
    subCategories: [
      "Bus route missing or bus stops incorrect",
      "Local train timings outdated",
      "Bus frequency or timings inaccurate",
      "Petrol bunk / EV charging spot missing",
      "Station or bus stop pinned wrong",
      "Other transit navigation issue",
    ],
  },
  {
    key: "LOST_FOUND",
    label: "Lost & Found",
    icon: PackageSearch,
    badge: "Lost & Found",
    description: "Reported lost keys, wallets, documents, pets, and recovered items",
    subCategories: [
      "Item already claimed or retrieved",
      "Cannot upload proof photo",
      "Claim request not reaching owner",
      "Suspicious claim without valid proof",
      "Item category or location incorrect",
      "Other lost & found feedback",
    ],
  },
  {
    key: "COMPLAINTS",
    label: "Civic Complaints",
    icon: AlertTriangle,
    badge: "Grievances",
    description: "Garbage, streetlights, drainage, roads, or drinking water issues",
    subCategories: [
      "Cannot upload photo proof",
      "Street name or ward not matching",
      "Complaint status not updating",
      "Submission failed / network timeout",
      "Duplicate complaint issue",
      "Other complaint redressal bug",
    ],
  },
  {
    key: "SOS",
    label: "Radiant SOS Hub",
    icon: LifeBuoy,
    badge: "Emergency",
    description: "Audio siren, 112 dialer, WhatsApp GPS emergency broadcast",
    subCategories: [
      "Audio siren not playing",
      "112 emergency dialer issue",
      "WhatsApp GPS location inaccurate",
      "Avadi police station contact wrong",
      "Blood request SOS broadcast error",
      "Other emergency hub issue",
    ],
  },
  {
    key: "FEED",
    label: "Community Feed",
    icon: MessageSquare,
    badge: "Town Hall",
    description: "Ward posts, discussion threads, commenting, and neighborhood news",
    subCategories: [
      "Post failed to publish",
      "Comments not loading or posting",
      "Image upload / compression bug",
      "Inappropriate content to flag",
      "Ward filter not showing posts",
      "Other community feed feedback",
    ],
  },
  {
    key: "OTHER",
    label: "General / Suggestions",
    icon: HelpCircle,
    badge: "Ideas",
    description: "Suggest a new civic feature, UI improvements, or general feedback",
    subCategories: [
      "Feature suggestion / New idea",
      "Dark mode or UI glitch",
      "Language / Tamil translation mistake",
      "Slow app performance",
      "General citizen inquiry",
    ],
  },
];

export default function SupportForm() {
  const { activeWard, authUser } = useWard();
  const fileInputId = useId();

  // Form states
  const [featureCategory, setFeatureCategory] = useState<SupportFeatureKey | "">("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Submission & feedback states
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState<boolean>(false);

  // Active category metadata
  const selectedMeta = CATEGORIES.find((c) => c.key === featureCategory);

  // Handle category change
  const handleCategorySelect = (key: SupportFeatureKey) => {
    setFeatureCategory(key);
    setSubCategory("");
    setErrorMessage(null);
  };

  // Handle file preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be smaller than 5MB.");
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotFile(null);
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!featureCategory) {
      setErrorMessage("Please choose which app feature this report is about.");
      return;
    }

    if (!subCategory) {
      setErrorMessage("Please select a specific sub-category for your issue.");
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage("Please provide at least 10 characters explaining the issue or idea.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("featureCategory", featureCategory);
      formData.append("subCategory", subCategory);
      formData.append("description", description.trim());
      formData.append("wardId", String(activeWard?.id || authUser?.wardNumber || 1));

      if (screenshotFile) {
        formData.append("screenshot", screenshotFile);
      } else if (screenshotPreview) {
        formData.append("screenshotUrl", screenshotPreview);
      }

      const res = await submitSupportTicket(formData);

      if (res.success && res.ticketId) {
        setSubmittedTicketId(res.ticketId);
        setIsPopupModalOpen(true);
        toast.success("Feedback submitted successfully!");
      } else {
        const errorText = res.error || "Unable to submit your ticket. Please try again.";
        setErrorMessage(errorText);
        toast.error(errorText);
      }
    });
  };

  // Reset form to submit another ticket
  const handleReset = () => {
    setFeatureCategory("");
    setSubCategory("");
    setDescription("");
    setScreenshotPreview(null);
    setScreenshotFile(null);
    setSubmittedTicketId(null);
    setIsPopupModalOpen(false);
    setErrorMessage(null);
  };

  return (
    <>
      {/* POPUP CONFIRMATION MODAL */}
      <Modal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        title="Feedback Registered"
        maxWidth="sm:max-w-md"
      >
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
            <CheckCircle2 size={36} className="stroke-[2.2]" />
          </div>

          <h4 className="text-lg font-black text-slate-900 dark:text-white">
            Feedback Submitted!
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your report has been saved to the database. The Avadi Municipal tech team will inspect this item.
          </p>

          {submittedTicketId && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
              <span className="text-slate-400">Report ID:</span>
              <span className="font-bold text-primary">{submittedTicketId}</span>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsPopupModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer"
            >
              Done
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wide transition text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </Modal>

      {/* SUCCESS SCREEN OR MAIN FORM */}
      {submittedTicketId ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 text-center shadow-sm"
        >
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 shadow-xs">
            <CheckCircle2 size={36} className="sm:size-10 stroke-[2.2]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Report Registered
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Thank you for improving Avadi City!
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Your feedback has been logged into the municipal issue queue. Our technical and ward administration team will review this report.
          </p>

          <div className="my-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200">
            <span className="text-slate-400">Report ID:</span>
            <span className="font-bold text-primary tracking-wider">{submittedTicketId}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary hover:bg-orange-600 text-white font-black text-xs tracking-wide uppercase transition-all shadow-md shadow-primary/25 active:scale-95 cursor-pointer"
            >
              Submit Another Report
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition border border-slate-200 dark:border-slate-700 active:scale-95 text-center"
            >
              Return to Dashboard
            </Link>
          </div>
        </motion.div>
      ) : (
        /* MAIN FORM */
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-6"
        >
        {/* User & Ward Context Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Reporting as:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {authUser?.name || "Avadi Citizen"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
            <MapPin size={12} />
            <span>Ward {activeWard?.id || authUser?.wardNumber || 1}</span>
          </div>
        </div>

        {/* Feature Category Selector (No numbers) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200">
              Select Feature or Service <span className="text-primary">*</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Which part of the app is this about?
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = featureCategory === cat.key;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[92px] group border ${
                    isSelected
                      ? "bg-primary/5 dark:bg-primary/15 border-primary ring-2 ring-primary/30 shadow-xs"
                      : "bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`p-2 rounded-xl border transition-colors ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 group-hover:text-primary"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {cat.badge}
                    </span>
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-black leading-tight ${
                        isSelected
                          ? "text-primary dark:text-white"
                          : "text-slate-800 dark:text-slate-200 group-hover:text-primary"
                      }`}
                    >
                      {cat.label}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Sub-Category Dropdown (No numbers) */}
        <AnimatePresence mode="wait">
          {selectedMeta && (
            <motion.div
              key={selectedMeta.key}
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden space-y-2.5 pt-1"
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="subCategory"
                  className="block text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200"
                >
                  Sub-Category for {selectedMeta.label} <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-primary font-medium hidden sm:inline">
                  {selectedMeta.description}
                </span>
              </div>

              <div className="relative">
                <select
                  id="subCategory"
                  value={subCategory}
                  onChange={(e) => {
                    setSubCategory(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-xs border border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-400">
                    -- Select a specific issue or feedback topic --
                  </option>
                  {selectedMeta.subCategories.map((sub) => (
                    <option key={sub} value={sub} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-1">
                      {sub}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Description Field (No numbers) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200"
            >
              Detailed Description <span className="text-primary">*</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                description.length > 2400
                  ? "text-rose-500 font-bold"
                  : "text-slate-400"
              }`}
            >
              {description.length} / 2500
            </span>
          </div>

          <textarea
            id="description"
            rows={4}
            maxLength={2500}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="Please describe the issue, what went wrong, or the feature you'd love to see in Avadi City..."
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs leading-relaxed border border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[110px]"
          />
        </div>

        {/* Optional Screenshot Upload (No numbers) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200">
            Attach Screenshot / Photo <span className="text-slate-400 font-normal">(Optional)</span>
          </label>

          {screenshotPreview ? (
            <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-1.5 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="max-h-48 rounded-xl object-contain bg-slate-100 dark:bg-black/50"
              />
              <button
                type="button"
                onClick={handleRemoveScreenshot}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition shadow-md cursor-pointer"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div>
              <label
                htmlFor={fileInputId}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition cursor-pointer text-center"
              >
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary/40 transition mb-2 shadow-2xs">
                  <UploadCloud size={20} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition">
                  Click to attach a screenshot or photo
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  PNG, JPG or WebP up to 5MB (stored securely in Cloudflare R2)
                </p>
              </label>
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Error Notice */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 font-medium"
            >
              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button (Changed to "Submit") */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-orange-600 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={15} className="text-white" />
                <span>Submit</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
            Your feedback is reviewed directly by the Avadi City Municipal Administration.
          </p>
        </div>
      </form>
      )}
    </>
  );
}
