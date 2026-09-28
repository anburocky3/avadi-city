"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Utensils,
  Globe,
  Share2,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  Check,
  FileText,
  Moon,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { ALL_AVADI_STREETS } from "@/lib/wards";
import { wards as WARD_LIST } from "@/data/wards";

const FOOD_TYPE_OPTIONS = [
  "Vegetarian",
  "Non-Vegetarian",
  "Both",
  "Egg",
  "Vegan",
  "Jain",
  "Halal",
  "Other",
];

const CUISINE_OPTIONS = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Arabian",
  "Continental",
  "Kerala",
  "Tamil Cuisine",
  "Fast Food",
  "Street Food",
  "Bakery",
  "Desserts",
  "Beverages",
  "Other",
];

const OPENING_TIME_OPTIONS = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
];

const CLOSING_TIME_OPTIONS = [
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
  "12:00 AM",
  "1:00 AM",
  "2:00 AM",
  "3:00 AM",
  "4:00 AM",
  "5:00 AM",
  "6:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const LATE_NIGHT_TIME_OPTIONS = [
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
  "12:00 AM",
  "1:00 AM",
  "2:00 AM",
  "3:00 AM",
  "4:00 AM",
  "5:00 AM",
  "6:00 AM",
];

interface LocationSuggestion {
  id: string;
  name: string;
  wardNo: number;
  wardLabel: string;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NewListingWizardPage() {
  const router = useRouter();
  const toast = useToast();
  const { activeWard, isAuthenticated, isLoadingAuth } = useWard();

  // File input references
  const shopFileInputRef = useRef<HTMLInputElement>(null);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  // Wizard Navigation: Step 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Authentication Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/foods/add");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // ==========================================
  // STEP 1 STATE: FOOD DETAILS
  // ==========================================
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(["Both"]);
  const [otherFoodType, setOtherFoodType] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["South Indian"]);
  const [otherCuisine, setOtherCuisine] = useState("");

  // ==========================================
  // STEP 2 STATE: SHOP DETAILS
  // ==========================================
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [ward, setWard] = useState<number>(activeWard?.id || 1);
  const [shopAddress, setShopAddress] = useState("");
  const [openingTime, setOpeningTime] = useState("9:00 AM");
  const [closingTime, setClosingTime] = useState("10:00 PM");
  const [socialLink, setSocialLink] = useState("");
  const [website, setWebsite] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // ==========================================
  // STEP 3 STATE: PHOTOS & CONFIRMATION
  // ==========================================
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [shopImagePreview, setShopImagePreview] = useState<string | null>(null);

  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);

  // Popular items state
  const [popularItems, setPopularItems] = useState<string[]>([]);
  const [popularItemInput, setPopularItemInput] = useState("");
  const [popularItemError, setPopularItemError] = useState("");

  // Late-night service states
  const [isLateNight, setIsLateNight] = useState(false);
  const [lateNightStartTime, setLateNightStartTime] = useState("10:00 PM");
  const [lateNightEndTime, setLateNightEndTime] = useState("2:00 AM");
  const [lateNightDining, setLateNightDining] = useState(false);
  const [lateNightTakeaway, setLateNightTakeaway] = useState(false);
  const [lateNightDelivery, setLateNightDelivery] = useState(false);
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [takeaway, setTakeaway] = useState(false);
  const [dineIn, setDineIn] = useState(true);

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync ward if activeWard loads later and user hasn't selected another
  useEffect(() => {
    if (activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48) {
      setWard((currentWard) => (currentWard === 1 ? activeWard.id : currentWard));
    }
  }, [activeWard?.id]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (shopImagePreview && shopImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(shopImagePreview);
      }
      if (menuImagePreview && menuImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(menuImagePreview);
      }
    };
  }, [shopImagePreview, menuImagePreview]);

  // Close location autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Location Suggestions from existing project datasets
  const locationSuggestions = useMemo((): LocationSuggestion[] => {
    const q = streetArea.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const prefixMatches: LocationSuggestion[] = [];
    const otherMatches: LocationSuggestion[] = [];
    const seenNames = new Set<string>();

    const checkAndAdd = (rawName: string, wardNo: number, id: string) => {
      const lower = rawName.toLowerCase().trim();
      if (!lower || seenNames.has(lower)) return;
      seenNames.add(lower);

      const wardInfo = WARD_LIST.find((w) => w.id === wardNo);
      const wardLabel = wardInfo ? `Ward ${wardNo} - ${wardInfo.name}` : `Ward ${wardNo}`;
      const item: LocationSuggestion = {
        id,
        name: toTitleCase(rawName),
        wardNo,
        wardLabel,
      };

      if (lower.startsWith(q)) {
        prefixMatches.push(item);
      } else {
        otherMatches.push(item);
      }
    };

    // 1. Check Areas and Localities from WARD_LIST
    for (const w of WARD_LIST) {
      if (w.name.toLowerCase().includes(q)) {
        checkAndAdd(w.name, w.id, `ward-area-${w.id}`);
      }
      if (w.hints) {
        const hintsArr = w.hints.split(",").map((h) => h.trim());
        for (const hint of hintsArr) {
          if (hint.toLowerCase().includes(q)) {
            checkAndAdd(hint, w.id, `ward-hint-${w.id}-${hint.replace(/\s+/g, "-")}`);
          }
        }
      }
    }

    // 2. Check Street List from ALL_AVADI_STREETS
    for (const street of ALL_AVADI_STREETS) {
      if (street.streetName.toLowerCase().includes(q)) {
        checkAndAdd(street.streetName, street.wardNo, street.id);
      }
      if (prefixMatches.length + otherMatches.length >= 25) break;
    }

    return [...prefixMatches, ...otherMatches].slice(0, 8);
  }, [streetArea]);

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setStreetArea(suggestion.name);
    // Automatically determine and set the corresponding Ward Number!
    setWard(suggestion.wardNo);
    setShowLocationSuggestions(false);
    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }
  };

  // Toggle Multi-select food types
  const toggleFoodType = (item: string) => {
    setSelectedFoodTypes((prev) => {
      const exists = prev.includes(item);
      const updated = exists ? prev.filter((i) => i !== item) : [...prev, item];
      if (fieldErrors.foodTypes) {
        setFieldErrors((p) => ({ ...p, foodTypes: "" }));
      }
      return updated;
    });
  };

  // Toggle Multi-select cuisines
  const toggleCuisine = (item: string) => {
    setSelectedCuisines((prev) => {
      const exists = prev.includes(item);
      const updated = exists ? prev.filter((i) => i !== item) : [...prev, item];
      if (fieldErrors.cuisines) {
        setFieldErrors((p) => ({ ...p, cuisines: "" }));
      }
      return updated;
    });
  };

  // Image Upload Handlers
  const handleShopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Shop Image size must be less than 5MB.");
      return;
    }

    if (shopImagePreview && shopImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(shopImagePreview);
    }
    setShopImageFile(file);
    setShopImagePreview(URL.createObjectURL(file));
    if (fieldErrors.shopImage) {
      setFieldErrors((prev) => ({ ...prev, shopImage: "" }));
    }
  };

  const handleRemoveShopImage = () => {
    if (shopImagePreview && shopImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(shopImagePreview);
    }
    setShopImageFile(null);
    setShopImagePreview(null);
    if (shopFileInputRef.current) shopFileInputRef.current.value = "";
  };

  const handleMenuImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Menu Card Image size must be less than 5MB.");
      return;
    }

    if (menuImagePreview && menuImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(menuImagePreview);
    }
    setMenuImageFile(file);
    setMenuImagePreview(URL.createObjectURL(file));
    if (fieldErrors.menuImage) {
      setFieldErrors((prev) => ({ ...prev, menuImage: "" }));
    }
  };

  const handleRemoveMenuImage = () => {
    if (menuImagePreview && menuImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(menuImagePreview);
    }
    setMenuImageFile(null);
    setMenuImagePreview(null);
    if (menuFileInputRef.current) menuFileInputRef.current.value = "";
  };

  // Popular Items Handlers
  const handleAddPopularItem = () => {
    const trimmed = popularItemInput.trim();
    if (!trimmed) {
      setPopularItemError("Please enter a popular item.");
      return;
    }

    if (popularItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setPopularItemError("This item has already been added.");
      return;
    }

    if (popularItems.length >= 15) {
      setPopularItemError("You can add up to 15 popular items.");
      return;
    }

    setPopularItems((prev) => [...prev, trimmed]);
    setPopularItemInput("");
    setPopularItemError("");
  };

  const handleRemovePopularItem = (itemToRemove: string) => {
    setPopularItems((prev) => prev.filter((item) => item !== itemToRemove));
    if (popularItemError) setPopularItemError("");
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (selectedFoodTypes.length === 0) {
      errors.foodTypes = "Please select at least one food type.";
    } else if (selectedFoodTypes.includes("Other") && !otherFoodType.trim()) {
      errors.otherFoodType = "Please specify the other food type.";
    }

    if (selectedCuisines.length === 0) {
      errors.cuisines = "Please select at least one cuisine.";
    } else if (selectedCuisines.includes("Other") && !otherCuisine.trim()) {
      errors.otherCuisine = "Please specify the other cuisine.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please complete the required food details.");
    }
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Shop Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Shop Name must be at least 2 characters.";
    }

    if (!description.trim()) {
      errors.description = "Shop Description is required.";
    } else if (description.trim().length < 10) {
      errors.description = "Shop Description must be at least 10 characters.";
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone Number is required.";
    } else if (cleanPhone.replace(/[^0-9]/g, "").length < 10) {
      errors.phone = "Phone Number must be at least 10 digits.";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!streetArea.trim()) {
      errors.streetArea = "Street / Area is required.";
    }

    if (!ward || ward < 1 || ward > 48) {
      errors.ward = "Select a valid Avadi municipal ward (1 to 48).";
    }

    if (!shopAddress.trim()) {
      errors.shopAddress = "Shop Address is required.";
    } else if (shopAddress.trim().length < 3) {
      errors.shopAddress = "Shop Address must be at least 3 characters.";
    }

    if (!openingTime) {
      errors.openingTime = "Opening Time is required.";
    }

    if (!closingTime) {
      errors.closingTime = "Closing Time is required.";
    }

    if (socialLink.trim() && !socialLink.startsWith("http://") && !socialLink.startsWith("https://")) {
      errors.socialLink = "Please enter a valid URL starting with http:// or https://";
    }

    if (website.trim() && !website.startsWith("http://") && !website.startsWith("https://")) {
      errors.website = "Please enter a valid URL starting with http:// or https://";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fill in all required shop details.");
    }
  };

  // Step 3 Validation & Submission
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!shopImageFile) {
      errors.shopImage = "Shop Image is mandatory.";
    }

    if (!menuImageFile) {
      errors.menuImage = "Menu Card Image is mandatory.";
    }

    if (isLateNight) {
      if (!lateNightStartTime || !lateNightEndTime) {
        errors.lateNightHours = "Please select the late-night service hours.";
      }
    }

    if (!termsAccepted) {
      errors.terms = "Please agree to the Terms & Conditions.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isStep3Ready = Boolean(shopImageFile && menuImageFile && termsAccepted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setCurrentStep(1);
      toast.error("Please check your food details in Step 1.");
      return;
    }

    if (!validateStep2()) {
      setCurrentStep(2);
      toast.error("Please check your shop details in Step 2.");
      return;
    }

    if (!validateStep3()) {
      toast.error("Please upload the required images and accept the Terms.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("phone", phone.trim());
      if (email.trim()) formData.append("email", email.trim());

      const fullAddress = `${shopAddress.trim()}, ${streetArea.trim()}`;
      formData.append("address", fullAddress);
      formData.append("areaLandmark", streetArea.trim());
      formData.append("ward", ward.toString());

      formData.append("openingTime", openingTime);
      formData.append("closingTime", closingTime);

      if (website.trim()) formData.append("website", website.trim());
      if (socialLink.trim()) formData.append("socialLink", socialLink.trim());

      // Food types & Cuisines
      const allFoodTypes = selectedFoodTypes
        .map((t) => (t === "Other" && otherFoodType.trim() ? otherFoodType.trim() : t))
        .join(", ");
      const allCuisines = selectedCuisines
        .map((c) => (c === "Other" && otherCuisine.trim() ? otherCuisine.trim() : c))
        .join(", ");

      formData.append("foodTypes", allFoodTypes);
      formData.append("cuisines", allCuisines);
      formData.append("foodType", allFoodTypes);
      formData.append("category", selectedCuisines[0] || "Restaurant");

      // Operational flags
      formData.append("isLateNight", isLateNight ? "true" : "false");
      if (isLateNight) {
        formData.append("lateNightStartTime", lateNightStartTime);
        formData.append("lateNightEndTime", lateNightEndTime);
      }
      formData.append("lateNightDining", lateNightDining ? "true" : "false");
      formData.append("lateNightTakeaway", lateNightTakeaway ? "true" : "false");
      formData.append("lateNightDelivery", lateNightDelivery ? "true" : "false");
      formData.append("popularItems", JSON.stringify(popularItems));
      formData.append("homeDelivery", homeDelivery ? "true" : "false");
      formData.append("takeaway", takeaway ? "true" : "false");
      formData.append("dineIn", dineIn ? "true" : "false");

      // Mandatory images
      if (shopImageFile) formData.append("image", shopImageFile);
      if (menuImageFile) formData.append("menuCardImage", menuImageFile);

      formData.append("termsAccepted", "true");

      const response = await fetch("/api/foods", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to submit your listing. Please try again.");
        if (result.errors) {
          const mappedErrors: Record<string, string> = {};
          for (const key of Object.keys(result.errors)) {
            mappedErrors[key] = Array.isArray(result.errors[key])
              ? result.errors[key][0]
              : result.errors[key];
          }
          setFieldErrors(mappedErrors);
        }
        return;
      }

      // Show success modal popup
      setShowSuccessModal(true);
    } catch {
      toast.error("Unable to submit your listing. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* 1. Back to Food & Dining Button */}
      <div>
        <Link
          href="/foods"
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft size={16} />
          <span>Back to Food &amp; Dining</span>
        </Link>
      </div>

      {/* 2. Main Wizard Card with Integrated Step Bar */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* Top Segmented Progress Bar (Matches Reference Image) */}
          <div className="space-y-3.5 border-b border-slate-100 dark:border-slate-800 pb-5 sm:pb-6">
            {/* Horizontal Segmented Progress Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  onClick={() => {
                    if (stepNum < currentStep) setCurrentStep(stepNum as 1 | 2 | 3);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    stepNum <= currentStep
                      ? "bg-primary shadow-xs shadow-primary/30"
                      : "bg-slate-100 dark:bg-slate-800"
                  } ${stepNum < currentStep ? "cursor-pointer hover:opacity-80" : ""}`}
                  title={`Step ${stepNum}`}
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
                  {currentStep === 1 && "Food Details & Dietary Options"}
                  {currentStep === 2 && "Shop Information & Location"}
                  {currentStep === 3 && "Photos & Confirmation"}
                </h2>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black tracking-tight shrink-0 shadow-2xs">
                {currentStep}/3
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 1: FOOD DETAILS                                     */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Food Type / Dietary Options (Multi-select) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Food Type <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Select all that apply)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FOOD_TYPE_OPTIONS.map((type) => {
                    const isSelected = selectedFoodTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center space-x-2.5 p-3 rounded-2xl border cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFoodType(type)}
                          className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                        />
                        <span className="text-xs">{type}</span>
                      </label>
                    );
                  })}
                </div>

                {fieldErrors.foodTypes && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.foodTypes}
                  </p>
                )}

                {/* Additional Food Type when 'Other' is checked */}
                {selectedFoodTypes.includes("Other") && (
                  <div className="pt-2">
                    <label
                      htmlFor="other-food-type-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Other Food Type <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="other-food-type-input"
                      type="text"
                      value={otherFoodType}
                      onChange={(e) => {
                        setOtherFoodType(e.target.value);
                        if (fieldErrors.otherFoodType) setFieldErrors((p) => ({ ...p, otherFoodType: "" }));
                      }}
                      placeholder="e.g. Seafood, Homemade Food, Bakery Items, Snacks..."
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.otherFoodType
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.otherFoodType && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.otherFoodType}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cuisines (Multi-select) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Cuisines <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Select all that apply)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const isSelected = selectedCuisines.includes(cuisine);
                    return (
                      <label
                        key={cuisine}
                        className={`flex items-center space-x-2.5 p-3 rounded-2xl border cursor-pointer transition select-none ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCuisine(cuisine)}
                          className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                        />
                        <span className="text-xs">{cuisine}</span>
                      </label>
                    );
                  })}
                </div>

                {fieldErrors.cuisines && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.cuisines}
                  </p>
                )}

                {/* Additional Cuisine when 'Other' is checked */}
                {selectedCuisines.includes("Other") && (
                  <div className="pt-2">
                    <label
                      htmlFor="other-cuisine-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Other Cuisine <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="other-cuisine-input"
                      type="text"
                      value={otherCuisine}
                      onChange={(e) => {
                        setOtherCuisine(e.target.value);
                        if (fieldErrors.otherCuisine) setFieldErrors((p) => ({ ...p, otherCuisine: "" }));
                      }}
                      placeholder="e.g. Chettinad, Mughlai, Mexican, Italian..."
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.otherCuisine
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.otherCuisine && (
                      <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.otherCuisine}
                      </p>
                    )}
                  </div>
                )}
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
          {/* STEP 2: SHOP DETAILS                                     */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Shop Name */}
              <div>
                <label
                  htmlFor="shop-name-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="shop-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Sri Krishna Bhavan, Aunty's Kitchen"
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.name
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Shop Description */}
              <div>
                <label
                  htmlFor="shop-description-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Shop Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="shop-description-input"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  placeholder="Tell customers about your shop, food, specialties, and dining experience..."
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[100px] ${
                    fieldErrors.description
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.description && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Phone Number & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-phone-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="shop-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="e.g. 9876543210"
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.phone
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="shop-email-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="shop-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="e.g. contact@mybusiness.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.email
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Details: Street / Area Autocomplete & Automatic Ward Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 relative" ref={locationContainerRef}>
                  <label
                    htmlFor="shop-street-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Street / Area <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="shop-street-input"
                      type="text"
                      value={streetArea}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) setShowLocationSuggestions(true);
                      }}
                      onChange={(e) => {
                        setStreetArea(e.target.value);
                        setShowLocationSuggestions(true);
                        if (fieldErrors.streetArea) setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
                      }}
                      placeholder="Type street or area (e.g. Paruthipattu, Pattabiram, CTH Road)..."
                      className={`w-full pl-4 pr-10 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                        fieldErrors.streetArea
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                      autoComplete="off"
                    />
                    <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Suggested Avadi Locations (Click to Auto-Select Ward)
                      </div>
                      {locationSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectLocation(item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-slate-800 transition flex items-center justify-between group cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <MapPin size={14} className="text-slate-400 group-hover:text-primary shrink-0 transition-colors" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            {item.wardLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {fieldErrors.streetArea && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.streetArea}
                    </p>
                  )}
                </div>

                {/* Ward Selector (Auto-filled on street selection or manual selection) */}
                <div>
                  <label
                    htmlFor="shop-ward-select"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Ward <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="shop-ward-select"
                    value={ward}
                    onChange={(e) => setWard(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {Array.from({ length: 48 }, (_, i) => i + 1).map((w) => {
                      const wardObj = WARD_LIST.find((item) => item.id === w);
                      return (
                        <option key={w} value={w}>
                          Ward {w} {wardObj ? `- ${wardObj.name}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Shop Address */}
              <div>
                <label
                  htmlFor="shop-address-detail-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Shop Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="shop-address-detail-input"
                  type="text"
                  value={shopAddress}
                  onChange={(e) => {
                    setShopAddress(e.target.value);
                    if (fieldErrors.shopAddress) setFieldErrors((prev) => ({ ...prev, shopAddress: "" }));
                  }}
                  placeholder="e.g. Door No. 12/4, Main Road, Near Bus Stop"
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.shopAddress
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.shopAddress && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.shopAddress}
                  </p>
                )}
              </div>

              {/* Opening & Closing Time (Selectable Controls with convenient options) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-opening-time"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Opening Time <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      id="shop-opening-time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {OPENING_TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="shop-closing-time"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Closing Time <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      id="shop-closing-time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {CLOSING_TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Social Media & Website (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-social-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Social Media Link <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Share2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="shop-social-input"
                      type="url"
                      value={socialLink}
                      onChange={(e) => {
                        setSocialLink(e.target.value);
                        if (fieldErrors.socialLink) setFieldErrors((p) => ({ ...p, socialLink: "" }));
                      }}
                      placeholder="https://instagram.com/myshop"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {fieldErrors.socialLink && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.socialLink}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="shop-website-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Website <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="shop-website-input"
                      type="url"
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        if (fieldErrors.website) setFieldErrors((p) => ({ ...p, website: "" }));
                      }}
                      placeholder="https://mybusiness.in"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {fieldErrors.website && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.website}
                    </p>
                  )}
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
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
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PHOTOS & CONFIRMATION                            */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Upload Grid: Shop Photo & Menu Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Shop Image (MANDATORY) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Shop Image <span className="text-rose-500">*</span>
                  </label>
                  {shopImagePreview ? (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={shopImagePreview}
                        alt="Shop preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveShopImage}
                        disabled={isSubmitting}
                        className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => shopFileInputRef.current?.click()}
                      className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition p-4 text-center group ${
                        fieldErrors.shopImage
                          ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/60 bg-slate-50/50 dark:bg-slate-950/50"
                      }`}
                    >
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary transition-colors mb-2">
                        <UploadCloud size={22} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Upload Shop Photo *
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={shopFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleShopImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {fieldErrors.shopImage && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.shopImage}
                    </p>
                  )}
                </div>

                {/* 2. Menu Card Image (MANDATORY) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Menu Card Image <span className="text-rose-500">*</span>
                  </label>
                  {menuImagePreview ? (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={menuImagePreview}
                        alt="Menu preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveMenuImage}
                        disabled={isSubmitting}
                        className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => menuFileInputRef.current?.click()}
                      className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition p-4 text-center group ${
                        fieldErrors.menuImage
                          ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/60 bg-slate-50/50 dark:bg-slate-950/50"
                      }`}
                    >
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary transition-colors mb-2">
                        <FileText size={22} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Upload Menu Card *
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        JPG, PNG, WebP up to 5MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={menuFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMenuImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {fieldErrors.menuImage && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.menuImage}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Popular Items Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Popular Items
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Add some popular food items customers can find at your shop.
                  </p>
                </div>

                {/* Popular Item Input & Add Button */}
                <div>
                  <label
                    htmlFor="popular-item-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Popular Item
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="popular-item-input"
                      type="text"
                      value={popularItemInput}
                      onChange={(e) => {
                        setPopularItemInput(e.target.value);
                        if (popularItemError) setPopularItemError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPopularItem();
                        }
                      }}
                      placeholder="Enter item name..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddPopularItem}
                      className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1 cursor-pointer shadow-xs active:scale-98 shrink-0"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>

                  {popularItemError && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {popularItemError}
                    </p>
                  )}
                </div>

                {/* Added Items List */}
                {popularItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Added Items ({popularItems.length}/15):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularItems.map((item) => (
                        <div
                          key={item}
                          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-orange-50 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold group shadow-2xs"
                        >
                          <span className="truncate max-w-[220px]">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePopularItem(item)}
                            aria-label={`Remove ${item}`}
                            className="p-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Late-Night Service Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Late-Night Service
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Let customers know if you serve food late at night.
                  </p>
                </div>

                {/* Checkbox: We serve food late at night */}
                <label className="flex items-center space-x-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLateNight}
                    onChange={(e) => {
                      setIsLateNight(e.target.checked);
                      if (!e.target.checked) {
                        setLateNightDining(false);
                        setLateNightTakeaway(false);
                        setLateNightDelivery(false);
                      }
                      if (fieldErrors.lateNightHours) {
                        setFieldErrors((prev) => ({ ...prev, lateNightHours: "" }));
                      }
                    }}
                    className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                  />
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Moon size={16} className="text-amber-500" />
                    <span>We serve food late at night</span>
                  </div>
                </label>

                {/* Conditional Late-Night Service Time Selectors */}
                {isLateNight && (
                  <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-3 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300">
                        Late-Night Service Time <span className="text-rose-500">*</span>
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                        Select your late-night operating hours (e.g. 10:00 PM to 2:00 AM). Overnight hours supported.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="late-night-from"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          From
                        </label>
                        <div className="relative">
                          <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select
                            id="late-night-from"
                            value={lateNightStartTime}
                            onChange={(e) => {
                              setLateNightStartTime(e.target.value);
                              if (fieldErrors.lateNightHours) setFieldErrors((p) => ({ ...p, lateNightHours: "" }));
                            }}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                          >
                            {LATE_NIGHT_TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="late-night-to"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          To
                        </label>
                        <div className="relative">
                          <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select
                            id="late-night-to"
                            value={lateNightEndTime}
                            onChange={(e) => {
                              setLateNightEndTime(e.target.value);
                              if (fieldErrors.lateNightHours) setFieldErrors((p) => ({ ...p, lateNightHours: "" }));
                            }}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                          >
                            {LATE_NIGHT_TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {fieldErrors.lateNightHours && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.lateNightHours}
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Late-Night Dining */}
                <label className="flex items-start space-x-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lateNightDining}
                    onChange={(e) => setLateNightDining(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Utensils size={15} className="text-purple-500" />
                      <span>Late-Night Dining Available</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customers can dine inside the shop during late-night hours.
                    </p>
                  </div>
                </label>

                {/* 6. Late-Night Takeaway */}
                <label className="flex items-start space-x-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lateNightTakeaway}
                    onChange={(e) => setLateNightTakeaway(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <ShoppingBag size={15} className="text-emerald-500" />
                      <span>Late-Night Takeaway Available</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customers can collect takeaway orders during late-night hours.
                    </p>
                  </div>
                </label>

                {/* 7. Late-Night Delivery */}
                <label className="flex items-start space-x-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lateNightDelivery}
                    onChange={(e) => setLateNightDelivery(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Truck size={15} className="text-blue-500" />
                      <span>Late-Night Food Delivery Available</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customers can order food delivered during late-night hours.
                    </p>
                  </div>
                </label>
              </div>

              {/* 8. Terms & Conditions Consent (Plain text, no hyperlink) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="terms-checkbox"
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
                    htmlFor="terms-checkbox"
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer select-none font-medium"
                  >
                    I confirm that the information, shop details, images, menu, popular items, and services provided by me are accurate.
                  </label>
                </div>

                {fieldErrors.terms && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pl-8">
                    <AlertCircle size={13} /> {fieldErrors.terms}
                  </p>
                )}

                {/* 9. Responsibility Notice */}
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-8 leading-relaxed">
                  By submitting this listing, you confirm that the information and images provided are accurate. Avadi Connect provides this platform for listing and discovery and is not responsible for the accuracy, quality, pricing, availability, or services offered by the listed business.
                </p>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={!isStep3Ready || isSubmitting}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-sm ${
                    isStep3Ready && !isSubmitting
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer active:scale-98"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Listing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* 4. Success Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Listing submitted successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Your shop has been submitted and is waiting for review.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/foods")}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm transition cursor-pointer active:scale-98"
              >
                Back to Food &amp; Dining
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
