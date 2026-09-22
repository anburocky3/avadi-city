"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Search,
  Clock,
  ShieldCheck,
  Loader2,
  Edit3,
  Plus,
  Check,
  X,
  User,
  AlertCircle,
  Bell,
  Wrench,
  Zap,
  Hammer,
  Wind,
  Paintbrush,
  Car,
  Tv,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import { Badge, Modal } from "@/components/shared-components";
import { WardSelector } from "@/components/ward-selector";
import { useWard } from "@/context/wardContext";
import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

// Registration categories with professional SVG icons & color accents (NO EMOJIS)
export interface ServiceCategoryConfig {
  id: string;
  nameKey: string;
  fallbackName: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  hint: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  {
    id: "Plumbers",
    nameKey: "plumbers",
    fallbackName: "Plumbers",
    icon: Wrench,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-950/60",
    borderClass: "border-sky-200/80 dark:border-sky-800/80",
    hint: "Leakage, taps, piping & drainage",
  },
  {
    id: "Electricians",
    nameKey: "electricians",
    fallbackName: "Electricians",
    icon: Zap,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/60",
    borderClass: "border-amber-200/80 dark:border-amber-800/80",
    hint: "Wiring, switches, fan & inverter",
  },
  {
    id: "Carpenters",
    nameKey: "carpenters",
    fallbackName: "Carpenters",
    icon: Hammer,
    colorClass: "text-amber-800 dark:text-amber-300",
    bgClass: "bg-amber-100/50 dark:bg-amber-950/40",
    borderClass: "border-amber-300/80 dark:border-amber-800/80",
    hint: "Doors, furniture & woodwork",
  },
  {
    id: "AC Repair",
    nameKey: "acRepair",
    fallbackName: "AC Repair",
    icon: Wind,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/60",
    borderClass: "border-cyan-200/80 dark:border-cyan-800/80",
    hint: "Service, gas refilling & cooling",
  },
  {
    id: "Painters",
    nameKey: "painters",
    fallbackName: "Painters",
    icon: Paintbrush,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/60",
    borderClass: "border-purple-200/80 dark:border-purple-800/80",
    hint: "Interior, exterior wall painting",
  },
  {
    id: "Mechanics",
    nameKey: "mechanics",
    fallbackName: "Mechanics",
    icon: Car,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/60",
    borderClass: "border-rose-200/80 dark:border-rose-800/80",
    hint: "Bike, car repair & breakdown",
  },
  {
    id: "Appliance Repair",
    nameKey: "applianceRepair",
    fallbackName: "Appliance Repair",
    icon: Tv,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/60",
    borderClass: "border-indigo-200/80 dark:border-indigo-800/80",
    hint: "Washing machine, fridge, TV",
  },
];

export const SERVICE_SKILLS: Record<string, string[]> = {
  Plumbers: [
    "Pipe Leakage Repair",
    "Bathroom Fitting",
    "Water Tank Cleaning",
    "Drainage Clearing",
    "Motor / Pump Repair",
    "RO Installation",
    "Tap & Shower Repair",
    "Sanitary Pipeline",
  ],
  Electricians: [
    "Home Rewiring",
    "Switch & Socket Repair",
    "Fan Installation",
    "Light Installation",
    "Inverter Installation",
    "Meter Work",
    "Electrical Fault Repair",
    "MCB & Fuse Box Repair",
  ],
  Carpenters: [
    "Door & Window Repair",
    "Furniture Assembly",
    "Custom Cabinetry",
    "Lock Replacement",
    "Wood Polishing",
    "Modular Kitchen Work",
    "Wardrobe Repair",
    "Hinges & Fittings",
  ],
  "AC Repair": [
    "AC General Service",
    "Gas Refilling",
    "Installation & Uninstallation",
    "Compressor Check",
    "Water Leakage Fix",
    "PCB Board Repair",
    "Coil Cleaning",
    "Duct Cleaning",
  ],
  Painters: [
    "Interior Painting",
    "Exterior Painting",
    "Wall Putty & Primer",
    "Waterproofing",
    "Texture Painting",
    "Wood & Metal Polishing",
    "Damp Wall Treatment",
  ],
  Mechanics: [
    "Bike General Service",
    "Car Breakdown Support",
    "Engine Oil Change",
    "Brake Repair & Replacement",
    "Puncture & Tire Repair",
    "Battery Replacement",
    "Electrical & Wiring Check",
  ],
  "Appliance Repair": [
    "Washing Machine Repair",
    "Refrigerator Service",
    "Microwave Oven Repair",
    "Mixer Grinder Service",
    "Water Heater / Geyser Repair",
    "TV Repair",
    "Induction Stove Fix",
  ],
};

export const EXPERIENCE_OPTIONS = [
  "0–1 Year",
  "2 Years",
  "3 Years",
  "4 Years",
  "5 Years",
  "6 Years",
  "7 Years",
  "8 Years",
  "9 Years",
  "10+ Years",
];

export const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const options: { value: string; label: string }[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      const val = `${hh}:${mm}`;
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayHour.toString().padStart(2, "0")}:${mm} ${period}`;
      options.push({ value: val, label });
    }
  }
  return options;
})();

export const formatTimeTo12hr = (timeStr: string): string => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH.toString().padStart(2, "0")}:${mStr || "00"} ${period}`;
};

export function RegisterClient({
  wardsList = [],
}: {
  wardsList: { id: number; name: string }[];
}) {
  const router = useRouter();
  const t = useTranslations("services");
  const locale = useLocale();
  const { activeWard, authUser } = useWard();

  // Natural flow:
  // Step 1: Profile Details & Ward (First!)
  // Step 2: Trade Category & Specific Skills
  // Step 3: Experience, Pricing & Hours
  // Step 4: Final Review & Submit
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [regSubmitted, setRegSubmitted] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isStreetWardModalOpen, setIsStreetWardModalOpen] = useState<boolean>(false);
  const [customSkillInput, setCustomSkillInput] = useState<string>("");
  const [customSkillsByCategory, setCustomSkillsByCategory] = useState<
    Record<string, string[]>
  >({});
  const [photoConsent, setPhotoConsent] = useState<boolean>(false);
  const [reviewConsent, setReviewConsent] = useState<boolean>(false);
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);

  // Photo & Camera State
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll to the very top across all container types (<main>, window, html, body)
  const scrollToTop = () => {
    if (topRef.current) {
      try {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        topRef.current.scrollIntoView();
      }
    }
    const scrollParent =
      topRef.current?.closest("main") || document.querySelector("main");
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Automatically scroll to top whenever step changes or form is submitted
  useEffect(() => {
    scrollToTop();
    const t1 = setTimeout(() => scrollToTop(), 50);
    const t2 = setTimeout(() => scrollToTop(), 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [regStep, regSubmitted]);

  const [regData, setRegData] = useState({
    profilePhoto: "",
    fullName: "",
    category: "Plumbers",
    services: ["Pipe Leakage Repair", "Bathroom Fitting"] as string[],
    servingWard: activeWard?.id || 14,
    streetName: "",
    phone: "",
    email: "",
    address: "",
    lat: 13.1169,
    lng: 80.0972,
    experience: "5 Years",
    startTime: "08:00",
    endTime: "20:00",
    visitingCharge: "350",
    description: "",
  });

  // Stop camera stream cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraStarting(false);
    setIsCameraReady(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // When live camera opens, attach the stream to videoRef once mounted
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      const playVideo = async () => {
        try {
          await video.play();
          setIsCameraReady(true);
        } catch (e) {
          console.warn("video.play error", e);
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.onloadeddata = playVideo;
      }
    }
  }, [isCameraOpen, cameraFacing]);

  // Start Live Camera
  const startCameraStream = async (facing: "user" | "environment" = "user") => {
    setIsCameraStarting(true);
    setIsCameraReady(false);
    setUploadError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const hasMediaDevices =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    if (!hasMediaDevices) {
      setIsCameraStarting(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setUploadError(
          locale === "ta"
            ? "கேமரா இந்த உலாவியில் ஆதரிக்கப்படவில்லை. கோப்புகளிலிருந்து பதிவேற்றவும்."
            : "Camera is not supported on this browser. Please upload from files.",
        );
      }
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      setCameraFacing(facing);
      setIsCameraOpen(true);
      setIsCameraStarting(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => {
            setIsCameraReady(true);
          })
          .catch(console.warn);
      }
    } catch (err: any) {
      console.warn("getUserMedia failed:", err);
      setIsCameraStarting(false);
      setIsCameraOpen(false);
      setIsCameraReady(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setUploadError(
          locale === "ta"
            ? "கேமரா அனுமதி மறுக்கப்பட்டது. உலாவியில் கேமரா அனுமதியை அனுமதிக்கவும் அல்லது கோப்புகளிலிருந்து பதிவேற்றவும்."
            : "Camera permission denied. Please allow camera access in browser settings or upload from files.",
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setUploadError(
          locale === "ta"
            ? "கேமரா சாதனம் எதுவும் கண்டறியப்படவில்லை. கோப்புகளிலிருந்து பதிவேற்றவும்."
            : "No camera device found. Please upload from files.",
        );
      } else {
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        } else {
          setUploadError(
            locale === "ta"
              ? "கேமராவைத் தொடங்க முடியவில்லை. கோப்புகளிலிருந்து பதிவேற்றவும்."
              : "Could not open camera. Please upload from files.",
          );
        }
      }
    }
  };

  // Capture Photo from Live Camera
  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setUploadError(
        locale === "ta"
          ? "கேமரா இன்னும் தயாராகவில்லை. தயவுசெய்து ஒரு வினாடி காத்திருக்கவும்."
          : "Camera is still initializing. Please wait a moment.",
      );
      return;
    }

    const canvas = document.createElement("canvas");
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const targetSize = Math.min(minDim, 500);
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (cameraFacing === "user") {
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);
    }

    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;
    ctx.drawImage(
      video,
      startX,
      startY,
      minDim,
      minDim,
      0,
      0,
      targetSize,
      targetSize,
    );

    stopCameraStream();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (dataUrl && dataUrl.startsWith("data:image/jpeg") && dataUrl.length > 100) {
      setRegData((prev) => ({ ...prev, profilePhoto: dataUrl }));
      setRegError(null);
      setUploadError(null);
    } else {
      setUploadError("Could not capture photo. Please try uploading from files.");
    }
  };

  // Process File Upload or Native Camera input
  const processImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError(
        locale === "ta"
          ? "தயவுசெய்து ஒரு படக் கோப்பைத் தேர்ந்தெடுக்கவும் (JPG, PNG, WebP)."
          : "Please select a valid image file (JPG, PNG, WebP).",
      );
      return;
    }

    setIsCompressingImage(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsCompressingImage(false);
      setUploadError(
        locale === "ta"
          ? "படத்தைப் படிக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
          : "Failed to read image file. Please try again.",
      );
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        setIsCompressingImage(false);
        setUploadError(
          locale === "ta"
            ? "படத்தை ஏற்ற முடியவில்லை. தயவுசெய்து வேறு படத்தைப் பயன்படுத்தவும்."
            : "Failed to load image. Please use another photo.",
        );
      };

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const minDim = Math.min(img.width, img.height);
          const targetSize = Math.min(minDim, 500);
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setIsCompressingImage(false);
            return;
          }

          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize,
          );

          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          if (
            dataUrl &&
            dataUrl.startsWith("data:image/jpeg") &&
            dataUrl.length > 100
          ) {
            setRegData((prev) => ({ ...prev, profilePhoto: dataUrl }));
            setRegError(null);
            setUploadError(null);
          } else if (typeof e.target?.result === "string") {
            setRegData((prev) => ({
              ...prev,
              profilePhoto: e.target!.result as string,
            }));
            setRegError(null);
          }
        } catch (err) {
          console.error("Image resize error:", err);
          if (typeof e.target?.result === "string") {
            setRegData((prev) => ({
              ...prev,
              profilePhoto: e.target!.result as string,
            }));
            setRegError(null);
          }
        } finally {
          setIsCompressingImage(false);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Validation according to step sequence
  const validateStep = (step: 1 | 2 | 3): boolean => {
    // Step 1: Profile & Serving Ward
    if (step === 1) {
      if (
        !regData.profilePhoto ||
        !regData.profilePhoto.startsWith("data:image") ||
        regData.profilePhoto.length < 100
      ) {
        setRegError(
          locale === "ta"
            ? "சுயவிவரப் படம் அவசியம். படம் எடுக்கவும் அல்லது கோப்பிலிருந்து பதிவேற்றவும்."
            : "Profile photo is required. Please upload or take a photo.",
        );
        return false;
      }
      if (!regData.fullName.trim()) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்."
            : "Please enter your full name or business name.",
        );
        return false;
      }
      const phoneDigits = regData.phone.replace(/[^0-9]/g, "");
      if (phoneDigits.length < 10) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்."
            : "Please enter a valid 10-digit phone number.",
        );
        return false;
      }
      if (regData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(regData.email.trim())) {
          setRegError(
            locale === "ta"
              ? "தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்."
              : "Please enter a valid email address.",
          );
          return false;
        }
      }
      if (!regData.servingWard) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து உங்கள் முதன்மை சேவை வார்டைத் தேர்ந்தெடுக்கவும்."
            : "Please select your primary serving ward.",
        );
        return false;
      }
      if (!photoConsent) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து புகைப்பட உறுதிமொழி அறிவிப்பை ஏற்கவும்."
            : "Please acknowledge the photograph declaration checkbox to proceed.",
        );
        return false;
      }
      return true;
    }

    // Step 2: Trade Category & Skills
    if (step === 2) {
      if (!regData.category) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து உங்கள் முதன்மை தொழிலைத் தேர்ந்தெடுக்கவும்."
            : "Please select your primary service trade.",
        );
        return false;
      }
      if (regData.services.length === 0) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து குறைந்தது ஒரு வேலையையாவது தேர்ந்தெடுக்கவும்."
            : "Please select at least one service you provide.",
        );
        return false;
      }
      return true;
    }

    // Step 3: Experience & Rates
    if (step === 3) {
      if (!regData.experience) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து உங்கள் பணி அனுபவத்தைத் தேர்ந்தெடுக்கவும்."
            : "Please select your years of experience.",
        );
        return false;
      }
      if (
        !regData.visitingCharge.trim() ||
        isNaN(Number(regData.visitingCharge)) ||
        Number(regData.visitingCharge) < 0
      ) {
        setRegError(
          locale === "ta"
            ? "தயவுசெய்து சரியான ஆய்வுக் கட்டணத்தை உள்ளிடவும்."
            : "Please enter a valid visiting/inspection charge (numbers only).",
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (regStep < 4) {
      if (validateStep(regStep as 1 | 2 | 3)) {
        setRegError(null);
        setRegStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
        scrollToTop();
      }
    }
  };

  const handlePrevStep = () => {
    setRegError(null);
    if (regStep > 1) {
      setRegStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      scrollToTop();
    }
  };

  const handleSelectCategory = (catId: string) => {
    const defaultSkills = SERVICE_SKILLS[catId] ? SERVICE_SKILLS[catId].slice(0, 2) : [];
    const savedCustom = customSkillsByCategory[catId] || [];
    setRegData((prev) => ({
      ...prev,
      category: catId,
      services: [...defaultSkills, ...savedCustom],
    }));
    setRegError(null);
  };

  const handleToggleService = (service: string) => {
    setRegData((prev) => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s !== service)
          : [...prev.services, service],
      };
    });
    setRegError(null);
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    // Track in custom skills for current category
    setCustomSkillsByCategory((prev) => {
      const existing = prev[regData.category] || [];
      if (existing.includes(trimmed)) return prev;
      return {
        ...prev,
        [regData.category]: [...existing, trimmed],
      };
    });

    // Also select it in regData.services
    if (!regData.services.includes(trimmed)) {
      setRegData((prev) => ({
        ...prev,
        services: [...prev.services, trimmed],
      }));
    }

    setCustomSkillInput("");
    setRegError(null);
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkillsByCategory((prev) => ({
      ...prev,
      [regData.category]: (prev[regData.category] || []).filter((s) => s !== skill),
    }));
    setRegData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== skill),
    }));
  };

  // Push notification trigger
  const triggerPushNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const title = locale === "ta" ? "ஆவடி மாநகராட்சி சேவைகள்" : "Avadi City Services";
      const body =
        locale === "ta"
          ? "ஆவடி மாநகரில் சேவை வழங்குநராக இணைவதற்கான உங்கள் கோரிக்கை வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது. மதிப்பாய்வு செய்யப்பட்டதும் உங்களுக்கு அறிவிக்கப்படும்."
          : "Your request to join Avadi City as a service provider has been submitted successfully. We’ll notify you once it’s reviewed.";

      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon: "/icons/icon-192x192.png",
          });
        } catch (e) {
          console.warn("Native Notification error:", e);
        }
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            try {
              new Notification(title, {
                body,
                icon: "/icons/icon-192x192.png",
              });
            } catch (e) {
              console.warn("Native Notification error:", e);
            }
          }
        });
      }
    }
  };

  const handleSubmitRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    if (!reviewConsent) {
      setRegError(
        locale === "ta"
          ? "தயவுசெய்து சமர்ப்பிக்கும் முன் உங்கள் விவரங்கள் சரியாக உள்ளதை உறுதிப்படுத்தும் அறிவிப்பை ஏற்கவும்."
          : "Please confirm that your details are correct before submitting.",
      );
      return;
    }

    // Trigger device push notification
    triggerPushNotification();
    setRegSubmitted(true);
    scrollToTop();
  };

  const handleFinishAndReturn = () => {
    router.push("/services?registered=true");
  };

  return (
    <div ref={topRef} className="min-h-screen pb-28 pt-2 sm:pt-4 px-3 sm:px-6 max-w-2xl mx-auto space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-bold text-xs py-1.5 px-2.5 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{locale === "ta" ? "சேவைகள்" : "Services"}</span>
        </Link>

        {!regSubmitted && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
              {regStep === 1 && (locale === "ta" ? "சுயவிவரம் & வார்டு" : "Profile & Location")}
              {regStep === 2 && (locale === "ta" ? "தொழில் & வேலைகள்" : "Trade & Skills")}
              {regStep === 3 && (locale === "ta" ? "அனுபவம் & கட்டணம்" : "Rates & Hours")}
              {regStep === 4 && (locale === "ta" ? "சரிபார்த்து சமர்ப்பி" : "Review & Submit")}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {regSubmitted ? (
        /* SUBMISSION SUCCESS CONFIRMATION VIEW */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} className="animate-in zoom-in duration-300" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {t("applicationSubmitted")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              {locale === "ta"
                ? "ஆவடி மாநகரில் சேவை வழங்குநராக இணைவதற்கான உங்கள் கோரிக்கை வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது. மதிப்பாய்வு செய்யப்பட்டதும் உங்களுக்கு அறிவிக்கப்படும்."
                : "Your request to join Avadi City as a service provider has been submitted successfully. We’ll notify you once it’s reviewed."}
            </p>
          </div>

          {/* Structured Worker Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-3 shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
              {regData.profilePhoto &&
              regData.profilePhoto.startsWith("data:image") &&
              regData.profilePhoto.length > 100 ? (
                <img
                  src={regData.profilePhoto}
                  alt={regData.fullName}
                  onError={() => setRegData((prev) => ({ ...prev, profilePhoto: "" }))}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <User size={20} className="text-slate-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {regData.fullName}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="primary" className="text-[10px] py-0 px-2 font-bold">
                    {regData.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Ward {regData.servingWard}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1.5">
                <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                <span>{locale === "ta" ? "நிலை:" : "Status:"}</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                {locale === "ta" ? "நிர்வாக பரிசீலனையில் உள்ளது" : "Awaiting Admin Approval"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-start gap-2">
              <ShieldCheck size={15} className="shrink-0 text-primary mt-0.5" />
              <span>
                {locale === "ta"
                  ? "நிர்வாக ஒப்புதல் அளிக்கப்பட்டதும் இது ஆவடி சேவை பட்டியலில் தானாக சேர்க்கப்படும். சாதன அறிவிப்பு அனுப்பப்படும்."
                  : "Once verified by the municipal administration, your profile will be published to the Local Services directory."}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishAndReturn}
            className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white rounded-2xl font-bold text-xs sm:text-sm transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Bell size={15} />
            <span>{locale === "ta" ? "முடிந்தது — சேவை பகுதிக்குச் செல்" : "Done — Return to Local Services"}</span>
          </button>
        </div>
      ) : (
        /* 4-STEP WIZARD CONTAINER */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
          {/* MODERN CAPSULE STEPPER */}
          <div className="space-y-2.5">
            {/* 4 Clean Rounded Capsule Bars */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((stepIdx) => {
                const isCompleted = regStep > stepIdx;
                const isCurrent = regStep === stepIdx;
                return (
                  <div
                    key={stepIdx}
                    className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-300"
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
                  {locale === "ta" ? `படி ${regStep} / 4` : `STEP ${regStep} OF 4`}
                </span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {regStep === 1 && (locale === "ta" ? "சுயவிவரப் படம் & சேவை வார்டு" : "Profile Photo & Serving Ward")}
                  {regStep === 2 && (locale === "ta" ? "உங்கள் தொழில் & சேவைகளைத் தேர்ந்தெடுக்கவும்" : "Select Your Trade & Services")}
                  {regStep === 3 && (locale === "ta" ? "பணி அனுபவம் & கட்டணம்" : "Experience, Rates & Hours")}
                  {regStep === 4 && (locale === "ta" ? "விவரங்களைச் சரிபார்த்து சமர்ப்பிக்கவும்" : "Review & Submit Profile")}
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {regStep === 1 && (locale === "ta" ? "உங்கள் படம், தொடர்பு விவரங்கள் மற்றும் பணிபுரியும் வார்டை உள்ளிடவும்." : "Upload your photo, contact info, and select your active ward.")}
                  {regStep === 2 && (locale === "ta" ? "உங்கள் முக்கிய தொழில் மற்றும் நீங்கள் வழங்கும் பழுதுபார்க்கும் வேலைகள்." : "Pick your core trade and check off the repairs you handle.")}
                  {regStep === 3 && (locale === "ta" ? "உங்கள் அனுபவம் மற்றும் வாடிக்கையாளர் வருகைக் கட்டணம்." : "Set your years of experience, inspection charge, and working hours.")}
                  {regStep === 4 && (locale === "ta" ? "நிர்வாக ஒப்புதலுக்கு அனுப்பும் முன் தகவல்களைச் சரிபார்க்கவும்." : "Double-check your information before sending for admin review.")}
                </p>
              </div>

              <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                {regStep}/4
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {regError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {/* ================= STEP 1: PROFILE DETAILS & WARD (STARTING HERE) ================= */}
          {regStep === 1 && (
            <div className="space-y-5 text-xs">
              {/* Profile Photo Section (Compulsory with *) */}
              <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-900 dark:text-slate-100 font-semibold text-xs sm:text-sm">
                    {locale === "ta" ? "சுயவிவர புகைப்படம் *" : "Profile Photo *"}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {locale === "ta"
                      ? "தெளிவான புகைப்படத்தை பதிவேற்றவும் அல்லது கேமராவில் எடுக்கவும்."
                      : "Upload a recent portrait or take a photo."}
                  </p>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleCameraInputChange}
                  className="hidden"
                />

                {/* Live Camera Viewfinder */}
                {isCameraOpen ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white space-y-3 animate-in fade-in">
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-square max-w-[220px] mx-auto border border-slate-800 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedData={() => {
                          if (videoRef.current) {
                            videoRef.current.play().catch(console.warn);
                            setIsCameraReady(true);
                          }
                        }}
                        className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
                      />
                      {(!isCameraReady || isCameraStarting) && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 z-10">
                          <Loader2 size={24} className="animate-spin text-white" />
                          <span className="text-xs font-medium">
                            {locale === "ta" ? "கேமரா தயாராகிறது..." : "Starting camera..."}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={capturePhotoFromCamera}
                        disabled={isCompressingImage || isCameraStarting || !isCameraReady}
                        className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isCompressingImage ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={14} />
                            <span>{locale === "ta" ? "படம் எடுக்கவும்" : "Capture Photo"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => startCameraStream(cameraFacing === "user" ? "environment" : "user")}
                        disabled={isCameraStarting}
                        title={locale === "ta" ? "கேமரா மாற்றுக" : "Flip Camera"}
                        className="p-2 rounded-lg border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <RefreshCw size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-2 rounded-lg border border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                      >
                        {locale === "ta" ? "ரத்து" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Clean Minimalist Photo Dropzone */
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent">
                    <div className="shrink-0">
                      {regData.profilePhoto &&
                      regData.profilePhoto.startsWith("data:image") &&
                      regData.profilePhoto.length > 100 ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                          <img
                            src={regData.profilePhoto}
                            alt="Profile"
                            onError={() => {
                              setRegData((prev) => ({ ...prev, profilePhoto: "" }));
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                          <User size={22} className="text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        {/* Solid Primary Button: Upload from files */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-orange-600 transition shadow-xs cursor-pointer active:scale-[0.98]"
                        >
                          <Upload size={13} />
                          <span>{locale === "ta" ? "கோப்புகளிலிருந்து பதிவேற்றவும்" : "Upload from files"}</span>
                        </button>

                        {/* Subtle Outline Button: Take Photo */}
                        <button
                          type="button"
                          onClick={() => startCameraStream("user")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80 transition border border-slate-300 dark:border-slate-700 cursor-pointer active:scale-[0.98]"
                        >
                          <Camera size={13} />
                          <span>{locale === "ta" ? "படம் எடுக்கவும்" : "Take Photo"}</span>
                        </button>

                        {regData.profilePhoto && regData.profilePhoto.length > 100 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRegData((prev) => ({ ...prev, profilePhoto: "" }));
                              setUploadError(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                              if (cameraInputRef.current) cameraInputRef.current.value = "";
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>{locale === "ta" ? "நீக்குக" : "Remove"}</span>
                          </button>
                        )}
                      </div>

                      {isCompressingImage && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500">
                          <Loader2 size={12} className="animate-spin text-primary" />
                          <span>Optimizing photo...</span>
                        </div>
                      )}

                      {uploadError && (
                        <p className="text-xs text-rose-500 font-medium">
                          {uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Standard unstyled inline legal consent checkbox */}
                <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={photoConsent}
                    onChange={(e) => {
                      setPhotoConsent(e.target.checked);
                      if (e.target.checked) setRegError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                  />
                  <span className="leading-normal">
                    {locale === "ta"
                      ? "இப்புகைப்படம் எனது உண்மையான அடையாளம் என உறுதிப்படுத்துகிறேன். ஆவடி சிட்டி உள்ளூர் சேவைகளில் பின்னணி சரிபார்ப்பு நோக்கங்களுக்காக மட்டுமே இதைப் பயன்படுத்த ஒப்புக்கொள்கிறேன்."
                      : "I certify that this photo is an accurate representation of my identity and authorize its use for background verification on Avadi City Local Services."}
                  </span>
                </label>
              </div>

              {/* Full Name / Business Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {locale === "ta" ? "முழு பெயர் / நிறுவன பெயர் *" : "Full Name / Business Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={regData.fullName}
                  onChange={(e) => {
                    setRegData({ ...regData, fullName: e.target.value });
                    setRegError(null);
                  }}
                  placeholder={
                    locale === "ta"
                      ? "எ.கா. ஆனந்த் (பிளம்பர்) அல்லது ராயல் எலக்ட்ரிக்"
                      : "e.g. Anand (Master Plumber) or Royal Electric"
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Phone & Email (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {locale === "ta" ? "தொலைபேசி எண் *" : "Phone Number *"}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regData.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      setRegData({ ...regData, phone: digitsOnly });
                      setRegError(null);
                    }}
                    placeholder="9876543210"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm font-medium tracking-wide"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {locale === "ta" ? "மின்னஞ்சல் (விருப்பத்தேர்வு)" : "Email (Optional)"}
                  </label>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => {
                      setRegData({ ...regData, email: e.target.value });
                      setRegError(null);
                    }}
                    placeholder="name@example.com"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Primary Serving Ward (with Interactive Find Your Street Search) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {locale === "ta" ? "முதன்மை சேவை வார்டு *" : "Primary Serving Ward *"}
                </label>
                <div
                  onClick={() => setIsStreetWardModalOpen(true)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                      W{regData.servingWard}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs truncate">
                        Ward {regData.servingWard}
                        {regData.streetName && ` • ${regData.streetName}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {locale === "ta" ? "தெருவைத் தேடி வார்டு மாற்றுக" : "Search street to change"}
                      </span>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:underline shrink-0">
                    <Search size={13} />
                    <span>{locale === "ta" ? "தேடு" : "Find"}</span>
                  </span>
                </div>
              </div>

              {/* Street Name & Landmark */}
              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <MapPin size={18} />
                  </div>
                  <span>
                    {locale === "ta" ? "தெரு பெயர் & முக்கிய அடையாளம்" : "Street Name & Landmark"}
                  </span>
                </label>

                <input
                  type="text"
                  autoComplete="off"
                  value={regData.streetName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRegData((prev) => ({ ...prev, streetName: val, address: val }));
                    setRegError(null);
                    if (val.trim().length < 2) {
                      setStreetResults([]);
                      return;
                    }
                    const filtered = ALL_AVADI_STREETS.filter((item) =>
                      item.streetName.toLowerCase().includes(val.toLowerCase().trim()),
                    ).slice(0, 10);
                    setStreetResults(filtered);
                  }}
                  placeholder={
                    locale === "ta"
                      ? "எ.கா. பட்டாபிராம் ரயில் நிலையம் அருகில் அல்லது காந்தி ரோடு"
                      : "e.g. Near Pattabiram Railway Station or Gandhi Road"
                  }
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                {/* Autocomplete dropdown for Avadi Streets */}
                <AnimatePresence>
                  {streetResults.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl custom-scrollbar top-full divide-y divide-slate-100 dark:divide-slate-800"
                    >
                      {streetResults.map((street, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setRegData((prev) => ({
                              ...prev,
                              streetName: street.streetName,
                              address: street.streetName,
                              servingWard: street.wardNo,
                            }));
                            setStreetResults([]);
                            setRegError(null);
                          }}
                          className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-primary cursor-pointer flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
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
            </div>
          )}

          {/* ================= STEP 2: TRADE & SERVICES (NO EMOJIS, SLEEK SVG VECTOR ICONS) ================= */}
          {regStep === 2 && (
            <div className="space-y-5 text-xs">
              {/* Trade Selection Cards */}
              <div className="space-y-2">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                  {locale === "ta" ? "முதன்மை தொழில் *" : "Select Your Primary Trade *"}
                </label>
                <p className="text-[11px] text-slate-400">
                  {locale === "ta"
                    ? "நீங்கள் வழங்கும் முக்கிய தொழிலைத் தேர்ந்தெடுக்கவும்."
                    : "Choose your trade. You can specify exact repair skills below."}
                </p>

                {/* Professional 2-Column Vector Icon Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isSelected = regData.category === cat.id;
                    const IconComponent = cat.icon;
                    const label = t(`categories.${cat.nameKey}`, {
                      defaultValue: cat.fallbackName,
                    });
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`min-h-[62px] p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer select-none active:scale-[0.98] ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary dark:text-orange-400 ring-2 ring-primary/20 shadow-xs font-bold"
                            : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : `${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`
                          }`}
                        >
                          <IconComponent size={18} className="stroke-[2.2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate leading-tight">{label}</span>
                          <span className="block text-[10px] text-slate-400 truncate mt-0.5">{cat.hint}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills Checklist for Selected Category */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                      {locale === "ta" ? `நீங்கள் வழங்கும் ${regData.category} வேலைகள் *` : `What ${regData.category} work do you provide? *`}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {locale === "ta" ? "பொருந்தும் வேலைகளைத் தேர்ந்தெடுக்கவும்" : "Select all skills that apply to your work"}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {regData.services.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const categoryDefaultSkills = SERVICE_SKILLS[regData.category] || [];
                    const categoryCustomSkills = customSkillsByCategory[regData.category] || [];
                    const allCategorySkills = Array.from(
                      new Set([
                        ...categoryDefaultSkills,
                        ...categoryCustomSkills,
                        ...regData.services.filter((s) => !categoryDefaultSkills.includes(s)),
                      ]),
                    );

                    return allCategorySkills.map((skill) => {
                      const isChecked = regData.services.includes(skill);
                      const isCustom = !categoryDefaultSkills.includes(skill);
                      return (
                        <div
                          key={skill}
                          onClick={() => handleToggleService(skill)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                            isChecked
                              ? "bg-primary/5 border-primary/50 text-slate-900 dark:text-slate-100 font-bold"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                              }`}
                            >
                              {isChecked && <Check size={11} className="stroke-[3]" />}
                            </div>
                            <span className="text-xs truncate">{skill}</span>
                          </div>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomSkill(skill);
                              }}
                              title={locale === "ta" ? "நீக்குக" : "Delete"}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Add Custom Skill */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                    placeholder={
                      locale === "ta"
                        ? "பிற சிறப்பு வேலைகளை உள்ளிடவும் (எ.கா. இன்வெர்ட்டர் சர்வீஸ்)..."
                        : "Add another skill / repair specialization..."
                    }
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    disabled={!customSkillInput.trim()}
                    className="px-3.5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{locale === "ta" ? "சேர்" : "Add"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EXPERIENCE, RATES, HOURS ================= */}
          {regStep === 3 && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Experience Dropdown */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {locale === "ta" ? "பணி அனுபவம் *" : "Years of Experience *"}
                  </label>
                  <select
                    value={regData.experience}
                    onChange={(e) =>
                      setRegData({ ...regData, experience: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visiting / Inspection Charge */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {locale === "ta" ? "ஆய்வு / வருகைக் கட்டணம் (₹) *" : "Visiting / Inspection Charge (₹) *"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={regData.visitingCharge}
                      onChange={(e) =>
                        setRegData({ ...regData, visitingCharge: e.target.value })
                      }
                      placeholder="350"
                      className="w-full pl-8 pr-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-primary focus:outline-none text-xs sm:text-sm"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {locale === "ta"
                      ? "வாடிக்கையாளர் இடத்தில் ஆரம்ப ஆய்வுக்கான குறைந்தபட்ச கட்டணம்."
                      : "Base charge for home visit and initial diagnosis."}
                  </span>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {locale === "ta" ? "வேலை நேரம் *" : "Working Hours *"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {locale === "ta" ? "தொடங்கும் நேரம்" : "Starts at"}
                    </span>
                    <select
                      value={regData.startTime}
                      onChange={(e) =>
                        setRegData({ ...regData, startTime: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {locale === "ta" ? "முடியும் நேரம்" : "Closes at"}
                    </span>
                    <select
                      value={regData.endTime}
                      onChange={(e) =>
                        setRegData({ ...regData, endTime: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {locale === "ta"
                    ? "கூடுதல் விவரங்கள் (விரும்பினால்)"
                    : "Additional Notes / Tools & Warranty (Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={regData.description}
                  onChange={(e) =>
                    setRegData({ ...regData, description: e.target.value })
                  }
                  placeholder={
                    locale === "ta"
                      ? "சிறப்பு கருவிகள், வாரண்டி அல்லது அவசர சேவைகள் பற்றிய விவரங்கள்..."
                      : "Describe special tools available, warranty on repairs, or emergency support..."
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW & SUBMIT ================= */}
          {regStep === 4 && (
            <div className="space-y-4 text-xs">
              {/* Structured Review Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
                {/* Header Preview */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {regData.profilePhoto &&
                    regData.profilePhoto.startsWith("data:image") &&
                    regData.profilePhoto.length > 100 ? (
                      <img
                        src={regData.profilePhoto}
                        alt={regData.fullName}
                        onError={() => setRegData((prev) => ({ ...prev, profilePhoto: "" }))}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <User size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {regData.fullName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="primary" className="text-[10px] py-0 px-1.5 font-bold">
                          {regData.category}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Ward {regData.servingWard}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="text-primary hover:text-orange-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>{t("editSection")}</span>
                  </button>
                </div>

                {/* Contact & Location Details */}
                <div className="text-[11px] space-y-1.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{locale === "ta" ? "தொலைபேசி:" : "Phone:"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {regData.phone}
                    </span>
                  </div>
                  {regData.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{locale === "ta" ? "மின்னஞ்சல்:" : "Email:"}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {regData.email}
                      </span>
                    </div>
                  )}
                  {regData.address && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 shrink-0">
                        {locale === "ta" ? "சேவை பகுதி:" : "Service Area:"}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                        {regData.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Skills Preview */}
                <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {locale === "ta" ? "சேவைகள் & திறன்கள்:" : "Services & Skills:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="text-primary hover:text-orange-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={11} />
                      <span>{t("editSection")}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {regData.services.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-semibold text-primary dark:text-orange-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience, Visiting Rate, Hours */}
                <div className="text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{locale === "ta" ? "அனுபவம் & கட்டணம்:" : "Exp & Rate:"}</span>
                    <button
                      type="button"
                      onClick={() => setRegStep(3)}
                      className="text-primary hover:text-orange-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={11} />
                      <span>{t("editSection")}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                      <span className="text-[10px] text-slate-400 block">{locale === "ta" ? "அனுபவம்" : "Experience"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{regData.experience}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                      <span className="text-[10px] text-slate-400 block">{locale === "ta" ? "ஆய்வுக் கட்டணம்" : "Visiting Rate"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">₹{regData.visitingCharge}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                      <span className="text-[10px] text-slate-400 block">{locale === "ta" ? "வேலை நேரம்" : "Hours"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-[10px]">
                        {formatTimeTo12hr(regData.startTime)} - {formatTimeTo12hr(regData.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Review Confirmation & Ready to Submit Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reviewConsent}
                  onChange={(e) => {
                    setReviewConsent(e.target.checked);
                    if (e.target.checked) setRegError(null);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {locale === "ta"
                    ? "எனது விவரங்களைச் சரிபார்த்து அனைத்தும் சரியாக இருப்பதை உறுதிப்படுத்துகிறேன். எனது சுயவிவரத்தை மதிப்பாய்வுக்குச் சமர்ப்பிக்கத் தயாராக உள்ளேன்."
                    : "I’ve reviewed my details and confirm that everything looks correct. I’m ready to submit my profile for review."}
                </span>
              </label>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            {regStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft size={15} />
                <span>{t("prevStep")}</span>
              </button>
            ) : (
              <div />
            )}

            {regStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5 ml-auto active:scale-95"
              >
                <span>
                  {regStep === 1 && (locale === "ta" ? "சேவைகளுக்குத் தொடர்க" : "Continue to Services")}
                  {regStep === 2 && (locale === "ta" ? "கட்டணத்திற்குத் தொடர்க" : "Continue to Rates")}
                  {regStep === 3 && (locale === "ta" ? "விவரங்களைச் சரிபார்க்கவும்" : "Review Details")}
                </span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={!reviewConsent}
                className="px-5 py-2.5 bg-linear-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-extrabold text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 ml-auto active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} />
                <span>{t("submitForReview")}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Street to Ward Mapping Modal (Find Your Street) */}
      <Modal
        isOpen={isStreetWardModalOpen}
        onClose={() => setIsStreetWardModalOpen(false)}
        title={locale === "ta" ? "சேவை வார்டைத் தேர்ந்தெடுக்கவும்" : "Select Active Ward"}
        zIndex="z-70"
      >
        <WardSelector
          onClose={() => setIsStreetWardModalOpen(false)}
          onCustomSelect={(wardNo, streetName) => {
            setRegData((prev) => ({
              ...prev,
              servingWard: wardNo,
              streetName: streetName || "",
              address: prev.address.trim() ? prev.address : (streetName || ""),
            }));
            setRegError(null);
            setIsStreetWardModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
