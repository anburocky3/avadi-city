/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Building2,
  Phone,
  Clock,
  Globe,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  ExternalLink,
  Plus,
  Sparkles,
  IndianRupee,
  Check,
} from "lucide-react";

import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { TimePickerDropdown } from "@/components/ui/TimePickerDropdown";
import {
  ALL_AVADI_STREETS,
  StreetItem,
  AVADI_WARD_COORDINATES,
} from "@/lib/wards";
import "leaflet/dist/leaflet.css";

// Dynamically import MapLocationPicker to prevent SSR issues with Leaflet
const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs font-semibold text-slate-400">
        Loading Avadi Interactive Map...
      </div>
    ),
  },
);

// 1. Categories configuration
const CATEGORIES = [
  { id: "Parks & Gardens", name: "Parks & Gardens", icon: "🌳" },
  { id: "Historical Places", name: "Historical Places", icon: "🏛️" },
  { id: "Lakes & Nature", name: "Lakes & Nature", icon: "🏞️" },
  {
    id: "Cultural & Heritage Places",
    name: "Cultural & Heritage Places",
    icon: "🛕",
  },
  { id: "Sports & Recreation", name: "Sports & Recreation", icon: "🏟️" },
  {
    id: "Cultural & Event Spaces",
    name: "Cultural & Event Spaces",
    icon: "🎭",
  },
  { id: "Tourist Attractions", name: "Tourist Attractions", icon: "📸" },
  { id: "Public Landmarks", name: "Public Landmarks", icon: "🏙️" },
  {
    id: "Shopping & Public Spaces",
    name: "Shopping & Public Spaces",
    icon: "🛍️",
  },
  { id: "Art & Community Spaces", name: "Art & Community Spaces", icon: "🎨" },
];

// 2. Activities mapped dynamically by Place Category
const CATEGORY_ACTIVITIES: Record<string, string[]> = {
  "Parks & Gardens": [
    "Walking",
    "Jogging",
    "Relaxation",
    "Family Outing",
    "Children's Play Area",
    "Photography",
    "Bird Watching",
    "Outdoor Exercise",
  ],
  "Historical Places": [
    "Historical Exploration",
    "Guided Visit",
    "Photography",
    "Educational Visit",
    "Architecture Viewing",
  ],
  "Lakes & Nature": [
    "Nature Walk",
    "Bird Watching",
    "Photography",
    "Scenic Viewing",
    "Relaxation",
  ],
  "Cultural & Heritage Places": [
    "Cultural Exploration",
    "Historical Learning",
    "Photography",
    "Community Events",
    "Educational Visits",
  ],
  "Sports & Recreation": [
    "Outdoor Sports",
    "Indoor Games",
    "Exercise",
    "Fitness Activities",
    "Recreation",
    "Community Sports",
  ],
  "Cultural & Event Spaces": [
    "Public Events",
    "Cultural Programs",
    "Exhibitions",
    "Community Gatherings",
    "Performances",
  ],
  "Tourist Attractions": [
    "Sightseeing",
    "Photography",
    "Family Outing",
    "Local Exploration",
    "Educational Visits",
  ],
  "Public Landmarks": [
    "Sightseeing",
    "Photography",
    "Local Exploration",
    "Historical Learning",
  ],
  "Shopping & Public Spaces": [
    "Shopping",
    "Local Market Exploration",
    "Public Events",
    "Family Visits",
  ],
  "Art & Community Spaces": [
    "Art Exhibitions",
    "Workshops",
    "Cultural Programs",
    "Community Activities",
    "Educational Visits",
  ],
};

// 3. Visitor Suitability options
const VISITOR_TYPES = [
  "Families",
  "Children",
  "Couples",
  "Individual Visitors",
  "Groups",
  "Tourists",
  "Students",
];

// 4. Visitor Facilities & Accessibility options (Grouped)
export interface FacilityGroup {
  group: string;
  icon?: string;
  items: { id: string; label: string; icon: string }[];
}

const VISITOR_FACILITY_GROUPS: FacilityGroup[] = [
  {
    group: "Basic Facilities",
    items: [
      { id: "Parking", label: "Parking", icon: "🚗" },
      { id: "Public Restrooms", label: "Public Restrooms", icon: "🚻" },
      { id: "Drinking Water", label: "Drinking Water", icon: "🚰" },
      { id: "Seating Areas", label: "Seating Areas", icon: "🪑" },
      { id: "Lighting", label: "Lighting", icon: "💡" },
    ],
  },
  {
    group: "Accessibility",
    items: [
      { id: "Wheelchair Access", label: "Wheelchair Access", icon: "♿" },
      {
        id: "Accessible Restrooms",
        label: "Accessible Restrooms",
        icon: "♿🚻",
      },
      { id: "Accessible Parking", label: "Accessible Parking", icon: "♿🚗" },
    ],
  },
  {
    group: "Family Facilities",
    items: [
      { id: "Children's Play Area", label: "Children's Play Area", icon: "🛝" },
      { id: "Family Seating Area", label: "Family Seating Area", icon: "👨‍👩‍👧" },
    ],
  },
  {
    group: "Visitor Services",
    items: [
      { id: "Food Stalls", label: "Food Stalls", icon: "🍲" },
      {
        id: "Public Transport Access",
        label: "Public Transport Access",
        icon: "🚌",
      },
    ],
  },
];

// 5. Best Time to Visit options (Grouped & Rich Multi-Choice)
export interface BestTimeGroup {
  group: string;
  items: { id: string; label: string; icon: string; desc?: string }[];
}

const BEST_TIME_GROUPS: BestTimeGroup[] = [
  {
    group: "Times of Day",
    items: [
      { id: "Early Morning", label: "Early Morning", icon: "🌅", desc: "5:00 AM – 8:00 AM" },
      { id: "Morning", label: "Morning", icon: "☀️", desc: "8:00 AM – 12:00 PM" },
      { id: "Afternoon", label: "Afternoon", icon: "🌤️", desc: "12:00 PM – 4:00 PM" },
      { id: "Evening", label: "Evening", icon: "🌇", desc: "4:00 PM – 8:00 PM" },
      { id: "Night", label: "Night", icon: "🌙", desc: "After 8:00 PM" },
    ],
  },
  {
    group: "Days of Week",
    items: [
      { id: "Weekdays", label: "Weekdays", icon: "💼", desc: "Monday – Friday" },
      { id: "Weekends", label: "Weekends", icon: "🎉", desc: "Saturday – Sunday" },
    ],
  },
  {
    group: "Seasons & Occasions",
    items: [
      { id: "Winter (Nov–Feb)", label: "Winter / Cooler Months", icon: "❄️", desc: "Nov – Feb" },
      { id: "Monsoon Season", label: "Monsoon Season", icon: "🌧️", desc: "Rainy & scenic" },
      { id: "Festivals & Events", label: "Festivals & Special Events", icon: "🎊", desc: "Celebrations" },
      { id: "Any Time / All Year", label: "Any Time / All Year", icon: "🕒", desc: "Open throughout" },
    ],
  },
];

export default function PostPlacePage() {
  const router = useRouter();
  const toast = useToast();
  const { activeWard, isAuthenticated, isLoadingAuth } = useWard();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  // Field element refs for error scrolling
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const feeRef = useRef<HTMLDivElement>(null);
  const coverImageRef = useRef<HTMLDivElement>(null);

  // Authentication Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/explore/create");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // Step Navigation with smooth auto-scroll to top
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

  // Scroll smoothly to first invalid field
  const scrollToError = (fieldKey: string) => {
    setTimeout(() => {
      let target: HTMLElement | null = null;
      if (fieldKey === "name") target = nameRef.current;
      else if (fieldKey === "category") target = categoryRef.current;
      else if (fieldKey === "activities") target = activitiesRef.current;
      else if (fieldKey === "description") target = descRef.current;
      else if (fieldKey === "streetArea") target = streetInputRef.current;
      else if (fieldKey === "address") target = addressRef.current;
      else if (fieldKey === "hours") target = hoursRef.current;
      else if (fieldKey === "entryFee") target = feeRef.current;
      else if (fieldKey === "coverImage") target = coverImageRef.current;

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in target && typeof target.focus === "function") {
          target.focus();
        }
      }
    }, 100);
  };

  // ==========================================
  // STEP 1 STATE: PLACE PROFILE
  // ==========================================
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [selectedVisitorTypes, setSelectedVisitorTypes] = useState<string[]>(
    [],
  );

  // ==========================================
  // STEP 2 STATE: LOCATION & VISITOR INFO
  // ==========================================
  const [streetQuery, setStreetQuery] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] =
    useState<StreetItem | null>(null);
  const [streetArea, setStreetArea] = useState("");
  const [ward, setWard] = useState<number>(activeWard?.id || 1);
  const [latitude, setLatitude] = useState<number>(13.1169);
  const [longitude, setLongitude] = useState<number>(80.0972);
  const [mapError, setMapError] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  const [isOpen24Hours, setIsOpen24Hours] = useState(false);
  const [openingTime, setOpeningTime] = useState("9:00 AM");
  const [closingTime, setClosingTime] = useState("5:00 PM");

  const [entryFeeType, setEntryFeeType] = useState<"Free Entry" | "Paid Entry">(
    "Free Entry",
  );
  const [entryFeeAmount, setEntryFeeAmount] = useState<string>("");

  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");

  // ==========================================
  // STEP 3 STATE: PHOTOS & CONFIRMATION
  // ==========================================
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );

  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedBestTimes, setSelectedBestTimes] = useState<string[]>([]);
  const [customBestTimeInput, setCustomBestTimeInput] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Toggle helper for multi-choice Best Time to Visit
  const toggleBestTime = (timeOption: string) => {
    setSelectedBestTimes((prev) => {
      const isAnyTime =
        timeOption === "Any Time" || timeOption === "Any Time / All Year";
      if (isAnyTime) {
        return prev.includes(timeOption) ? [] : [timeOption];
      }
      const withoutAnyTime = prev.filter(
        (t) => t !== "Any Time" && t !== "Any Time / All Year",
      );
      if (withoutAnyTime.includes(timeOption)) {
        return withoutAnyTime.filter((t) => t !== timeOption);
      } else {
        return [...withoutAnyTime, timeOption];
      }
    });
  };

  const handleAddCustomBestTime = () => {
    const trimmed = customBestTimeInput.trim();
    if (!trimmed) return;
    if (!selectedBestTimes.includes(trimmed)) {
      setSelectedBestTimes((prev) => [
        ...prev.filter((t) => t !== "Any Time" && t !== "Any Time / All Year"),
        trimmed,
      ]);
    }
    setCustomBestTimeInput("");
  };

  // Form submission and validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync ward if activeWard loads later
  useEffect(() => {
    if (activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48) {
      if (!selectedStreetItem) {
        setWard(activeWard.id);
        const wardCoords = AVADI_WARD_COORDINATES[activeWard.id];
        if (wardCoords) {
          setLatitude(wardCoords.lat);
          setLongitude(wardCoords.lng);
        }
      }
    }
  }, [activeWard?.id, selectedStreetItem]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (coverImagePreview && coverImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverImagePreview);
      }
      additionalPreviews.forEach((url) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [coverImagePreview, additionalPreviews]);

  // Category change handler: updates category and filters activities dynamically
  const handleSelectCategory = (catId: string) => {
    setCategory(catId);
    if (fieldErrors.category) {
      setFieldErrors((prev) => ({ ...prev, category: "" }));
    }
    // Filter out activities not supported by new category
    const validActivities = CATEGORY_ACTIVITIES[catId] || [];
    setSelectedActivities((prev) =>
      prev.filter((act) => validActivities.includes(act)),
    );
  };

  // Toggle activity selection (multi-select chip)
  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) => {
      const exists = prev.includes(activity);
      const updated = exists
        ? prev.filter((a) => a !== activity)
        : [...prev, activity];
      if (fieldErrors.activities && updated.length > 0) {
        setFieldErrors((p) => ({ ...p, activities: "" }));
      }
      return updated;
    });
  };

  // Toggle visitor type (multi-select chip)
  const toggleVisitorType = (vType: string) => {
    setSelectedVisitorTypes((prev) =>
      prev.includes(vType)
        ? prev.filter((item) => item !== vType)
        : [...prev, vType],
    );
  };

  // Toggle facility (multi-select chip)
  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facilityId)
        ? prev.filter((f) => f !== facilityId)
        : [...prev, facilityId],
    );
  };

  // Street autocomplete input change
  const handleStreetSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setStreetQuery(searchTerm);
    setSelectedStreetItem(null);

    if (!searchTerm.trim()) {
      setStreetResults([]);
      return;
    }

    const matches = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setStreetResults(matches.slice(0, 15));
  };

  // Select street suggestion: derives ward, updates map coordinates
  const handleSelectStreetItem = (item: StreetItem) => {
    setSelectedStreetItem(item);
    setStreetQuery(item.streetName);
    setStreetArea(item.streetName);
    setStreetResults([]);
    setWard(item.wardNo);

    // Reposition map to ward coordinate
    const wardCoord = AVADI_WARD_COORDINATES[item.wardNo];
    if (wardCoord) {
      setLatitude(wardCoord.lat);
      setLongitude(wardCoord.lng);
      setMapError(null);
    }

    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }
  };

  // Cover image change handler
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Place Cover Image size must be less than 5MB.");
      return;
    }

    if (coverImagePreview && coverImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    if (fieldErrors.coverImage) {
      setFieldErrors((prev) => ({ ...prev, coverImage: "" }));
    }
  };

  const handleRemoveCoverImage = () => {
    if (coverImagePreview && coverImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };

  // Additional images handler
  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 3 - additionalFiles.length;
    if (remainingSlots <= 0) {
      toast.error("You can upload a maximum of 3 additional images.");
      return;
    }

    const validNewFiles: File[] = [];
    const validNewPreviews: string[] = [];

    for (const file of files.slice(0, remainingSlots)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not a valid image file.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }
      validNewFiles.push(file);
      validNewPreviews.push(URL.createObjectURL(file));
    }

    setAdditionalFiles((prev) => [...prev, ...validNewFiles]);
    setAdditionalPreviews((prev) => [...prev, ...validNewPreviews]);
    if (additionalFileInputRef.current)
      additionalFileInputRef.current.value = "";
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const removedPreview = additionalPreviews[index];
    if (removedPreview && removedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview);
    }
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // STEP 1 VALIDATION
  // ==========================================
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Place Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Place Name must be at least 2 characters.";
    }

    if (!category) {
      errors.category = "Please select a Place Category.";
    }

    if (selectedActivities.length === 0) {
      errors.activities = "Please select at least one Activity/Attraction.";
    }

    if (!description.trim()) {
      errors.description = "About This Place is required.";
    } else if (description.trim().length < 10) {
      errors.description = "About This Place must be at least 10 characters.";
    }

    setFieldErrors(errors);

    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      scrollToError(firstKey);
      return false;
    }

    return true;
  };

  const handleContinueStep1 = () => {
    if (validateStep1()) {
      goToStep(2);
    } else {
      toast.error("Please fill in all required fields in Step 1.");
    }
  };

  // ==========================================
  // STEP 2 VALIDATION
  // ==========================================
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    const effectiveStreet = (streetArea || streetQuery).trim();
    if (!effectiveStreet) {
      errors.streetArea = "Area / Street Location in Avadi is required.";
    }

    if (!address.trim()) {
      errors.address = "Place Address is required.";
    } else if (address.trim().length < 3) {
      errors.address = "Place Address must be at least 3 characters.";
    }

    if (!isOpen24Hours) {
      if (!openingTime) errors.openingTime = "Opening Time is required.";
      if (!closingTime) errors.closingTime = "Closing Time is required.";
    }

    if (entryFeeType === "Paid Entry") {
      const numVal = parseFloat(entryFeeAmount);
      if (isNaN(numVal) || numVal <= 0) {
        errors.entryFeeAmount =
          "Please enter a valid admission fee amount (greater than 0).";
      }
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, "");
      if (cleanPhone.length < 7) {
        errors.phone = "Please enter a valid contact phone number.";
      }
    }

    if (website.trim() && !/^https?:\/\//i.test(website.trim())) {
      errors.website = "Website URL must start with http:// or https://";
    }

    if (officialUrl.trim() && !/^https?:\/\//i.test(officialUrl.trim())) {
      errors.officialUrl = "Official URL must start with http:// or https://";
    }

    setFieldErrors(errors);

    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      scrollToError(firstKey);
      return false;
    }

    return true;
  };

  const handleContinueStep2 = () => {
    if (validateStep2()) {
      goToStep(3);
    } else {
      toast.error(
        "Please fill in all required location & visitor information.",
      );
    }
  };

  // ==========================================
  // STEP 3 VALIDATION & SUBMISSION
  // ==========================================
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!coverImageFile) {
      errors.coverImage = "Place Cover Image is mandatory.";
    }

    if (!termsAccepted) {
      errors.terms = "Please confirm that the submitted details are accurate.";
    }

    setFieldErrors(errors);

    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      scrollToError(firstKey);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      goToStep(1);
      toast.error("Please check the place profile in Step 1.");
      return;
    }

    if (!validateStep2()) {
      goToStep(2);
      toast.error("Please check the location details in Step 2.");
      return;
    }

    if (!validateStep3()) {
      toast.error("Please upload the cover image and confirm accuracy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("activities", JSON.stringify(selectedActivities));
      formData.append("description", description.trim());
      if (selectedVisitorTypes.length > 0) {
        formData.append("visitorTypes", JSON.stringify(selectedVisitorTypes));
      }

      const effectiveStreet = (streetArea || streetQuery).trim();
      formData.append("streetArea", effectiveStreet);
      formData.append("address", address.trim());
      formData.append("ward", ward.toString());

      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());

      formData.append("is24x7", isOpen24Hours ? "true" : "false");
      if (!isOpen24Hours) {
        formData.append("openingTime", openingTime);
        formData.append("closingTime", closingTime);
      }

      formData.append("entryFeeType", entryFeeType);
      if (entryFeeType === "Paid Entry" && entryFeeAmount) {
        formData.append("entryFeeAmount", entryFeeAmount);
      }

      if (phone.trim()) formData.append("phone", phone.trim());
      if (website.trim()) formData.append("website", website.trim());
      if (officialUrl.trim())
        formData.append("officialUrl", officialUrl.trim());

      if (coverImageFile) {
        formData.append("image", coverImageFile);
      }

      additionalFiles.forEach((file) => {
        formData.append("additionalImages", file);
      });

      if (selectedFacilities.length > 0) {
        formData.append("facilities", JSON.stringify(selectedFacilities));
      }
      if (selectedBestTimes.length > 0) {
        formData.append("bestTimeToVisit", selectedBestTimes.join(", "));
      }
      if (guidelines.trim()) {
        formData.append("guidelines", guidelines.trim());
      }

      formData.append("termsAccepted", "true");

      const response = await fetch("/api/explore", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Unable to submit your place. Please try again.",
        );
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

      setShowSuccessModal(true);
    } catch {
      toast.error(
        "Unable to submit place. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Ready = Boolean(
    name.trim().length >= 2 &&
    category &&
    selectedActivities.length > 0 &&
    description.trim().length >= 10,
  );

  const isStep2Ready = Boolean(
    (streetArea || streetQuery).trim() &&
    address.trim().length >= 3 &&
    (isOpen24Hours || (openingTime && closingTime)) &&
    (entryFeeType === "Free Entry" ||
      (entryFeeType === "Paid Entry" && parseFloat(entryFeeAmount) > 0)),
  );

  const isStep3Ready = Boolean(coverImageFile && termsAccepted);

  return (
    <div className="p-4 md:p-8 max-w-3xl lg:max-w-full  mx-auto space-y-6">
      {/* 1. Back to Explore Places Link */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-black text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft size={16} />
          <span>Back to Explore Places</span>
        </Link>
      </div>

      {/* 2. Main Wizard Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div ref={wizardTopRef} className="scroll-mt-6" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* Top Segmented Progress Bar */}
          <div className="space-y-3.5 border-b border-slate-100 dark:border-slate-800 pb-5 sm:pb-6">
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
                  {currentStep === 1 && "Place Profile & Activities"}
                  {currentStep === 2 && "Location & Visitor Information"}
                  {currentStep === 3 && "Photos & Confirmation"}
                </h2>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black tracking-tight shrink-0 shadow-2xs">
                {currentStep}/3
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* STEP 1: PLACE PROFILE                                    */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Place Name */}
              <div>
                <label
                  htmlFor="place-name-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Place Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  id="place-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name)
                      setFieldErrors((p) => ({ ...p, name: "" }));
                  }}
                  placeholder="e.g. Paruthipattu Lake Park, Local Heritage Landmark"
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

              {/* Place Category (Selectable cards, single selection) */}
              <div
                ref={categoryRef}
                className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Place Category <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Select one category)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`flex items-center space-x-2.5 p-3 rounded-2xl border transition-all select-none text-left cursor-pointer active:scale-98 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-xs ring-1 ring-primary/40"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-xl shrink-0">{cat.icon}</span>
                        <span className="text-xs sm:text-sm leading-tight">
                          {cat.name}
                        </span>
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

              {/* Dynamic Activities & Attractions (Based on selected category) */}
              <div
                ref={activitiesRef}
                className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  What Can Visitors Do Here?{" "}
                  <span className="text-rose-500">*</span>
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    {category
                      ? `(Select activities applicable to ${category})`
                      : "(Please select a category above first)"}
                  </span>
                </label>

                {!category ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                    <p className="text-xs text-slate-400">
                      Select a Place Category above to view available activities
                      and attractions.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {(CATEGORY_ACTIVITIES[category] || []).map((activity) => {
                      const isSelected = selectedActivities.includes(activity);
                      return (
                        <button
                          key={activity}
                          type="button"
                          onClick={() => toggleActivity(activity)}
                          className={`flex items-center justify-center p-3 rounded-2xl border transition-all select-none text-center cursor-pointer active:scale-98 ${
                            isSelected
                              ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-xs"
                              : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium"
                          }`}
                        >
                          <span className="text-xs leading-snug">
                            {activity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {fieldErrors.activities && (
                  <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.activities}
                  </p>
                )}
              </div>

              {/* About This Place */}
              <div>
                <label
                  htmlFor="place-description-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  About This Place <span className="text-rose-500">*</span>
                </label>
                <textarea
                  ref={descRef}
                  id="place-description-input"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description)
                      setFieldErrors((p) => ({ ...p, description: "" }));
                  }}
                  placeholder="Describe what this place is, what makes it interesting, key highlights, and useful advice for visitors..."
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-24 ${
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

              {/* Visit Suitability */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Visit Suitability{" "}
                  <span className="text-xs font-normal text-slate-400 ml-1.5">
                    (Optional — Select who this place is ideal for)
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {VISITOR_TYPES.map((vType) => {
                    const isSelected = selectedVisitorTypes.includes(vType);
                    return (
                      <button
                        key={vType}
                        type="button"
                        onClick={() => toggleVisitorType(vType)}
                        className={`px-3.5 py-2 rounded-xl border text-xs transition cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 font-medium"
                        }`}
                      >
                        {vType}
                      </button>
                    );
                  })}
                </div>
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
          {/* STEP 2: LOCATION & VISITOR INFORMATION                    */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Street / Area Autocomplete */}
              <div className="relative">
                <label
                  htmlFor="place-street-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Area / Street Location in Avadi{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={streetInputRef}
                    id="place-street-input"
                    type="text"
                    value={streetQuery}
                    onChange={handleStreetSearchChange}
                    placeholder="Type area or street name (e.g. Paruthipattu, Pattabiram, CTH Road)..."
                    className={`w-full pl-4 pr-10 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                      fieldErrors.streetArea
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    autoComplete="off"
                  />
                  <Search
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>

                {/* Autocomplete Suggestions */}
                {streetResults.length > 0 && !selectedStreetItem && (
                  <ul className="absolute z-20 w-full mt-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xl max-h-56 overflow-y-auto">
                    {streetResults.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleSelectStreetItem(item)}
                        className="p-3 hover:bg-amber-50/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-start gap-3 transition"
                      >
                        <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                            {item.streetName.toLowerCase()}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold mt-1">
                            <Building2 size={12} className="shrink-0" />
                            <span>Ward {item.wardNo}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {streetQuery.trim() &&
                  streetResults.length === 0 &&
                  !selectedStreetItem && (
                    <div className="p-3 mt-1 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500">
                        No matching street found in Avadi. You can still
                        pinpoint the location on the map below.
                      </p>
                    </div>
                  )}

                {fieldErrors.streetArea && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.streetArea}
                  </p>
                )}
              </div>

              {/* Interactive Map (Above Place Address) */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <MapPin size={16} className="text-primary" />
                  <span>Pinpoint Place on Map</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    (Click or drag marker to set exact attraction entrance or
                    spot in Avadi)
                  </span>
                </label>

                <MapLocationPicker
                  defaultLat={latitude}
                  defaultLng={longitude}
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
                    Selected Coordinates:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </span>
                    {ward ? (
                      <span className="ml-2 font-bold text-primary">
                        (Ward {ward})
                      </span>
                    ) : null}
                  </p>
                )}
              </div>

              {/* Detailed Place Address */}
              <div>
                <label
                  htmlFor="place-address-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Place Address <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={addressRef}
                  id="place-address-input"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address)
                      setFieldErrors((p) => ({ ...p, address: "" }));
                  }}
                  placeholder="e.g. Lake View Road, Paruthipattu, Near Checkpost, Avadi - 600071"
                  className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.address
                      ? "border-rose-400 focus:ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                />
                {fieldErrors.address && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.address}
                  </p>
                )}
              </div>

              {/* Visiting Hours (Open 24 Hours or 12h AM/PM Pickers) */}
              <div
                ref={hoursRef}
                className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Visiting Hours <span className="text-rose-500">*</span>
                  </label>

                  {/* Open 24 Hours Checkbox Card */}
                  <label className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOpen24Hours}
                      onChange={(e) => {
                        setIsOpen24Hours(e.target.checked);
                        if (e.target.checked && fieldErrors.openingTime) {
                          setFieldErrors((p) => ({
                            ...p,
                            openingTime: "",
                            closingTime: "",
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary"
                    />
                    <span>Open 24 Hours</span>
                  </label>
                </div>

                {!isOpen24Hours ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="place-opening-time"
                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Opening Time <span className="text-rose-500">*</span>
                      </label>
                      <TimePickerDropdown
                        id="place-opening-time"
                        value={openingTime}
                        onChange={(val) => {
                          setOpeningTime(val);
                          if (fieldErrors.openingTime)
                            setFieldErrors((p) => ({ ...p, openingTime: "" }));
                        }}
                        hasError={!!fieldErrors.openingTime}
                        placement="top"
                      />
                      {fieldErrors.openingTime && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} /> {fieldErrors.openingTime}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="place-closing-time"
                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Closing Time <span className="text-rose-500">*</span>
                      </label>
                      <TimePickerDropdown
                        id="place-closing-time"
                        value={closingTime}
                        onChange={(val) => {
                          setClosingTime(val);
                          if (fieldErrors.closingTime)
                            setFieldErrors((p) => ({ ...p, closingTime: "" }));
                        }}
                        hasError={!!fieldErrors.closingTime}
                        placement="top"
                      />
                      {fieldErrors.closingTime && (
                        <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={13} /> {fieldErrors.closingTime}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-2">
                    <Clock size={15} className="shrink-0" />
                    <span>This place is open 24 hours daily for visitors.</span>
                  </div>
                )}
              </div>

              {/* Entry Fee (Free Entry vs Paid Entry) */}
              <div
                ref={feeRef}
                className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Entry Fee <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryFeeType("Free Entry");
                      setEntryFeeAmount("");
                      if (fieldErrors.entryFeeAmount) {
                        setFieldErrors((p) => ({ ...p, entryFeeAmount: "" }));
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      entryFeeType === "Free Entry"
                        ? "bg-primary/10 border-primary text-slate-900 dark:text-white ring-1 ring-primary/40 shadow-xs"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>Free Entry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryFeeType("Paid Entry")}
                    className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      entryFeeType === "Paid Entry"
                        ? "bg-primary/10 border-primary text-slate-900 dark:text-white ring-1 ring-primary/40 shadow-xs"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>Paid Entry</span>
                  </button>
                </div>

                {entryFeeType === "Paid Entry" && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2 animate-in fade-in">
                    <label
                      htmlFor="entry-fee-amount-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      Admission Fee (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="entry-fee-amount-input"
                        type="number"
                        min="1"
                        step="1"
                        value={entryFeeAmount}
                        onChange={(e) => {
                          setEntryFeeAmount(e.target.value);
                          if (fieldErrors.entryFeeAmount) {
                            setFieldErrors((p) => ({
                              ...p,
                              entryFeeAmount: "",
                            }));
                          }
                        }}
                        placeholder="e.g. 20 (Adult ticket / Entry ticket)"
                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary ${
                          fieldErrors.entryFeeAmount
                            ? "border-rose-400 focus:ring-rose-400"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                    </div>
                    {fieldErrors.entryFeeAmount && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.entryFeeAmount}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Information (Optional) */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Contact Information (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="place-phone-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="place-phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone)
                            setFieldErrors((p) => ({ ...p, phone: "" }));
                        }}
                        placeholder="e.g. 044-26551234"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="place-website-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Website
                    </label>
                    <div className="relative">
                      <Globe
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="place-website-input"
                        type="url"
                        value={website}
                        onChange={(e) => {
                          setWebsite(e.target.value);
                          if (fieldErrors.website)
                            setFieldErrors((p) => ({ ...p, website: "" }));
                        }}
                        placeholder="https://example.org"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {fieldErrors.website && (
                      <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={13} /> {fieldErrors.website}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="place-official-url"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Official Information URL
                  </label>
                  <div className="relative">
                    <ExternalLink
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="place-official-url"
                      type="url"
                      value={officialUrl}
                      onChange={(e) => {
                        setOfficialUrl(e.target.value);
                        if (fieldErrors.officialUrl)
                          setFieldErrors((p) => ({ ...p, officialUrl: "" }));
                      }}
                      placeholder="https://tn.gov.in/attraction or wikipedia link"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {fieldErrors.officialUrl && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.officialUrl}
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
                  disabled={!isStep2Ready}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center space-x-2 ${
                    isStep2Ready
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
          {/* STEP 3: PHOTOS & CONFIRMATION                            */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. Main Place Cover Image (MANDATORY) */}
              <div ref={coverImageRef} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Place Cover Image <span className="text-rose-500">*</span>
                </label>

                {coverImagePreview ? (
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <img
                      src={coverImagePreview}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverFileInputRef.current?.click()}
                    className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition p-4 text-center group ${
                      fieldErrors.coverImage
                        ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-primary bg-slate-50/50 dark:bg-slate-950/50"
                    }`}
                  >
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary transition-colors mb-2">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Upload Place Cover Image *
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      High quality landscape image (JPG, PNG, WebP up to 5MB)
                    </p>
                  </div>
                )}

                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {fieldErrors.coverImage && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.coverImage}
                  </p>
                )}
              </div>

              {/* 2. Additional Place Images (OPTIONAL) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Additional Images{" "}
                      <span className="text-xs font-normal text-slate-400">
                        (Optional — up to 3 photos)
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Show entrance, landscape, attractions, amenities or scenic
                      views.
                    </p>
                  </div>

                  {additionalFiles.length < 3 && (
                    <button
                      type="button"
                      onClick={() => additionalFileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Photos ({additionalFiles.length}/3)</span>
                    </button>
                  )}
                </div>

                {additionalPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {additionalPreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group"
                      >
                        <img
                          src={preview}
                          alt={`Gallery photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition cursor-pointer"
                          aria-label="Remove photo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={additionalFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </div>

              {/* 3. Visitor Facilities & Accessibility (Grouped Selectable Cards) */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Visitor Facilities &amp; Accessibility
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select the facilities and accessibility amenities actually
                    available at this place.
                  </p>
                </div>

                <div className="space-y-4">
                  {VISITOR_FACILITY_GROUPS.map((group) => (
                    <div key={group.group} className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        {group.group}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.items.map((fac) => {
                          const isSelected = selectedFacilities.includes(
                            fac.id,
                          );
                          return (
                            <button
                              key={fac.id}
                              type="button"
                              onClick={() => toggleFacility(fac.id)}
                              className={`p-3 rounded-2xl border text-xs font-medium transition flex items-center space-x-2 text-left cursor-pointer active:scale-98 ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-2xs ring-1 ring-primary/40"
                                  : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium"
                              }`}
                            >
                              <span className="text-base shrink-0">
                                {fac.icon}
                              </span>
                              <span className="truncate">{fac.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Best Time to Visit (Multiple Choice) */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Best Time to Visit{" "}
                      <span className="text-xs font-normal text-slate-400">
                        (Multiple Choice — Select all that apply)
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Help visitors know the ideal hours, days, or seasons to visit this place.
                    </p>
                  </div>
                  {selectedBestTimes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedBestTimes([])}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                    >
                      Clear All ({selectedBestTimes.length})
                    </button>
                  )}
                </div>

                <div className="space-y-3.5">
                  {BEST_TIME_GROUPS.map((group) => (
                    <div key={group.group} className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        {group.group}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.items.map((item) => {
                          const isSelected = selectedBestTimes.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleBestTime(item.id)}
                              className={`p-2.5 rounded-2xl border text-xs font-medium transition flex items-center justify-between text-left cursor-pointer active:scale-98 ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-slate-900 dark:text-white font-bold shadow-2xs ring-1 ring-primary/40"
                                  : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-1">
                                <span className="text-base shrink-0">{item.icon}</span>
                                <div className="truncate">
                                  <p className="font-bold text-xs truncate leading-snug">{item.label}</p>
                                  {item.desc && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                                      {item.desc}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-primary border-primary text-white"
                                    : "border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Best Time write-in */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customBestTimeInput}
                      onChange={(e) => setCustomBestTimeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomBestTime();
                        }
                      }}
                      placeholder="Add custom timing (e.g. Sunset, Full Moon Day, Flower Bloom)..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBestTime}
                      disabled={!customBestTimeInput.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Display any user-added custom tags */}
                  {selectedBestTimes.filter(
                    (t) => !BEST_TIME_GROUPS.some((g) => g.items.some((i) => i.id === t)),
                  ).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedBestTimes
                        .filter(
                          (t) => !BEST_TIME_GROUPS.some((g) => g.items.some((i) => i.id === t)),
                        )
                        .map((customTag) => (
                          <span
                            key={customTag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold"
                          >
                            <span>{customTag}</span>
                            <button
                              type="button"
                              onClick={() => toggleBestTime(customTag)}
                              className="hover:text-rose-500 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Visitor Guidelines / Additional Information */}
              <div>
                <label
                  htmlFor="place-guidelines-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Visitor Guidelines &amp; Additional Information{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id="place-guidelines-input"
                  rows={3}
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  placeholder="e.g. Photography restrictions, footwear rules, entry ticket counters, parking instructions, festival days..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* 6. Review Before Submission Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  <Sparkles size={15} className="text-primary" />
                  <span>Review Place Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      Place Name &amp; Category:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {name || "—"}{" "}
                      <span className="font-semibold text-primary">
                        ({category || "—"})
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      Location &amp; Ward:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {streetArea || streetQuery || "—"}{" "}
                      {ward ? `(Ward ${ward})` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      Visiting Hours:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {isOpen24Hours
                        ? "Open 24 Hours"
                        : `${openingTime} – ${closingTime}`}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      Entry Fee:
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {entryFeeType === "Free Entry"
                        ? "Free Entry"
                        : `₹${entryFeeAmount || 0}`}
                    </p>
                  </div>

                  {selectedActivities.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[11px] block">
                        Activities:
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedActivities.join(" · ")}
                      </p>
                    </div>
                  )}

                  {selectedFacilities.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[11px] block">
                        Facilities:
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedFacilities.join(", ")}
                      </p>
                    </div>
                  )}

                  {selectedBestTimes.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[11px] block">
                        Best Time to Visit:
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedBestTimes.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Terms & Confirmation Checkbox */}
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
                    className="mt-1 w-5 h-5 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer accent-primary shrink-0"
                  />
                  <label
                    htmlFor="terms-checkbox"
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer select-none font-medium"
                  >
                    I confirm that the information, location details, timings,
                    and images provided by me for this place are accurate.
                  </label>
                </div>

                {fieldErrors.terms && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pl-8">
                    <AlertCircle size={13} /> {fieldErrors.terms}
                  </p>
                )}

                <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-8 leading-relaxed">
                  By submitting this place, you agree that your submission will
                  be reviewed by administrators before being made publicly
                  visible on Avadi Connect Explore.
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
                      <span>Submitting Place...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Post Place</span>
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
                Place submitted successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                ✅{" "}
                <span className="text-primary font-bold">
                  {name.trim() || "Your place"}
                </span>{" "}
                has been submitted and is waiting for admin review.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/explore")}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm transition cursor-pointer active:scale-98"
              >
                Back to Explore Places
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
