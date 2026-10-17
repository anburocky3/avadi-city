"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Modal,
  Badge,
} from "@/components/shared-components";
import {
  DonationRequest,
  DonationFormData,
  DonationType,
  DonationUrgency,
  BeneficiaryType,
  DonationItem,
} from "@/types/donation";
import { Stepper } from "@/components/volunteer/Stepper";
import { FormField } from "@/components/volunteer/FormField";
import { StatusBadge } from "@/components/volunteer/StatusBadge";
import { WardSelector } from "@/components/ward-selector";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";
import {
  validateDonationStep1,
  validateDonationStep2,
  validateDonationStep3,
  cleanPhoneNumber,
} from "@/utils/validators";
import donationService from "@/services/donationService";
import toast from "@/utils/toast";
import {
  Gift,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Info,
  MapPin,
  Search,
  X,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import MapLocationPicker for Leaflet map without SSR issues
const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-xs font-semibold text-slate-400">
        Loading Avadi Map...
      </div>
    ),
  },
);

// Avadi Ward centroids for smart map panning
const WARD_CENTROIDS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 13.137, lng: 80.088 },
  2: { lat: 13.132, lng: 80.092 },
  3: { lat: 13.128, lng: 80.096 },
  4: { lat: 13.125, lng: 80.1 },
  5: { lat: 13.121, lng: 80.104 },
  6: { lat: 13.118, lng: 80.108 },
  7: { lat: 13.124, lng: 80.114 },
  8: { lat: 13.129, lng: 80.118 },
  9: { lat: 13.135, lng: 80.122 },
  10: { lat: 13.131, lng: 80.127 },
  11: { lat: 13.126, lng: 80.131 },
  12: { lat: 13.12, lng: 80.126 },
  13: { lat: 13.115, lng: 80.122 },
  14: { lat: 13.122, lng: 80.105 },
  15: { lat: 13.127, lng: 80.109 },
  16: { lat: 13.132, lng: 80.113 },
  17: { lat: 13.136, lng: 80.117 },
  18: { lat: 13.141, lng: 80.121 },
  19: { lat: 13.145, lng: 80.125 },
  20: { lat: 13.118, lng: 80.102 },
  21: { lat: 13.114, lng: 80.098 },
  22: { lat: 13.11, lng: 80.095 },
  23: { lat: 13.106, lng: 80.091 },
  24: { lat: 13.102, lng: 80.087 },
  25: { lat: 13.107, lng: 80.092 },
  26: { lat: 13.112, lng: 80.096 },
  27: { lat: 13.116, lng: 80.099 },
  28: { lat: 13.117, lng: 80.097 },
  29: { lat: 13.121, lng: 80.094 },
  30: { lat: 13.125, lng: 80.09 },
  31: { lat: 13.129, lng: 80.086 },
  32: { lat: 13.133, lng: 80.082 },
  33: { lat: 13.124, lng: 80.078 },
  34: { lat: 13.119, lng: 80.081 },
  35: { lat: 13.115, lng: 80.084 },
  36: { lat: 13.11, lng: 80.08 },
  37: { lat: 13.106, lng: 80.082 },
  38: { lat: 13.102, lng: 80.085 },
  39: { lat: 13.099, lng: 80.089 },
  40: { lat: 13.105, lng: 80.094 },
  41: { lat: 13.113, lng: 80.101 },
  42: { lat: 13.095, lng: 80.093 },
  43: { lat: 13.114, lng: 80.111 },
  44: { lat: 13.111, lng: 80.105 },
  45: { lat: 13.097, lng: 80.097 },
  46: { lat: 13.094, lng: 80.101 },
  47: { lat: 13.0902, lng: 80.109 },
  48: { lat: 13.085, lng: 80.103 },
};

export interface CreateDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: any;
  activeWardId?: number;
  editingRequest?: DonationRequest | null;
  onSuccess: (request: DonationRequest) => void;
}

const REQUEST_TYPES: DonationType[] = [
  "Charity Need",
  "Emergency Relief",
  "Blood Requirement",
  "Medical Help",
  "Education Support",
  "Food & Clothing",
  "Other",
];

const BENEFICIARY_TYPES: BeneficiaryType[] = [
  "Individual",
  "Family",
  "Community or Institution",
];

export const CreateDonationModal: React.FC<CreateDonationModalProps> = ({
  isOpen,
  onClose,
  authUser,
  activeWardId,
  editingRequest,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const userWard = editingRequest?.ward || authUser?.wardNumber || activeWardId || 14;
  const modalTopRef = useRef<HTMLDivElement>(null);

  const scrollToModalTop = () => {
    if (modalTopRef.current) {
      const scrollableParent = modalTopRef.current.closest(".overflow-y-auto");
      if (scrollableParent) {
        scrollableParent.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        modalTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scroll to the first empty / invalid box field, or fallback to modal top
  const scrollToFirstError = (errorObj: Record<string, string>) => {
    const errorKeys = Object.keys(errorObj);
    if (!errorKeys || errorKeys.length === 0) {
      scrollToModalTop();
      return;
    }

    setTimeout(() => {
      let targetEl: HTMLElement | null = null;

      // 1. Try finding input element by data-field, name, or id
      for (const key of errorKeys) {
        targetEl = document.querySelector<HTMLElement>(
          `[data-field="${key}"], [name="${key}"], #${key}, #donation-${key}`
        );
        if (targetEl) break;
      }

      // 2. Fallback to any element marked with error border or aria-invalid
      if (!targetEl) {
        targetEl = document.querySelector<HTMLElement>(
          '.border-rose-500, [aria-invalid="true"]'
        );
      }

      if (targetEl) {
        const scrollableParent = targetEl.closest(".overflow-y-auto") as HTMLElement | null;
        if (scrollableParent) {
          const parentRect = scrollableParent.getBoundingClientRect();
          const elRect = targetEl.getBoundingClientRect();
          const relativeTop = elRect.top - parentRect.top + scrollableParent.scrollTop;
          // Offset by 85px to keep field label and prompt clearly visible
          scrollableParent.scrollTo({
            top: Math.max(0, relativeTop - 85),
            behavior: "smooth",
          });
        } else {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Auto-focus input if it's an interactive field
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
        scrollToModalTop();
      }
    }, 40);
  };

  // Automatically scroll to the top of the modal on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToModalTop();
    }, 40);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Street Autocomplete & Ward Selection Modal state
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [isStreetWardModalOpen, setIsStreetWardModalOpen] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Default coordinate setup
  const initialCoord = WARD_CENTROIDS[userWard] || { lat: 13.1169, lng: 80.0972 };

  const [formData, setFormData] = useState<DonationFormData>(() => {
    if (editingRequest) {
      return {
        id: editingRequest.id,
        createdBy: editingRequest.createdBy,
        createdByName: editingRequest.createdByName,
        type: editingRequest.type,
        urgency: editingRequest.urgency,
        title: editingRequest.title,
        description: editingRequest.description || "",
        ward: editingRequest.ward,
        address: editingRequest.address,
        lat: editingRequest.lat || initialCoord.lat,
        lng: editingRequest.lng || initialCoord.lng,
        beneficiary: editingRequest.beneficiary,
        items: editingRequest.items ? editingRequest.items.map((i) => ({ ...i })) : [],
        target: editingRequest.target ? { ...editingRequest.target } : null,
        requiredBy: editingRequest.requiredBy,
        contact: { ...editingRequest.contact },
        images: [...editingRequest.images],
        organisation: editingRequest.organisation
          ? { ...editingRequest.organisation }
          : null,
        supportingProof: editingRequest.supportingProof || null,
        confirmedGenuine: true,
        agreedGuidelines: true,
      };
    }

    const savedDraft = donationService.getDraft();
    if (savedDraft && savedDraft.createdBy === (authUser?.id || "guest")) {
      return savedDraft;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const cleanUserPhone = authUser?.phone ? cleanPhoneNumber(authUser.phone) : "";

    return {
      createdBy: authUser?.id || "user-avadi-citizen",
      createdByName: authUser?.name || "Avadi Resident",
      type: "Charity Need" as DonationType,
      urgency: "Normal" as DonationUrgency,
      title: "",
      description: "", // Optional
      ward: userWard,
      address: authUser?.streetName || "",
      lat: initialCoord.lat,
      lng: initialCoord.lng,
      beneficiary: "Family" as BeneficiaryType,
      items: [], // Optional: defaults to empty array so user is not blocked
      target: { amount: "", upi: "" },
      requiredBy: tomorrowStr,
      contact: {
        name: authUser?.name || "Avadi Resident",
        phone: cleanUserPhone,
        whatsapp: cleanUserPhone,
      },
      images: [],
      organisation: { name: "", regNo: "" },
      supportingProof: null,
      confirmedGenuine: false,
      agreedGuidelines: false,
    };
  });

  const [sameAsPhone, setSameAsPhone] = useState<boolean>(
    Boolean(
      formData.contact?.phone &&
        formData.contact?.whatsapp &&
        formData.contact.phone === formData.contact.whatsapp,
    ),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedDonation, setSubmittedDonation] = useState<DonationRequest | null>(null);

  // Reset acknowledgement state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmittedDonation(null);
    }
  }, [isOpen]);

  // Autosave draft
  useEffect(() => {
    if (!editingRequest && isOpen) {
      donationService.saveDraft(formData);
    }
  }, [formData, editingRequest, isOpen]);

  // Next Step with clear error messaging & auto-scroll to invalid field
  const handleNextStep = () => {
    let res;
    if (currentStep === 1) {
      res = validateDonationStep1(formData);
    } else if (currentStep === 2) {
      res = validateDonationStep2(formData);
    } else {
      res = validateDonationStep3(formData);
    }

    if (!res.isValid) {
      setErrors(res.errors);
      const firstErrorMessage = Object.values(res.errors)[0];
      toast.error(firstErrorMessage || "Please complete the required details.");
      scrollToFirstError(res.errors);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => prev + 1);
    scrollToModalTop();
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    scrollToModalTop();
  };

  // Re-pin map to ward centroid
  const handleRepinWard = (targetWard: number) => {
    const coords = WARD_CENTROIDS[targetWard] || { lat: 13.1169, lng: 80.0972 };
    setFormData((prev) => ({
      ...prev,
      lat: coords.lat,
      lng: coords.lng,
    }));
  };

  // Dynamic Item Rows (Optional)
  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { id: `item-${Date.now()}`, name: "", qty: 1, unit: "units" },
      ],
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof DonationItem,
    val: any,
  ) => {
    setFormData((prev) => {
      const updated = [...(prev.items || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, items: updated };
    });
  };

  // Image Upload Handling (Max 3, 2MB each)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 3) {
      toast.error("You can upload a maximum of 3 images.");
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 2 MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string].slice(0, 3),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  // Phone / WhatsApp sync
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        phone: cleaned,
        whatsapp: sameAsPhone ? cleaned : prev.contact.whatsapp,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s1 = validateDonationStep1(formData);
    const s2 = validateDonationStep2(formData);
    const s3 = validateDonationStep3(formData);

    if (!s1.isValid || !s2.isValid || !s3.isValid) {
      const allErrors = { ...s1.errors, ...s2.errors, ...s3.errors };
      setErrors(allErrors);
      // If error belongs to an earlier step, automatically return to that step
      if (!s1.isValid && currentStep !== 1) {
        setCurrentStep(1);
      } else if (!s2.isValid && currentStep !== 2 && s1.isValid) {
        setCurrentStep(2);
      }
      const first = Object.values(allErrors)[0];
      toast.error(first || "Please complete all required fields properly.");
      scrollToFirstError(allErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out any completely blank item rows
      const cleanItems = (formData.items || []).filter(
        (i) => i.name && i.name.trim().length > 0,
      );

      const authorUserId = authUser?.id || "user-avadi-citizen";
      const authorName =
        authUser?.name || formData.contact?.name || "Avadi Resident";

      const payload = {
        ...formData,
        createdBy: authorUserId,
        createdByName: authorName,
        items: cleanItems,
        status: "approved" as DonationStatus,
      };

      let result: DonationRequest;
      if (editingRequest?.id) {
        result = donationService.update(editingRequest.id, payload);
        toast.success("Donation request successfully updated!");
      } else {
        result = await donationService.createAsync(payload);
        toast.success("Donation request submitted and posted to the Avadi feed!");
      }
      onSuccess(result);
      setSubmittedDonation(result);
      scrollToModalTop();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit donation request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    const res = submittedDonation;
    setSubmittedDonation(null);
    if (res) {
      onSuccess(res);
    }
    onClose();
  };

  const stepsList = [
    { id: 1, title: "Type & Details" },
    { id: 2, title: "Needs & Contact" },
    { id: 3, title: "Verify & Submit" },
  ];

  // ==========================================
  // ACKNOWLEDGEMENT SCREEN
  // ==========================================
  if (submittedDonation) {
    const isEditing = Boolean(editingRequest?.id);

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleDone}
        title="Request Acknowledgement"
        maxWidth="sm:max-w-xl"
      >
        <div className="space-y-6 py-2 text-center">
          <div ref={modalTopRef} className="h-0 w-0 -mt-5" />

          {/* Success Animated Check Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-900/40 shadow-sm">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>

          {/* Status badge & headings */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isEditing ? "Request Successfully Updated" : "Request Successfully Completed"}
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
              {isEditing
                ? "Donation Details Updated!"
                : "Donation Request Broadcasted!"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your donation request is live in the Avadi City portal and has been posted to Ward {submittedDonation.ward} residents, donors, and verified civic volunteers.
            </p>
          </div>

          {/* Identity & Request Summary Card */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-950 dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 rounded-3xl text-left space-y-3.5 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Avadi Donation Reference
              </span>
              <span className="text-[11px] font-mono font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {submittedDonation.id}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="text-[10px] font-bold">
                  {submittedDonation.type}
                </Badge>
                <StatusBadge type="urgency" value={submittedDonation.urgency} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                {submittedDonation.title}
              </p>
              {submittedDonation.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {submittedDonation.description}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Location
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5 text-[11px]">
                  <MapPin size={12} className="text-primary shrink-0" />
                  Ward {submittedDonation.ward} · {submittedDonation.address}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Beneficiary
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5 text-[11px]">
                  {submittedDonation.beneficiary}
                </span>
              </div>
            </div>

            {submittedDonation.items && submittedDonation.items.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Requested Items ({submittedDonation.items.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {submittedDonation.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300"
                    >
                      {it.name} ({it.qty} {it.unit})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Coordinator: <strong className="text-slate-800 dark:text-slate-200">{submittedDonation.contact?.name}</strong> ({submittedDonation.contact?.phone})
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                ✓ Active on Feed
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleDone}
            className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>View in Donations Feed</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingRequest ? "Edit Donation Request" : "Request Donation"}
        maxWidth="sm:max-w-xl"
      >
        <div className="space-y-5">
          <div ref={modalTopRef} className="h-0 w-0 -mt-5" />
          {/* Stepper with progress */}
          <Stepper
            steps={stepsList}
            currentStep={currentStep}
            onStepClick={(s) => {
              if (s < currentStep) {
                setCurrentStep(s);
                scrollToModalTop();
              }
            }}
          />

          {/* ========================================== */}
          {/* STEP 1: TYPE & DETAILS */}
          {/* ========================================== */}
          {currentStep === 1 && (
            <div className="space-y-4 pt-1">
              {/* Request Type & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField label="Request Type" required error={errors.type}>
                  <select
                    id="donation-type"
                    name="type"
                    data-field="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as DonationType,
                      }))
                    }
                    className={`w-full px-3 py-2.5 rounded-xl border ${
                      errors.type
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    } bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none`}
                  >
                    {REQUEST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Urgency Level" required error={errors.urgency}>
                  <div className="flex items-center gap-2">
                    <select
                      id="donation-urgency"
                      name="urgency"
                      data-field="urgency"
                      value={formData.urgency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          urgency: e.target.value as DonationUrgency,
                        }))
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors.urgency
                          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800"
                      } bg-white dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-primary/40 focus:outline-none`}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <StatusBadge type="urgency" value={formData.urgency} />
                  </div>
                </FormField>
              </div>

              {/* Title */}
              <FormField
                label="Request Title"
                required
                error={errors.title}
                charCount={{ current: (formData.title || "").length, max: 80 }}
                hint="Between 3 and 80 characters"
              >
                <input
                  id="donation-title"
                  name="title"
                  data-field="title"
                  type="text"
                  maxLength={80}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Food relief, School notebooks, or Emergency blood requirement"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    errors.title
                      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none`}
                />
              </FormField>

              {/* Description (OPTIONAL) */}
              <FormField
                label="Description (Optional)"
                error={errors.description}
                charCount={{
                  current: (formData.description || "").length,
                  max: 500,
                }}
                hint="Explain who needs help, why the items are required, or any specific details"
              >
                <textarea
                  id="donation-description"
                  name="description"
                  data-field="description"
                  rows={3}
                  maxLength={500}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Provide background context or instructions (optional)..."
                  className={`w-full px-3 py-2 rounded-xl border ${
                    errors.description
                      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none`}
                />
              </FormField>

              {/* ======================================================== */}
              {/* EXACT WARD & MAP PATTERN FROM PICTURE 2 */}
              {/* ======================================================== */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* 1. Locality / Street Area */}
                <div className="relative">
                  <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <MapPin size={13} />
                    </span>
                    <span>Locality / Street Area</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    id="donation-address"
                    name="address"
                    data-field="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, address: val }));
                      if (val.trim().length <= 2) {
                        setStreetResults([]);
                        return;
                      }
                      const filtered = ALL_AVADI_STREETS.filter((item) =>
                        item.streetName
                          .toLowerCase()
                          .includes(val.toLowerCase().trim()),
                      ).slice(0, 8);
                      setStreetResults(filtered);
                    }}
                    placeholder="e.g. Kamaraj Nagar, Near Pattabiram Railway Station, Gandhi Road..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${
                      errors.address
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    } bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                  {errors.address && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">
                      {errors.address}
                    </p>
                  )}

                  {/* Autocomplete dropdown for Avadi Streets */}
                  <AnimatePresence>
                    {streetResults.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl top-full divide-y divide-slate-100 dark:divide-slate-800"
                      >
                        {streetResults.map((street, idx) => (
                          <li
                            key={`${street.streetName}-${street.wardNo}-${idx}`}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                address: street.streetName,
                                ward: street.wardNo,
                              }));
                              handleRepinWard(street.wardNo);
                              setStreetResults([]);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-primary cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <MapPin size={13} className="text-slate-400 shrink-0" />
                              <span>{street.streetName}</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Ward {street.wardNo}
                            </span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Municipal Ward interactive selector card (Image 2 style) */}
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs mb-1.5">
                    Municipal Ward <span className="text-rose-500">*</span>
                  </label>
                  <div
                    id="donation-ward"
                    data-field="ward"
                    onClick={() => setIsStreetWardModalOpen(true)}
                    className={`w-full p-3 rounded-xl border ${
                      errors.ward
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                    } hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer group shadow-2xs`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                        W{formData.ward}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs truncate">
                          {formData.address?.trim()
                            ? formData.address.trim()
                            : "Select street / ward"}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Search street or select ward
                        </span>
                      </div>
                    </div>
                    <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:underline shrink-0">
                      <Search size={13} />
                      <span>{formData.address?.trim() ? "Change" : "Find"}</span>
                    </span>
                  </div>
                  {errors.ward && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1">
                      {errors.ward}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-normal">
                    <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      We use your ward to show this listing to verified community volunteers and donors in this area.
                    </span>
                  </p>
                </div>

                {/* 3. Pin Location on Map (Image 2 style) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2">
                      <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <MapPin size={13} />
                      </span>
                      <span>Pin Location on Map</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      (Drag marker to adjust pin)
                    </span>
                  </div>

                  {/* Leaflet Map */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs relative z-0 h-52 sm:h-60">
                    <MapLocationPicker
                      defaultLat={formData.lat || initialCoord.lat}
                      defaultLng={formData.lng || initialCoord.lng}
                      onLocationSelect={(lat, lng) => {
                        setFormData((prev) => ({ ...prev, lat, lng }));
                        setMapError(null);
                      }}
                      onError={(msg) => setMapError(msg)}
                    />
                  </div>

                  {mapError && (
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {mapError}
                    </p>
                  )}

                  {/* Coordinates Bar & Re-pin */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="text-[10px] font-bold text-slate-400 font-sans">Lat</span>
                      <span className="font-bold">{(formData.lat || initialCoord.lat).toFixed(4)}</span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[10px] font-bold text-slate-400 font-sans">Lng</span>
                      <span className="font-bold">{(formData.lng || initialCoord.lng).toFixed(4)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRepinWard(formData.ward)}
                      className="text-[11px] font-bold text-primary hover:text-orange-600 transition flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <RotateCcw size={11} />
                      <span>Re-pin to Ward {formData.ward}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Beneficiary */}
              <FormField label="Beneficiary Type" required error={errors.beneficiary}>
                <div
                  id="donation-beneficiary"
                  data-field="beneficiary"
                  className="grid grid-cols-3 gap-2"
                >
                  {BENEFICIARY_TYPES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, beneficiary: b }))
                      }
                      className={`p-2.5 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        formData.beneficiary === b
                          ? "bg-primary text-white border-primary shadow-sm"
                          : errors.beneficiary
                          ? "bg-rose-50/40 border-rose-400 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 2: NEEDS & CONTACT */}
          {/* ========================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 pt-1">
              {/* Needed Items List (NOW OPTIONAL) */}
              <div id="donation-items" data-field="items" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>Needed Items List</span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        (Optional)
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Add specific supplies or leave blank for general support
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] font-extrabold text-primary hover:text-orange-600 flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50"
                  >
                    <Plus size={13} />
                    <span>Add Item Row</span>
                  </button>
                </div>

                {errors.items && (
                  <p className="text-[11px] font-bold text-rose-500">
                    {errors.items}
                  </p>
                )}

                {(formData.items || []).length > 0 ? (
                  <div className="space-y-2">
                    {formData.items!.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
                      >
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(index, "name", e.target.value)
                          }
                          placeholder="Item (e.g. Rice, Water Can, Notebooks)"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(index, "qty", e.target.value)
                          }
                          placeholder="Qty"
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="units">units</option>
                          <option value="kg">kg</option>
                          <option value="litres">litres</option>
                          <option value="bags">bags</option>
                          <option value="boxes">boxes</option>
                          <option value="packs">packs</option>
                          <option value="sheets">sheets</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                    No specific item rows added. Tap "+ Add Item Row" if you want to itemize supplies.
                  </div>
                )}
              </div>

              {/* Target Amount & UPI (Optional) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                  <Info size={14} />
                  <span>Optional Financial Target (Display Only)</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  Note: Avadi City only displays the direct UPI ID for voluntary
                  donations and never holds or processes payments.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <FormField label="Target Amount (₹, optional)">
                    <input
                      id="donation-targetAmount"
                      name="targetAmount"
                      data-field="targetAmount"
                      type="number"
                      min={0}
                      value={formData.target?.amount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          target: {
                            ...prev.target,
                            amount: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </FormField>

                  <FormField
                    label="Coordinator UPI ID (optional)"
                    error={errors.targetUpi}
                  >
                    <input
                      id="donation-targetUpi"
                      name="targetUpi"
                      data-field="targetUpi"
                      type="text"
                      value={formData.target?.upi || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          target: {
                            ...prev.target,
                            upi: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. trust@okhdfcbank"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.targetUpi
                          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                          : "border-slate-200 dark:border-slate-800"
                      } bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none`}
                    />
                  </FormField>
                </div>
              </div>

              {/* Required-by Date */}
              <FormField
                label="Required-by Date"
                error={errors.requiredBy}
                hint="Date by which aid or supplies are needed"
              >
                <input
                  id="donation-requiredBy"
                  name="requiredBy"
                  data-field="requiredBy"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.requiredBy}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiredBy: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    errors.requiredBy
                      ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800"
                  } bg-white dark:bg-slate-950 text-xs font-semibold focus:ring-2 focus:ring-primary/40 focus:outline-none`}
                />
              </FormField>

              {/* Contact Person Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Coordinator Contact for Donors
                </span>

                <FormField
                  label="Contact Person Name"
                  required
                  error={errors.contactName}
                >
                  <input
                    id="donation-contactName"
                    name="contactName"
                    data-field="contactName"
                    type="text"
                    value={formData.contact.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, name: e.target.value },
                      }))
                    }
                    placeholder="e.g. S. Ramanathan"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      errors.contactName
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    } bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none`}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    label="Contact Phone"
                    required
                    error={errors.contactPhone}
                  >
                    <input
                      id="donation-contactPhone"
                      name="contactPhone"
                      data-field="contactPhone"
                      type="tel"
                      maxLength={10}
                      value={formData.contact.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9840123456"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.contactPhone
                          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                          : "border-slate-200 dark:border-slate-800"
                      } bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none`}
                    />
                  </FormField>

                  <FormField
                    label="WhatsApp Number"
                    required
                    error={errors.contactWhatsapp}
                  >
                    <div className="space-y-1">
                      <input
                        id="donation-contactWhatsapp"
                        name="contactWhatsapp"
                        data-field="contactWhatsapp"
                        type="tel"
                        maxLength={10}
                        disabled={sameAsPhone}
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
                        className={`w-full px-3 py-2 rounded-xl border ${
                          errors.contactWhatsapp
                            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                            : "border-slate-200 dark:border-slate-800"
                        } bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none ${
                          sameAsPhone ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500">
                        <input
                          type="checkbox"
                          checked={sameAsPhone}
                          onChange={(e) => {
                            setSameAsPhone(e.target.checked);
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                contact: {
                                  ...prev.contact,
                                  whatsapp: prev.contact.phone,
                                },
                              }));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary accent-primary"
                        />
                        <span>Same as contact phone</span>
                      </label>
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Optional Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Attach Photos (Optional, max 3 photos, 2 MB each)
                </label>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group shadow-xs"
                    >
                      <img
                        src={img}
                        alt="Donation attachment"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {formData.images.length < 3 && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary transition cursor-pointer select-none">
                      <Upload size={18} />
                      <span className="text-[9px] font-bold mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 3: VERIFICATION & SUBMIT */}
          {/* ========================================== */}
          {currentStep === 3 && (
            <div className="space-y-4 pt-1">
              {/* Institution / Org Details (Only if beneficiary is Institution) */}
              {formData.beneficiary === "Community or Institution" && (
                <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-3">
                  <span className="text-xs font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">
                    Organisation / Institution Verification
                  </span>

                  <FormField
                    label="Organisation Name (Optional)"
                    error={errors.orgName}
                  >
                    <input
                      id="donation-orgName"
                      name="orgName"
                      data-field="orgName"
                      type="text"
                      value={formData.organisation?.name || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          organisation: {
                            ...prev.organisation,
                            name: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Avadi Care Charitable Trust"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        errors.orgName
                          ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                          : "border-slate-200 dark:border-slate-800"
                      } bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none`}
                    />
                  </FormField>

                  <FormField label="Registration / NGO Number (Optional)">
                    <input
                      id="donation-orgRegNo"
                      name="orgRegNo"
                      data-field="orgRegNo"
                      type="text"
                      value={formData.organisation?.regNo || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          organisation: {
                            ...prev.organisation,
                            regNo: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. TN/TR/2021/8472"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </FormField>
                </div>
              )}

              {/* Quick Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" className="text-[10px] font-bold">
                    {formData.type}
                  </Badge>
                  <StatusBadge type="urgency" value={formData.urgency} />
                </div>

                <h4 className="font-extrabold text-slate-800 dark:text-slate-100">
                  {formData.title || "Untitled Request"}
                </h4>

                {formData.description ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {formData.description}
                  </p>
                ) : null}

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    📍 Ward {formData.ward} · {formData.address}
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    🎁 {(formData.items || []).length} item(s) specified
                  </span>
                </div>
              </div>

              {/* Verification Checkboxes */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div
                  id="donation-confirmedGenuine"
                  data-field="confirmedGenuine"
                  className={`space-y-1 p-2 rounded-xl transition ${
                    errors.confirmedGenuine ? "bg-rose-50/50 border border-rose-300 dark:border-rose-900/60" : ""
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.confirmedGenuine}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmedGenuine: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>
                      I confirm this request is genuine and needed for actual
                      beneficiaries in Avadi.
                    </span>
                  </label>
                  {errors.confirmedGenuine && (
                    <p className="text-[11px] font-bold text-rose-500 pl-6">
                      {errors.confirmedGenuine}
                    </p>
                  )}
                </div>

                <div
                  id="donation-agreedGuidelines"
                  data-field="agreedGuidelines"
                  className={`space-y-1 p-2 rounded-xl transition ${
                    errors.agreedGuidelines ? "bg-rose-50/50 border border-rose-300 dark:border-rose-900/60" : ""
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.agreedGuidelines}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          agreedGuidelines: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>
                      I agree to the Community Guidelines and understand that
                      fraudulent posts will be banned and reported.
                    </span>
                  </label>
                  {errors.agreedGuidelines && (
                    <p className="text-[11px] font-bold text-rose-500 pl-6">
                      {errors.agreedGuidelines}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Navigation Buttons */}
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
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                <span>
                  {isSubmitting
                    ? "Submitting..."
                    : editingRequest
                      ? "Update Request"
                      : "Post Donation Request"}
                </span>
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Street to Ward Mapping Modal (Find Your Street Modal) */}
      <Modal
        isOpen={isStreetWardModalOpen}
        onClose={() => setIsStreetWardModalOpen(false)}
        title="Select Municipal Ward & Street"
      >
        <WardSelector
          onClose={() => setIsStreetWardModalOpen(false)}
          onCustomSelect={(wardNo, selectedStreet) => {
            setFormData((prev) => ({
              ...prev,
              ward: wardNo,
              address: selectedStreet ? selectedStreet : prev.address,
            }));
            handleRepinWard(wardNo);
            setIsStreetWardModalOpen(false);
          }}
        />
      </Modal>
    </>
  );
};

export default CreateDonationModal;
