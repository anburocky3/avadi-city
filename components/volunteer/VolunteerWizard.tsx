"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  User,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  FileText,
  MapPin,
  Calendar,
  Lock,
  Loader2,
} from "lucide-react";
import { FormField } from "./FormField";
import { ChipSelect } from "./ChipSelect";
import { ToggleSwitch } from "./ToggleSwitch";
import { ReviewCard } from "./ReviewCard";
import { StatusBadge } from "./StatusBadge";
import { Card } from "@/components/shared-components";
import { VolunteerAdvisoryModal } from "./VolunteerAdvisoryModal";
import {
  Volunteer,
  VolunteerFormData,
  ExperienceLevel,
  VehicleType,
  AvailabilityType,
  TravelRadius,
} from "@/types/volunteer";
import {
  validateVolunteerStep1,
  validateVolunteerStep2,
  validateVolunteerStep3,
  validateVolunteerStep4,
  cleanPhoneNumber,
} from "@/utils/validators";
import volunteerService from "@/services/volunteerService";
import toast from "@/utils/toast";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

const INTEREST_OPTIONS = [
  "Disaster Relief",
  "Teaching Kids",
  "Animal Rescue",
  "Clean-up Drives",
  "Blood Donation",
  "Elderly Care",
  "Medical First Aid",
  "Tree Plantation",
  "Food Distribution",
  "Traffic/Crowd Management",
  "Event Support",
];

const SKILL_OPTIONS = [
  "First Aid/CPR",
  "Driving",
  "Teaching",
  "Medical/Nursing",
  "Cooking",
  "Photography",
  "Tech/IT",
  "Counselling",
  "Construction/Repair",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const LANGUAGES = ["Tamil", "English", "Hindi", "Telugu"];

export interface VolunteerWizardProps {
  authUser: any;
  activeWardId?: number;
  initialData?: Volunteer | null; // For editing existing profile
  onComplete: (volunteer: Volunteer) => void;
  onCancel?: () => void;
}

export const VolunteerWizard: React.FC<VolunteerWizardProps> = ({
  authUser,
  activeWardId,
  initialData,
  onComplete,
  onCancel,
}) => {
  // Compute profile age & DOB
  const computedAge = useMemo(() => {
    if (initialData?.age) return initialData.age;
    if (authUser?.dob) {
      const birth = new Date(authUser.dob);
      if (!isNaN(birth.getTime())) {
        const diff = Date.now() - birth.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }
    return 24; // sensible default if not set
  }, [authUser?.dob, initialData?.age]);

  const resolvedWard =
    initialData?.ward || authUser?.wardNumber || activeWardId || 14;

  const resolvedName =
    initialData?.fullName || authUser?.name || "Avadi Citizen";

  const resolvedGender =
    initialData?.gender || authUser?.gender || "Not Specified";

  // Step state: 1 to 4, 5 = Review, 6 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [createdVolunteer, setCreatedVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState<boolean>(!initialData);
  const wizardTopRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll to the top of the wizard / main viewport
  const scrollToWizardTop = () => {
    if (wizardTopRef.current) {
      wizardTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const mainEl = document.querySelector("main") || document.querySelector(".overflow-y-auto");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scroll to top whenever step changes
  useEffect(() => {
    scrollToWizardTop();
  }, [currentStep]);

  // Form State
  const [formData, setFormData] = useState<VolunteerFormData>(() => {
    // If editing existing
    if (initialData) {
      return {
        userId: initialData.userId,
        fullName: initialData.fullName,
        ward: initialData.ward,
        gender: initialData.gender,
        age: initialData.age,
        dob: initialData.dob,
        contact: { ...initialData.contact },
        emergencyContact: { ...initialData.emergencyContact },
        languages: [...initialData.languages],
        interests: [...initialData.interests],
        skills: [...initialData.skills],
        otherSkill: initialData.otherSkill || "",
        experience: initialData.experience,
        bio: initialData.bio || "",
        vehicle: initialData.vehicle,
        availability: { ...initialData.availability },
        health: { ...initialData.health },
        guardian: initialData.guardian ? { ...initialData.guardian } : null,
        consents: { ...initialData.consents },
      };
    }

    // Try draft restore from localStorage
    const savedDraft = volunteerService.getDraft();
    if (savedDraft && savedDraft.userId === (authUser?.id || "guest")) {
      return savedDraft;
    }

    // Initial default state
    return {
      userId: authUser?.id || "user-avadi-citizen",
      fullName: resolvedName,
      ward: resolvedWard,
      gender: resolvedGender,
      age: computedAge,
      dob: authUser?.dob || "",
      contact: {
        mobile: authUser?.phone ? cleanPhoneNumber(authUser.phone) : "",
        whatsapp: authUser?.phone ? cleanPhoneNumber(authUser.phone) : "",
        area: authUser?.streetName || "",
        showPhonePublic: false,
      },
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      languages: ["Tamil", "English"],
      interests: [],
      skills: [],
      otherSkill: "",
      experience: "Beginner" as ExperienceLevel,
      bio: "",
      vehicle: "None" as VehicleType,
      availability: {
        days: ["Sat", "Sun"],
        slots: ["Morning", "Evening"],
        type: "Weekends only" as AvailabilityType,
        radius: "My ward only" as TravelRadius,
      },
      health: {
        bloodGroup: authUser?.bloodGroup || "O+",
        willDonateBlood: true,
        lastDonation: "",
        fitness: "Yes",
        conditions: "",
      },
      guardian:
        computedAge < 18
          ? {
              name: "",
              consent: false,
            }
          : null,
      consents: {
        conduct: false,
        directory: false,
        truthful: false,
      },
    };
  });

  const [sameAsMobile, setSameAsMobile] = useState<boolean>(
    formData.contact.mobile === formData.contact.whatsapp &&
      formData.contact.mobile.length > 0,
  );

  // Field errors for active step
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Street Autocomplete dropdown state
  const [showStreetDropdown, setShowStreetDropdown] = useState<boolean>(false);
  const streetInputRef = useRef<HTMLDivElement>(null);

  // Close street dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        streetInputRef.current &&
        !streetInputRef.current.contains(e.target as Node)
      ) {
        setShowStreetDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const streetMatches = useMemo(() => {
    const q = (formData.contact.area || "").trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const matches: StreetItem[] = [];
    const seen = new Set<string>();

    for (const item of ALL_AVADI_STREETS) {
      if (item.streetName.toLowerCase().includes(q)) {
        const key = `${item.streetName.toLowerCase()}-${item.wardNo}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push(item);
          if (matches.length >= 25) break;
        }
      }
    }
    return matches;
  }, [formData.contact.area]);

  const handleSelectStreet = (street: StreetItem) => {
    setFormData((prev) => ({
      ...prev,
      ward: street.wardNo,
      contact: {
        ...prev.contact,
        area: street.streetName,
      },
    }));
    setShowStreetDropdown(false);
    if (errors.area) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.area;
        return next;
      });
    }
  };

  // Autosave draft on formData change (unless completed or editing)
  useEffect(() => {
    if (!initialData && currentStep <= 5) {
      volunteerService.saveDraft(formData);
    }
  }, [formData, initialData, currentStep]);

  // Sync WhatsApp when "Same as Mobile" is checked
  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        mobile: cleaned,
        whatsapp: sameAsMobile ? cleaned : prev.contact.whatsapp,
      },
    }));
  };

  const handleSameAsMobileToggle = (checked: boolean) => {
    setSameAsMobile(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        contact: {
          ...prev.contact,
          whatsapp: prev.contact.mobile,
        },
      }));
    }
  };

  // Step Validators
  const stepValidation = useMemo(() => {
    switch (currentStep) {
      case 1:
        return validateVolunteerStep1(formData);
      case 2:
        return validateVolunteerStep2(formData);
      case 3:
        return validateVolunteerStep3(formData);
      case 4:
        return validateVolunteerStep4(formData);
      default:
        return { isValid: true, errors: {} };
    }
  }, [currentStep, formData]);

  const scrollToFirstError = (errorObj: Record<string, string>) => {
    const errorKeys = Object.keys(errorObj);
    if (!errorKeys || errorKeys.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      for (const key of errorKeys) {
        targetEl = document.querySelector<HTMLElement>(
          `[data-field="${key}"], [name="${key}"], #${key}, #vol-${key}`
        );
        if (targetEl) break;
      }

      if (!targetEl) {
        targetEl = document.querySelector<HTMLElement>(
          '.border-rose-500, [aria-invalid="true"]'
        );
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          if (
            targetEl &&
            (targetEl instanceof HTMLInputElement ||
              targetEl instanceof HTMLTextAreaElement ||
              targetEl instanceof HTMLSelectElement)
          ) {
            targetEl.focus({ preventScroll: true });
          }
        }, 120);
      } else {
        scrollToWizardTop();
      }
    }, 40);
  };

  const handleNextStep = () => {
    const res = stepValidation;
    if (!res.isValid) {
      setErrors(res.errors);
      toast.error("Please resolve the required fields before continuing.");
      scrollToFirstError(res.errors);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => prev + 1);
    scrollToWizardTop();
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    scrollToWizardTop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all steps
    const s1 = validateVolunteerStep1(formData);
    const s2 = validateVolunteerStep2(formData);
    const s3 = validateVolunteerStep3(formData);
    const s4 = validateVolunteerStep4(formData);

    if (!s1.isValid || !s2.isValid || !s3.isValid || !s4.isValid) {
      const allErrors = {
        ...s1.errors,
        ...s2.errors,
        ...s3.errors,
        ...s4.errors,
      };
      setErrors(allErrors);
      if (!s1.isValid && currentStep !== 1) setCurrentStep(1);
      else if (!s2.isValid && currentStep !== 2 && s1.isValid) setCurrentStep(2);
      else if (!s3.isValid && currentStep !== 3 && s1.isValid && s2.isValid) setCurrentStep(3);
      else if (!s4.isValid && currentStep !== 4) setCurrentStep(4);
      toast.error("Please verify all sections have valid required information.");
      scrollToFirstError(allErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let saved: Volunteer;
      if (initialData?.id) {
        saved = await volunteerService.updateAsync(initialData.id, formData);
        toast.success("Volunteer profile successfully updated in database!");
      } else {
        saved = await volunteerService.createAsync({
          ...formData,
          status: "pending",
        });
        toast.success("Registration submitted! Awaiting admin approval in database.");
      }
      setCreatedVolunteer(saved);
      setCurrentStep(6); // Success screen
      if (onComplete) {
        onComplete(saved);
      }
    } catch (err: any) {
      console.error("Volunteer registration error:", err);
      toast.error(err?.message || "Failed to submit volunteer registration to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { id: 1, title: "Personal" },
    { id: 2, title: "Interests" },
    { id: 3, title: "Availability" },
    { id: 4, title: "Consent" },
    { id: 5, title: "Review" },
  ];

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (currentStep === 6 && createdVolunteer) {
    const isPending =
      (createdVolunteer.status || "").trim().toLowerCase() === "pending";

    return (
      <Card className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 max-w-xl mx-auto shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border-4 border-amber-100 dark:border-amber-900/40">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-widest text-amber-700 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            {isPending ? "Awaiting Admin Approval" : "Registration Active"}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
            {isPending
              ? "Registration Submitted to Database!"
              : "Welcome to the Avadi Volunteer Force!"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {isPending
              ? "Your volunteer application has been recorded in the database. Once approved by the admin, your profile card will be displayed in the public Citizens Directory."
              : "Your volunteer details are live. Fellow residents and ward coordinators can connect with you for civic drives and relief work."}
          </p>
        </div>

        {/* Volunteer Identity Badge */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-950 dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 rounded-3xl text-left space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Citizen Volunteer ID
            </span>
            <StatusBadge
              type="volunteerStatus"
              value={createdVolunteer.status}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-black text-slate-800 dark:text-slate-100">
                {createdVolunteer.fullName}
              </p>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} className="text-primary" />
                Ward {createdVolunteer.ward} · {createdVolunteer.gender} · Age{" "}
                {createdVolunteer.age}
              </p>
            </div>
            <StatusBadge
              type="bloodGroup"
              value={createdVolunteer.health.bloodGroup}
            />
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-mono font-extrabold text-primary tracking-wider">
              {createdVolunteer.id}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Submitted {new Date().toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onComplete(createdVolunteer)}
          className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>View My Volunteer Card</span>
          <ArrowRight size={14} />
        </button>
      </Card>
    );
  }

  return (
    <>
      <div ref={wizardTopRef} className="-mt-2 scroll-mt-6" />

      <div className="w-full max-w-2xl mx-auto space-y-3.5">
        {/* Top Navigation Bar from Picture 2 */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-bold text-xs py-1 px-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              {currentStep === 1 && "Personal Details"}
              {currentStep === 2 && "Interests & Skills"}
              {currentStep === 3 && "Availability"}
              {currentStep === 4 && "Consent & Health"}
              {currentStep === 5 && "Review & Submit"}
            </span>
          </div>
        </div>

        <Card className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
          {/* Volunteer Guidelines Pill / Banner */}
          {!initialData && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
                <HeartHandshake size={15} className="shrink-0" />
                <span>Avadi Citizen Volunteer Force Guidelines Active</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvisoryModal(true)}
                className="text-[11px] font-black text-rose-600 dark:text-rose-400 underline hover:text-rose-700 cursor-pointer shrink-0"
              >
                Review Instructions
              </button>
            </div>
          )}

          {/* Wizard Header (Shown when editing existing profile) */}
          {initialData && (
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 dark:bg-orange-950/40 text-primary rounded-2xl border border-orange-100 dark:border-orange-900/40">
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-base text-slate-800 dark:text-white leading-tight">
                    Edit Volunteer Profile
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Update your contact, availability, or skill preferences
                  </p>
                </div>
              </div>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* MODERN 5-CAPSULE STEPPER (EXACT FLOW FROM PICTURE 2) */}
          <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            {/* 5 Clean Rounded Capsule Progress Bars */}
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((stepIdx) => {
                const isCompleted = currentStep > stepIdx;
                const isCurrent = currentStep === stepIdx;
                return (
                  <div
                    key={stepIdx}
                    onClick={() => stepIdx < currentStep && setCurrentStep(stepIdx)}
                    className={`h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-300 ${
                      stepIdx < currentStep ? "cursor-pointer" : ""
                    }`}
                  >
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isCompleted
                          ? "bg-emerald-500 w-full"
                          : isCurrent
                            ? "bg-linear-to-r from-primary to-orange-500 w-full shadow-xs"
                            : "w-0"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Step Heading & Guidance */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                  STEP {currentStep} OF 5
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {currentStep === 1 && (initialData ? "Edit Personal & Contact Details" : "Personal & Contact Details")}
                  {currentStep === 2 && "Interests & Skills"}
                  {currentStep === 3 && "Availability & Mobility"}
                  {currentStep === 4 && "Health & Citizen Consent"}
                  {currentStep === 5 && "Review & Confirm Details"}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentStep === 1 && "Provide your basic details, ward, and contact information."}
                  {currentStep === 2 && "Select focus areas and skills where you want to assist Avadi."}
                  {currentStep === 3 && "Specify your days, time slots, and emergency vehicle access."}
                  {currentStep === 4 && "Provide emergency contact, blood group, and code declarations."}
                  {currentStep === 5 && "Verify your volunteer credentials before submitting to Avadi Force."}
                </p>
              </div>

              <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                {currentStep}/5
              </div>
            </div>
          </div>

      {/* ========================================== */}
      {/* STEP 1: PERSONAL & CONTACT */}
      {/* ========================================== */}
      {currentStep === 1 && (
        <div className="space-y-4 pt-1">
          {/* Read-only Profile Auto-fill Banner */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User size={12} className="text-primary" />
                Verified Citizen Profile (Auto-filled)
              </span>
              {!authUser?.dob && (
                <Link
                  href="/profile"
                  className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1"
                >
                  <AlertCircle size={11} /> Complete Profile
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                👤 {resolvedName}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                📍 Ward {formData.ward || resolvedWard}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                ⚧ {resolvedGender}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                🎂 Age {formData.age} {formData.age < 18 ? "(Minor)" : ""}
              </span>
            </div>

            {!authUser?.dob && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                Notice: DOB is not yet set in your profile. Default age ({formData.age}) is applied.
              </p>
            )}
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Mobile Number"
              required
              error={errors.mobile}
              hint="Must start with 6, 7, 8, or 9"
            >
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.contact.mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="9840123456"
                  className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </FormField>

            <FormField
              label="WhatsApp Number"
              required
              error={errors.whatsapp}
            >
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={sameAsMobile}
                    value={formData.contact.whatsapp}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10),
                        },
                      }))
                    }
                    placeholder="9840123456"
                    className={`w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none ${
                      sameAsMobile ? "opacity-70 bg-slate-50 dark:bg-slate-900 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={sameAsMobile}
                    onChange={(e) => handleSameAsMobileToggle(e.target.checked)}
                    className="rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span>Same as mobile number</span>
                </label>
              </div>
            </FormField>
          </div>

          {/* Area / Street / Landmark */}
          <FormField
            label="Area / Street / Landmark within Ward"
            required
            error={errors.area}
            hint="Helps ward captains deploy you to nearby incidents"
          >
            <div ref={streetInputRef} className="relative">
              <input
                type="text"
                value={formData.contact.area}
                onFocus={() => {
                  if ((formData.contact.area || "").trim().length >= 1) {
                    setShowStreetDropdown(true);
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, area: val },
                  }));
                  setShowStreetDropdown(true);
                }}
                placeholder="e.g. 2nd Cross Street, near Kamaraj Statue"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />

              {showStreetDropdown && streetMatches.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {streetMatches.map((item, idx) => (
                    <button
                      key={`${item.streetName}-${item.wardNo}-${idx}`}
                      type="button"
                      onClick={() => handleSelectStreet(item)}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5 min-w-0 pr-2">
                        <MapPin size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.streetName}</span>
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        Ward {item.wardNo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* Preferred Languages */}
          <FormField
            label="Preferred Language(s)"
            required
            error={errors.languages}
            hint="Languages you can comfortably converse in"
          >
            <ChipSelect
              options={LANGUAGES}
              value={formData.languages}
              multiple
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, languages: vals }))
              }
            />
          </FormField>

          {/* Emergency Contact Information */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Phone size={13} className="text-primary" />
              <span>Emergency Contact Details (Mandatory)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <FormField
                label="Contact Name"
                required
                error={errors.emergencyName}
              >
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: {
                        ...prev.emergencyContact,
                        name: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. S. Kothandapani"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </FormField>

              <FormField
                label="Phone (10 digits)"
                required
                error={errors.emergencyPhone}
              >
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: {
                        ...prev.emergencyContact,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      },
                    }))
                  }
                  placeholder="9840987654"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </FormField>

              <FormField
                label="Relationship"
                required
                error={errors.emergencyRelationship}
              >
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emergencyContact: {
                        ...prev.emergencyContact,
                        relationship: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. Father, Spouse"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2: VOLUNTEERING PROFILE */}
      {/* ========================================== */}
      {currentStep === 2 && (
        <div className="space-y-4 pt-1">
          {/* Interests */}
          <FormField
            label="Volunteering Interests"
            required
            error={errors.interests}
            hint="Choose domains you are enthusiastic to volunteer for (at least 1)"
          >
            <ChipSelect
              options={INTEREST_OPTIONS}
              value={formData.interests}
              multiple
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, interests: vals }))
              }
            />
          </FormField>

          {/* Skills */}
          <FormField
            label="Skills & Capabilities"
            required
            error={errors.skills}
            hint="Select applicable skills to help matching with civic duties"
          >
            <ChipSelect
              options={SKILL_OPTIONS}
              value={formData.skills}
              multiple
              accent="primary"
              onChange={(vals) =>
                setFormData((prev) => ({ ...prev, skills: vals }))
              }
            />
            <div className="pt-2">
              <input
                type="text"
                value={formData.otherSkill || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    otherSkill: e.target.value,
                  }))
                }
                placeholder="Other specific skill (e.g. Ham Radio, Electrician, Swimmer)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </FormField>

          {/* Experience Level & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Experience Level" required error={errors.experience}>
              <select
                value={formData.experience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience: e.target.value as ExperienceLevel,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="Beginner">Beginner (Eager to learn and assist)</option>
                <option value="Intermediate">Intermediate (Past volunteer experience)</option>
                <option value="Experienced">Experienced (Can lead drives/teams)</option>
              </select>
            </FormField>

            <FormField
              label="Do you have a vehicle?"
              required
              error={errors.vehicle}
            >
              <select
                value={formData.vehicle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicle: e.target.value as VehicleType,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="None">None (Pedestrian / Public transit)</option>
                <option value="Two-wheeler">Two-wheeler (Bike / Scooter)</option>
                <option value="Four-wheeler">Four-wheeler (Car / Van)</option>
              </select>
            </FormField>
          </div>

          {/* Short Bio */}
          <FormField
            label="Short Bio / Note (Optional)"
            error={errors.bio}
            charCount={{ current: (formData.bio || "").length, max: 200 }}
            hint="Brief note about your civic motivation or previous community work"
          >
            <textarea
              maxLength={200}
              rows={3}
              value={formData.bio || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="e.g. Passionate about lake rejuvenation and youth education. Ready for monsoon rescue."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none"
            />
          </FormField>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 3: AVAILABILITY & HEALTH */}
      {/* ========================================== */}
      {currentStep === 3 && (
        <div className="space-y-4 pt-1">
          {/* Days Available */}
          <FormField
            label="Days Available"
            required
            error={errors.days}
            hint="Select the days you can contribute"
          >
            <ChipSelect
              options={DAYS_OF_WEEK}
              value={formData.availability.days}
              multiple
              onChange={(vals) =>
                setFormData((prev) => ({
                  ...prev,
                  availability: { ...prev.availability, days: vals },
                }))
              }
            />
          </FormField>

          {/* Time Slots */}
          <FormField
            label="Time Slots"
            required
            error={errors.slots}
            hint="Preferred hours of volunteering"
          >
            <ChipSelect
              options={TIME_SLOTS}
              value={formData.availability.slots}
              multiple
              accent="primary"
              onChange={(vals) =>
                setFormData((prev) => ({
                  ...prev,
                  availability: { ...prev.availability, slots: vals },
                }))
              }
            />
          </FormField>

          {/* Availability Type & Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Availability Commitment" required>
              <select
                value={formData.availability.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      type: e.target.value as AvailabilityType,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="Weekends only">Weekends only</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Anytime">Anytime (Flexible schedule)</option>
                <option value="Emergency-only">Emergency-only (Disasters/Critical)</option>
              </select>
            </FormField>

            <FormField label="Travel Radius" required>
              <select
                value={formData.availability.radius}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      radius: e.target.value as TravelRadius,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="My ward only">My ward only (Ward {formData.ward})</option>
                <option value="Nearby wards">Nearby wards</option>
                <option value="Anywhere in Avadi">Anywhere in Avadi (All 48 Wards)</option>
              </select>
            </FormField>
          </div>

          {/* Health & Blood Group */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Health & Emergency Blood Registry
              </span>
              <StatusBadge
                type="bloodGroup"
                value={formData.health.bloodGroup}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField label="Blood Group" required error={errors.bloodGroup}>
                <select
                  value={formData.health.bloodGroup}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      health: { ...prev.health, bloodGroup: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Physical Fitness for Field Work" required>
                <select
                  value={formData.health.fitness}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      health: {
                        ...prev.health,
                        fitness: e.target.value as "Yes" | "Limited",
                      },
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none"
                >
                  <option value="Yes">Yes (Fit for heavy/outdoor activity)</option>
                  <option value="Limited">Limited (Desk / coordination tasks only)</option>
                </select>
              </FormField>
            </div>

            {/* Willing to donate blood in emergencies */}
            <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <ToggleSwitch
                checked={formData.health.willDonateBlood}
                onChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    health: { ...prev.health, willDonateBlood: checked },
                  }))
                }
                label="Willing to donate blood in emergency civic appeals?"
                description="Ward coordinators may reach out if a critically injured resident requires matching blood."
              />
            </div>

            {/* Last donation date (shown only if Yes) */}
            {formData.health.willDonateBlood && (
              <FormField
                label="Last Blood Donation Date (Optional)"
                error={errors.lastDonation}
                hint="Leave blank if never donated before"
              >
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.health.lastDonation || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      health: { ...prev.health, lastDonation: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </FormField>
            )}

            <FormField
              label="Medical conditions or allergies to be aware of (Optional)"
              hint="Keep coordinators informed in case of field missions"
            >
              <input
                type="text"
                value={formData.health.conditions || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    health: { ...prev.health, conditions: e.target.value },
                  }))
                }
                placeholder="e.g. Asthma, Penicillin allergy, None"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </FormField>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 4: CONSENT & VERIFICATION */}
      {/* ========================================== */}
      {currentStep === 4 && (
        <div className="space-y-4 pt-1">
          {/* Privacy Toggle */}
          <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-orange-900 dark:text-orange-300">
              <Lock size={14} className="text-primary" />
              <span>Contact Privacy Control</span>
            </div>
            <ToggleSwitch
              accent="primary"
              checked={formData.contact.showPhonePublic}
              onChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, showPhonePublic: checked },
                }))
              }
              label="Show my phone number publicly in Citizens Directory"
              description="Default is OFF. When OFF, your phone is hidden and residents must use the in-app 'Request Contact' feature to reach you."
            />
          </div>

          {/* Under-18 Guardian Consent if age < 18 */}
          {formData.age < 18 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-400">
                <AlertCircle size={14} />
                <span>Guardian Consent Required (Age Under 18)</span>
              </div>
              <FormField
                label="Parent / Guardian Full Name"
                required
                error={errors.guardianName}
              >
                <input
                  type="text"
                  value={formData.guardian?.name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian: {
                        name: e.target.value,
                        consent: prev.guardian?.consent ?? false,
                      },
                    }))
                  }
                  placeholder="e.g. S. Murugesan (Father)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </FormField>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.guardian?.consent || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guardian: {
                        name: prev.guardian?.name || "",
                        consent: e.target.checked,
                      },
                    }))
                  }
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>
                  I, the parent/guardian, give permission for this minor to
                  participate in safe civic community volunteer activities.
                </span>
              </label>
              {errors.guardianConsent && (
                <p className="text-[11px] font-bold text-rose-500">
                  {errors.guardianConsent}
                </p>
              )}
            </div>
          )}

          {/* Mandatory Consents */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Community Declarations & Consents
            </h4>

            {/* 1. Code of conduct */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.consents.conduct}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      consents: { ...prev.consents, conduct: e.target.checked },
                    }))
                  }
                  className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span>
                  I agree to adhere to the Avadi Volunteer Code of Conduct,
                  maintaining respect, integrity, and safety during all civic
                  activities.
                </span>
              </label>
              {errors.conduct && (
                <p className="text-[11px] font-bold text-rose-500 pl-6">
                  {errors.conduct}
                </p>
              )}
            </div>

            {/* 2. Directory consent */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.consents.directory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      consents: {
                        ...prev.consents,
                        directory: e.target.checked,
                      },
                    }))
                  }
                  className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span>
                  I consent to sharing my name, ward ({formData.ward}), blood group
                  ({formData.health.bloodGroup}) and interests in the Citizens Directory.
                </span>
              </label>
              {errors.directory && (
                <p className="text-[11px] font-bold text-rose-500 pl-6">
                  {errors.directory}
                </p>
              )}
            </div>

            {/* 3. Truthful info */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.consents.truthful}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      consents: { ...prev.consents, truthful: e.target.checked },
                    }))
                  }
                  className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                />
                <span>
                  I confirm that all information provided in this registration is
                  true and accurate to the best of my knowledge.
                </span>
              </label>
              {errors.truthful && (
                <p className="text-[11px] font-bold text-rose-500 pl-6">
                  {errors.truthful}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 5: REVIEW SCREEN */}
      {/* ========================================== */}
      {currentStep === 5 && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 text-xs font-bold">
            <Shield size={16} className="text-primary shrink-0" />
            <span>
              Please review all information before submitting. Click "Edit" on
              any section to make changes.
            </span>
          </div>

          {/* Section 1 Review */}
          <ReviewCard
            title="Personal & Contact"
            stepId={1}
            onEdit={setCurrentStep}
            icon={<User size={14} />}
          >
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Name:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Ward:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Ward {formData.ward}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Gender / Age:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.gender} · {formData.age} yrs
                </span>
              </div>
              <div>
                <span className="text-slate-400">Mobile:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  +91 {formData.contact.mobile}
                </span>
              </div>
              <div>
                <span className="text-slate-400">WhatsApp:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  +91 {formData.contact.whatsapp}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Area:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.contact.area}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
              <span className="text-slate-400">Emergency Contact:</span>{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formData.emergencyContact.name} ({formData.emergencyContact.relationship}) - +91 {formData.emergencyContact.phone}
              </span>
            </div>
          </ReviewCard>

          {/* Section 2 Review */}
          <ReviewCard
            title="Volunteering Profile"
            stepId={2}
            onEdit={setCurrentStep}
            icon={<HeartHandshake size={14} />}
          >
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-slate-400 block mb-1">Interests:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.interests.map((i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/50 dark:border-orange-900/50 font-bold text-[10px]"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/50 dark:border-orange-900/50 font-bold text-[10px]"
                    >
                      {s}
                    </span>
                  ))}
                  {formData.otherSkill && (
                    <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-primary border border-orange-200/50 dark:border-orange-900/50 font-bold text-[10px]">
                      {formData.otherSkill}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400">Experience:</span>{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formData.experience}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Vehicle:</span>{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formData.vehicle}
                  </span>
                </div>
              </div>
            </div>
          </ReviewCard>

          {/* Section 3 Review */}
          <ReviewCard
            title="Availability & Health"
            stepId={3}
            onEdit={setCurrentStep}
            icon={<Calendar size={14} />}
          >
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Days:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.availability.days.join(", ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Slots:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.availability.slots.join(", ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Commitment:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.availability.type}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Travel Radius:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.availability.radius}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Blood Group:</span>{" "}
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formData.health.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Donate Blood:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.health.willDonateBlood ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </ReviewCard>

          {/* Section 4 Review */}
          <ReviewCard
            title="Consent & Privacy"
            stepId={4}
            onEdit={setCurrentStep}
            icon={<Lock size={14} />}
          >
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone Privacy:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {formData.contact.showPhonePublic
                    ? "Visible Publicly"
                    : "Hidden (Request Contact only)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Code of Conduct:</span>
                <span className="font-bold text-emerald-600">Agreed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Directory Sharing:</span>
                <span className="font-bold text-emerald-600">Consented</span>
              </div>
            </div>
          </ReviewCard>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            disabled={!stepValidation.isValid}
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Submit &amp; Join Force</span>
              </>
            )}
          </button>
        )}
      </div>
    </Card>
  </div>

    {/* Volunteer Guidelines & Advisory Modal */}
    <VolunteerAdvisoryModal
      isOpen={showAdvisoryModal}
      onClose={() => {
        setShowAdvisoryModal(false);
        if (onCancel && !initialData) {
          onCancel();
        }
      }}
      onConfirm={() => setShowAdvisoryModal(false)}
    />
  </>
  );
};

export default VolunteerWizard;
