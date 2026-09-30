"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Building2,
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
  FileText,
  Moon,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import avadiWardsData from "@/data/avadi-wards.json";
import {
  VegSymbol,
  NonVegSymbol,
  VeganSymbol,
  GlutenFreeSymbol,
  DairyFreeSymbol,
  EggFreeSymbol,
} from "@/components/food-icons";
import { TimePickerDropdown } from "@/components/ui/TimePickerDropdown";

import dynamic from "next/dynamic";

const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading Avadi Map...
      </div>
    ),
  }
);

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Egg-Free",
];

const CUISINE_OPTIONS = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Arabian",
  "Continental",
  "Bakery",
  "Desserts",
  "Beverages",
];

// 12-Hour AM/PM Time Options for user-facing selection (no railway 24h timetable format)
const TIME_OPTIONS_12H = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM",
  "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM"
];

// Late-Night serving range: 10:00 PM → 6:00 AM with 12-hour AM/PM format
const LATE_NIGHT_TIME_OPTIONS_12H = [
  "10:00 PM",
  "10:30 PM",
  "11:00 PM",
  "11:30 PM",
  "12:00 AM",
  "12:30 AM",
  "1:00 AM",
  "1:30 AM",
  "2:00 AM",
  "2:30 AM",
  "3:00 AM",
  "3:30 AM",
  "4:00 AM",
  "4:30 AM",
  "5:00 AM",
  "5:30 AM",
  "6:00 AM"
];

interface AvadiStreetRecord {
  id: string;
  name: string;
  wardNo: number;
  wardCode: string;
  lat: number;
  lng: number;
}

const AVADI_WARD_COORDINATES: Record<number, { lat: number; lng: number }> = {
  1: { lat: 13.1245, lng: 80.0582 },
  2: { lat: 13.1218, lng: 80.0635 },
  3: { lat: 13.1158, lng: 80.0631 },
  4: { lat: 13.1482, lng: 80.0894 },
  5: { lat: 13.1415, lng: 80.0763 },
  6: { lat: 13.1332, lng: 80.0841 },
  7: { lat: 13.1425, lng: 80.1012 },
  8: { lat: 13.1398, lng: 80.1075 },
  9: { lat: 13.1092, lng: 80.0885 },
  10: { lat: 13.1065, lng: 80.0942 },
  11: { lat: 13.0984, lng: 80.0853 },
  12: { lat: 13.0921, lng: 80.0915 },
  13: { lat: 13.0856, lng: 80.0847 },
  14: { lat: 13.0782, lng: 80.0898 },
  15: { lat: 13.0715, lng: 80.0945 },
  16: { lat: 13.1182, lng: 80.0985 },
  17: { lat: 13.1197, lng: 80.1017 },
  18: { lat: 13.1165, lng: 80.1052 },
  19: { lat: 13.1295, lng: 80.1124 },
  20: { lat: 13.1272, lng: 80.1189 },
  21: { lat: 13.1345, lng: 80.1168 },
  22: { lat: 13.1312, lng: 80.1235 },
  23: { lat: 13.1115, lng: 80.1172 },
  24: { lat: 13.1082, lng: 80.1225 },
  25: { lat: 13.1285, lng: 80.1298 },
  26: { lat: 13.1342, lng: 80.1365 },
  27: { lat: 13.1305, lng: 80.1412 },
  28: { lat: 13.1268, lng: 80.1458 },
  29: { lat: 13.1197, lng: 80.1500 },
  30: { lat: 13.1252, lng: 80.1548 },
  31: { lat: 13.1215, lng: 80.1605 },
  32: { lat: 13.1145, lng: 80.1545 },
  33: { lat: 13.1154, lng: 80.1477 },
  34: { lat: 13.1235, lng: 80.1028 },
  35: { lat: 13.1352, lng: 80.1485 },
  36: { lat: 13.1289, lng: 80.1065 },
  37: { lat: 13.1525, lng: 80.0925 },
  38: { lat: 13.1465, lng: 80.0825 },
  39: { lat: 13.1285, lng: 80.0545 },
  40: { lat: 13.1195, lng: 80.0525 },
  41: { lat: 13.1125, lng: 80.0825 },
  42: { lat: 13.1365, lng: 80.0875 },
  43: { lat: 13.1172, lng: 80.1045 },
  44: { lat: 13.1462, lng: 80.1042 },
  45: { lat: 13.0952, lng: 80.0815 },
  46: { lat: 13.0815, lng: 80.0925 },
  47: { lat: 13.1045, lng: 80.1195 },
  48: { lat: 13.1315, lng: 80.1495 },
};

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

interface AvadiWardItem {
  ward_no?: number;
  ward_code?: string;
  streets?: Array<{ value?: string; text?: string } | string>;
}

// Authoritative Street & Area dataset derived exclusively from @avadi-wards.json
const AVADI_STREETS_CATALOG: AvadiStreetRecord[] = (() => {
  const list: AvadiStreetRecord[] = [];
  const rawWards = (avadiWardsData as { wards?: AvadiWardItem[] })?.wards;
  if (Array.isArray(rawWards)) {
    for (const w of rawWards) {
      const wardNo = Number(w.ward_no);
      if (!wardNo || wardNo < 1 || wardNo > 48 || !Array.isArray(w.streets)) continue;
      const wardCode = String(w.ward_code || `WD-${String(wardNo).padStart(2, "0")}`);
      const baseCoord = AVADI_WARD_COORDINATES[wardNo] || { lat: 13.1169, lng: 80.0972 };

      for (let i = 0; i < w.streets.length; i++) {
        const item = w.streets[i];
        const rawName = typeof item === "string" ? item : item?.text;
        const val = typeof item === "object" && item?.value ? String(item.value) : String(i);
        const clean = rawName?.trim();
        if (!clean) continue;

        // Micro-offset distributes individual streets naturally across the ward's authentic geography
        const charSum = val.split("").reduce((sum: number, c: string) => sum + c.charCodeAt(0), 0) + i;
        const latOffset = ((charSum % 11) - 5) * 0.00025;
        const lngOffset = ((Math.floor(charSum / 11) % 11) - 5) * 0.00025;

        list.push({
          id: `w${wardNo}-${val}-${i}`,
          name: toTitleCase(clean),
          wardNo,
          wardCode,
          lat: Number((baseCoord.lat + latOffset).toFixed(5)),
          lng: Number((baseCoord.lng + lngOffset).toFixed(5)),
        });
      }
    }
  }
  return list;
})();

export default function NewListingWizardPage() {
  const router = useRouter();
  const toast = useToast();
  const { activeWard, isAuthenticated, isLoadingAuth } = useWard();

  // File input & container references
  const shopFileInputRef = useRef<HTMLInputElement>(null);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  // Wizard Navigation: Step 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step Navigation with automatic top-scroll
  const goToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
    setTimeout(() => {
      if (wizardTopRef.current) {
        wizardTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  // Authentication Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/foods/add");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // ==========================================
  // STEP 1 STATE: DIETARY & CUISINES
  // ==========================================
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // ==========================================
  // STEP 2 STATE: SHOP DETAILS
  // ==========================================
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [ward, setWard] = useState<number>(activeWard?.id || 1);
  const [latitude, setLatitude] = useState<number>(13.1169);
  const [longitude, setLongitude] = useState<number>(80.0972);
  const [mapError, setMapError] = useState<string | null>(null);
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

  // Filter Location Suggestions solely and strictly from @avadi-wards.json
  const locationSuggestions = useMemo((): AvadiStreetRecord[] => {
    const q = streetArea.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const prefixMatches: AvadiStreetRecord[] = [];
    const otherMatches: AvadiStreetRecord[] = [];
    const seen = new Set<string>();

    for (const street of AVADI_STREETS_CATALOG) {
      const lower = street.name.toLowerCase();
      if (seen.has(lower)) continue;

      if (lower.startsWith(q)) {
        seen.add(lower);
        prefixMatches.push(street);
      } else if (lower.includes(q)) {
        seen.add(lower);
        otherMatches.push(street);
      }

      if (prefixMatches.length + otherMatches.length >= 25) break;
    }

    return [...prefixMatches, ...otherMatches].slice(0, 10);
  }, [streetArea]);

  const handleSelectLocation = (suggestion: AvadiStreetRecord) => {
    setStreetArea(suggestion.name);
    // Ward is derived internally from the selected @avadi-wards.json record (NO visible ward dropdown)
    setWard(suggestion.wardNo);
    // Coordinates corresponding to the selected record
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lng);
    setMapError(null);
    setShowLocationSuggestions(false);
    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }
  };

  // Toggle Multi-select dietary options
  const toggleDietary = (item: string) => {
    setSelectedDietary((prev) => {
      const exists = prev.includes(item);
      const updated = exists ? prev.filter((i) => i !== item) : [...prev, item];
      if (fieldErrors.dietary) {
        setFieldErrors((p) => ({ ...p, dietary: "" }));
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

  // Step 1 Validation & Ready State
  const isStep1Ready = selectedDietary.length > 0 && selectedCuisines.length > 0;

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (selectedDietary.length === 0) {
      errors.dietary = "Please select at least one Dietary option.";
    }

    if (selectedCuisines.length === 0) {
      errors.cuisines = "Please select at least one Cuisine.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueStep1 = () => {
    if (validateStep1()) {
      goToStep(2);
    } else {
      toast.error("Please select at least one Dietary option and at least one Cuisine.");
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
      goToStep(3);
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
      goToStep(1);
      toast.error("Please check your food details in Step 1.");
      return;
    }

    if (!validateStep2()) {
      goToStep(2);
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

      const fullAddress = [shopAddress.trim(), streetArea.trim()].filter(Boolean).join(", ");
      formData.append("address", fullAddress);
      formData.append("areaLandmark", streetArea.trim());
      formData.append("ward", ward.toString());
      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());

      formData.append("openingTime", openingTime);
      formData.append("closingTime", closingTime);

      if (website.trim()) formData.append("website", website.trim());
      if (socialLink.trim()) formData.append("socialLink", socialLink.trim());

      // Dietary & Cuisines
      const allDietary = selectedDietary.join(", ");
      const allCuisines = selectedCuisines.join(", ");

      formData.append("foodTypes", allDietary);
      formData.append("cuisines", allCuisines);
      formData.append("foodType", allDietary);
      formData.append("category", selectedCuisines[0] || "Restaurant");

      // Operational flags
      formData.append("isLateNight", isLateNight ? "true" : "false");
      if (isLateNight) {
        formData.append("lateNightStartTime", lateNightStartTime);
        formData.append("lateNightEndTime", lateNightEndTime);
      }
      formData.append("lateNightDining", (isLateNight && lateNightDining) ? "true" : "false");
      formData.append("lateNightTakeaway", (isLateNight && lateNightDining && lateNightTakeaway) ? "true" : "false");
      formData.append("lateNightDelivery", (isLateNight && lateNightDining && lateNightDelivery) ? "true" : "false");
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
        <div ref={wizardTopRef} className="scroll-mt-6" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* Top Segmented Progress Bar (Matches Reference Image) */}
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
                  {currentStep === 1 && "Dietary & Cuisines"}
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
          {/* STEP 1: DIETARY & CUISINES                               */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Dietary Options (Selectable button / card / chip, NO checkboxes, NO ticks) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Dietary <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Select all that apply)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DIETARY_OPTIONS.map((item) => {
                    const isSelected = selectedDietary.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDietary(item)}
                        className={`flex items-center space-x-2.5 p-3.5 rounded-2xl border transition-all select-none text-left cursor-pointer active:scale-98 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-xs"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium"
                        }`}
                      >
                        {item === "Vegetarian" && <VegSymbol />}
                        {item === "Non-Vegetarian" && <NonVegSymbol />}
                        {item === "Vegan" && <VeganSymbol />}
                        {item === "Gluten-Free" && <GlutenFreeSymbol />}
                        {item === "Dairy-Free" && <DairyFreeSymbol />}
                        {item === "Egg-Free" && <EggFreeSymbol />}
                        <span className="text-xs sm:text-sm font-semibold">{item}</span>
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.dietary && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.dietary}
                  </p>
                )}
              </div>

              {/* Cuisines (Selectable button / card / chip, NO checkboxes, NO ticks) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Cuisines <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Select all that apply)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {CUISINE_OPTIONS.map((cuisine) => {
                    const isSelected = selectedCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`flex items-center justify-center p-3.5 rounded-2xl border transition-all select-none text-center cursor-pointer active:scale-98 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-xs"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{cuisine}</span>
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.cuisines && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.cuisines}
                  </p>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleContinueStep1}
                  disabled={!isStep1Ready}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center space-x-2 ${
                    isStep1Ready
                      ? "bg-primary hover:bg-primary/90 text-white cursor-pointer active:scale-98"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
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

              {/* Location Details: Street / Area Autocomplete (Ward is automatically derived) */}
              <div className="relative" ref={locationContainerRef}>
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

                {/* Autocomplete Dropdown matching project get-started styling */}
                {showLocationSuggestions && streetArea.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#0c1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                    {locationSuggestions.length > 0 ? (
                      <ul className="divide-y divide-slate-800/80 text-left">
                        {locationSuggestions.map((item) => (
                          <li
                            key={item.id}
                            onClick={() => handleSelectLocation(item)}
                            className="p-3.5 hover:bg-slate-800/60 cursor-pointer flex items-start gap-3 transition group"
                          >
                            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-white transition shadow-sm">
                              <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <p className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-slate-300 text-[11px] font-bold transition">
                                  <Building2 size={12} className="text-slate-400 shrink-0" />
                                  <span>Ward {item.wardNo}</span>
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center space-y-1 bg-[#0c1322]">
                        <p className="text-xs font-bold text-slate-200">
                          No matching Avadi location found
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Only locations within Avadi Municipal Corporation are permitted.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {fieldErrors.streetArea && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.streetArea}
                  </p>
                )}
              </div>

              {/* Map Section (Placed Above Shop Address) */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <MapPin size={16} className="text-primary" />
                  <span>Pinpoint Location on Map</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    (Click or drag marker to set shop location in Avadi)
                  </span>
                </label>
                <MapLocationPicker
                  selectedLat={latitude}
                  selectedLng={longitude}
                  selectedAreaName={streetArea ? `${streetArea} (Ward ${ward})` : null}
                  onLocationSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    setMapError(null);
                  }}
                  onError={(msg) => setMapError(msg)}
                />
                {mapError && (
                  <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} /> {mapError}
                  </p>
                )}
                {latitude && longitude && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selected Location: <span className="font-semibold text-slate-700 dark:text-slate-300">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
                  </p>
                )}
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

              {/* Opening & Closing Time (Custom 12-Hour AM/PM Time Picker Dropdown) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shop-opening-time"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Opening Time <span className="text-rose-500">*</span>
                  </label>
                  <TimePickerDropdown
                    id="shop-opening-time"
                    value={openingTime}
                    onChange={(val) => {
                      setOpeningTime(val);
                      if (fieldErrors.openingTime) setFieldErrors((p) => ({ ...p, openingTime: "" }));
                    }}
                    hasError={!!fieldErrors.openingTime}
                    placement="top"
                  />
                  {fieldErrors.openingTime && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.openingTime}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="shop-closing-time"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Closing Time <span className="text-rose-500">*</span>
                  </label>
                  <TimePickerDropdown
                    id="shop-closing-time"
                    value={closingTime}
                    onChange={(val) => {
                      setClosingTime(val);
                      if (fieldErrors.closingTime) setFieldErrors((p) => ({ ...p, closingTime: "" }));
                    }}
                    hasError={!!fieldErrors.closingTime}
                    placement="top"
                  />
                  {fieldErrors.closingTime && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.closingTime}
                    </p>
                  )}
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
                        <TimePickerDropdown
                          id="late-night-from"
                          value={lateNightStartTime}
                          onChange={(val) => {
                            setLateNightStartTime(val);
                            if (fieldErrors.lateNightHours) setFieldErrors((p) => ({ ...p, lateNightHours: "" }));
                          }}
                          placement="top"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="late-night-to"
                          className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                        >
                          To
                        </label>
                        <TimePickerDropdown
                          id="late-night-to"
                          value={lateNightEndTime}
                          onChange={(val) => {
                            setLateNightEndTime(val);
                            if (fieldErrors.lateNightHours) setFieldErrors((p) => ({ ...p, lateNightHours: "" }));
                          }}
                          placement="top"
                        />
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
                    onChange={(e) => {
                      setLateNightDining(e.target.checked);
                      if (!e.target.checked) {
                        setLateNightTakeaway(false);
                        setLateNightDelivery(false);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-700 focus:ring-primary accent-primary"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Utensils size={15} className="text-purple-500" />
                      <span>Late Night Dining Available</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customers can dine inside the shop during late-night hours.
                    </p>
                  </div>
                </label>

                {/* 6 & 7. Conditional Late-Night Takeaway & Delivery (displayed only when Late Night Dining is selected) */}
                {lateNightDining && (
                  <div className="pl-4 sm:pl-6 space-y-3 border-l-2 border-primary/30 ml-2 animate-in fade-in duration-200">
                    {/* Late-Night Takeaway */}
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
                          <span>Late Night Takeaway Available</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Customers can collect takeaway orders during late-night hours.
                        </p>
                      </div>
                    </label>

                    {/* Late-Night Delivery */}
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
                          <span>Late Night Food Delivery Available</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Customers can order food delivered during late-night hours.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
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
                  onClick={() => goToStep(2)}
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
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Listing submitted successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                ✅ <span className="text-primary font-bold">{name.trim() || "Your shop"}</span> has been submitted and is waiting for admin review.
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
