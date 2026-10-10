/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  X,
  Plus,
  Calendar,
  FileText,
  DollarSign,
  GraduationCap,
  Search,
  Check,
} from "lucide-react";

import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { TimePickerDropdown } from "@/components/ui/TimePickerDropdown";
import {
  ALL_AVADI_STREETS,
  StreetItem,
  AVADI_WARD_COORDINATES,
  getAvadiStreetCoordinates,
} from "@/lib/wards";
import "leaflet/dist/leaflet.css";

// Dynamically import MapLocationPicker to avoid SSR issues with Leaflet
const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs font-semibold text-slate-400">
        Loading Avadi Interactive Map...
      </div>
    ),
  }
);

// Predefined Job Categories
const JOB_CATEGORIES = [
  "IT & Software",
  "Sales & Marketing",
  "Finance & Accounting",
  "Education",
  "Healthcare",
  "Retail",
  "Hospitality",
  "Delivery & Logistics",
  "Construction",
  "Office & Administration",
  "Customer Support",
  "Skilled Trades",
  "Driving",
  "Services",
  "Other",
];

// Employment Types
const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
];

// Work Modes
const WORK_MODES = [
  { id: "On-site", label: "On-site", desc: "Work from local Avadi workplace" },
  { id: "Hybrid", label: "Hybrid", desc: "Mix of local on-site & remote work" },
  { id: "Remote", label: "Remote", desc: "Work completely from home" },
];

// Experience Options (No Fresher card)
const EXPERIENCE_OPTIONS = [
  "0–1 Years",
  "1–3 Years",
  "3–5 Years",
  "5+ Years",
];

// Salary Types
const SALARY_TYPES = ["Per Month", "Per Day", "Per Hour", "Per Year"];

// Qualifications (includes Not Required)
const QUALIFICATION_OPTIONS = [
  "Not Required",
  "10th Pass",
  "12th Pass",
  "Diploma",
  "ITI",
  "Undergraduate",
  "Graduate",
  "Postgraduate",
];

// Popular suggested skills in Avadi
const POPULAR_SKILLS = [
  "Communication",
  "Basic Computer",
  "MS Excel",
  "Customer Service",
  "Billing / Tally",
  "Two-Wheeler Driving",
  "Sales",
  "Inventory Management",
  "React / Frontend",
  "English & Tamil",
];

// Days of week
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Application Methods
const APPLICATION_METHODS = ["Phone", "Email", "Walk-in", "Website"];

// Note: AVADI_WARD_COORDINATES and getAvadiStreetCoordinates are imported from @/lib/wards

export default function PostJobVacancyPage() {
  const router = useRouter();
  const toast = useToast();
  const { activeWard, isAuthenticated, isLoadingAuth } = useWard();

  // Element references for scroll behavior & file inputs
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  // Wizard Navigation: Step 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Invalidate a completed step if its data is changed
  const invalidateStep = (stepNum: number) => {
    setCompletedSteps((prev) => prev.filter((s) => s !== stepNum));
  };

  // Authentication Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/jobs/create");
    }
  }, [isLoadingAuth, isAuthenticated, router]);

  // Scroll to top helper
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

  // Scroll directly to the first invalid field/container in the visible viewport
  const scrollToFirstError = (errorKeys: string[], delay = 60) => {
    if (!errorKeys || errorKeys.length === 0) return;

    const fieldIdMap: Record<string, string> = {
      // Step 1
      role: "field-job-title",
      category: "field-job-category",
      jobType: "field-employment-type",
      workMode: "field-work-mode",
      experience: "field-experience",
      salary: "field-salary",
      // Step 2
      businessName: "field-company-name",
      details: "field-job-description",
      skills: "field-skills",
      openings: "field-openings",
      location: "street-search-input",
      address: "field-job-address",
      workingDays: "field-working-days",
      shift: "field-working-hours",
      // Step 3
      applicationMethods: "field-application-methods",
      contact: "field-contact-phone",
      email: "field-contact-email",
      website: "field-website",
      interviewAddress: "field-interview-address",
      termsAccepted: "field-terms",
    };

    setTimeout(() => {
      for (const key of errorKeys) {
        const elId = fieldIdMap[key] || key;
        const targetEl = document.getElementById(elId);
        if (targetEl) {
          targetEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Focus first invalid input if focusable
          const focusable =
            targetEl instanceof HTMLInputElement ||
            targetEl instanceof HTMLTextAreaElement ||
            targetEl instanceof HTMLSelectElement
              ? targetEl
              : targetEl.querySelector<HTMLElement>(
                  "input, textarea, select, button"
                );

          if (focusable && typeof focusable.focus === "function") {
            setTimeout(() => {
              try {
                focusable.focus({ preventScroll: true });
              } catch {}
            }, 250);
          }
          break;
        }
      }
    }, delay);
  };

  // Switch step and scroll smoothly to the first error in that step
  const switchStepAndScrollToError = (step: 1 | 2 | 3, errorKeys: string[]) => {
    setCurrentStep(step);
    scrollToFirstError(errorKeys, 120);
  };

  // Directly navigate to public jobs page
  const handleTopBack = () => {
    router.push("/jobs");
  };

  // ==========================================
  // STEP 1 STATE: JOB PROFILE (No automatic selections)
  // ==========================================
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [experience, setExperience] = useState("");
  const [minSalary, setMinSalary] = useState<string>("");
  const [maxSalary, setMaxSalary] = useState<string>("");
  const [salaryType, setSalaryType] = useState("Per Month");
  const [customSalary, setCustomSalary] = useState("");

  // Computed display salary
  const computedSalary = useMemo(() => {
    if (customSalary.trim()) return customSalary.trim();
    if (minSalary && maxSalary) {
      const typeSuffix =
        salaryType === "Per Month"
          ? "month"
          : salaryType === "Per Day"
          ? "day"
          : salaryType === "Per Hour"
          ? "hour"
          : "year";
      return `₹${Number(minSalary).toLocaleString("en-IN")} – ₹${Number(
        maxSalary
      ).toLocaleString("en-IN")} / ${typeSuffix}`;
    }
    if (minSalary) {
      return `₹${Number(minSalary).toLocaleString("en-IN")}+ / ${salaryType.toLowerCase()}`;
    }
    return "";
  }, [minSalary, maxSalary, salaryType, customSalary]);

  // ==========================================
  // STEP 2 STATE: COMPANY & DETAILS
  // ==========================================
  const [businessName, setBusinessName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [details, setDetails] = useState("");

  // Skills
  const [skills, setSkills] = useState<string[]>([
    "Communication",
    "Customer Service",
  ]);
  const [skillInput, setSkillInput] = useState("");
  const [skillError, setSkillError] = useState("");

  // Qualifications & Openings (Initially unselected and empty)
  const [qualifications, setQualifications] = useState("");
  const [openings, setOpenings] = useState<string>("");
  const [gender, setGender] = useState("Any");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  // Location & Map
  const [streetQuery, setStreetQuery] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [selectedStreetRecord, setSelectedStreetRecord] = useState<StreetItem | null>(null);
  const [hasSearchedLocation, setHasSearchedLocation] = useState(false);
  const [mapZoom, setMapZoom] = useState(14);
  const [ward, setWard] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);

  // Default geographical center for interactive map display before street selection
  const defaultMapCenter = useMemo(() => {
    const wId = activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48 ? activeWard.id : 14;
    return AVADI_WARD_COORDINATES[wId] || { lat: 13.1169, lng: 80.0972 };
  }, [activeWard?.id]);

  // Timings & Working Days
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [startTime, setStartTime] = useState("9:00 AM");
  const [endTime, setEndTime] = useState("6:00 PM");

  // ==========================================
  // STEP 3 STATE: APPLICATION & CONFIRMATION
  // ==========================================
  const [applicationMethods, setApplicationMethods] = useState<string[]>([
    "Phone",
  ]);
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [interviewAddress, setInterviewAddress] = useState("");
  const [interviewContactPerson, setInterviewContactPerson] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00 AM");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Company / Job Poster Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Terms and Submission
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    role: string;
    businessName: string;
  } | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(event.target as Node)
      ) {
        setStreetResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Street Autocomplete Handler from authoritative municipal records (@avadi-wards.json)
  const handleStreetSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setStreetQuery(query);
    setHasSearchedLocation(true);

    // Invalidate previous selection and coordinates immediately if user alters the text
    if (selectedStreetRecord && query.trim() !== selectedStreetRecord.streetName.trim()) {
      setSelectedStreetRecord(null);
      setLatitude(null);
      setLongitude(null);
      setWard(null);
    }

    if (!query.trim()) {
      setStreetResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const prefixMatches: StreetItem[] = [];
    const otherMatches: StreetItem[] = [];

    for (const item of ALL_AVADI_STREETS) {
      const lowerName = item.streetName.toLowerCase();
      if (lowerName.startsWith(lowerQuery)) {
        prefixMatches.push(item);
      } else if (lowerName.includes(lowerQuery)) {
        otherMatches.push(item);
      }
      if (prefixMatches.length + otherMatches.length >= 25) break;
    }

    setStreetResults([...prefixMatches, ...otherMatches].slice(0, 15));
  };

  const handleSelectStreet = (item: StreetItem) => {
    setSelectedStreetRecord(item);
    setStreetQuery(item.streetName);
    setStreetResults([]);
    setWard(item.wardNo);
    setHasSearchedLocation(false);

    // Compute distinct, geographically accurate coordinates for this specific street
    const streetCoords = getAvadiStreetCoordinates(item);
    setLatitude(streetCoords.lat);
    setLongitude(streetCoords.lng);
    setMapZoom(16);
    setMapError(null);

    // Auto-fill address prefix if blank
    if (!address.trim()) {
      setAddress(`${item.streetName}, Avadi (Ward ${item.wardNo})`);
    }

    if (fieldErrors.location) {
      setFieldErrors((prev) => ({ ...prev, location: "" }));
    }
  };

  // Skill Handlers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) {
      setSkillError("Please enter a skill.");
      return;
    }
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError("This skill has already been added.");
      return;
    }
    if (skills.length >= 15) {
      setSkillError("Maximum 15 skills allowed.");
      return;
    }

    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
    setSkillError("");
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: "" }));
    }
  };

  const handleQuickAddSkill = (skill: string) => {
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    if (skills.length >= 15) return;
    setSkills((prev) => [...prev, skill]);
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: "" }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Working Days Toggles
  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) => {
      const exists = prev.includes(day);
      if (exists) {
        if (prev.length === 1) {
          toast.error("Please keep at least one working day.");
          return prev;
        }
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleQuickDays = (mode: "weekdays" | "sixdays" | "all") => {
    if (mode === "weekdays") {
      setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    } else if (mode === "sixdays") {
      setWorkingDays([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]);
    } else {
      setWorkingDays(DAYS_OF_WEEK);
    }
  };

  // Application Method Toggle
  const toggleApplicationMethod = (method: string) => {
    setApplicationMethods((prev) => {
      const exists = prev.includes(method);
      if (exists) {
        if (prev.length === 1) {
          toast.error("At least one application method is required.");
          return prev;
        }
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  };

  // ==========================================
  // VALIDATION LOGIC
  // ==========================================
  const validateStep1 = (): { isValid: boolean; errors: string[] } => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (!role.trim()) {
      errors.role = "Job Title is required.";
      errorKeys.push("role");
    } else if (role.trim().length < 2) {
      errors.role = "Job Title must be at least 2 characters.";
      errorKeys.push("role");
    }

    if (!category.trim()) {
      errors.category = "Please select a Job Category.";
      errorKeys.push("category");
    }

    if (!jobType.trim()) {
      errors.jobType = "Please select an Employment Type.";
      errorKeys.push("jobType");
    }

    if (!workMode.trim()) {
      errors.workMode = "Please select a Work Mode.";
      errorKeys.push("workMode");
    }

    if (!experience.trim()) {
      errors.experience = "Please select Experience Required.";
      errorKeys.push("experience");
    }

    if (!customSalary.trim() && !minSalary && !maxSalary) {
      errors.salary = "Please provide expected salary or pay range.";
      errorKeys.push("salary");
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return { isValid: errorKeys.length === 0, errors: errorKeys };
  };

  const handleContinueStep1 = () => {
    const result = validateStep1();
    if (result.isValid) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
      goToStep(2);
    } else {
      toast.error("Please fill in all required job profile fields.");
      scrollToFirstError(result.errors);
    }
  };

  const validateStep2 = (): { isValid: boolean; errors: string[] } => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (!businessName.trim()) {
      errors.businessName = "Company or Employer Name is required.";
      errorKeys.push("businessName");
    } else if (businessName.trim().length < 2) {
      errors.businessName = "Company Name must be at least 2 characters.";
      errorKeys.push("businessName");
    }

    if (!details.trim()) {
      errors.details = "Job Description is required.";
      errorKeys.push("details");
    } else if (details.trim().length < 10) {
      errors.details = "Job Description must be at least 10 characters.";
      errorKeys.push("details");
    }

    if (!selectedStreetRecord) {
      errors.location = "Please select a valid Avadi Area or Street from the authoritative municipal list.";
      errorKeys.push("location");
    } else if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      errors.location = "Valid location coordinates must be resolved for the selected street.";
      errorKeys.push("location");
    }

    if (!address.trim()) {
      errors.address = "Detailed Job Address is required.";
      errorKeys.push("address");
    } else if (address.trim().length < 3) {
      errors.address = "Address must be at least 3 characters.";
      errorKeys.push("address");
    }

    const trimmedOpenings = openings.trim();
    const numOpenings = parseInt(trimmedOpenings, 10);
    if (!trimmedOpenings) {
      errors.openings = "Number of vacancies is required.";
      errorKeys.push("openings");
    } else if (
      isNaN(numOpenings) ||
      !/^\d+$/.test(trimmedOpenings) ||
      numOpenings < 1
    ) {
      errors.openings = "Number of vacancies must be a whole number of at least 1.";
      errorKeys.push("openings");
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return { isValid: errorKeys.length === 0, errors: errorKeys };
  };

  const handleContinueStep2 = () => {
    const result = validateStep2();
    if (result.isValid) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
      goToStep(3);
    } else {
      toast.error("Please fill in all required company and job details.");
      scrollToFirstError(result.errors);
    }
  };

  const validateStep3 = (): { isValid: boolean; errors: string[] } => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (applicationMethods.length === 0) {
      errors.applicationMethods = "Select at least one application method.";
      errorKeys.push("applicationMethods");
    }

    if (applicationMethods.includes("Phone")) {
      const cleanPhone = contact.replace(/[^0-9]/g, "");
      if (!cleanPhone) {
        errors.contact = "Contact Phone is required when Phone application is selected.";
        errorKeys.push("contact");
      } else if (cleanPhone.length < 10) {
        errors.contact = "Contact Phone must be at least 10 digits.";
        errorKeys.push("contact");
      }
    }

    if (applicationMethods.includes("Email")) {
      if (!email.trim()) {
        errors.email = "Contact Email is required when Email application is selected.";
        errorKeys.push("email");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address.";
        errorKeys.push("email");
      }
    }

    if (applicationMethods.includes("Website")) {
      if (!website.trim()) {
        errors.website = "Website URL is required when Website application is selected.";
        errorKeys.push("website");
      } else if (!website.startsWith("http://") && !website.startsWith("https://")) {
        errors.website = "Website must start with http:// or https://";
        errorKeys.push("website");
      }
    }

    if (applicationMethods.includes("Walk-in") && !interviewAddress.trim()) {
      errors.interviewAddress = "Interview or Walk-in address is required.";
      errorKeys.push("interviewAddress");
    }

    if (!termsAccepted) {
      errors.termsAccepted = "Please accept the Terms & Conditions before posting.";
      errorKeys.push("termsAccepted");
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return { isValid: errorKeys.length === 0, errors: errorKeys };
  };

  // Final Form Submission
  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Step 1
    const s1 = validateStep1();
    if (!s1.isValid) {
      toast.error("Please review Step 1: Missing required job profile fields.");
      switchStepAndScrollToError(1, s1.errors);
      return;
    }

    // 2. Validate Step 2
    const s2 = validateStep2();
    if (!s2.isValid) {
      toast.error("Please review Step 2: Missing required company and location details.");
      switchStepAndScrollToError(2, s2.errors);
      return;
    }

    // 3. Validate Step 3
    const s3 = validateStep3();
    if (!s3.isValid) {
      toast.error("Please review Step 3: Application & Confirmation fields.");
      scrollToFirstError(s3.errors);
      return;
    }

    if (!selectedStreetRecord || latitude === null || longitude === null) {
      toast.error("Please select a valid Avadi Area or Street from the authoritative list.");
      switchStepAndScrollToError(2, ["location"]);
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("role", role.trim());
      formData.append("category", category.trim());
      formData.append("jobType", jobType.trim());
      formData.append("workMode", workMode.trim());
      formData.append("experience", experience.trim());
      formData.append("salary", computedSalary || "As per company standards");
      if (minSalary) formData.append("minSalary", minSalary);
      if (maxSalary) formData.append("maxSalary", maxSalary);
      formData.append("salaryType", salaryType);

      formData.append("businessName", businessName.trim());
      if (companyDescription.trim()) {
        formData.append("companyDescription", companyDescription.trim());
      }
      formData.append("details", details.trim());
      formData.append("requirements", JSON.stringify(skills));
      if (qualifications) formData.append("qualifications", qualifications);
      formData.append("openings", openings.toString());
      formData.append("gender", gender);
      if (minAge) formData.append("minAge", minAge);
      if (maxAge) formData.append("maxAge", maxAge);

      formData.append("location", selectedStreetRecord.streetName.trim());
      formData.append("ward", (selectedStreetRecord.wardNo || ward || 1).toString());
      formData.append("address", address.trim());
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      formData.append("workingDays", workingDays.join(", "));
      formData.append("shift", `${startTime} - ${endTime}`);

      formData.append("applicationMethods", JSON.stringify(applicationMethods));
      formData.append("contact", contact.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (website.trim()) formData.append("website", website.trim());
      if (interviewAddress.trim()) {
        formData.append("interviewAddress", interviewAddress.trim());
      }
      if (interviewContactPerson.trim()) {
        formData.append("interviewContactPerson", interviewContactPerson.trim());
      }
      if (interviewDate) formData.append("interviewDate", interviewDate);
      if (interviewTime) formData.append("interviewTime", interviewTime);
      if (deadline) formData.append("deadline", deadline);
      if (startDate) formData.append("startDate", startDate);
      if (additionalInfo.trim()) {
        formData.append("additionalInfo", additionalInfo.trim());
      }
      formData.append("termsAccepted", "true");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to submit job vacancy.");
        if (data.errors) {
          const firstErrKey = Object.keys(data.errors)[0];
          if (firstErrKey) scrollToFirstError([firstErrKey]);
        }
        return;
      }

      // Success
      setCompletedSteps([1, 2, 3]);
      setSubmittedData({
        role: role.trim(),
        businessName: businessName.trim(),
      });
      setShowSuccessModal(true);
      toast.success("Job vacancy submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setShowSuccessModal(false);
    setCompletedSteps([]);
    setRole("");
    setCategory("");
    setJobType("");
    setWorkMode("");
    setExperience("");
    setMinSalary("");
    setMaxSalary("");
    setOpenings("");
    setQualifications("");
    setBusinessName("");
    setCompanyDescription("");
    setDetails("");
    setSkills(["Communication"]);
    setCustomSalary("");
    setStreetQuery("");
    setStreetResults([]);
    setSelectedStreetRecord(null);
    setLatitude(null);
    setLongitude(null);
    setWard(null);
    setAddress("");
    setImageFile(null);
    setImagePreview(null);
    setTermsAccepted(false);
    goToStep(1);
  };

  return (
    <div
      ref={wizardTopRef}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28 md:pb-20 transition-colors"
    >
      {/* Top Header Sticky Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTopBack}
              className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Back to Jobs"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-lg bg-orange-500/10 text-orange-500">
                  <Briefcase size={16} />
                </span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Post Job Vacancy
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Direct local hiring for shops, offices, factories & businesses in Avadi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <span className="hidden sm:inline">Step</span>
            <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white font-black text-xs shadow-xs">
              {currentStep} of 3
            </span>
          </div>
        </div>
      </header>

      {/* Main Single Card Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmitJob} noValidate>
          <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl sm:shadow-2xl overflow-hidden transition-all">
            {/* ======================================================== */}
            {/* CARD HEADER: REFERENCE STEP 1 TO 3 PROGRESS INDICATOR */}
            {/* ======================================================== */}
            <div className="p-6 sm:p-8 bg-[#0b1120] text-white border-b border-slate-800/80 relative overflow-hidden">
              {/* Subtle ambient lighting */}
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/4 -bottom-16 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* 3-Segment Horizontal Progress Bars (Completed = Green, Active = Orange, Incomplete = Slate) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-4 relative z-10">
                {[1, 2, 3].map((step) => {
                  const isCompleted = completedSteps.includes(step);
                  const isCurrent = currentStep === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        if (step === 1) goToStep(1);
                        else if (step === 2) {
                          if (completedSteps.includes(1) || validateStep1().isValid) goToStep(2);
                          else handleContinueStep1();
                        } else if (step === 3) {
                          const s1 = validateStep1();
                          if (!s1.isValid) {
                            switchStepAndScrollToError(1, s1.errors);
                            return;
                          }
                          const s2 = validateStep2();
                          if (!s2.isValid) {
                            switchStepAndScrollToError(2, s2.errors);
                            return;
                          }
                          goToStep(3);
                        }
                      }}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                          : isCurrent
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
                          : "bg-slate-800 hover:bg-slate-700/80"
                      }`}
                      aria-label={`Step ${step} ${isCompleted ? "(Completed)" : isCurrent ? "(Current)" : ""}`}
                      title={`Step ${step} ${isCompleted ? "(Completed)" : isCurrent ? "(Current)" : ""}`}
                    />
                  );
                })}
              </div>

              {/* Reference UI Step Label: STEP 1 OF 3 */}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black tracking-wider text-orange-500 uppercase">
                    STEP {currentStep} OF 3
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {currentStep === 1
                      ? "Job Profile & Pay"
                      : currentStep === 2
                      ? "Company & Location"
                      : "Application & Review"}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  {currentStep === 1 && "Define Job Profile & Remuneration"}
                  {currentStep === 2 && "Company, Workplace & Requirements"}
                  {currentStep === 3 && "Application Methods & Final Review"}
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                  {currentStep === 1 &&
                    "Specify the role title, category, employment type, and expected salary range to attract qualified Avadi candidates."}
                  {currentStep === 2 &&
                    "Provide your business name, role duties, required skills, and pin your workplace on the interactive Avadi map."}
                  {currentStep === 3 &&
                    "Choose how applicants should contact you, set deadlines, upload optional logos/posters, and confirm submission."}
                </p>
              </div>
            </div>

            {/* ======================================================== */}
            {/* STEP 1: JOB PROFILE & REMUNERATION */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <>
                <div className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* 1. Job Title */}
                  <div id="field-job-title" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="job-title-input"
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5"
                      >
                        <span>Job Title / Role</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        e.g. Sales Executive, Cashier, Driver
                      </span>
                    </div>
                    <input
                      id="job-title-input"
                      type="text"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        invalidateStep(1);
                        if (fieldErrors.role) {
                          setFieldErrors((prev) => ({ ...prev, role: "" }));
                        }
                      }}
                      placeholder="e.g. Billing Executive & Store Assistant"
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                        fieldErrors.role
                          ? "border-rose-500 ring-1 ring-rose-500/30"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.role && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.role}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 self-center mr-1">
                        Suggestions:
                      </span>
                      {[
                        "Billing Cashier",
                        "Delivery Executive",
                        "Sales Associate",
                        "Office Assistant",
                        "Accountant",
                        "Store In-charge",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setRole(s);
                            invalidateStep(1);
                            if (fieldErrors.role) {
                              setFieldErrors((prev) => ({ ...prev, role: "" }));
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Job Category */}
                  <div id="field-job-category" className="pt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Job Category</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Single selection
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1 rounded-2xl ${
                      fieldErrors.category ? "ring-2 ring-rose-500/40" : ""
                    }`}>
                      {JOB_CATEGORIES.map((cat) => {
                        const isSelected = category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCategory(cat);
                              invalidateStep(1);
                              if (fieldErrors.category) {
                                setFieldErrors((prev) => ({ ...prev, category: "" }));
                              }
                            }}
                            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                                : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40"
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isSelected && <Check size={14} className="stroke-3 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.category && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.category}</span>
                      </p>
                    )}
                  </div>

                  {/* 3. Employment Type & Work Mode */}
                  <div className="pt-8 space-y-6">
                    {/* Employment Type */}
                    <div id="field-employment-type" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Employment Type</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Select one option
                        </span>
                      </div>

                      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1 rounded-2xl ${
                        fieldErrors.jobType ? "ring-2 ring-rose-500/40" : ""
                      }`}>
                        {EMPLOYMENT_TYPES.map((type) => {
                          const isSelected = jobType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setJobType(type);
                                invalidateStep(1);
                                if (fieldErrors.jobType) {
                                  setFieldErrors((prev) => ({ ...prev, jobType: "" }));
                                }
                              }}
                              className={`py-3 px-3.5 rounded-2xl border text-xs font-extrabold text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40"
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {fieldErrors.jobType && (
                        <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{fieldErrors.jobType}</span>
                        </p>
                      )}
                    </div>

                    {/* Work Mode */}
                    <div id="field-work-mode" className="space-y-3">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Work Mode</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>

                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1 rounded-2xl ${
                        fieldErrors.workMode ? "ring-2 ring-rose-500/40" : ""
                      }`}>
                        {WORK_MODES.map((mode) => {
                          const isSelected = workMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => {
                                setWorkMode(mode.id);
                                invalidateStep(1);
                                if (fieldErrors.workMode) {
                                  setFieldErrors((prev) => ({ ...prev, workMode: "" }));
                                }
                              }}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black">{mode.label}</span>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {mode.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      {fieldErrors.workMode && (
                        <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{fieldErrors.workMode}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4. Experience Required */}
                  <div id="field-experience" className="pt-8 space-y-3">
                    <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Experience Required</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>

                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl ${
                      fieldErrors.experience ? "ring-2 ring-rose-500/40" : ""
                    }`}>
                      {EXPERIENCE_OPTIONS.map((exp) => {
                        const isSelected = experience === exp;
                        return (
                          <button
                            key={exp}
                            type="button"
                            onClick={() => {
                              setExperience(exp);
                              invalidateStep(1);
                              if (fieldErrors.experience) {
                                setFieldErrors((prev) => ({ ...prev, experience: "" }));
                              }
                            }}
                            className={`py-2.5 px-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40"
                            }`}
                          >
                            {exp}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.experience && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.experience}</span>
                      </p>
                    )}
                  </div>

                  {/* 5. Salary / Pay Range */}
                  <div id="field-salary" className="pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <DollarSign size={16} className="text-orange-500" />
                        <span>Salary / Pay Range</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Indian Rupee (₹)
                      </span>
                    </div>

                    {/* Salary Frequency / Type */}
                    <div className="flex flex-wrap gap-2">
                      {SALARY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSalaryType(type);
                            invalidateStep(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            salaryType === type
                              ? "bg-orange-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Min / Max Salary Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Minimum (₹)
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={minSalary}
                          onChange={(e) => {
                            setMinSalary(e.target.value);
                            invalidateStep(1);
                            if (fieldErrors.salary) {
                              setFieldErrors((prev) => ({ ...prev, salary: "" }));
                            }
                          }}
                          placeholder="e.g. 15000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                          Maximum (₹)
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={maxSalary}
                          onChange={(e) => {
                            setMaxSalary(e.target.value);
                            invalidateStep(1);
                            if (fieldErrors.salary) {
                              setFieldErrors((prev) => ({ ...prev, salary: "" }));
                            }
                          }}
                          placeholder="e.g. 25000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {fieldErrors.salary && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.salary}</span>
                      </p>
                    )}

                    {/* Displayed preview */}
                    {computedSalary && (
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          Formatted Preview:
                        </span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                          {computedSalary}
                        </span>
                      </div>
                    )}

                    {/* Or Custom Salary */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Or enter custom salary description (optional):
                      </label>
                      <input
                        type="text"
                        value={customSalary}
                        onChange={(e) => {
                          setCustomSalary(e.target.value);
                          invalidateStep(1);
                          if (fieldErrors.salary) {
                            setFieldErrors((prev) => ({ ...prev, salary: "" }));
                          }
                        }}
                        placeholder="e.g. ₹8,000 + Daily Petrol Allowance or Negotiable"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Step 1 Actions */}
                <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTopBack}
                    className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueStep1}
                    className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-95"
                  >
                    <span>Continue to Step 2</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* STEP 2: COMPANY & WORKPLACE DETAILS */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <>
                <div className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* 1. Company Name */}
                  <div id="field-company-name" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="company-name-input"
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5"
                      >
                        <span>Company / Business / Shop Name</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        e.g. Sri Balaji Supermarket
                      </span>
                    </div>
                    <input
                      id="company-name-input"
                      type="text"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        if (fieldErrors.businessName) {
                          setFieldErrors((prev) => ({ ...prev, businessName: "" }));
                        }
                      }}
                      placeholder="e.g. ABC Technologies / Sri Lakshmi Traders"
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                        fieldErrors.businessName
                          ? "border-rose-500 ring-1 ring-rose-500/30"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.businessName && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.businessName}</span>
                      </p>
                    )}
                  </div>

                  {/* 2. Company Description */}
                  <div className="pt-8 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Company Description (Optional)
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Brief company overview
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Briefly describe what your business does, your industry, or store focus..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* 3. Job Description */}
                  <div id="field-job-description" className="pt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="job-description-input"
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5"
                      >
                        <span>Job Description & Responsibilities</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Min 10 characters
                      </span>
                    </div>
                    <textarea
                      id="job-description-input"
                      rows={4}
                      value={details}
                      onChange={(e) => {
                        setDetails(e.target.value);
                        if (fieldErrors.details) {
                          setFieldErrors((prev) => ({ ...prev, details: "" }));
                        }
                      }}
                      placeholder="Describe the day-to-day duties, work timing, customer interactions, software usage, or responsibilities..."
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                        fieldErrors.details
                          ? "border-rose-500 ring-1 ring-rose-500/30"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.details && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.details}</span>
                      </p>
                    )}
                  </div>

                  {/* 4. Required Skills */}
                  <div id="field-skills" className="pt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Required Skills</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {skills.length} added
                      </span>
                    </div>

                    {/* Skill input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          if (skillError) setSkillError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Type skill & press Add (e.g. MS Excel)"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    {skillError && (
                      <p className="text-[11px] font-bold text-rose-500">
                        {skillError}
                      </p>
                    )}

                    {/* Active Skills Chips */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-xs"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1.5 text-orange-600/60 dark:text-orange-400/60 hover:text-rose-500 p-0.5 rounded-full cursor-pointer transition"
                              aria-label={`Remove ${skill}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested skills quick add */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                        Quick Add Common Avadi Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SKILLS.map((item) => {
                          const alreadyAdded = skills.some(
                            (s) => s.toLowerCase() === item.toLowerCase()
                          );
                          if (alreadyAdded) return null;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleQuickAddSkill(item)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer"
                            >
                              + {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 5. Qualifications & Openings & Demographics */}
                  <div className="pt-8 space-y-4">
                    {/* Qualifications */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <GraduationCap size={16} className="text-orange-500" />
                          <span>Minimum Qualification</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {QUALIFICATION_OPTIONS.map((q) => {
                          const isSelected = qualifications === q;
                          return (
                            <button
                              key={q}
                              type="button"
                              onClick={() => {
                                setQualifications((prev) => (prev === q ? "" : q));
                                invalidateStep(2);
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-orange-500/40"
                              }`}
                            >
                              {q}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Openings and Gender and Age */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      {/* Number of Openings */}
                      <div id="field-openings">
                        <label
                          htmlFor="openings-input"
                          className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 mb-1.5"
                        >
                          <span>Number of Vacancies</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          id="openings-input"
                          type="number"
                          min={1}
                          value={openings}
                          onChange={(e) => {
                            setOpenings(e.target.value);
                            invalidateStep(2);
                            if (fieldErrors.openings) {
                              setFieldErrors((prev) => ({ ...prev, openings: "" }));
                            }
                          }}
                          placeholder="Enter number of openings"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                            fieldErrors.openings
                              ? "border-rose-500 ring-1 ring-rose-500/30"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        />
                        {fieldErrors.openings && (
                          <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>{fieldErrors.openings}</span>
                          </p>
                        )}
                      </div>

                      {/* Gender Requirement */}
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-white block mb-1.5">
                          Gender Requirement
                        </label>
                        <div className="flex gap-1.5">
                          {["Any", "Male", "Female"].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGender(g)}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                                gender === g
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Age Range */}
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-white block mb-1.5">
                          Age Range (Optional)
                        </label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            min={18}
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                            placeholder="Min 18"
                            className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-center"
                          />
                          <span className="text-xs text-slate-400 font-bold">–</span>
                          <input
                            type="number"
                            max={70}
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                            placeholder="Max"
                            className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Location: Area / Street & Map */}
                  <div className="pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin size={16} className="text-orange-500" />
                        <span>Area / Street Location in Avadi</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {selectedStreetRecord ? `Avadi Ward ${selectedStreetRecord.wardNo} (Auto-derived)` : "Select from Municipal Records"}
                      </span>
                    </div>

                    {/* Street autocomplete input */}
                    <div ref={locationContainerRef} className="relative">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Search size={16} />
                        </span>
                        <input
                          id="street-search-input"
                          type="text"
                          value={streetQuery}
                          onChange={handleStreetSearch}
                          placeholder="Search street, colony, or area in Avadi (e.g. CTH Road, Kamaraj Nagar)..."
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                            fieldErrors.location
                              ? "border-rose-500 ring-1 ring-rose-500/30"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        />
                      </div>

                      {/* Autocomplete dropdown */}
                      {streetResults.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                          {streetResults.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectStreet(item)}
                              className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-orange-500/10 hover:text-orange-500 transition flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{item.streetName}</span>
                              <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-2">
                                Ward {item.wardNo}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No match notice */}
                      {hasSearchedLocation &&
                        streetQuery.trim().length >= 2 &&
                        streetResults.length === 0 &&
                        !selectedStreetRecord && (
                          <div className="absolute z-50 left-0 right-0 mt-1 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0 text-amber-500" />
                            <span>
                              No matching Avadi location found in authoritative municipal records. Please select from the suggestions.
                            </span>
                          </div>
                        )}

                      {/* Selected street confirmation badge */}
                      {selectedStreetRecord && (
                        <div className="mt-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {selectedStreetRecord.streetName}
                            </span>
                            <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                              Ward {selectedStreetRecord.wardNo}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStreetRecord(null);
                              setStreetQuery("");
                              setStreetResults([]);
                              setLatitude(null);
                              setLongitude(null);
                              setWard(null);
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                            title="Clear selection"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {fieldErrors.location && (
                        <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{fieldErrors.location}</span>
                        </p>
                      )}
                    </div>

                    {/* Interactive Map */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500">
                          Pinpoint Location Marker (Drag marker or click to refine)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {latitude !== null && longitude !== null
                            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                            : "Waiting for street selection"}
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <MapLocationPicker
                          defaultLat={latitude ?? defaultMapCenter.lat}
                          defaultLng={longitude ?? defaultMapCenter.lng}
                          zoom={mapZoom}
                          onLocationSelect={(lat, lng) => {
                            if (selectedStreetRecord) {
                              setLatitude(lat);
                              setLongitude(lng);
                              setMapError(null);
                            }
                          }}
                          onError={(msg) => setMapError(msg)}
                        />
                      </div>
                      {mapError && (
                        <p className="text-[10px] text-amber-500 font-semibold">
                          {mapError}
                        </p>
                      )}
                    </div>

                    {/* Detailed Job Address */}
                    <div id="field-job-address" className="space-y-1.5">
                      <label
                        htmlFor="job-address-input"
                        className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1"
                      >
                        <span>Detailed Job Address</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <textarea
                        id="job-address-input"
                        rows={2}
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (fieldErrors.address) {
                            setFieldErrors((prev) => ({ ...prev, address: "" }));
                          }
                        }}
                        placeholder="Door no, Building / Complex name, Landmark, Street, Area, Avadi"
                        className={`w-full px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                          fieldErrors.address
                            ? "border-rose-500 ring-1 ring-rose-500/30"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {fieldErrors.address && (
                        <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{fieldErrors.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 7. Working Days & Working Hours */}
                  <div className="pt-8 space-y-4">
                    {/* Working Days */}
                    <div id="field-working-days" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Clock size={16} className="text-orange-500" />
                          <span>Working Days</span>
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickDays("sixdays")}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition cursor-pointer"
                          >
                            Mon–Sat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDays("weekdays")}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition cursor-pointer"
                          >
                            Mon–Fri
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickDays("all")}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition cursor-pointer"
                          >
                            All 7 Days
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleWorkingDay(day)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Working Hours (12-Hour AM/PM Timepicker) */}
                    <div id="field-working-hours" className="pt-2">
                      <label className="text-xs font-black text-slate-900 dark:text-white block mb-2">
                        Shift Timings (12-Hour AM/PM format)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">
                            Shift Start Time
                          </span>
                          <TimePickerDropdown
                            id="job-start-time"
                            value={startTime}
                            onChange={(t) => setStartTime(t)}
                            placement="top"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">
                            Shift End Time
                          </span>
                          <TimePickerDropdown
                            id="job-end-time"
                            value={endTime}
                            onChange={(t) => setEndTime(t)}
                            placement="top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Step 2 Actions */}
                <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Step 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueStep2}
                    className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-95"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* STEP 3: APPLICATION & CONFIRMATION */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <>
                <div className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* 1. Application Methods */}
                  <div id="field-application-methods" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>How can applicants apply?</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Select all that apply
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {APPLICATION_METHODS.map((method) => {
                        const isSelected = applicationMethods.includes(method);
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => toggleApplicationMethod(method)}
                            className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span>{method}</span>
                            {isSelected && <Check size={14} className="stroke-3" />}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.applicationMethods && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{fieldErrors.applicationMethods}</span>
                      </p>
                    )}
                  </div>

                  {/* 2. Contact Phone & Email & Website Inputs */}
                  <div className="pt-8 space-y-4">
                    {/* Phone */}
                    {applicationMethods.includes("Phone") && (
                      <div id="field-contact-phone" className="space-y-1.5">
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Phone size={14} className="text-orange-500" />
                          <span>Contact Phone Number</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          value={contact}
                          onChange={(e) => {
                            setContact(e.target.value);
                            if (fieldErrors.contact) {
                              setFieldErrors((prev) => ({ ...prev, contact: "" }));
                            }
                          }}
                          placeholder="e.g. 9876543210 (10-digit mobile number)"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                            fieldErrors.contact
                              ? "border-rose-500 ring-1 ring-rose-500/30"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        />
                        {fieldErrors.contact && (
                          <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>{fieldErrors.contact}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Email */}
                    {applicationMethods.includes("Email") && (
                      <div id="field-contact-email" className="space-y-1.5">
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Mail size={14} className="text-orange-500" />
                          <span>Application Email Address</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({ ...prev, email: "" }));
                            }
                          }}
                          placeholder="e.g. jobs@abctech.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
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
                    )}

                    {/* Website */}
                    {applicationMethods.includes("Website") && (
                      <div id="field-website" className="space-y-1.5">
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Globe size={14} className="text-orange-500" />
                          <span>Application Website / Careers URL</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => {
                            setWebsite(e.target.value);
                            if (fieldErrors.website) {
                              setFieldErrors((prev) => ({ ...prev, website: "" }));
                            }
                          }}
                          placeholder="e.g. https://abctech.com/careers"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                            fieldErrors.website
                              ? "border-rose-500 ring-1 ring-rose-500/30"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        />
                        {fieldErrors.website && (
                          <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                            <AlertCircle size={12} />
                            <span>{fieldErrors.website}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Walk-in Info */}
                    {applicationMethods.includes("Walk-in") && (
                      <div id="field-interview-address" className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building size={14} className="text-orange-500" />
                          <span>Walk-in / Interview Address</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={interviewAddress}
                          onChange={(e) => {
                            setInterviewAddress(e.target.value);
                            if (fieldErrors.interviewAddress) {
                              setFieldErrors((prev) => ({ ...prev, interviewAddress: "" }));
                            }
                          }}
                          placeholder="Venue for walk-in interview (e.g. 2nd Floor, Sri Balaji Tower, Market Road, Avadi)"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                              Contact Person (Optional)
                            </span>
                            <input
                              type="text"
                              value={interviewContactPerson}
                              onChange={(e) => setInterviewContactPerson(e.target.value)}
                              placeholder="e.g. Mr. Ramesh (Store Manager)"
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                              Walk-in Date (Optional)
                            </span>
                            <input
                              type="date"
                              value={interviewDate}
                              onChange={(e) => setInterviewDate(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                              Timing Window (Optional)
                            </span>
                            <input
                              type="text"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                              placeholder="e.g. 10:00 AM - 1:00 PM"
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Deadlines & Dates */}
                  <div className="pt-8 space-y-3">
                    <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar size={16} className="text-orange-500" />
                      <span>Important Dates (Optional)</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          Last Date to Apply (Deadline)
                        </span>
                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          Expected Joining Date
                        </span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Company Logo / Job Poster Image (Optional) */}
                  <div className="pt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UploadCloud size={16} className="text-orange-500" />
                        <span>Company Logo or Job Poster (Optional)</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Max 5MB (JPG, PNG, WebP)
                      </span>
                    </div>

                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {!imagePreview ? (
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        className="w-full py-7 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-orange-500/50 hover:bg-orange-500/5 transition cursor-pointer"
                      >
                        <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                          <UploadCloud size={24} />
                        </div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                          Upload Logo or Hiring Poster
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Click to browse image files
                        </span>
                      </button>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-xs">
                        <img
                          src={imagePreview}
                          alt="Job Poster Preview"
                          className="w-full h-44 object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition cursor-pointer"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. Additional Notes */}
                  <div className="pt-8 space-y-2">
                    <label className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Perks, bonuses, food/accommodation provided, transportation, or other notes..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* 6. Review Before Submit Summary Box */}
                  <div className="pt-8 space-y-4">
                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="p-1.5 rounded-xl bg-orange-500 text-white">
                          <FileText size={16} />
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Review Vacancy Before Posting
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            Summary of details that will be submitted for admin verification
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 space-y-0.5 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Job Role
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {role || "—"}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 space-y-0.5 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Company
                          </span>
                          <span className="font-black text-orange-500">
                            {businessName || "—"}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 space-y-0.5 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Type & Work Mode
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {jobType} • {workMode}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 space-y-0.5 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Experience
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {experience}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 space-y-0.5 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                            Offered Salary
                          </span>
                          <span className="font-black text-emerald-700 dark:text-emerald-300">
                            {computedSalary || "As per company standards"}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 space-y-0.5 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Location in Avadi
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                            {selectedStreetRecord ? `${selectedStreetRecord.streetName} (Ward ${selectedStreetRecord.wardNo})` : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Skills tags preview */}
                      {skills.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">
                            Skills:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {skills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 7. Terms & Conditions acceptance */}
                  <div id="field-terms" className="pt-8">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => {
                            setTermsAccepted(e.target.checked);
                            if (fieldErrors.termsAccepted) {
                              setFieldErrors((prev) => ({ ...prev, termsAccepted: "" }));
                            }
                          }}
                          className="mt-1 w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          I confirm that this job vacancy is genuine, located in or near Avadi, follows fair employment practices, and I am authorized to represent{" "}
                          <span className="font-bold text-slate-900 dark:text-white">
                            {businessName || "this employer"}
                          </span>
                          .
                        </span>
                      </label>
                      {fieldErrors.termsAccepted && (
                        <p className="text-[11px] font-bold text-rose-500 mt-2 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{fieldErrors.termsAccepted}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Step 3 Actions */}
                <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Step 2</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/25 cursor-pointer disabled:opacity-60 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting Vacancy...</span>
                      </>
                    ) : (
                      <>
                        <Briefcase size={16} />
                        <span>Post Job Vacancy</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </main>

      {/* ======================================================== */}
      {/* SUCCESS CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showSuccessModal && submittedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Job Vacancy Submitted!
              </h3>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 leading-snug">
                ✅ {submittedData.role} at {submittedData.businessName} has been submitted and is waiting for admin review.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Once reviewed by the municipal moderator, your posting will appear live on the Avadi Local Job Vacancies board.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Post Another
              </button>

              <button
                type="button"
                onClick={() => router.push("/jobs")}
                className="py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-xs font-black text-white shadow-md transition cursor-pointer"
              >
                View All Jobs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
