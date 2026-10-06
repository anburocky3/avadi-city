/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Stethoscope,
  Pill,
  Activity,
  Building2,
  PawPrint,
  Phone,
  Mail,
  MapPin,
  Search,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Ambulance,
  Globe,
} from "lucide-react";

import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { TimePickerDropdown } from "@/components/ui/TimePickerDropdown";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";
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

// Facility Types configuration
const FACILITY_TYPES = [
  { id: "Hospital", label: "Hospital", icon: HeartPulse, desc: "Multispeciality or general hospital" },
  { id: "Clinic", label: "Clinic", icon: Stethoscope, desc: "Consultation, outpatient & specialized care" },
  { id: "Pharmacy", label: "Pharmacy", icon: Pill, desc: "Medical store & pharmaceuticals" },
  { id: "Medical Centre", label: "Medical Centre", icon: Activity, desc: "Primary healthcare & family care" },
  { id: "Diagnostic Centre", label: "Diagnostic Centre", icon: Building2, desc: "Pathology, scans, X-ray & lab" },
  { id: "Pet Hospital", label: "Pet Hospital", icon: PawPrint, desc: "Veterinary emergency & surgery" },
  { id: "Pet Clinic", label: "Pet Clinic", icon: PawPrint, desc: "Veterinary care & pet vaccines" },
];

// Interface for dynamic healthcare services
export interface HealthcareServiceItem {
  name: string;
  icon: string;
  group?: string;
}

// Dynamic Healthcare Services mapped by Facility Type
const DYNAMIC_SERVICES_BY_TYPE: Record<string, HealthcareServiceItem[]> = {
  Hospital: [
    // General & Emergency
    { name: "General Medicine", icon: "🩺", group: "General & Emergency" },
    { name: "Emergency Care", icon: "🚨", group: "General & Emergency" },
    { name: "Inpatient Care", icon: "🏥", group: "General & Emergency" },
    { name: "Ambulance Service", icon: "🚑", group: "General & Emergency" },

    // Medical Specialties
    { name: "Cardiology", icon: "❤️", group: "Medical Specialties" },
    { name: "Orthopedics", icon: "🦴", group: "Medical Specialties" },
    { name: "Pediatrics", icon: "🧒", group: "Medical Specialties" },
    { name: "Gynecology", icon: "👩", group: "Medical Specialties" },
    { name: "ENT", icon: "👂", group: "Medical Specialties" },
    { name: "Ophthalmology", icon: "👁️", group: "Medical Specialties" },
    { name: "Dermatology", icon: "🧴", group: "Medical Specialties" },
    { name: "Neurology", icon: "🧠", group: "Medical Specialties" },
    { name: "General Surgery", icon: "🩸", group: "Medical Specialties" },

    // Diagnostic & Support
    { name: "Laboratory / Blood Tests", icon: "🧪", group: "Diagnostic & Support" },
    { name: "X-Ray", icon: "🩻", group: "Diagnostic & Support" },
    { name: "Scanning / Imaging", icon: "🖥️", group: "Diagnostic & Support" },
    { name: "In-house Pharmacy", icon: "💊", group: "Diagnostic & Support" },
    { name: "Health Checkup", icon: "🩺", group: "Diagnostic & Support" },
  ],
  Clinic: [
    { name: "General Consultation", icon: "🩺" },
    { name: "Pediatrics", icon: "🧒" },
    { name: "Cardiology", icon: "❤️" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Gynecology", icon: "👩" },
    { name: "ENT", icon: "👂" },
    { name: "Ophthalmology", icon: "👁️" },
    { name: "Dental", icon: "🦷" },
    { name: "Dermatology", icon: "🧴" },
    { name: "Neurology", icon: "🧠" },
    { name: "Physiotherapy", icon: "💪" },
    { name: "Laboratory / Blood Tests", icon: "🧪" },
    { name: "Health Checkup", icon: "🩺" },
    { name: "Appointment Available", icon: "📅" },
  ],
  Pharmacy: [
    { name: "Prescription Medicines", icon: "💊" },
    { name: "OTC Medicines", icon: "💊" },
    { name: "Home Delivery", icon: "🏠" },
    { name: "Phone / WhatsApp Order", icon: "📞" },
    { name: "Generic Medicines", icon: "🧬" },
    { name: "Medical Equipment", icon: "🩺" },
    { name: "Baby Care Products", icon: "🍼" },
    { name: "Personal Care Products", icon: "🧴" },
    { name: "First Aid Supplies", icon: "🩹" },
    { name: "Basic Healthcare Supplies", icon: "💉" },
  ],
  "Medical Centre": [
    { name: "General Consultation", icon: "🩺" },
    { name: "Pediatrics", icon: "🧒" },
    { name: "Cardiology", icon: "❤️" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Gynecology", icon: "👩" },
    { name: "Dental", icon: "🦷" },
    { name: "ENT", icon: "👂" },
    { name: "Ophthalmology", icon: "👁️" },
    { name: "Dermatology", icon: "🧴" },
    { name: "Physiotherapy", icon: "💪" },
    { name: "Laboratory / Blood Tests", icon: "🧪" },
    { name: "X-Ray / Imaging", icon: "🩻" },
    { name: "Preventive Health Checkup", icon: "🩺" },
    { name: "Appointment Available", icon: "📅" },
  ],
  "Diagnostic Centre": [
    // Laboratory
    { name: "Blood Test", icon: "🩸", group: "Laboratory" },
    { name: "Urine Test", icon: "🧪", group: "Laboratory" },
    { name: "Pathology", icon: "🧬", group: "Laboratory" },
    { name: "Microbiology", icon: "🧫", group: "Laboratory" },
    { name: "Biochemistry", icon: "🧪", group: "Laboratory" },

    // Imaging
    { name: "X-Ray", icon: "🩻", group: "Imaging" },
    { name: "CT Scan", icon: "🖥️", group: "Imaging" },
    { name: "MRI Scan", icon: "🧠", group: "Imaging" },
    { name: "Ultrasound / Scan", icon: "📡", group: "Imaging" },
    { name: "ECG", icon: "❤️", group: "Imaging" },

    // Packages
    { name: "Full Body Health Checkup", icon: "🩺", group: "Packages" },
    { name: "Cardiac Health Checkup", icon: "❤️", group: "Packages" },
    { name: "Women's Health Checkup", icon: "👩", group: "Packages" },
    { name: "Children's Health Checkup", icon: "🧒", group: "Packages" },
  ],
  "Pet Hospital": [
    { name: "General Pet Consultation", icon: "🐶" },
    { name: "Emergency Pet Care", icon: "🚨" },
    { name: "Vaccination", icon: "💉" },
    { name: "Surgery", icon: "🩺" },
    { name: "Orthopedic Care", icon: "🦴" },
    { name: "Laboratory Tests", icon: "🧪" },
    { name: "X-Ray / Imaging", icon: "🩻" },
    { name: "Pet Pharmacy", icon: "💊" },
    { name: "Dental Care", icon: "🦷" },
    { name: "Deworming", icon: "🪱" },
    { name: "Grooming", icon: "🐕" },
    { name: "Pet Inpatient Care", icon: "🏥" },
    { name: "Pet Ambulance", icon: "🚑" },
  ],
  "Pet Clinic": [
    { name: "General Pet Consultation", icon: "🐶" },
    { name: "Vaccination", icon: "💉" },
    { name: "Deworming", icon: "🪱" },
    { name: "Preventive Care", icon: "🩺" },
    { name: "Dental Care", icon: "🦷" },
    { name: "Minor Procedures", icon: "🩹" },
    { name: "Basic Laboratory Tests", icon: "🧪" },
    { name: "Pet Medicines", icon: "💊" },
    { name: "Grooming", icon: "🐕" },
    { name: "Appointment Available", icon: "📅" },
  ],
};

// Appointment availability options
const APPOINTMENT_OPTIONS = [
  "Phone Appointment",
  "Online Appointment",
  "Walk-in",
  "Not Available",
];

// Ward center coordinates for Avadi (Wards 1 to 48)
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
  29: { lat: 13.1197, lng: 80.15 },
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

export default function CreateFacilityPage() {
  const router = useRouter();
  const toast = useToast();
  const { activeWard, isAuthenticated, isLoadingAuth } = useWard();

  // Element references for scroll behavior & file inputs
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  // Wizard Navigation: Step 1, 2, or 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Authentication Guard
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace("/login?redirect=/hospitals/create");
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
  const scrollToFirstError = (errorKeys: string[]) => {
    if (!errorKeys || errorKeys.length === 0) return;

    const fieldIdMap: Record<string, string> = {
      // Step 1
      facilityType: "field-facility-type",
      services: "field-services",
      // Step 2
      name: "facility-name-input",
      description: "facility-description-input",
      phone: "facility-phone-input",
      email: "facility-email-input",
      streetArea: "street-search-input",
      facilityAddress: "facility-address-input",
      openingTime: "field-timings",
      closingTime: "field-timings",
      // Step 3
      primaryImage: "field-primary-image",
      ambulancePhone: "ambulance-phone-input",
      terms: "field-terms",
    };

    setTimeout(() => {
      for (const key of errorKeys) {
        const elId = fieldIdMap[key] || key;
        const targetEl = document.getElementById(elId);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = scrollTop + rect.top - 100;

          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth",
          });

          if (
            targetEl instanceof HTMLInputElement ||
            targetEl instanceof HTMLTextAreaElement ||
            targetEl instanceof HTMLSelectElement
          ) {
            targetEl.focus({ preventScroll: true });
          }
          break;
        }
      }
    }, 60);
  };

  // Directly navigate to public cards page
  const handleTopBack = () => {
    router.push("/hospitals");
  };

  // ==========================================
  // STEP 1 STATE: FACILITY PROFILE
  // ==========================================
  const [selectedFacilityTypes, setSelectedFacilityTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // ==========================================
  // STEP 2 STATE: FACILITY INFORMATION
  // ==========================================
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [ward, setWard] = useState<number>(activeWard?.id || 14);
  const [latitude, setLatitude] = useState<number>(13.1169);
  const [longitude, setLongitude] = useState<number>(80.0972);
  const [mapError, setMapError] = useState<string | null>(null);
  const [facilityAddress, setFacilityAddress] = useState("");
  const [isOpen24Hours, setIsOpen24Hours] = useState(false);
  const [openingTime, setOpeningTime] = useState("9:00 AM");
  const [closingTime, setClosingTime] = useState("9:00 PM");

  // Location Autocomplete state
  const [streetQuery, setStreetQuery] = useState("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] = useState<StreetItem | null>(null);

  // ==========================================
  // STEP 3 STATE: DETAILS & CONFIRMATION
  // ==========================================
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(null);

  const additionalImageFiles: File[] = [];

  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [ambulanceAvailable, setAmbulanceAvailable] = useState(false);
  const [ambulancePhone, setAmbulancePhone] = useState("");
  const [appointmentType, setAppointmentType] = useState<string>("Walk-in");
  const [homeDeliveryAvailable, setHomeDeliveryAvailable] = useState(false);
  const selectedPayments = ["Cash", "UPI"];
  const [website, setWebsite] = useState("");
  const [socialLink, setSocialLink] = useState("");

  // Key Services state (small chips with 'X')
  const [keyServices, setKeyServices] = useState<string[]>([]);
  const [keyServiceInput, setKeyServiceInput] = useState("");
  const [keyServiceError, setKeyServiceError] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission & Validation UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync ward if activeWard updates
  useEffect(() => {
    if (activeWard?.id && activeWard.id >= 1 && activeWard.id <= 48) {
      setWard((current) => (current === 14 ? activeWard.id : current));
      const coords = AVADI_WARD_COORDINATES[activeWard.id];
      if (coords && latitude === 13.1169 && longitude === 80.0972) {
        setLatitude(coords.lat);
        setLongitude(coords.lng);
      }
    }
  }, [activeWard?.id, latitude, longitude]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (primaryImagePreview && primaryImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(primaryImagePreview);
      }
    };
  }, [primaryImagePreview]);

  // Close street search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(e.target as Node)
      ) {
        setStreetResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Is pharmacy selected in Step 1?
  const isPharmacySelected = selectedFacilityTypes.some((t) =>
    t.toLowerCase().includes("pharmacy")
  );

  // Step 1 Validation Check for enabling/disabling Continue button
  const isStep1Valid = selectedFacilityTypes.length > 0 && selectedServices.length > 0;

  // ==========================================
  // HANDLERS: STEP 1
  // ==========================================
  const toggleFacilityType = (typeId: string) => {
    setSelectedFacilityTypes((prev) => {
      const isSelected = prev.includes(typeId);
      // Select the clicked facility type or deselect if already chosen
      const nextType = isSelected ? [] : [typeId];

      // CRITICAL RULE 4: Clear invalid selections that don't belong to the new Facility Type
      const validServicesForNewType = nextType[0]
        ? (DYNAMIC_SERVICES_BY_TYPE[nextType[0]] || []).map((s) => s.name)
        : [];

      setSelectedServices((prevServices) =>
        prevServices.filter((s) => validServicesForNewType.includes(s))
      );

      if (fieldErrors.facilityType) {
        setFieldErrors((p) => ({ ...p, facilityType: "" }));
      }
      return nextType;
    });
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) => {
      const exists = prev.includes(serviceName);
      const updated = exists
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName];
      if (fieldErrors.services) {
        setFieldErrors((p) => ({ ...p, services: "" }));
      }
      return updated;
    });
  };

  const validateStep1 = (): string[] => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (selectedFacilityTypes.length === 0) {
      errors.facilityType = "Please select a Facility Type.";
      errorKeys.push("facilityType");
    }

    if (selectedServices.length === 0) {
      errors.services = "Please select at least one Healthcare Service.";
      errorKeys.push("services");
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return errorKeys;
  };

  const handleContinueStep1 = () => {
    const errorKeys = validateStep1();
    if (errorKeys.length === 0) {
      goToStep(2);
    } else {
      scrollToFirstError(errorKeys);
      toast.error(
        "Please select a Facility Type and at least one relevant Service to continue."
      );
    }
  };

  // ==========================================
  // HANDLERS: STEP 2
  // ==========================================
  const handleStreetSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setStreetQuery(q);
    setStreetArea(q);
    setSelectedStreetItem(null);

    if (!q.trim() || q.trim().length < 2) {
      setStreetResults([]);
      return;
    }

    const matches = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(q.toLowerCase().trim())
    );

    setStreetResults(matches.slice(0, 15));
  };

  const handleSelectStreetItem = (item: StreetItem) => {
    setSelectedStreetItem(item);
    setStreetQuery(item.streetName);
    setStreetArea(item.streetName);
    setStreetResults([]);
    // Ward is derived internally from authoritative Avadi data
    setWard(item.wardNo);

    // Update map to selected ward coordinates
    const coords = AVADI_WARD_COORDINATES[item.wardNo] || { lat: 13.1169, lng: 80.0972 };
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setMapError(null);

    if (fieldErrors.streetArea) {
      setFieldErrors((prev) => ({ ...prev, streetArea: "" }));
    }
  };

  const validateStep2 = (): string[] => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (!name.trim()) {
      errors.name = "Facility Name is required.";
      errorKeys.push("name");
    } else if (name.trim().length < 2) {
      errors.name = "Facility Name must be at least 2 characters.";
      errorKeys.push("name");
    }

    if (!description.trim()) {
      errors.description = "Facility Description is required.";
      errorKeys.push("description");
    } else if (description.trim().length < 10) {
      errors.description = "Please provide a detailed description (at least 10 characters).";
      errorKeys.push("description");
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (!cleanPhone) {
      errors.phone = "Phone number is required.";
      errorKeys.push("phone");
    } else if (cleanPhone.replace(/[^0-9]/g, "").length < 10) {
      errors.phone = "Phone number must be at least 10 digits.";
      errorKeys.push("phone");
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
      errorKeys.push("email");
    }

    if (!streetArea.trim()) {
      errors.streetArea = "Area / Street from Avadi is required.";
      errorKeys.push("streetArea");
    }

    if (!facilityAddress.trim()) {
      errors.facilityAddress = "Facility Address is required.";
      errorKeys.push("facilityAddress");
    } else if (facilityAddress.trim().length < 3) {
      errors.facilityAddress = "Facility Address must be at least 3 characters.";
      errorKeys.push("facilityAddress");
    }

    if (!isOpen24Hours) {
      if (!openingTime) {
        errors.openingTime = "Opening Time is required.";
        errorKeys.push("openingTime");
      }
      if (!closingTime) {
        errors.closingTime = "Closing Time is required.";
        errorKeys.push("closingTime");
      }
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return errorKeys;
  };

  const handleContinueStep2 = () => {
    const errorKeys = validateStep2();
    if (errorKeys.length === 0) {
      goToStep(3);
    } else {
      scrollToFirstError(errorKeys);
      toast.error("Please fill in all required facility details.");
    }
  };

  // ==========================================
  // HANDLERS: STEP 3
  // ==========================================
  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Primary Image size must be less than 5MB.");
      return;
    }

    if (primaryImagePreview && primaryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(primaryImagePreview);
    }

    setPrimaryImageFile(file);
    setPrimaryImagePreview(URL.createObjectURL(file));
    if (fieldErrors.primaryImage) {
      setFieldErrors((prev) => ({ ...prev, primaryImage: "" }));
    }
  };

  const handleRemovePrimaryImage = () => {
    if (primaryImagePreview && primaryImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(primaryImagePreview);
    }
    setPrimaryImageFile(null);
    setPrimaryImagePreview(null);
    if (primaryFileInputRef.current) primaryFileInputRef.current.value = "";
  };

  // Key Services individual additions
  const handleAddKeyService = () => {
    const trimmed = keyServiceInput.trim();
    if (!trimmed) {
      setKeyServiceError("Please enter a service name.");
      return;
    }

    if (keyServices.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setKeyServiceError("This key service has already been added.");
      return;
    }

    if (keyServices.length >= 12) {
      setKeyServiceError("You can add up to 12 key services.");
      return;
    }

    setKeyServices((prev) => [...prev, trimmed]);
    setKeyServiceInput("");
    setKeyServiceError("");
  };

  const handleRemoveKeyService = (serviceToRemove: string) => {
    setKeyServices((prev) => prev.filter((s) => s !== serviceToRemove));
  };

  const validateStep3 = (): string[] => {
    const errors: Record<string, string> = {};
    const errorKeys: string[] = [];

    if (!primaryImageFile) {
      errors.primaryImage = "Facility image is mandatory.";
      errorKeys.push("primaryImage");
    }

    if (ambulanceAvailable && !ambulancePhone.trim()) {
      errors.ambulancePhone = "Ambulance contact number is required when ambulance is available.";
      errorKeys.push("ambulancePhone");
    }

    if (!termsAccepted) {
      errors.terms = "Please agree to the Terms & Verification before submitting.";
      errorKeys.push("terms");
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return errorKeys;
  };

  // ==========================================
  // FINAL SUBMISSION
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs1 = validateStep1();
    if (errs1.length > 0) {
      goToStep(1);
      scrollToFirstError(errs1);
      toast.error("Please select facility type and services in Step 1.");
      return;
    }

    const errs2 = validateStep2();
    if (errs2.length > 0) {
      goToStep(2);
      scrollToFirstError(errs2);
      toast.error("Please fill all required facility information in Step 2.");
      return;
    }

    const errs3 = validateStep3();
    if (errs3.length > 0) {
      scrollToFirstError(errs3);
      toast.error("Please complete the required information before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("facilityType", selectedFacilityTypes.join(", "));
      formData.append("category", selectedFacilityTypes[0] || "Hospitals");
      formData.append("description", description.trim());
      formData.append("phone", phone.trim());
      if (alternatePhone.trim()) formData.append("alternatePhone", alternatePhone.trim());
      if (email.trim()) formData.append("email", email.trim());

      const fullAddress = [facilityAddress.trim(), streetArea.trim()]
        .filter(Boolean)
        .join(", ");
      formData.append("address", fullAddress);
      formData.append("areaLandmark", streetArea.trim());
      formData.append("ward", ward.toString());

      if (latitude) formData.append("latitude", latitude.toString());
      if (longitude) formData.append("longitude", longitude.toString());

      formData.append("is24x7", isOpen24Hours ? "true" : "false");
      formData.append("openingTime", isOpen24Hours ? "Open 24 Hours" : openingTime);
      formData.append("closingTime", isOpen24Hours ? "Open 24 Hours" : closingTime);

      formData.append("services", JSON.stringify(selectedServices));
      formData.append("emergencyAvailable", emergencyAvailable ? "true" : "false");
      formData.append("ambulanceAvailable", ambulanceAvailable ? "true" : "false");
      if (ambulanceAvailable && ambulancePhone.trim()) {
        formData.append("ambulancePhone", ambulancePhone.trim());
      }
      formData.append("appointments", appointmentType);
      formData.append("homeDelivery", homeDeliveryAvailable ? "true" : "false");
      formData.append("paymentMethods", JSON.stringify(selectedPayments));

      if (website.trim()) formData.append("website", website.trim());
      if (socialLink.trim()) formData.append("socialLink", socialLink.trim());
      formData.append("keyServices", JSON.stringify(keyServices));

      formData.append("termsAccepted", "true");

      if (primaryImageFile) {
        formData.append("image", primaryImageFile);
      }

      additionalImageFiles.forEach((file) => {
        formData.append("additionalImages", file);
      });

      const response = await fetch("/api/hospitals", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit facility.");
      }

      setShowSuccessModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during submission.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={wizardTopRef} className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Main Title */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <HeartPulse size={24} className="text-rose-600" />
          <span>Register New Healthcare Facility</span>
        </h1>
        <div>
          <button
            type="button"
            onClick={() => router.push("/hospitals")}
            aria-label="Back to Hospitals & Pharmacies"
            className="inline-flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xl font-bold transition cursor-pointer hover:-translate-x-1"
          >
            ←
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Add hospitals, clinics, 24/7 pharmacies, or medical centres to Avadi Connect.
          Submissions undergo official verification before appearing publicly.
        </p>
      </div>

      {/* 2. Main Wizard Unified Single Card Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* Top Segmented Progress Bar */}
          <div className="space-y-3.5 border-b border-slate-100 dark:border-slate-800 pb-5 sm:pb-6">
            {/* Horizontal Segmented Progress Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  onClick={() => {
                    if (stepNum < currentStep) goToStep(stepNum as 1 | 2 | 3);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stepNum < currentStep
                      ? "bg-emerald-500 shadow-xs shadow-emerald-500/30 cursor-pointer hover:opacity-85"
                      : stepNum === currentStep
                      ? "bg-orange-500 shadow-sm shadow-orange-500/40"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                  title={
                    stepNum < currentStep
                      ? `Step ${stepNum} (Completed - Click to return)`
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
                  {currentStep === 1 && "Facility Profile & Services"}
                  {currentStep === 2 && "Facility Information & Location"}
                  {currentStep === 3 && "Facility Details & Confirmation"}
                </h2>
              </div>

              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-black tracking-tight shrink-0 shadow-2xs">
                {currentStep}/3
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP 1: FACILITY PROFILE */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Facility Type */}
              <div
                id="field-facility-type"
                className={`space-y-3 p-3 -m-3 rounded-2xl transition duration-150 ${
                  fieldErrors.facilityType
                    ? "ring-2 ring-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20"
                    : ""
                }`}
              >
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Facility Type <span className="text-rose-500">*</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the category that best describes your healthcare facility.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {FACILITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedFacilityTypes.includes(type.id);

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleFacilityType(type.id)}
                        className={`p-3.5 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-xs"
                            : "bg-slate-50/60 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 transition ${
                            isSelected
                              ? "bg-rose-600 text-white"
                              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm font-bold leading-tight ${
                              isSelected
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {type.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.facilityType && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pt-1">
                    <AlertCircle size={13} /> {fieldErrors.facilityType}
                  </p>
                )}
              </div>

              {/* Dynamic Healthcare Services */}
              <div
                id="field-services"
                className={`space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 p-3 -m-3 rounded-2xl transition duration-150 ${
                  fieldErrors.services
                    ? "ring-2 ring-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20"
                    : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Healthcare Services <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedFacilityTypes.length > 0
                        ? `Select relevant services for ${selectedFacilityTypes[0]}. Only selected services are stored.`
                        : "Select a Facility Type above to display relevant healthcare services."}
                    </p>
                  </div>
                  {selectedFacilityTypes.length > 0 && selectedServices.length > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200/80 dark:border-rose-900/60 w-fit">
                      {selectedServices.length} selected
                    </span>
                  )}
                </div>

                {selectedFacilityTypes.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/30">
                    <HeartPulse className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={28} />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select a Facility Type above
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Relevant healthcare services will appear dynamically based on your choice.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const currentType = selectedFacilityTypes[0];
                    const serviceList = DYNAMIC_SERVICES_BY_TYPE[currentType] || [];
                    const hasGroups = serviceList.some((s) => Boolean(s.group));

                    if (hasGroups) {
                      const groupsMap: Record<string, HealthcareServiceItem[]> = {};
                      serviceList.forEach((s) => {
                        const g = s.group || "Other Services";
                        if (!groupsMap[g]) groupsMap[g] = [];
                        groupsMap[g].push(s);
                      });

                      return (
                        <div className="space-y-4 pt-1">
                          {Object.entries(groupsMap).map(([groupTitle, items]) => (
                            <div key={groupTitle} className="space-y-2">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {groupTitle}
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {items.map((service) => {
                                  const isSelected = selectedServices.includes(service.name);
                                  return (
                                    <button
                                      key={service.name}
                                      type="button"
                                      onClick={() => toggleService(service.name)}
                                      className={`p-3 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-center gap-2.5 ${
                                        isSelected
                                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-xs scale-[1.01]"
                                          : "bg-slate-50/60 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                                      }`}
                                    >
                                      <span className="text-lg leading-none shrink-0" role="img" aria-label={service.name}>
                                        {service.icon}
                                      </span>
                                      <span
                                        className={`text-xs font-bold leading-tight line-clamp-2 ${
                                          isSelected
                                            ? "text-rose-700 dark:text-rose-300"
                                            : "text-slate-800 dark:text-slate-200"
                                        }`}
                                      >
                                        {service.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                        {serviceList.map((service) => {
                          const isSelected = selectedServices.includes(service.name);
                          return (
                            <button
                              key={service.name}
                              type="button"
                              onClick={() => toggleService(service.name)}
                              className={`p-3 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-xs scale-[1.01]"
                                  : "bg-slate-50/60 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <span className="text-lg leading-none shrink-0" role="img" aria-label={service.name}>
                                {service.icon}
                              </span>
                              <span
                                className={`text-xs font-bold leading-tight line-clamp-2 ${
                                  isSelected
                                    ? "text-rose-700 dark:text-rose-300"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {service.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                )}

                {fieldErrors.services && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pt-1">
                    <AlertCircle size={13} /> {fieldErrors.services}
                  </p>
                )}
              </div>

              {/* Step 1 Continue Action */}
              <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleContinueStep1}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-98"
                >
                  <span>Continue to Facility Information</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: FACILITY INFORMATION */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Facility Name & Description */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="facility-name-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="facility-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="e.g. Sri Lakshmi Hospital, ABC Medicals"
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      fieldErrors.name
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Description directly below Facility Name */}
                <div>
                  <label
                    htmlFor="facility-description-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="facility-description-input"
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (fieldErrors.description)
                        setFieldErrors((p) => ({ ...p, description: "" }));
                    }}
                    placeholder="Describe your facility, specializations, primary departments, doctors, facilities, and other useful patient information..."
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-medium bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      fieldErrors.description
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.description}
                    </p>
                  )}
                </div>

                {/* Phone & Alternate Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="facility-phone-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="facility-phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                        }}
                        placeholder="e.g. 044 2638 0255 or 98400 12345"
                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          fieldErrors.phone
                            ? "border-rose-400 focus:ring-rose-400"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
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
                      htmlFor="facility-alt-phone-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Alternate Phone <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="facility-alt-phone-input"
                        type="tel"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                        placeholder="Reception, emergency, or pharmacy desk"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="facility-email-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="facility-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                      }}
                      placeholder="contact@facility.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        fieldErrors.email
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Location &amp; Coordinates
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Search Avadi street or area from the official municipal registry.
                  </p>
                </div>

                {/* Area / Street Autocomplete */}
                <div ref={locationContainerRef} className="relative space-y-1.5">
                  <label
                    htmlFor="street-search-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Area / Street <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="street-search-input"
                      type="text"
                      value={streetQuery}
                      onChange={handleStreetSearchChange}
                      placeholder="Search Avadi street or area (e.g. CTH Road, HVF, Gandhi Nagar)..."
                      className={`w-full pl-4 pr-10 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
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

                  {/* Autocomplete Dropdown */}
                  {streetResults.length > 0 && !selectedStreetItem && (
                    <ul className="absolute z-20 w-full mt-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xl max-h-56 overflow-y-auto">
                      {streetResults.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleSelectStreetItem(item)}
                          className="p-3 hover:bg-rose-50/60 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin size={15} className="text-rose-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate capitalize">
                              {item.streetName}
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                            Ward {item.wardNo}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {fieldErrors.streetArea && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.streetArea}
                    </p>
                  )}
                </div>

                {/* MAP DISPLAY (PLACED ABOVE FACILITY ADDRESS) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <MapPin size={15} className="text-rose-600" />
                      <span>Pinpoint Facility on Avadi Map</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      (Drag marker to adjust pin)
                    </span>
                  </div>

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
                    <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {mapError}
                    </p>
                  )}

                  {latitude && longitude && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Selected Coordinates:{" "}
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {latitude.toFixed(5)}, {longitude.toFixed(5)}
                      </span>
                    </p>
                  )}
                </div>

                {/* FACILITY ADDRESS (PLACED BELOW THE MAP) */}
                <div>
                  <label
                    htmlFor="facility-address-input"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                  >
                    Facility Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="facility-address-input"
                    type="text"
                    value={facilityAddress}
                    onChange={(e) => {
                      setFacilityAddress(e.target.value);
                      if (fieldErrors.facilityAddress)
                        setFieldErrors((p) => ({ ...p, facilityAddress: "" }));
                    }}
                    placeholder="Door No., Building Name, Street / Landmark, Avadi, Chennai - 600054"
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                      fieldErrors.facilityAddress
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {fieldErrors.facilityAddress && (
                    <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.facilityAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Hours */}
              <div id="field-timings" className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Operational Hours
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Operating schedule in 12-hour AM/PM format.
                    </p>
                  </div>

                  {/* Open 24 Hours Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsOpen24Hours(!isOpen24Hours)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black border transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                      isOpen24Hours
                        ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <ShieldAlert size={14} />
                    <span>Open 24 Hours</span>
                  </button>
                </div>

                {!isOpen24Hours ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        Opening Time <span className="text-rose-500">*</span>
                      </label>
                      <TimePickerDropdown
                        value={openingTime}
                        onChange={(t) => {
                          setOpeningTime(t);
                          if (fieldErrors.openingTime)
                            setFieldErrors((p) => ({ ...p, openingTime: "" }));
                        }}
                        hasError={Boolean(fieldErrors.openingTime)}
                      />
                      {fieldErrors.openingTime && (
                        <p className="mt-1 text-xs font-semibold text-rose-500">
                          {fieldErrors.openingTime}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                        Closing Time <span className="text-rose-500">*</span>
                      </label>
                      <TimePickerDropdown
                        value={closingTime}
                        onChange={(t) => {
                          setClosingTime(t);
                          if (fieldErrors.closingTime)
                            setFieldErrors((p) => ({ ...p, closingTime: "" }));
                        }}
                        hasError={Boolean(fieldErrors.closingTime)}
                      />
                      {fieldErrors.closingTime && (
                        <p className="mt-1 text-xs font-semibold text-rose-500">
                          {fieldErrors.closingTime}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-800 dark:text-rose-300">
                    <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                    <p className="text-xs font-semibold">
                      Facility will be displayed as <span className="font-black">Open 24 Hours</span> for emergency and round-the-clock care.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2 Back & Continue Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Back to Profile
                </button>

                <button
                  type="button"
                  onClick={handleContinueStep2}
                  className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: FACILITY DETAILS & CONFIRMATION */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Primary Image Upload (Required) */}
              <div
                id="field-primary-image"
                className={`space-y-3 p-3 -m-3 rounded-2xl transition duration-150 ${
                  fieldErrors.primaryImage
                    ? "ring-2 ring-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20"
                    : ""
                }`}
              >
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Facility Image <span className="text-rose-500">*</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload high quality photo of hospital front, clinic entrance, or pharmacy storefront (max 5MB).
                  </p>
                </div>

                <input
                  ref={primaryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryImageChange}
                  className="hidden"
                  id="facility-primary-image-upload"
                />

                {primaryImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={primaryImagePreview}
                      alt="Facility preview"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePrimaryImage}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white transition cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="facility-primary-image-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl hover:border-rose-400 dark:hover:border-rose-600 transition cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 text-center space-y-2 group"
                  >
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 group-hover:scale-105 transition">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to upload main facility image
                    </p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, or WebP up to 5MB</p>
                  </label>
                )}

                {fieldErrors.primaryImage && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {fieldErrors.primaryImage}
                  </p>
                )}
              </div>



              {/* Read-Only Services Summary */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Services Summary
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Services configured in Step 1 (read-only).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedServices.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emergency & Ambulance Services */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Emergency &amp; Critical Care
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select available emergency capabilities. Do not claim services not provided.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEmergencyAvailable(!emergencyAvailable)}
                    className={`p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-start gap-3 ${
                      emergencyAvailable
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 transition ${
                        emergencyAvailable
                          ? "bg-rose-600 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200/80 dark:border-slate-700"
                      }`}
                    >
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold">Emergency Care Available</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Trauma, casualty or urgent medical care
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAmbulanceAvailable(!ambulanceAvailable)}
                    className={`p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-start gap-3 ${
                      ambulanceAvailable
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20"
                        : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 transition ${
                        ambulanceAvailable
                          ? "bg-rose-600 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200/80 dark:border-slate-700"
                      }`}
                    >
                      <Ambulance size={18} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold">Ambulance Available</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Dedicated ambulance on standby
                      </p>
                    </div>
                  </button>
                </div>

                {ambulanceAvailable && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <label
                      htmlFor="ambulance-phone-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Ambulance Direct Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="ambulance-phone-input"
                      type="tel"
                      value={ambulancePhone}
                      onChange={(e) => {
                        setAmbulancePhone(e.target.value);
                        if (fieldErrors.ambulancePhone)
                          setFieldErrors((p) => ({ ...p, ambulancePhone: "" }));
                      }}
                      placeholder="e.g. 108 or direct driver/desk mobile"
                      className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        fieldErrors.ambulancePhone
                          ? "border-rose-400 focus:ring-rose-400"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    />
                    {fieldErrors.ambulancePhone && (
                      <p className="mt-1 text-xs font-semibold text-rose-500">
                        {fieldErrors.ambulancePhone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Appointments Available */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Appointments Available
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select how patients can consult your medical specialists.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {APPOINTMENT_OPTIONS.map((opt) => {
                    const isSelected = appointmentType === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAppointmentType(opt)}
                        className={`p-3 rounded-2xl border text-center transition duration-150 cursor-pointer text-xs font-bold ${
                          isSelected
                            ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pharmacy Home Delivery */}
              {isPharmacySelected && (
                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        Pharmacy Home Delivery
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Do you deliver medicines within Avadi?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHomeDeliveryAvailable(!homeDeliveryAvailable)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black border transition cursor-pointer ${
                        homeDeliveryAvailable
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {homeDeliveryAvailable ? "Delivery Active" : "No Delivery"}
                    </button>
                  </div>
                </div>
              )}



              {/* Key Services */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Key Services &amp; Packages
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add highlighted treatments or tests (e.g. Full Body Checkup, ECG, Blood Test).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyServiceInput}
                    onChange={(e) => {
                      setKeyServiceInput(e.target.value);
                      if (keyServiceError) setKeyServiceError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyService();
                      }
                    }}
                    placeholder="e.g. Full Body Checkup, Digital X-Ray, Dental Cleaning"
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyService}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {keyServiceError && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> {keyServiceError}
                  </p>
                )}

                {keyServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {keyServices.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 text-xs font-bold shadow-xs"
                      >
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyService(service)}
                          className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Online Links */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Online Links <span className="text-slate-400 font-normal">(Optional)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official website or Google profile / social media page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="facility-website-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="facility-website-input"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://examplehospital.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="facility-social-input"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
                    >
                      Social Media / Maps Link
                    </label>
                    <input
                      id="facility-social-input"
                      type="url"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
                      placeholder="https://instagram.com/facility or Google profile"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Verification Checkbox */}
              <div
                id="field-terms"
                className={`p-4 sm:p-5 rounded-2xl border transition space-y-2 ${
                  fieldErrors.terms
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800"
                    : "bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (fieldErrors.terms) setFieldErrors((p) => ({ ...p, terms: "" }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    I confirm that all details, license information, phone numbers, and operational timings provided above are authentic and accurate for this healthcare establishment in Avadi Corporation. I understand this listing requires administrator review before going live.
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 pl-7">
                    <AlertCircle size={13} /> {fieldErrors.terms}
                  </p>
                )}
              </div>

              {/* Step 3 Back & Submit Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Back to Information
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Facility...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Facility</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Facility Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                ✅{" "}
                <span className="text-rose-600 font-bold">
                  {name.trim() || "Your facility"}
                </span>{" "}
                has been submitted and is waiting for admin review.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/healthcare")}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm shadow-sm transition cursor-pointer active:scale-98"
              >
                Back to Hospitals &amp; Pharmacies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
