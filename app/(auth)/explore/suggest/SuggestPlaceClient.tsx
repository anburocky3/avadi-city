"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ImagePlus,
  Trash2,
  Clock,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Car,
  Bike,
  Ticket,
  BadgeCheck,
  Search,
  X,
  Building2,
  Layers,
  ShieldCheck,
  Bell,
  UserCheck,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sunrise,
  Sunset,
  Sun,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "@/utils/toast";
import { ALL_AVADI_STREETS } from "@/lib/wards";

// Dynamic import for Leaflet map (SSR-safe)
const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-2xl bg-slate-800/60 animate-pulse border border-slate-700/50" />
    ),
  }
);

// ─── Landmarks ─────────────────────────────────────────────────────────────────
interface LandmarkItem {
  id: string;
  streetName: string;
  wardNo: number;
  lat: number;
  lng: number;
}

const AVADI_LANDMARKS: LandmarkItem[] = [
  { id: "l-bus-stand", streetName: "Avadi Bus Terminus", wardNo: 7, lat: 13.1169, lng: 80.0972 },
  { id: "l-railway", streetName: "Avadi Railway Station", wardNo: 7, lat: 13.1140, lng: 80.0990 },
  { id: "l-paruthipattu", streetName: "Paruthipattu Lake Park", wardNo: 10, lat: 13.0920, lng: 80.0810 },
  { id: "l-hvf", streetName: "HVF (Heavy Vehicles Factory)", wardNo: 5, lat: 13.1210, lng: 80.1100 },
  { id: "l-mth", streetName: "MTH Road, Avadi", wardNo: 7, lat: 13.1180, lng: 80.0960 },
  { id: "l-district-office", streetName: "Avadi District Collectorate", wardNo: 6, lat: 13.1160, lng: 80.1020 },
  { id: "l-vanagaram", streetName: "Vanagaram Junction", wardNo: 12, lat: 13.0620, lng: 80.0820 },
  { id: "l-thirumullaivoyal", streetName: "Thirumullaivoyal Market", wardNo: 15, lat: 13.0980, lng: 80.0790 },
  { id: "l-kamaraj-nagar", streetName: "Kamaraj Nagar, Avadi", wardNo: 3, lat: 13.1255, lng: 80.1010 },
  { id: "l-pattabiram", streetName: "Pattabiram Railway Station", wardNo: 20, lat: 13.0870, lng: 80.0630 },
  { id: "l-thiruninravur", streetName: "Thiruninravur Temple", wardNo: 22, lat: 13.1160, lng: 80.0260 },
];

const WARD_CENTERS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 13.1300, lng: 80.1150 }, 2: { lat: 13.1280, lng: 80.1080 },
  3: { lat: 13.1250, lng: 80.1020 }, 4: { lat: 13.1220, lng: 80.0980 },
  5: { lat: 13.1210, lng: 80.1100 }, 6: { lat: 13.1175, lng: 80.1010 },
  7: { lat: 13.1169, lng: 80.0972 }, 8: { lat: 13.1145, lng: 80.0940 },
  9: { lat: 13.1120, lng: 80.0900 }, 10: { lat: 13.0930, lng: 80.0820 },
  11: { lat: 13.1050, lng: 80.0870 }, 12: { lat: 13.0650, lng: 80.0830 },
  13: { lat: 13.0700, lng: 80.0780 }, 14: { lat: 13.0760, lng: 80.0720 },
  15: { lat: 13.0990, lng: 80.0800 }, 16: { lat: 13.1010, lng: 80.0750 },
  17: { lat: 13.1080, lng: 80.0700 }, 18: { lat: 13.1060, lng: 80.0660 },
  19: { lat: 13.0990, lng: 80.0620 }, 20: { lat: 13.0880, lng: 80.0640 },
  21: { lat: 13.0920, lng: 80.0580 }, 22: { lat: 13.1160, lng: 80.0270 },
};

// ─── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "Parks & Nature", label: "Parks & Nature" },
  { id: "Temples/Places of Worship", label: "Temples & Worship" },
  { id: "Heritage & Historic Spots", label: "Heritage Spots" },
  { id: "Lakefront & Recreation", label: "Lakefront" },
  { id: "Schools & Colleges", label: "Schools & Colleges" },
  { id: "Government & Public Offices", label: "Govt Offices" },
  { id: "Others", label: "Others" },
];

const VIBE_CHIPS = [
  { id: "familyFriendly", label: "Family Friendly" },
  { id: "joggingTrack", label: "Jogging Track" },
  { id: "kidsPlayArea", label: "Kids Play Area" },
  { id: "sunsetView", label: "Sunset View" },
  { id: "photographyFriendly", label: "Photography Friendly" },
  { id: "peaceful", label: "Peaceful & Quiet" },
  { id: "heritageSpot", label: "Heritage / Historic" },
];

const AMENITY_CHIPS = [
  { id: "restrooms", label: "Restrooms" },
  { id: "drinkingWater", label: "Drinking Water" },
  { id: "wheelchairFriendly", label: "Wheelchair Friendly" },
  { id: "foodStalls", label: "Food Stalls Nearby" },
  { id: "benches", label: "Benches & Seating" },
  { id: "security", label: "Security / Guard" },
  { id: "outsideFoodAllowed", label: "Outside Food Allowed" },
  { id: "safeForSolo", label: "Safe for Solo & Women" },
  { id: "cctvMonitored", label: "CCTV Monitored" },
  { id: "rainShelter", label: "Rain Shelters / Shaded" },
];

const TRANSIT_CHIPS = [
  { id: "walkingFromStation", label: "Walking from Bus / Rail (<10 min)" },
  { id: "autoAvailable", label: "Auto & Share-Auto Available" },
  { id: "mainRoadAccess", label: "Direct Main Road Access" },
];

const BEST_TIME_OPTIONS = [
  { id: "earlyMorning", label: "Early Morning", sub: "6 AM – 9 AM" },
  { id: "evening", label: "Evening", sub: "4 PM – 8 PM" },
  { id: "allDay", label: "Any Time", sub: "Open All Day" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 5; h < 24; h++) {
  const suffix = h < 12 ? "AM" : "PM";
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h;
  TIME_OPTIONS.push(`${display}:00 ${suffix}`);
  if (!(h === 23)) TIME_OPTIONS.push(`${display}:30 ${suffix}`);
}
TIME_OPTIONS.push("11:30 PM");

const DAYS_OPTIONS = [
  { id: "allDays", label: "All Days" },
  { id: "monSat", label: "Mon – Sat" },
  { id: "monFri", label: "Mon – Fri" },
  { id: "weekends", label: "Weekends Only" },
];

type ParkingStatus = "none" | "free" | "paid" | "unknown";
type SubmitterRole = "resident" | "manager";

const MANAGER_ROLES = [
  { id: "managingTrustee", label: "Managing Trustee" },
  { id: "templePriest", label: "Temple Priest / Poojari" },
  { id: "secretary", label: "Secretary / Committee Member" },
  { id: "facilitySupervisor", label: "Facility Supervisor / Manager" },
  { id: "authorizedStaff", label: "Authorized Staff / Worker" },
  { id: "ownerFounder", label: "Owner / Founder" },
];

// ─── 3-Step Wizard Definition ───────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 0, label: "Step 1 of 3", short: "Step 2" },
  { id: 1, label: "Step 2 of 3", short: "Step 3" },
  { id: 2, label: "Step 3 of 3", short: "Submit" },
];

interface FormState {
  name: string;
  subCategory: string;
  address: string;
  vibes: string[];
  amenities: string[];
  transit: string[];
  bestTime: string;
  entryFee: "free" | "paid" | "unknown";
  entryAmount: string;
  carParking: ParkingStatus;
  carParkingAmount: string;
  bikeParking: ParkingStatus;
  bikeParkingAmount: string;
  description: string;
  isDescEdited: boolean;
  openTime: string;
  closeTime: string;
  daysOpen: string;
  submitterRole: SubmitterRole;
  managerName: string;
  managerRole: string;
  managerOrg: string;
  managerPhone: string;
}

// ─── Format timings ─────────────────────────────────────────────────────────────
function formatTimings(form: Pick<FormState, "openTime" | "closeTime" | "daysOpen">): string {
  if (!form.openTime && !form.closeTime) return "";
  const open = form.openTime || "—";
  const close = form.closeTime || "—";
  const daysLabel = form.daysOpen
    ? (DAYS_OPTIONS.find((d) => d.id === form.daysOpen)?.label || "")
    : "";
  return `${open} – ${close}${daysLabel ? ` (${daysLabel})` : ""}`;
}

// ─── Smart Description Generator ────────────────────────────────────────────────
function generateDescription(form: FormState): string {
  const parts: string[] = [];

  if (form.vibes.includes("peaceful") && form.vibes.includes("familyFriendly")) {
    parts.push("A peaceful, family-friendly");
  } else if (form.vibes.includes("peaceful")) {
    parts.push("A serene and peaceful");
  } else if (form.vibes.includes("familyFriendly")) {
    parts.push("A wonderful family-friendly");
  } else {
    parts.push("A notable");
  }

  const catMap: Record<string, string> = {
    "Parks & Nature": "park and nature spot",
    "Temples/Places of Worship": "place of worship",
    "Heritage & Historic Spots": "heritage and historic landmark",
    "Lakefront & Recreation": "lakefront recreation area",
    "Schools & Colleges": "educational institution",
    "Government & Public Offices": "government facility",
    Others: "local spot",
  };
  parts[0] += ` ${catMap[form.subCategory] || "place"} in Avadi.`;

  const featureLabels: Record<string, string> = {
    joggingTrack: "jogging tracks",
    kidsPlayArea: "a kids' play area",
    sunsetView: "breathtaking sunset views",
    photographyFriendly: "great photography spots",
    heritageSpot: "rich heritage and historical significance",
  };
  const features = form.vibes.filter((v) => featureLabels[v]).map((v) => featureLabels[v]);
  if (features.length > 0) parts.push(`Featuring ${features.join(", ")}.`);

  const amenityLabels: Record<string, string> = {
    restrooms: "clean restrooms",
    drinkingWater: "drinking water facility",
    wheelchairFriendly: "wheelchair accessibility",
    foodStalls: "nearby food stalls",
    benches: "shaded benches and seating",
    security: "on-site security",
    outsideFoodAllowed: "outside food allowed (picnic-friendly)",
    safeForSolo: "safe for solo and women visitors",
    cctvMonitored: "CCTV-monitored premises",
    rainShelter: "rain shelters and shaded areas",
  };
  const amenityItems = form.amenities.filter((a) => amenityLabels[a]).map((a) => amenityLabels[a]);
  if (amenityItems.length > 0) parts.push(`Equipped with ${amenityItems.join(", ")}.`);

  const transitLabels: Record<string, string> = {
    walkingFromStation: "within walking distance from the bus/railway station",
    autoAvailable: "easily reachable by auto and share-auto",
    mainRoadAccess: "directly accessible from the main road",
  };
  const transitItems = form.transit.filter((t) => transitLabels[t]).map((t) => transitLabels[t]);
  if (transitItems.length > 0) parts.push(`Conveniently located — ${transitItems.join(", ")}.`);

  const parkingParts: string[] = [];
  if (form.carParking === "free") parkingParts.push("free car parking");
  else if (form.carParking === "paid") parkingParts.push(`paid car parking (₹${form.carParkingAmount || "—"})`);
  else if (form.carParking === "unknown") parkingParts.push("paid car parking (fee unconfirmed)");
  if (form.bikeParking === "free") parkingParts.push("free two-wheeler parking");
  else if (form.bikeParking === "paid") parkingParts.push(`paid bike parking (₹${form.bikeParkingAmount || "—"})`);
  else if (form.bikeParking === "unknown") parkingParts.push("paid bike parking (fee unconfirmed)");
  if (parkingParts.length > 0) parts.push(`Parking available: ${parkingParts.join(" and ")}.`);

  if (form.entryFee === "free") {
    parts.push("Entry is free for all visitors.");
  } else if (form.entryFee === "paid" && form.entryAmount) {
    parts.push(`Entry fee: ₹${form.entryAmount}.`);
  } else if (form.entryFee === "paid") {
    parts.push("Nominal entry fee applicable.");
  } else if (form.entryFee === "unknown") {
    parts.push("Entry fee applicable (exact amount not confirmed).");
  }

  const btMap: Record<string, string> = {
    earlyMorning: "early mornings (6 AM – 9 AM)",
    evening: "evenings (4 PM – 8 PM)",
    allDay: "any time of the day",
  };
  if (form.bestTime && btMap[form.bestTime]) {
    parts.push(`Best visited during ${btMap[form.bestTime]}.`);
  }

  const timingsStr = formatTimings(form);
  if (timingsStr) parts.push(`Open: ${timingsStr}.`);

  return parts.join(" ");
}

// ─── Slide animation variants ────────────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function SuggestPlaceClient() {
  const router = useRouter();

  // ── Wizard state ──────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    subCategory: "",
    address: "",
    vibes: [],
    amenities: [],
    transit: [],
    bestTime: "",
    entryFee: "free" as "free" | "paid" | "unknown",
    entryAmount: "",
    carParking: "none",
    carParkingAmount: "",
    bikeParking: "none",
    bikeParkingAmount: "",
    description: "",
    isDescEdited: false,
    openTime: "",
    closeTime: "",
    daysOpen: "",
    submitterRole: "resident",
    managerName: "",
    managerRole: "",
    managerOrg: "",
    managerPhone: "",
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapFlyCoords, setMapFlyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapAutoDetected, setIsMapAutoDetected] = useState(false);

  const [photos, setPhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedPlaceName, setSubmittedPlaceName] = useState("");

  const [managerProofFile, setManagerProofFile] = useState<File | null>(null);
  const [managerProofPreview, setManagerProofPreview] = useState<string | null>(null);
  const managerProofInputRef = useRef<HTMLInputElement>(null);

  const [isManagerConfirmed, setIsManagerConfirmed] = useState(false);
  const [managerErrors, setManagerErrors] = useState<Record<string, string>>({});

  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ id: string; streetName: string; wardNo: number; lat?: number; lng?: number }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const autoDesc = useMemo(
    () => generateDescription(form),
    [
      form.subCategory, form.vibes, form.amenities, form.transit,
      form.entryFee, form.entryAmount, form.carParking, form.carParkingAmount,
      form.bikeParking, form.bikeParkingAmount, form.bestTime,
      form.openTime, form.closeTime, form.daysOpen,
    ]
  );

  useEffect(() => {
    if (!form.isDescEdited) {
      setForm((f) => ({ ...f, description: autoDesc }));
    }
  }, [autoDesc, form.isDescEdited]);

  const DRAFT_KEY = "avadi_suggest_draft";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setForm((f) => ({ ...f, ...saved.form }));
        if (saved.addressQuery) setAddressQuery(saved.addressQuery);
        if (saved.coords) setCoords(saved.coords);
        if (typeof saved.currentStep === "number") setCurrentStep(saved.currentStep);
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 4000);
      }
    } catch { /* ignore corrupt drafts */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, addressQuery, coords, currentStep }));
    } catch { /* storage full */ }
  }, [form, addressQuery, coords, currentStep]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field as string]) setErrors((e) => ({ ...e, [field]: undefined! }));
  };

  const toggleChip = (type: "vibes" | "amenities" | "transit", id: string) => {
    setForm((f) => ({
      ...f,
      [type]: f[type].includes(id) ? f[type].filter((x) => x !== id) : [...f[type], id],
    }));
  };

  // ── Per-step validation ──────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Role, Basics & Location
      if (form.submitterRole === "manager" && !isManagerConfirmed)
        newErrors.managerConfirm = "Please complete and confirm your Official Verification details.";
      if (form.submitterRole === "manager" && !managerProofFile)
        newErrors.managerProof = "Official ID Card proof is required.";
      if (!form.name.trim() || form.name.trim().length < 3)
        newErrors.name = "Place name must be at least 3 characters.";
      if (!form.subCategory) newErrors.subCategory = "Please select a category.";
      if (!form.address.trim() || form.address.trim().length < 5)
        newErrors.address = "Address / landmark is required.";
      if (!coords) newErrors.map = "Please pin the location on the map.";
    }

    if (step === 1) {
      // Facilities
      if (form.entryFee === "paid" && !form.entryAmount.trim())
        newErrors.entryAmount = "Please enter the entry fee amount.";
    }

    if (step === 2) {
      // Photos & Submit
      if (!form.description.trim() || form.description.trim().length < 15)
        newErrors.description = "Description must be at least 15 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const goNext = () => {
    if (!validateStep(currentStep)) {
      setTimeout(() => {
        const firstErrEl = document.querySelector("[data-error='true']");
        firstErrEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goBack = () => {
    setDirection(-1);
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Address Autocomplete ──────────────────────────────────────────────────────
  const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setAddressQuery(q);
    setField("address", q);
    setIsMapAutoDetected(false);
    if (!q.trim() || q.trim().length < 2) {
      setAddressSuggestions([]); setShowSuggestions(false); return;
    }
    const lower = q.toLowerCase();
    const landmarkMatches = AVADI_LANDMARKS.filter((l) =>
      l.streetName.toLowerCase().includes(lower)
    ).map((l) => ({ id: l.id, streetName: l.streetName, wardNo: l.wardNo, lat: l.lat, lng: l.lng }));
    const streetMatches = ALL_AVADI_STREETS.filter((s) =>
      s.streetName.toLowerCase().includes(lower)
    ).slice(0, 12).map((s) => ({ id: s.id, streetName: s.streetName, wardNo: s.wardNo }));
    const merged = [
      ...landmarkMatches,
      ...streetMatches.filter((s) => !landmarkMatches.find((l) => l.id === s.id)),
    ].slice(0, 14);
    setAddressSuggestions(merged);
    setShowSuggestions(merged.length > 0);
  };

  const handleSelectSuggestion = (item: {
    id: string; streetName: string; wardNo: number; lat?: number; lng?: number;
  }) => {
    const fullAddress = `${item.streetName}, Avadi${item.wardNo ? ` (Ward ${item.wardNo})` : ""}`;
    setAddressQuery(fullAddress);
    setField("address", fullAddress);
    setAddressSuggestions([]); setShowSuggestions(false);
    setIsMapAutoDetected(false);
    const lat = item.lat ?? WARD_CENTERS[item.wardNo]?.lat ?? 13.1169;
    const lng = item.lng ?? WARD_CENTERS[item.wardNo]?.lng ?? 80.0972;
    setMapFlyCoords({ lat, lng });
    setCoords({ lat, lng });
  };

  const clearAddress = () => {
    setAddressQuery(""); setField("address", "");
    setAddressSuggestions([]); setShowSuggestions(false);
    setIsMapAutoDetected(false);
    addressInputRef.current?.focus();
  };

  // ── Reverse Geocoding ────────────────────────────────────────────────────────
  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371000;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const sin2 =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.asin(Math.sqrt(sin2));
    };

    // ── Avadi boundary check (rough bounding box) ────────────────────────────
    const avadiBounds = { minLat: 13.01, maxLat: 13.22, minLng: 79.99, maxLng: 80.2 };
    const isInsideAvadi =
      lat >= avadiBounds.minLat && lat <= avadiBounds.maxLat &&
      lng >= avadiBounds.minLng && lng <= avadiBounds.maxLng;

    if (!isInsideAvadi) {
      // Outside Avadi — don't set a fake Avadi address
      setAddressQuery("");
      setField("address", "");
      setIsMapAutoDetected(false);
      return;
    }

    const tap = { lat, lng };
    let bestLandmark: (typeof AVADI_LANDMARKS)[0] | null = null;
    let bestDist = Infinity;
    for (const lm of AVADI_LANDMARKS) {
      const d = haversine(tap, lm);
      if (d < bestDist) { bestDist = d; bestLandmark = lm; }
    }

    if (bestLandmark && bestDist < 800) {
      const label = `${bestLandmark.streetName}, Avadi (Ward ${bestLandmark.wardNo})`;
      setAddressQuery(label);
      setField("address", label);
      setIsMapAutoDetected(true);
      return;
    }

    let nearestWard = 7;
    let nearestWardDist = Infinity;
    for (const [wardNo, center] of Object.entries(WARD_CENTERS)) {
      const d = haversine(tap, center);
      if (d < nearestWardDist) { nearestWardDist = d; nearestWard = Number(wardNo); }
    }
    const placeholderLabel = `Avadi (Ward ${nearestWard})`;
    setAddressQuery(placeholderLabel);
    setField("address", placeholderLabel);
    setIsMapAutoDetected(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "AvadiCityConnect/1.0" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const addr = data.address ?? {};
      const parts: string[] = [];
      if (addr.road || addr.pedestrian || addr.footway)
        parts.push(addr.road ?? addr.pedestrian ?? addr.footway);
      if (addr.suburb) parts.push(addr.suburb);
      if (addr.neighbourhood) parts.push(addr.neighbourhood);
      parts.push("Avadi");
      const enriched = `${parts.join(", ")} (Ward ${nearestWard})`;
      setAddressQuery(enriched);
      setField("address", enriched);
    } catch {
      /* silent fail */
    }
  }, []);

  // ── Multi-Photo Handlers ─────────────────────────────────────────────────────
  const addPhotos = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    setPhotos((prev) => {
      const remaining = 3 - prev.length;
      if (remaining <= 0) return prev;
      const valid = arr.slice(0, remaining).filter(
        (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
      );
      return [...prev, ...valid.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))];
    });
  }, []);

  const removePhoto = (idx: number) => {
    setPhotos((prev) => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addPhotos(e.target.files);
    e.target.value = "";
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) addPhotos(e.dataTransfer.files);
  };

  // ── Manager proof ─────────────────────────────────────────────────────────────
  const handleManagerProof = (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    if (managerProofPreview) URL.revokeObjectURL(managerProofPreview);
    setManagerProofFile(file);
    setManagerProofPreview(URL.createObjectURL(file));
    setManagerErrors((e) => ({ ...e, managerProof: undefined! }));
  };

  const validateAndConfirmManager = () => {
    const errs: Record<string, string> = {};
    if (!form.managerName.trim()) errs.managerName = "Full name is required.";
    if (!form.managerRole) errs.managerRole = "Please select your designation.";
    if (!form.managerOrg.trim()) errs.managerOrg = "Trust / Organization name is required.";
    if (!form.managerPhone.trim() || form.managerPhone.trim().length !== 10)
      errs.managerPhone = "Please enter a valid 10-digit phone number.";
    if (!managerProofFile) errs.managerProof = "Official ID Card / Staff ID proof photo is required.";
    setManagerErrors(errs);
    if (Object.keys(errs).length === 0) setIsManagerConfirmed(true);
  };

  // ── Final Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) { toast.error("Please accept the Terms & Conditions before submitting."); return; }
    if (!validateStep(2)) return;
    setIsSubmitting(true);
    try {
      const timingsStr = formatTimings(form);
      const fd = new FormData();
      fd.append("type", "EXPLORE_PLACE");
      fd.append("name", form.name.trim());
      fd.append("subCategory", form.subCategory);
      fd.append("description", form.description.trim());
      fd.append("address", form.address.trim());
      fd.append("is24x7", "false");
      if (timingsStr) fd.append("timings", timingsStr);
      if (coords) {
        fd.append("googleMapsUrl", `https://www.google.com/maps?q=${coords.lat},${coords.lng}`);
        fd.append("extraDetails[lat]", String(coords.lat));
        fd.append("extraDetails[lng]", String(coords.lng));
      }
      fd.append("extraDetails[entryFee]", form.entryFee);
      if (form.entryFee === "paid" && form.entryAmount) fd.append("extraDetails[entryAmount]", form.entryAmount);
      fd.append("extraDetails[carParking]", form.carParking);
      if (form.carParking === "paid" && form.carParkingAmount) fd.append("extraDetails[carParkingAmount]", form.carParkingAmount);
      fd.append("extraDetails[bikeParking]", form.bikeParking);
      if (form.bikeParking === "paid" && form.bikeParkingAmount) fd.append("extraDetails[bikeParkingAmount]", form.bikeParkingAmount);
      if (form.bestTime) fd.append("extraDetails[bestTime]", form.bestTime);
      if (form.vibes.length > 0) fd.append("extraDetails[vibes]", form.vibes.join(","));
      if (form.amenities.length > 0) fd.append("extraDetails[amenities]", form.amenities.join(","));
      if (form.transit.length > 0) fd.append("extraDetails[transit]", form.transit.join(","));
      fd.append("extraDetails[submitterRole]", form.submitterRole);
      if (form.submitterRole === "manager") {
        fd.append("extraDetails[managerName]", form.managerName.trim());
        fd.append("extraDetails[managerRole]", form.managerRole);
        fd.append("extraDetails[managerOrg]", form.managerOrg.trim());
        fd.append("extraDetails[managerPhone]", form.managerPhone.trim());
        if (managerProofFile) fd.append("managerProof", managerProofFile);
      }
      photos.forEach((p, i) => fd.append(i === 0 ? "image" : `image${i + 1}`, p.file));
      if (photos.length >= 3) fd.append("extraDetails[photo3]", "true");
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ok */ }
      const res = await fetch("/api/listings", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSubmittedPlaceName(form.name.trim());
      setShowSuccessModal(true);
      toast.success("Place submitted! Pending admin review.", { duration: 4000 });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setShowSuccessModal(false);
    setCurrentStep(0);
    setDirection(1);
    setAcceptedTerms(false);
    setForm({
      name: "",
      subCategory: "",
      address: "",
      vibes: [],
      amenities: [],
      transit: [],
      bestTime: "",
      entryFee: "free",
      entryAmount: "",
      carParking: "none",
      carParkingAmount: "",
      bikeParking: "none",
      bikeParkingAmount: "",
      description: "",
      isDescEdited: false,
      openTime: "",
      closeTime: "",
      daysOpen: "",
      submitterRole: "resident",
      managerName: "",
      managerRole: "",
      managerOrg: "",
      managerPhone: "",
    });
    setCoords(null);
    setPhotos([]);
    setErrors({});
    setManagerErrors({});
    setManagerProofFile(null);
    setManagerProofPreview(null);
    setIsManagerConfirmed(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ok */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Design Tokens ────────────────────────────────────────────────────────────
  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0d1525] text-sm text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition";
  const numericInputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0d1525] text-sm text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const selectCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0d1525] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition appearance-none cursor-pointer";
  const labelCls = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";
  const errorCls = "text-xs text-rose-500 mt-1.5 flex items-center gap-1";
  const sectionCard = "px-4 py-4 space-y-4 border-t border-slate-200 dark:border-slate-800/60";
  const sectionTitle = "text-sm font-black text-gray-900 dark:text-white flex items-center gap-2";
  const chipBase = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer select-none";
  const chipActive = "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30";
  const chipInactive = "bg-slate-100 dark:bg-[#0d1525] border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-orange-500/50 hover:text-orange-500 dark:hover:text-orange-300";

  const timingsDisplay = formatTimings(form);
  const catItem = CATEGORIES.find((c) => c.id === form.subCategory);

  // ─── Step Header (inside card) ────────────────────────────────────────────────
  const StepHeader = () => (
    <div className="px-4 py-4">
      {/* Progress bar */}
      <div className="flex gap-1 w-full mb-4">
        {WIZARD_STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-[3px] rounded-full transition-all duration-500 ${
              idx <= currentStep ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700/60"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </h2>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0d1525] border border-slate-200 dark:border-slate-700/60 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-black text-gray-700 dark:text-white">{currentStep + 1}/{WIZARD_STEPS.length}</span>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // PLACE NAME & CATEGORY sub-section
  // ════════════════════════════════════════════════════════════════════════════════
  const renderBasicsSection = () => (
    <div className={sectionCard}>
      <div data-error={!!errors.name}>
        <label className={labelCls}>Place Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. Paruthipattu Lake, Vaikundhaswamy Temple"
          className={inputCls}
        />
        {errors.name && <p className={errorCls}><AlertCircle size={12} /> {errors.name}</p>}
      </div>
      <div data-error={!!errors.subCategory}>
        <label className={labelCls}>Category *</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setField("subCategory", cat.id)}
              className={`${chipBase} ${form.subCategory === cat.id ? chipActive : chipInactive}`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        {errors.subCategory && <p className={errorCls}><AlertCircle size={12} /> {errors.subCategory}</p>}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // LOCATION & MAP sub-section
  // ════════════════════════════════════════════════════════════════════════════════
  const renderLocationSection = () => (
    <div className={sectionCard}>
        <div data-error={!!errors.address} className="relative">
          <label className={labelCls}><Search size={11} className="inline mr-1" />Street / Landmark *</label>
          <div className="relative">
            <input
              ref={addressInputRef}
              type="text"
              value={addressQuery}
              onChange={handleAddressInput}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search street, landmark, or area in Avadi…"
              className={`${inputCls} pr-8`}
              autoComplete="off"
            />
            {addressQuery && (
              <button
                type="button"
                onClick={clearAddress}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#111827] border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
              >
                {addressSuggestions.map((item) => {
                  const isLandmark = !!item.lat;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-orange-500/10 text-left transition border-b border-slate-800/60 last:border-b-0"
                    >
                      <MapPin size={14} className={`shrink-0 mt-0.5 ${isLandmark ? "text-orange-400" : "text-slate-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.streetName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isLandmark
                            ? <span className="text-orange-400 font-bold">Landmark</span>
                            : <span className="flex items-center gap-1"><Building2 size={10} /> Ward {item.wardNo}</span>}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {errors.address && <p className={errorCls}><AlertCircle size={12} /> {errors.address}</p>}
        </div>

        <div data-error={!!errors.map}>
          <label className={labelCls}><Navigation size={11} className="inline mr-1" />Pin on Map *</label>
          <p className="text-[11px] text-slate-500 mb-2">
            Tap the map or drag the pin — address auto-fills instantly!
          </p>
          <MapLocationPicker
            onLocationSelect={(lat, lng) => {
              setCoords({ lat, lng });
              setErrors((e) => ({ ...e, map: undefined! }));
            }}
            onError={(msg) => setMapError(msg)}
            selectedCoords={coords ?? mapFlyCoords}
            onReverseGeocode={handleReverseGeocode}
          />
          <AnimatePresence>
            {isMapAutoDetected && coords && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] text-orange-400 mt-1.5 flex items-center gap-1 font-semibold"
              >
                <CheckCircle2 size={11} /> Address auto-detected · {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </motion.p>
            )}
            {!isMapAutoDetected && coords && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-orange-400/80 mt-1.5 flex items-center gap-1"
              >
                <CheckCircle2 size={11} /> Pinned at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </motion.p>
            )}
          </AnimatePresence>
          {mapError && <p className={errorCls}><AlertCircle size={12} /> {mapError}</p>}
          {errors.map && <p className={errorCls}><AlertCircle size={12} /> {errors.map}</p>}
        </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Submitter Role, Basics & Location
  // ════════════════════════════════════════════════════════════════════════════════
  const renderStep1 = () => (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
      <StepHeader />



      <div className="px-4 py-4 space-y-4 border-t border-slate-800/60">
        <p className={sectionTitle}><UserCheck size={16} className="text-orange-400" />You are submitting as…</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "resident", label: "Local Resident / Visitor", desc: "I've personally visited this place" },
              { id: "manager", label: "Place Manager / Trustee", desc: "I manage or represent this place" },
            ] as const
          ).map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                setField("submitterRole", role.id);
                if (role.id === "resident") { setIsManagerConfirmed(false); setManagerErrors({}); }
              }}
              className={`flex flex-col items-start gap-1 px-3.5 py-3 rounded-xl border-2 text-left transition cursor-pointer ${
                form.submitterRole === role.id
                  ? "bg-orange-500/10 border-orange-500 text-orange-300"
                  : "bg-[#0d1525] border-slate-700/60 hover:border-orange-500/40"
              }`}
            >
              <span className={`text-xs font-black leading-tight ${form.submitterRole === role.id ? "text-orange-300" : "text-white"}`}>
                {role.label}
              </span>
              <span className="text-[10px] text-slate-500 leading-snug">{role.desc}</span>
            </button>
          ))}
        </div>

        {errors.managerConfirm && (
          <p className={errorCls}><AlertCircle size={12} /> {errors.managerConfirm}</p>
        )}

        {/* Manager Verification Panel */}
        <AnimatePresence>
          {form.submitterRole === "manager" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl border border-slate-700/60 bg-[#0d1525] p-4">
                {isManagerConfirmed ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                        <p className="text-xs font-black text-orange-400">Official Representative Confirmed</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManagerConfirmed(false)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-orange-400 transition cursor-pointer"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                    <div className="bg-[#111827] border border-slate-800/60 rounded-xl px-3.5 py-3 space-y-1.5">
                      <p className="text-xs text-white font-bold">{form.managerName}</p>
                      <p className="text-[11px] text-slate-400">
                        {MANAGER_ROLES.find((r) => r.id === form.managerRole)?.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{form.managerOrg}</p>
                      <p className="text-[11px] text-slate-400">+91 {form.managerPhone}</p>
                      <p className="text-[11px] text-orange-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> ID Card / Proof Attached
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-orange-400 shrink-0" />
                      <p className="text-xs font-black text-white">Official Representative Verification</p>
                    </div>
                    <div className="bg-[#111827] border border-slate-800/60 rounded-xl px-3.5 py-2.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Providing official contact details qualifies your listing for the{" "}
                        <span className="font-bold text-orange-400">Verified</span> badge.
                      </p>
                    </div>

                    <div data-error={!!managerErrors.managerName}>
                      <label className={labelCls}>Full Name / Contact Person *</label>
                      <input
                        type="text"
                        value={form.managerName}
                        onChange={(e) => { setField("managerName", e.target.value); setManagerErrors((er) => ({ ...er, managerName: undefined! })); }}
                        placeholder="e.g. R. Sundaram / K. Balan"
                        className={inputCls}
                      />
                      {managerErrors.managerName && <p className={errorCls}><AlertCircle size={12} /> {managerErrors.managerName}</p>}
                    </div>

                    <div data-error={!!managerErrors.managerRole}>
                      <label className={labelCls}>Designation / Role *</label>
                      <div className="flex flex-wrap gap-2">
                        {MANAGER_ROLES.map((r) => (
                          <button
                            key={r.id} type="button"
                            onClick={() => { setField("managerRole", form.managerRole === r.id ? "" : r.id); setManagerErrors((er) => ({ ...er, managerRole: undefined! })); }}
                            className={`${chipBase} ${form.managerRole === r.id ? chipActive : chipInactive}`}
                          >
                            <span>{r.label}</span>
                          </button>
                        ))}
                      </div>
                      {managerErrors.managerRole && <p className={errorCls}><AlertCircle size={12} /> {managerErrors.managerRole}</p>}
                    </div>

                    <div data-error={!!managerErrors.managerOrg}>
                      <label className={labelCls}>Trust / Board / Organization Name *</label>
                      <input
                        type="text"
                        value={form.managerOrg}
                        onChange={(e) => { setField("managerOrg", e.target.value); setManagerErrors((er) => ({ ...er, managerOrg: undefined! })); }}
                        placeholder="e.g. Arulmigu Devi Karumariamman Trust"
                        className={inputCls}
                      />
                      {managerErrors.managerOrg && <p className={errorCls}><AlertCircle size={12} /> {managerErrors.managerOrg}</p>}
                    </div>

                    <div data-error={!!managerErrors.managerPhone}>
                      <label className={labelCls}>Official Phone / WhatsApp *</label>
                      <input
                        type="text" inputMode="numeric" maxLength={10}
                        value={form.managerPhone}
                        onChange={(e) => { setField("managerPhone", e.target.value.replace(/\D/g, "").slice(0, 10)); setManagerErrors((er) => ({ ...er, managerPhone: undefined! })); }}
                        placeholder="e.g. 9876543210"
                        className={inputCls}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Admin will verify via call / WhatsApp before granting the Official Verified badge.</p>
                      {managerErrors.managerPhone && <p className={errorCls}><AlertCircle size={12} /> {managerErrors.managerPhone}</p>}
                    </div>

                    <div data-error={!!managerErrors.managerProof}>
                      <label className={labelCls}>Official ID Card / Staff ID Proof *</label>
                      <p className="text-[10px] text-slate-500 mb-2">Upload a clear photo of your Staff ID, Temple Badge, or Trust Authorization letter.</p>
                      <input type="file" accept="image/*" ref={managerProofInputRef}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleManagerProof(f); e.target.value = ""; }}
                        className="hidden"
                      />
                      {managerProofPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-700/60">
                          <img src={managerProofPreview} alt="ID Proof preview" className="w-full h-36 object-cover" />
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> ID Card Attached
                          </div>
                          <button type="button"
                            onClick={() => { if (managerProofPreview) URL.revokeObjectURL(managerProofPreview); setManagerProofFile(null); setManagerProofPreview(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition cursor-pointer"
                          ><X size={13} /></button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => managerProofInputRef.current?.click()}
                          className={`w-full py-3.5 border border-dashed rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                            managerErrors.managerProof
                              ? "border-rose-500/50 bg-rose-500/5 text-rose-400"
                              : "border-slate-700/60 text-slate-400 hover:border-orange-500/50 hover:text-orange-400 bg-[#111827]"
                          }`}
                        ><ImagePlus size={14} /> Upload Staff ID Card / Badge Photo</button>
                      )}
                      {managerErrors.managerProof && <p className={errorCls}><AlertCircle size={12} /> {managerErrors.managerProof}</p>}
                    </div>

                    <button type="button" onClick={validateAndConfirmManager}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-orange-500/20"
                    ><CheckCircle2 size={16} /> Save & Confirm Verification Details</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─ Inline Basics & Location sections ─ */}
      {renderBasicsSection()}
      {renderLocationSection()}
      {renderButtons()}

    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Facilities, Parking & Timings
  // ════════════════════════════════════════════════════════════════════════════════
  const renderStep2 = () => (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
      <StepHeader />

      {/* 1. Entry Fee */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>
            <Ticket size={16} className="text-orange-400" />
            Entry Fee
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Ticket / admission</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setField("entryFee", "free")}
            className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              form.entryFee === "free"
                ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-[#0d1525] border-slate-700/60 text-slate-300 hover:border-orange-500/40"
            }`}
          >
            <CheckCircle2 size={13} className={form.entryFee === "free" ? "text-white" : "text-emerald-400"} />
            Free Entry
          </button>
          <button
            type="button"
            onClick={() => setField("entryFee", "paid")}
            className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              form.entryFee === "paid"
                ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-[#0d1525] border-slate-700/60 text-slate-300 hover:border-orange-500/40"
            }`}
          >
            <Ticket size={13} />
            Paid Entry
          </button>
          <button
            type="button"
            onClick={() => setField("entryFee", "unknown")}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
              form.entryFee === "unknown"
                ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-[#0d1525] border-slate-700/60 text-slate-300 hover:border-orange-500/40"
            }`}
          >
            <HelpCircle size={12} />
            Amount Unknown
          </button>
        </div>
        <AnimatePresence>
          {form.entryFee === "paid" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <label className={labelCls}>Entry Amount (₹) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm font-bold pointer-events-none">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.entryAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = parseInt(raw, 10);
                    setField("entryAmount", raw === "" ? "" : String(Math.min(num, 5000)));
                  }}
                  placeholder="e.g. 20"
                  className={`${numericInputCls} pl-7`}
                  data-error={!!errors.entryAmount}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Max ₹5,000</p>
              {errors.entryAmount && <p className={errorCls}><AlertCircle size={12} /> {errors.entryAmount}</p>}
            </motion.div>
          )}
          {form.entryFee === "unknown" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="text-[11px] text-orange-400/80 flex items-center gap-1 mt-1">
                <AlertCircle size={11} /> Entry fee exists but exact amount is not confirmed — that&apos;s okay!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Parking Facilities — Side-by-Side Compact Segmented Controls */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>
            <Car size={16} className="text-orange-400" />
            Parking Facilities
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Vehicle parking availability</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Car Parking */}
          <div className="bg-[#0d1525]/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Car size={13} className="text-orange-400" /> Car Parking
              </label>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {form.carParking}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800">
              {(["none", "free", "paid", "unknown"] as ParkingStatus[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField("carParking", opt)}
                  className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer text-center capitalize ${
                    form.carParking === opt
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {form.carParking === "paid" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1">
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Car Parking Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.carParkingAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const num = parseInt(raw, 10);
                        setField("carParkingAmount", raw === "" ? "" : String(Math.min(num, 500)));
                      }}
                      placeholder="e.g. 30"
                      className={`${numericInputCls} pl-6 py-2 text-xs`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Max ₹500</p>
                </motion.div>
              )}
              {form.carParking === "unknown" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1">
                  <p className="text-[11px] text-orange-400/80 flex items-center gap-1">
                    <AlertCircle size={11} /> Rate not known — that&apos;s okay!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bike Parking */}
          <div className="bg-[#0d1525]/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Bike size={13} className="text-orange-400" /> Two-Wheeler / Bike
              </label>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {form.bikeParking}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800">
              {(["none", "free", "paid", "unknown"] as ParkingStatus[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField("bikeParking", opt)}
                  className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer text-center capitalize ${
                    form.bikeParking === opt
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {form.bikeParking === "paid" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1">
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Bike Parking Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none">₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.bikeParkingAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const num = parseInt(raw, 10);
                        setField("bikeParkingAmount", raw === "" ? "" : String(Math.min(num, 500)));
                      }}
                      placeholder="e.g. 10"
                      className={`${numericInputCls} pl-6 py-2 text-xs`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Max ₹500</p>
                </motion.div>
              )}
              {form.bikeParking === "unknown" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1">
                  <p className="text-[11px] text-orange-400/80 flex items-center gap-1">
                    <AlertCircle size={11} /> Rate not known — that&apos;s okay!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3. Vibes, Amenities & Transit — Clean Grouped Containers */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>
            <Layers size={16} className="text-orange-400" />
            Place Features & Amenities
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Select what applies</span>
        </div>

        {/* Group A: Atmosphere & Vibes */}
        <div className="bg-[#0d1525]/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles size={13} className="text-orange-400" /> Atmosphere & Vibes
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {form.vibes.length > 0 ? `${form.vibes.length} selected` : "Optional"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VIBE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleChip("vibes", chip.id)}
                className={`${chipBase} ${form.vibes.includes(chip.id) ? chipActive : chipInactive}`}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group B: Facilities & Amenities */}
        <div className="bg-[#0d1525]/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 size={13} className="text-orange-400" /> Facilities & Amenities
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {form.amenities.length > 0 ? `${form.amenities.length} selected` : "Optional"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AMENITY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleChip("amenities", chip.id)}
                className={`${chipBase} ${form.amenities.includes(chip.id) ? chipActive : chipInactive}`}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group C: How to Reach & Transit */}
        <div className="bg-[#0d1525]/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Navigation size={13} className="text-orange-400" /> How to Reach & Transit
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {form.transit.length > 0 ? `${form.transit.length} selected` : "Optional"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRANSIT_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleChip("transit", chip.id)}
                className={`${chipBase} ${form.transit.includes(chip.id) ? chipActive : chipInactive}`}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Best Time & Operating Hours */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>
            <Clock size={16} className="text-orange-400" />
            Timings & Best Hours
          </p>
          <span className="text-[11px] text-slate-500 font-medium">When to visit</span>
        </div>

        {/* Best Time Grid */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Recommended Time</label>
          <div className="grid grid-cols-3 gap-2">
            {BEST_TIME_OPTIONS.map((opt) => {
              const isSel = form.bestTime === opt.id;
              const Icon = opt.id === "earlyMorning" ? Sunrise : opt.id === "evening" ? Sunset : Sun;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setField("bestTime", opt.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isSel
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20"
                      : "bg-[#0d1525] border-slate-700/60 text-slate-300 hover:border-orange-500/40"
                  }`}
                >
                  <Icon size={16} className={isSel ? "text-white" : "text-orange-400"} />
                  <span className="leading-tight text-center">{opt.label}</span>
                  <span className={`text-[10px] font-medium ${isSel ? "text-white/80" : "text-slate-500"}`}>{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating Hours & Days */}
        <div className="bg-[#0d1525]/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Clock size={13} className="text-orange-400" /> Operating Hours <span className="font-normal text-[11px] text-slate-500">(optional)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Opening Time</label>
              <input
                type="time"
                value={form.openTime}
                onChange={(e) => setField("openTime", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Closing Time</label>
              <input
                type="time"
                value={form.closeTime}
                onChange={(e) => setField("closeTime", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Days Open</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setField("daysOpen", form.daysOpen === d.id ? "" : d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    form.daysOpen === d.id
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "bg-[#0d1525] border-slate-700/60 text-slate-300 hover:border-orange-500/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {(form.openTime || form.closeTime) && (
            <p className="text-[11px] text-orange-400 flex items-center gap-1 font-medium pt-1">
              <CheckCircle2 size={12} /> {form.openTime && `Opens: ${form.openTime}`}{form.openTime && form.closeTime && " – "}{form.closeTime && `Closes: ${form.closeTime}`}
            </p>
          )}
        </div>
      </div>
      {renderButtons()}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Photos, Review & Submit
  // ════════════════════════════════════════════════════════════════════════════════
  const renderStep3 = () => (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden">
      <StepHeader />

      {/* Photo Upload */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>
            <ImagePlus size={16} className="text-orange-400" />
            Add Photos
            <span className="text-xs font-normal text-slate-500">(optional · up to 3)</span>
          </p>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            photos.length >= 3 ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-500"
          }`}>{photos.length}/3</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-700/60 aspect-square">
              <img src={p.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              {idx !== 0 && (
                <button type="button" onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition cursor-pointer">
                  <Trash2 size={11} />
                </button>
              )}
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {idx === 0 ? "Cover" : `Photo ${idx + 1}`}
              </span>
            </div>
          ))}
          {photos.length < 3 && (
            <div
              onClick={() => photoInputRef.current?.click()}
              onDrop={handlePhotoDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed aspect-square cursor-pointer transition ${
                isDragging ? "border-orange-500 bg-orange-500/10" : "border-slate-700/60 hover:border-orange-500/50 bg-[#0d1525]"
              }`}
            >
              <ImagePlus size={20} className="text-slate-600" />
              <p className="text-[10px] text-slate-500 text-center leading-tight">
                {photos.length === 0 ? "Add Cover" : photos.length === 1 ? "Add Photo 2" : "Add Photo 3"}
              </p>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" multiple ref={photoInputRef} onChange={handlePhotoPick} className="hidden" />
        <p className="text-[11px] text-slate-500">JPG, PNG, WEBP · Max 5 MB each · Cover photo shows first</p>
      </div>

      {/* Place Overview */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <p className={sectionTitle}>Place Overview</p>
          {!form.isDescEdited && (
            <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-bold border border-orange-500/20">
              Smart Summary
            </span>
          )}
        </div>
        <div className="bg-[#0d1525] rounded-xl p-3.5 border border-slate-700/60">
          <p className="text-xs text-slate-300 leading-relaxed">
            {form.description || (
              <span className="text-slate-600 italic">Select a category and options above to auto-assemble a summary...</span>
            )}
          </p>
        </div>
        <button type="button" onClick={() => setField("isDescEdited", true)}
          className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer">
          <Pencil size={12} /> Edit / Customize Description
        </button>
        <AnimatePresence>
          {form.isDescEdited && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden space-y-1">
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="Describe the place in your own words..."
                data-error={!!errors.description}
              />
              <button type="button" onClick={() => { setField("isDescEdited", false); setField("description", autoDesc); }}
                className="text-[11px] text-slate-500 hover:text-orange-400 transition cursor-pointer">
                ↺ Reset to smart summary
              </button>
              {errors.description && <p className={errorCls}><AlertCircle size={12} /> {errors.description}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Terms & Conditions */}
      <div className={`px-4 py-4 border-t transition-all duration-200 ${
        acceptedTerms ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"
      }`}>
        <label
          htmlFor="terms-checkbox"
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative mt-0.5 shrink-0">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 pointer-events-none ${
                acceptedTerms ? "bg-orange-500 border-orange-500" : "bg-[#0d1525] border-slate-600 group-hover:border-orange-500/60"
              }`}
            >
              {acceptedTerms && <CheckCircle2 size={12} className="text-white" />}
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-relaxed">
            I confirm that the details provided are accurate and authentic. I accept Avadi City Connect&apos;s Community Terms &amp; Conditions regarding data collection and moderation.
          </p>
        </label>
        {!acceptedTerms && (
          <p className="mt-2 text-[10px] text-orange-400/70 flex items-center gap-1 font-bold">
            <FileText size={10} /> Required to submit
          </p>
        )}
        {acceptedTerms && (
          <p className="mt-2 text-[10px] text-green-400 flex items-center gap-1 font-bold">
            <CheckCircle2 size={10} /> Terms accepted
          </p>
        )}
      </div>
      {renderButtons()}
    </div>
  );

  // ─── Navigation Buttons (rendered inside each step card) ────────────────────
  const renderButtons = () => (
    <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-3">
      {currentStep > 0 && (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-[#1a2332] hover:text-gray-900 dark:hover:text-white active:scale-[0.97] transition cursor-pointer shrink-0"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      )}
      {!isLastStep ? (
        <button
          type="button"
          onClick={goNext}
          className="flex-1 py-3 px-6 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.97] cursor-pointer shadow-lg shadow-orange-500/25"
        >
          <span>{currentStep === 0 ? "Next: Facilities & Timings" : "Continue to Final Review"}</span>
          <ArrowRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit as any}
          disabled={isSubmitting || !acceptedTerms}
          className={`flex-1 py-3 px-6 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.97] shadow-lg ${
            acceptedTerms && !isSubmitting
              ? "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white cursor-pointer shadow-orange-500/25"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-300 dark:border-slate-700/60"
          }`}
        >
          {isSubmitting ? (
            <><Loader2 size={18} className="animate-spin" />Submitting...</>
          ) : !acceptedTerms ? (
            <><FileText size={16} />Accept Terms to Submit</>
          ) : (
            <><CheckCircle2 size={18} />Submit Place for Review</>
          )}
        </button>
      )}
    </div>
  );

  const stepContent = [renderStep1, renderStep2, renderStep3];

  // ─── Derived state for button label ──────────────────────────────────────────
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const nextStepLabel = !isLastStep ? WIZARD_STEPS[currentStep + 1].short : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080E1A]" ref={containerRef}>
      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#080E1A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => currentStep === 0 ? router.push("/explore") : goBack()}
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">{currentStep === 0 ? "Explore" : "Back"}</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-slate-300">
            {WIZARD_STEPS[currentStep].label}
          </span>
        </div>

        {/* Draft restored banner */}
        <AnimatePresence>
          {draftRestored && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="bg-orange-500/10 border-t border-orange-500/20 px-4 py-1.5 flex items-center gap-2"
            >
              <CheckCircle2 size={12} className="text-orange-400 shrink-0" />
              <p className="text-[11px] text-orange-300 font-medium">Draft restored — your previous answers are back!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === WIZARD_STEPS.length - 1) {
            handleSubmit(e);
          } else {
            goNext();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "INPUT") {
            e.preventDefault();
            if (currentStep < WIZARD_STEPS.length - 1) {
              goNext();
            }
          }
        }}
        className="max-w-2xl mx-auto px-4 pt-4 pb-32 mb-16"
      >
        {/* Animated Step Content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {stepContent[currentStep]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </form>

      {/* ── Submission Success Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => router.push("/explore")}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-[#0c1322]/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-xl overflow-hidden z-10"
            >
              {/* Subtle top ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Success Badge Icon - Sleek Circle */}
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mx-auto flex items-center justify-center mb-3.5">
                <CheckCircle2 size={24} strokeWidth={2} />
              </div>

              {/* Title & Subtitle - Soft & Elegant Typography */}
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-slate-100 tracking-normal">
                  Place Submitted Successfully
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Thank you! Your suggestion for{" "}
                  <span className="font-medium text-slate-200">{submittedPlaceName || "this place"}</span>{" "}
                  has been received.
                </p>
              </div>

              {/* Status Notice Card - Subtle & Soft */}
              <div className="bg-[#111a2e]/60 border border-slate-800/80 rounded-xl p-3 my-4 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-amber-400/90" />
                    Review Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Pending Admin Review
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  Our moderation team will verify the location details. Once approved, it will be published live on the Explore map.
                </p>
              </div>

              {/* Action Buttons - Clean & Balanced */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => router.push("/explore")}
                  className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Got it, Go to Explore</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-300 transition cursor-pointer text-center font-normal"
                >
                  Suggest Another Place
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
