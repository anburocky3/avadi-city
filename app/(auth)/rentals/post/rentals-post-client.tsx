"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Home,
  Bed,
  Briefcase,
  Layers,
  MapPin,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Trash2,
  Plus,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Car,
  Wifi,
  Utensils,
  Maximize2,
  Compass,
  Clock,
  Check,
  X,
  Phone,
  MessageSquare,
  HelpCircle,
  Trees,
  Search,
  Navigation,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import { useWard } from "@/context/wardContext";
import { ALL_AVADI_STREETS } from "@/lib/wards";
import { WardSelector, StreetItem } from "@/components/ward-selector";
import { Modal } from "@/components/shared-components";

// Dynamically import MapLocationPicker to prevent SSR issues with Leaflet
const MapLocationPicker = dynamic(
  () => import("@/components/ui/MapLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
        Loading Avadi Map...
      </div>
    ),
  }
);
import {
  TransactionType,
  PropertyCategory,
  FurnishingType,
  TenantPreference,
  RentalProperty,
} from "@/types/rental";

// 4 Primary categories and their respective sub-categories
export type MainCategory = "RENT" | "COMMERCIAL" | "NON-COMMERCIAL" | "PROPERTY FOR SALE";

interface MainCategoryOption {
  id: MainCategory;
  label: string;
  icon: React.ElementType;
}

export const MAIN_CATEGORIES: MainCategoryOption[] = [
  { id: "RENT", label: "RENT", icon: Home },
  { id: "COMMERCIAL", label: "COMMERCIAL", icon: Briefcase },
  { id: "NON-COMMERCIAL", label: "NON-COMMERCIAL", icon: Bed },
  { id: "PROPERTY FOR SALE", label: "PROPERTY FOR SALE", icon: Trees },
];

interface SubCategoryOption {
  id: PropertyCategory;
  name: string;
  icon: React.ElementType;
  hint: string;
}

export const SUB_CATEGORIES_MAP: Record<MainCategory, SubCategoryOption[]> = {
  RENT: [
    { id: "Apartment", name: "Apartment / Flat", icon: Building2, hint: "Gated community, standalone building flat" },
    { id: "Independent House", name: "Independent House", icon: Home, hint: "Independent bungalow or ground/first floor" },
    { id: "Villa", name: "Luxury Villa", icon: Home, hint: "Duplex or individual villa with private garden" },
    { id: "Single Room", name: "Single Room / 1 RK", icon: Bed, hint: "Studio room or 1RK for individuals" },
    { id: "Flatmate", name: "Flatmate / Shared Flat", icon: Layers, hint: "Shared 2BHK/3BHK with flatmates" },
  ],
  COMMERCIAL: [
    { id: "Shop", name: "Commercial Shop / Retail", icon: Briefcase, hint: "Main road retail shutter shop or store" },
    { id: "Showroom", name: "Showroom Space", icon: Building2, hint: "High frontage showroom for retail & brands" },
    { id: "Office", name: "Office Space / Coworking", icon: Briefcase, hint: "IT office, consultancy or corporate space" },
    { id: "Commercial Building", name: "Full Commercial Building", icon: Building2, hint: "Entire building for schools, banks, hospitals" },
    { id: "Warehouse", name: "Warehouse / Godown", icon: Layers, hint: "Storage space with truck loading bay" },
    { id: "Restaurant", name: "Restaurant / Kitchen", icon: Utensils, hint: "Commercial kitchen, cafe or dining hall" },
  ],
  "NON-COMMERCIAL": [
    { id: "Men's PG", name: "Working Men's PG", icon: Bed, hint: "Gents hostel with food & Wi-Fi" },
    { id: "Women's PG", name: "Working Women's PG", icon: ShieldCheck, hint: "Secure ladies hostel with biometric access" },
    { id: "Student Hostel", name: "Student Hostel", icon: Bed, hint: "College students accommodation near colleges" },
    { id: "Co-living", name: "Co-Living Space", icon: Layers, hint: "Modern furnished shared living community" },
  ],
  "PROPERTY FOR SALE": [
    { id: "Plot / Land", name: "Residential / Commercial Plot", icon: Trees, hint: "CMDA/DTCP approved layout plots for sale" },
    { id: "Apartment", name: "Apartment / Flat for Sale", icon: Building2, hint: "Ready-to-move or under-construction flat" },
    { id: "Independent House", name: "House / Villa for Sale", icon: Home, hint: "Independent house or villa with land ownership" },
    { id: "Commercial Building", name: "Commercial Space for Sale", icon: Briefcase, hint: "Commercial building or shop space for sale" },
  ],
};

const RESIDENTIAL_AMENITIES = [
  "24/7 Water Supply",
  "Power Backup / Inverter",
  "Separate EB Meter",
  "Gated Security",
  "Elevator / Lift",
  "CCTV Surveillance",
  "Modular Kitchen",
  "Solar Water Heater",
  "Air Conditioning",
  "Rainwater Harvesting",
  "Children Play Area",
  "Pet Friendly",
  "Feng Shui / Vastu Compliant",
];

const PG_AMENITIES = [
  "High Speed Wi-Fi",
  "Air Conditioned Rooms",
  "Daily Room Cleaning",
  "Washing Machine Access",
  "RO Drinking Water",
  "Individual Lockable Cupboard",
  "Spring/Box Mattress Provided",
  "Resident Warden Onsite",
  "CCTV Surveillance",
  "Fingerprint Access Gate",
  "Self-Cooking Allowed",
  "Study Room Table",
];

const COMMERCIAL_AMENITIES = [
  "Main Road Facing",
  "Heavy Pedestrian Footfall",
  "Motorized Rolling Shutter",
  "Attached Private Washroom",
  "Glass Frontage Fitted",
  "Dedicated Loading / Unloading Bay",
  "Large Signage Board Area",
  "Fire Safety System",
  "24/7 Security",
  "Water & Drainage Ready",
];

export function RentalsPostClient() {
  const router = useRouter();
  const { activeWard, userProfile } = useWard();

  // Multi-step progress (1 to 4)
  // Step 1: Category & Transaction Type
  // Step 2: Property Specifications & Amenities
  // Step 3: Location, Ward & Transit Landmarks
  // Step 4: Pricing, Photos & Submit Flow
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [postSubmitted, setPostSubmitted] = useState<boolean>(false);
  const [submittedPropertyId, setSubmittedPropertyId] = useState<string>("");

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
  }, [currentStep, postSubmitted]);

  // Step 1: Core Type State
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>("Rent");
  const [category, setCategory] = useState<PropertyCategory | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSelectMainCategory = (main: MainCategory) => {
    setMainCategory(main);
    setCategory(null);
    if (main === "RENT") {
      setTransactionType("Rent");
    } else if (main === "COMMERCIAL") {
      setTransactionType("Commercial");
    } else if (main === "NON-COMMERCIAL") {
      setTransactionType("PG / Hostel");
    } else if (main === "PROPERTY FOR SALE") {
      setTransactionType("Sale");
    }
  };

  // Step 2: Specs State
  const [bhk, setBhk] = useState<"1 RK" | "1 BHK" | "2 BHK" | "3 BHK" | "4+ BHK">("2 BHK");
  const [furnishing, setFurnishing] = useState<FurnishingType>("Unfurnished");
  const [builtUpArea, setBuiltUpArea] = useState<string>("950");
  const [carpetArea, setCarpetArea] = useState<string>("820");
  const [floor, setFloor] = useState<string>("1st of 2 Floors");
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [facing, setFacing] = useState<string>("East");
  const [parking, setParking] = useState<"Car & Bike" | "Bike Only" | "Covered Car" | "Open Parking" | "None">("Car & Bike");
  const [preferredTenants, setPreferredTenants] = useState<TenantPreference>("Family or Bachelors");
  const [availability, setAvailability] = useState<"Immediate" | "Within 15 Days" | "From Next Month">("Immediate");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "24/7 Water Supply",
    "Power Backup / Inverter",
  ]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState<string>("");
  const [showAllAmenities, setShowAllAmenities] = useState<boolean>(false);

  // PG specific state
  const [pgSharing, setPgSharing] = useState<"Single Room" | "2 Sharing" | "3 Sharing" | "4+ Sharing">("2 Sharing");
  const [availableBeds, setAvailableBeds] = useState<number>(2);
  const [pgGender, setPgGender] = useState<"Men" | "Women" | "Co-ed / Unisex">("Men");
  const [pgFoodIncluded, setPgFoodIncluded] = useState<boolean>(true);
  const [pgMeals, setPgMeals] = useState<string[]>(["Breakfast", "Dinner"]);
  const [pgCurfew, setPgCurfew] = useState<string>("10:30 PM");
  const [pgSelfCooking, setPgSelfCooking] = useState<boolean>(false);
  const [pgVisitorsAllowed, setPgVisitorsAllowed] = useState<boolean>(true);

  // Commercial specific state
  const [commRoadWidth, setCommRoadWidth] = useState<string>("40");
  const [commFrontage, setCommFrontage] = useState<string>("15");
  const [commPowerLoad, setCommPowerLoad] = useState<string>("10 kW 3-Phase");
  const [commSuitableFor, setCommSuitableFor] = useState<string>("Retail Shop, Clinic, Office, Pharmacy");

  // Step 3: Location State
  const [ward, setWard] = useState<number>(activeWard?.id || 14);
  const [streetName, setStreetName] = useState<string>("");
  const [isStreetWardModalOpen, setIsStreetWardModalOpen] = useState<boolean>(false);
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [distanceToStation, setDistanceToStation] = useState<string>("");
  const [distanceToBusStand, setDistanceToBusStand] = useState<string>("");
  const [nearbyLandmarks, setNearbyLandmarks] = useState<string>("");
  const [latitude, setLatitude] = useState<number>(13.1169);
  const [longitude, setLongitude] = useState<number>(80.0972);
  const [latInput, setLatInput] = useState<string>("13.1169");
  const [lngInput, setLngInput] = useState<string>("80.0972");
  const [mapError, setMapError] = useState<string | null>(null);

  // Step 4: Pricing State
  const [monthlyRent, setMonthlyRent] = useState<string>("");
  const [securityDeposit, setSecurityDeposit] = useState<string>("");
  const [maintenance, setMaintenance] = useState<string>("");
  const [electricityWater, setElectricityWater] = useState<string>("");
  const [pricingConfirmed, setPricingConfirmed] = useState<boolean>(false);

  // Calculated estimated move-in cost (Zero Brokerage)
  const estimatedMoveInCost = useMemo(() => {
    const rentVal = parseFloat(monthlyRent) || 0;
    const depVal = parseFloat(securityDeposit) || 0;
    const maintVal = parseFloat(maintenance) || 0;
    return rentVal + depVal + maintVal;
  }, [monthlyRent, securityDeposit, maintenance]);

  // Step 4: Photos & Owner State (Compulsory: 1 to 3 photos)
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ownerName, setOwnerName] = useState<string>(userProfile?.name || "");
  const [ownerType, setOwnerType] = useState<"Owner" | "Verified Broker" | "Builder" | "Property Manager">("Owner");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [whatsappPhone, setWhatsappPhone] = useState<string>("");
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(false);

  // Group helpers
  const isPG = mainCategory === "NON-COMMERCIAL";
  const isCommercial =
    mainCategory === "COMMERCIAL" ||
    (mainCategory === "PROPERTY FOR SALE" && category === "Commercial Building");
  const isPlot = category === "Plot / Land";
  const isResidential =
    mainCategory === "RENT" ||
    (mainCategory === "PROPERTY FOR SALE" &&
      (category === "Apartment" || category === "Independent House" || category === "Villa"));

  // Dynamic title placeholder based on mainCategory & category
  const titlePlaceholder = useMemo(() => {
    if (!mainCategory) {
      return "e.g. 2BHK House for Rent, 500 sq.ft Commercial Shop, PG Bed, or Plot for Sale...";
    }

    if (mainCategory === "PROPERTY FOR SALE") {
      if (category === "Plot / Land") {
        return "e.g. 1200 sq.ft CMDA Approved Residential Plot with 30ft Tar Road in Kamaraj Nagar";
      }
      if (category === "Apartment") {
        return "e.g. Brand New 2BHK Gated Community Flat for Sale with Lift, UDS & Covered Car Parking";
      }
      if (category === "Independent House") {
        return "e.g. 3BHK Individual House / Villa with Land Ownership & Patta for Sale near Avadi Station";
      }
      if (category === "Commercial Building") {
        return "e.g. G+2 Commercial Building for Sale on Main Road with High Monthly Rental Yield";
      }
      return "e.g. CMDA Approved Plot / Brand New 2BHK Flat for Sale in Prime Avadi Locality";
    }

    if (mainCategory === "COMMERCIAL") {
      if (category === "Shop") {
        return "e.g. 450 sq.ft Corner Retail Shop with Rolling Shutter & Glass Frontage on Avadi Main Road";
      }
      if (category === "Office") {
        return "e.g. 1200 sq.ft Furnished IT / Corporate Office Space with Cabins near Avadi Railway Station";
      }
      if (category === "Showroom") {
        return "e.g. 2500 sq.ft High-Visibility Showroom Space with Customer Parking & Main Road Frontage";
      }
      if (category === "Warehouse") {
        return "e.g. 5000 sq.ft Industrial Godown / Warehouse with Container Loading Bay & 24ft Height";
      }
      if (category === "Restaurant") {
        return "e.g. Fully Equipped Commercial Kitchen & Cafe Space with Chimney Duct near Avadi Bus Stand";
      }
      if (category === "Commercial Building") {
        return "e.g. Entire Commercial Building (G+2 Floors) for Rent - Ideal for Hospital, Bank or School";
      }
      return "e.g. 600 sq.ft Commercial Shop / Office Space for Rent on Main Road, Avadi";
    }

    if (mainCategory === "NON-COMMERCIAL") {
      if (category === "Women's PG") {
        return "e.g. Secure Working Women's PG with AC, 3-Time Food, Wi-Fi & Biometric Gate near Checkpost";
      }
      if (category === "Men's PG") {
        return "e.g. Deluxe 2-Sharing Working Men's PG with 3-Time Homely Food & Wi-Fi near Avadi Station";
      }
      if (category === "Student Hostel") {
        return "e.g. Affordable Student Hostel with Study Table, Wi-Fi & 3-Time Meals near Colleges";
      }
      if (category === "Co-living") {
        return "e.g. Modern Furnished Co-Living Studio with Housekeeping & High-Speed Wi-Fi";
      }
      return "e.g. Deluxe PG / Hostel Room with 3-Time Homely Food & Wi-Fi near Avadi Station";
    }

    // Default: RENT
    if (category === "Single Room") {
      return "e.g. 1 RK Studio Room for Rent with Attached Bathroom for Working Singles / Bachelors";
    }
    if (category === "Flatmate") {
      return "e.g. Single Occupancy AC Room in Shared 3BHK Flat with Working Professionals near Station";
    }
    if (category === "Villa") {
      return "e.g. 3BHK Luxury Duplex Villa for Rent with Private Garden & Car Parking in Gated Layout";
    }
    if (category === "Independent House") {
      return "e.g. 2BHK Independent 1st Floor House for Rent with 24/7 Water & Bike Parking near Avadi Station";
    }
    if (category === "Apartment") {
      return "e.g. 2BHK Gated Community Flat for Rent with Lift, Balcony & Covered Car Parking near Avadi Checkpost";
    }
    return "e.g. 2BHK Independent House or Flat for Rent with Car Parking near Avadi Station";
  }, [mainCategory, category]);

  // Dynamic title hint
  const titleHint = useMemo(() => {
    if (!mainCategory) {
      return "Select a Main Category above to see specific suggestions and guidance.";
    }
    if (mainCategory === "PROPERTY FOR SALE") {
      if (category === "Plot / Land") {
        return "Mention key perks: CMDA/DTCP approval number, plot dimensions, road width, and clear patta.";
      }
      if (category === "Commercial Building") {
        return "Mention key perks: rental income / ROI, road frontage, floor count, and legal clearances.";
      }
      return "Mention key perks: CMDA/DTCP approval, land size, road width, UDS share, or clear title.";
    }
    if (mainCategory === "COMMERCIAL") {
      if (category === "Shop") {
        return "Mention key perks: footfall, main road frontage, motorized shutter, and 3-phase power.";
      }
      if (category === "Office") {
        return "Mention key perks: workstation count, executive cabins, meeting rooms, and parking.";
      }
      return "Mention key perks: frontage width, footfall, road facing, 3-phase power, or parking.";
    }
    if (mainCategory === "NON-COMMERCIAL") {
      if (category === "Women's PG") {
        return "Mention key perks: AC/Non-AC, 3-time meals, CCTV & biometric security, warden, and curfew.";
      }
      return "Mention key perks: sharing type (1/2/3 sharing), food inclusion, AC, Wi-Fi, or distance to transit.";
    }
    return "Mention key perks: BHK, floor, car/bike parking, 24/7 water supply, or distance to station.";
  }, [mainCategory, category]);

  // Dynamic description placeholder
  const descriptionPlaceholder = useMemo(() => {
    if (!mainCategory) {
      return "Select a category above to see tailored guidelines for your property listing...";
    }
    if (mainCategory === "PROPERTY FOR SALE") {
      if (category === "Plot / Land") {
        return "Describe plot dimensions (e.g. 30x40 ft), road width in front, CMDA/DTCP approval number, facing direction, patta status, soil type, and proximity to bus stand / railway station...";
      }
      if (category === "Commercial Building") {
        return "Describe monthly rental yield / ROI, current tenant details, road frontage, floor layout, 3-phase power, commercial building approval, and clear legal title...";
      }
      return "Describe built-up area, carpet area, UDS (Undivided Share), floor level, lift access, car parking, water source (borewell/metro), construction age, and bank loan approvals...";
    }
    if (mainCategory === "COMMERCIAL") {
      if (category === "Shop" || category === "Showroom") {
        return "Describe shop frontage width, shutter type, road width, customer footfall, 3-phase power load, water/drainage, and ideal businesses (e.g. retail, pharmacy, salon)...";
      }
      if (category === "Office") {
        return "Describe number of workstations, executive cabins, conference room, pantry, private washrooms, internet wiring, and parking slots...";
      }
      if (category === "Warehouse") {
        return "Describe clear ceiling height, heavy truck entry access, loading bays, concrete flooring type, power load, and 24/7 security arrangements...";
      }
      return "Describe business suitability, frontage width, shutter type, road width, power phase/load, drainage facility, customer parking, and footfall highlights...";
    }
    if (mainCategory === "NON-COMMERCIAL") {
      if (category === "Women's PG") {
        return "Describe room sharing options (single/double/triple), 3-time food menu, AC, resident warden, CCTV surveillance, gate timings (curfew), washing machine, and proximity to bus stand...";
      }
      if (category === "Men's PG" || category === "Student Hostel") {
        return "Describe room sharing options (1/2/3 sharing), food menu and timings, Wi-Fi speed, cleaning schedule, washing machine, bike parking, and distance to station/colleges...";
      }
      return "Describe room sharing options, food menu and timings, Wi-Fi speed, cleaning schedule, gate curfew, washing machine access, and security arrangements...";
    }
    if (category === "Single Room" || category === "Flatmate") {
      return "Describe room size, attached/common bathroom, furnishings (bed, wardrobe), kitchen sharing or self-cooking rules, EB sharing, and bachelor guidelines...";
    }
    return "Describe room layout, ventilation, drinking water availability, nearby schools/markets, EB meter details, and house rules...";
  }, [mainCategory, category]);

  // Toggle amenity helper
  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
  };

  // Add custom amenity helper
  const handleAddCustomAmenity = () => {
    const val = customAmenityInput.trim();
    if (!val) return;
    if (!customAmenities.includes(val)) {
      setCustomAmenities((prev) => [...prev, val]);
    }
    if (!selectedAmenities.includes(val)) {
      setSelectedAmenities((prev) => [...prev, val]);
    }
    setCustomAmenityInput("");
  };

  // Remove custom amenity helper
  const handleRemoveCustomAmenity = (amenity: string) => {
    setCustomAmenities((prev) => prev.filter((a) => a !== amenity));
    setSelectedAmenities((prev) => prev.filter((a) => a !== amenity));
  };

  // Toggle PG meal helper
  const handleToggleMeal = (meal: string) => {
    setPgMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal],
    );
  };

  // Compress & add photo (Maximum 3 photos total)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 3) {
      setFormError("Maximum 3 property photos allowed. Remove a photo to upload a new one.");
      scrollToTop();
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const availableSlots = 3 - images.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    if (files.length > availableSlots) {
      setFormError(`Maximum 3 photos allowed. Only ${availableSlots} more photo(s) could be added.`);
    } else {
      setFormError(null);
    }

    setIsCompressing(true);

    try {
      const newUrls: string[] = [];
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;

        const options = {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              newUrls.push(event.target.result as string);
            }
            resolve();
          };
          reader.readAsDataURL(compressedFile);
        });
      }

      setImages((prev) => [...prev, ...newUrls].slice(0, 3));
    } catch {
      setFormError("Could not compress photo. Please try smaller JPEG/PNG files.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    setFormError(null);
    if (step === 1) {
      if (!mainCategory) {
        setFormError("Please select a main category (Rent, Commercial, Non-Commercial, or Property for Sale).");
        scrollToTop();
        return false;
      }
      if (!category) {
        setFormError(`Please select a property category under ${mainCategory}.`);
        scrollToTop();
        return false;
      }
      if (!title.trim() || title.length < 5) {
        setFormError("Please enter a descriptive property title (minimum 5 characters).");
        scrollToTop();
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!isPlot && !builtUpArea) {
        setFormError("Please enter the built-up or carpet area in sq.ft.");
        scrollToTop();
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!streetName.trim()) {
        setFormError("Please provide street name or locality area in Avadi.");
        scrollToTop();
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
        setFormError(
          transactionType === "Sale"
            ? "Please enter a valid total sale price amount."
            : "Please enter a valid monthly rent amount.",
        );
        scrollToTop();
        return false;
      }
      if (!securityDeposit || parseFloat(securityDeposit) < 0) {
        setFormError(
          transactionType === "Sale"
            ? "Please enter the booking advance amount."
            : "Please enter the security deposit / advance amount.",
        );
        scrollToTop();
        return false;
      }
      if (!pricingConfirmed) {
        setFormError("Please confirm the pricing and cash breakdown details by checking the confirmation box.");
        scrollToTop();
        return false;
      }
      if (images.length === 0) {
        setFormError("Property photos are compulsory. Please upload at least 1 photo (maximum 3 photos).");
        scrollToTop();
        return false;
      }
      if (images.length > 3) {
        setFormError("Maximum 3 property photos allowed. Please remove extra photos.");
        scrollToTop();
        return false;
      }
      if (!ownerName.trim()) {
        setFormError("Please enter owner / contact person's name.");
        scrollToTop();
        return false;
      }
      const digits = contactPhone.replace(/\D/g, "");
      if (digits.length < 10) {
        setFormError("Please enter a valid 10-digit mobile number.");
        scrollToTop();
        return false;
      }
      if (!declarationAgreed) {
        setFormError("Please check the verification declaration checkbox to proceed.");
        scrollToTop();
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      scrollToTop();
      setCurrentStep((prev) => Math.min(prev + 1, 4) as any);
    } else {
      scrollToTop();
      setTimeout(() => scrollToTop(), 50);
    }
  };

  const handlePrevStep = () => {
    setFormError(null);
    scrollToTop();
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
  };

  // Final Form Submission
  const handleSubmitListing = async () => {
    if (!validateStep(4)) {
      scrollToTop();
      setTimeout(() => scrollToTop(), 50);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const primaryImg = images[0] || "";

    const resolvedPropertyTypeTag =
      mainCategory === "PROPERTY FOR SALE"
        ? isPlot
          ? "Plot for Sale"
          : `${category || "Property"} for Sale`
        : isResidential
        ? `${bhk} ${category || "Property"}`
        : isPG
        ? `${pgSharing}`
        : isCommercial
        ? `${category || "Commercial"}`
        : category || "Property";

    const payload = {
      title: title.trim(),
      description: description.trim(),
      transactionType,
      category: category || "Apartment",
      propertyTypeTag: resolvedPropertyTypeTag,
      bhk: isResidential ? bhk : undefined,
      bathrooms: isResidential ? bathrooms : undefined,
      balconies: isResidential ? balconies : undefined,
      floor,
      builtUpArea: parseFloat(builtUpArea) || 0,
      carpetArea: parseFloat(carpetArea) || 0,
      furnishing,
      facing,
      parking,
      preferredTenants,
      availability,
      ward: Number(ward) || 14,
      streetName: streetName.trim(),
      location: `${streetName.trim()}, Ward ${ward}, Avadi`,
      lat: latitude,
      lng: longitude,
      pricing: {
        monthlyRent: parseFloat(monthlyRent) || 0,
        securityDeposit: parseFloat(securityDeposit) || 0,
        maintenance: parseFloat(maintenance) || 0,
        electricityWater,
        brokerage: 0,
        estimatedMoveInCost,
      },
      pgDetails: isPG
        ? {
            sharingType: pgSharing,
            availableBeds,
            foodIncluded: pgFoodIncluded,
            mealsOffered: pgMeals,
            gender: pgGender,
            rules: {
              curfew: pgCurfew,
              visitorsAllowed: pgVisitorsAllowed,
              smokingAllowed: false,
              alcoholAllowed: false,
              selfCookingAllowed: pgSelfCooking,
            },
          }
        : undefined,
      commercialDetails: isCommercial
        ? {
            carpetAreaSqFt: parseFloat(carpetArea) || 0,
            builtUpAreaSqFt: parseFloat(builtUpArea) || 0,
            frontageFeet: parseFloat(commFrontage) || 0,
            floor,
            powerLoad: commPowerLoad,
            roadWidthFeet: parseFloat(commRoadWidth) || 0,
            suitableFor: commSuitableFor.split(",").map((s) => s.trim()),
          }
        : undefined,
      localityIntel: {
        distanceToStation: distanceToStation.trim(),
        distanceToBusStand: distanceToBusStand.trim(),
        nearbyLandmarks: nearbyLandmarks.trim()
          ? nearbyLandmarks.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      },
      amenities: selectedAmenities,
      images,
      imageUrl: primaryImg,
      owner: {
        name: ownerName.trim(),
        type: ownerType,
        phone: contactPhone.trim(),
        whatsapp: (whatsappPhone || contactPhone).trim(),
        isPhoneVerified: true,
        isIdVerified: false,
        isPropertyVerified: true,
        memberSince: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      },
      // Legacy flat fields
      type: isCommercial ? "Commercial" : "Residential",
      rent: parseFloat(monthlyRent) || 0,
      advance: parseFloat(securityDeposit) || 0,
      contact: contactPhone.trim(),
      ownerName: ownerName.trim(),
      details: description.trim(),
    };

    let finalId = `rent-${Date.now()}`;

    try {
      // ── Primary: save to database via API ──────────────────────────────
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        finalId = json.id || finalId;
      } else {
        console.error("[POST /api/rentals] Failed:", json.message);
        setFormError(
          json.message || "Failed to save listing to database. Please try again."
        );
        setIsSubmitting(false);
        scrollToTop();
        return;
      }
    } catch (err) {
      console.error("[POST /api/rentals] Network error:", err);
      setFormError(
        "Network connection error. Could not connect to the database."
      );
      setIsSubmitting(false);
      scrollToTop();
      return;
    }

    // ── Always save locally so the "My Listings" tab works immediately ──
    const localProperty: RentalProperty = {
      ...(payload as unknown as RentalProperty),
      id: finalId,
      status: "Available",
      createdAt: new Date().toISOString(),
      features: selectedAmenities.slice(0, 4),
    };

    try {
      const stored = localStorage.getItem("avadi_user_rentals");
      const existingList: RentalProperty[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(
        "avadi_user_rentals",
        JSON.stringify([localProperty, ...existingList])
      );
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    setSubmittedPropertyId(finalId);
    setPostSubmitted(true);
    setIsSubmitting(false);
  };

  // If already successfully submitted
  if (postSubmitted) {
    return (
      <div className="min-h-screen py-10 px-4 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Property Listed Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your {category || "property"} in Ward {ward} ({streetName}) is now live on the Avadi City Property & Rental platform.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Listing ID:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{submittedPropertyId}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Price / Rent:</span>
              <span className="font-bold text-primary">₹{parseInt(monthlyRent, 10).toLocaleString()} {transactionType === "Rent" ? "/ mo" : ""}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">{streetName}, Ward {ward}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/rentals"
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-orange-600 text-white font-extrabold text-xs transition text-center shadow-md shadow-primary/20"
            >
              Browse Avadi Rentals
            </Link>
            <button
              type="button"
              onClick={() => {
                setPostSubmitted(false);
                setCurrentStep(1);
                setTitle("");
                setDescription("");
                setStreetName("");
                setDistanceToStation("");
                setDistanceToBusStand("");
                setNearbyLandmarks("");
                setImages([]);
                setMonthlyRent("");
                setSecurityDeposit("");
                setMaintenance("");
                setElectricityWater("");
                setPricingConfirmed(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Post Another Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={topRef}
      className="min-h-screen pb-28 pt-2 sm:pt-4 px-3 sm:px-6 max-w-3xl mx-auto space-y-5"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Link
          href="/rentals"
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-bold text-xs py-1.5 px-2.5 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft size={16} />
          <span>Back to Rentals</span>
        </Link>
        <span className="text-[11px] font-bold text-slate-400">
          Step {currentStep} of 4
        </span>
      </div>

      {/* Hero Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Post Your Property or Space
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          List apartments, independent houses, PG/hostels, commercial shops, or plots for rent, lease, or sale.
        </p>
      </div>

      {/* Stepped Progress Indicator */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { step: 1, label: "Type" },
          { step: 2, label: "Specs" },
          { step: 3, label: "Location" },
          { step: 4, label: "Pricing & Submit" },
        ].map((s) => {
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <div key={s.step} className="space-y-1 text-center">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500"
                    : isActive
                    ? "bg-primary"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
              <span
                className={`text-[10px] font-bold block truncate ${
                  isActive
                    ? "text-primary"
                    : isDone
                    ? "text-emerald-500"
                    : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {formError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Stepped Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-7 shadow-sm space-y-6">
        {/* ================= STEP 1: CATEGORY & TRANSACTION TYPE ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 text-xs animate-in fade-in">
            {/* Main Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                Main Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MAIN_CATEGORIES.map((m) => {
                  const isSelected = mainCategory === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMainCategory(m.id)}
                      className={`py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                        isSelected
                          ? "bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-orange-400 ring-1 ring-primary/30 shadow-xs font-black"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold"
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="text-xs tracking-tight font-extrabold whitespace-nowrap">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Sub-Category Grid for selected Main Category - only renders once a Main Category is clicked */}
            {mainCategory && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                  Select Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SUB_CATEGORIES_MAP[mainCategory].map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-orange-400 ring-1 ring-primary/30 shadow-xs font-bold"
                            : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border transition ${
                            isSelected
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold truncate leading-tight">
                            {cat.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                            {cat.hint}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Listing Title */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                Listing Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">
                {titleHint}
              </span>
            </div>

            {/* Full Property Description */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                Detailed Description & Highlights <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={descriptionPlaceholder}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: SPECS & AMENITIES ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 text-xs animate-in fade-in">
            {/* Conditional Specs based on Group */}
            {isResidential && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      BHK Type
                    </label>
                    <select
                      value={bhk}
                      onChange={(e) => setBhk(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="1 RK">1 RK / Studio</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4+ BHK">4+ BHK / Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Furnishing
                    </label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="Semi Furnished">Semi Furnished</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Built-Up Area (sq.ft)
                    </label>
                    <input
                      type="number"
                      value={builtUpArea}
                      onChange={(e) => setBuiltUpArea(e.target.value)}
                      placeholder="950"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Floor Level
                    </label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="1st of 2 Floors"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Bathrooms
                    </label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value={1}>1 Bathroom</option>
                      <option value={2}>2 Bathrooms</option>
                      <option value={3}>3 Bathrooms</option>
                      <option value={4}>4+ Bathrooms</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Parking
                    </label>
                    <select
                      value={parking}
                      onChange={(e) => setParking(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="Car & Bike">Car & Bike</option>
                      <option value="Covered Car">Covered Car</option>
                      <option value="Bike Only">Bike Only</option>
                      <option value="Open Parking">Open Parking</option>
                      <option value="None">No Parking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Facing Direction
                    </label>
                    <select
                      value={facing}
                      onChange={(e) => setFacing(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="East">East Facing</option>
                      <option value="North">North Facing</option>
                      <option value="North-East">North-East (Vastu)</option>
                      <option value="South">South Facing</option>
                      <option value="West">West Facing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Preferred Tenants
                    </label>
                    <select
                      value={preferredTenants}
                      onChange={(e) => setPreferredTenants(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="Family or Bachelors">Family or Bachelors</option>
                      <option value="Family Only">Family Only</option>
                      <option value="Bachelors Only">Bachelors Only</option>
                      <option value="Women Only">Women&apos;s Only</option>
                      <option value="Working Professionals">Working Professionals</option>
                      <option value="Students">Students Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PG & Hostel Specific Specs */}
            {isPG && (
              <div className="space-y-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60">
                <h3 className="font-extrabold text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <Bed size={16} />
                  <span>PG & Hostel Room Configuration</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Sharing Type
                    </label>
                    <select
                      value={pgSharing}
                      onChange={(e) => setPgSharing(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="Single Room">Single Room (Private)</option>
                      <option value="2 Sharing">2 Sharing</option>
                      <option value="3 Sharing">3 Sharing</option>
                      <option value="4+ Sharing">4+ Sharing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Available Vacancies <span className="text-[10px] text-slate-400 font-normal">(Up to 20)</span>
                    </label>
                    <select
                      value={availableBeds}
                      onChange={(e) => setAvailableBeds(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Bed / Vacancy" : "Beds / Vacancies"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Gender Policy
                    </label>
                    <select
                      value={pgGender}
                      onChange={(e) => setPgGender(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    >
                      <option value="Men">Men Only</option>
                      <option value="Women">Women Only</option>
                      <option value="Co-ed / Unisex">Co-ed / Unisex</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Curfew Timing
                    </label>
                    <input
                      type="text"
                      value={pgCurfew}
                      onChange={(e) => setPgCurfew(e.target.value)}
                      placeholder="e.g. 10:30 PM or No Curfew"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>
                </div>

                {/* Food Inclusions */}
                <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Food & Meal Provision
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pgFoodIncluded}
                        onChange={(e) => setPgFoodIncluded(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span className="font-semibold text-xs">Food Included in Rent</span>
                    </label>
                  </div>

                  {pgFoodIncluded && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["Breakfast", "Lunch", "Dinner", "Tea & Snacks", "Sunday Special"].map((meal) => (
                        <button
                          key={meal}
                          type="button"
                          onClick={() => handleToggleMeal(meal)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                            pgMeals.includes(meal)
                              ? "bg-primary text-white border-primary"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {pgMeals.includes(meal) && <Check size={12} />}
                          <span>{meal}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Commercial Specific Specs */}
            {isCommercial && (
              <div className="space-y-4 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60">
                <h3 className="font-extrabold text-sky-900 dark:text-sky-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <Briefcase size={16} />
                  <span>Commercial & Retail Specifications</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Frontage (Feet)
                    </label>
                    <input
                      type="number"
                      value={commFrontage}
                      onChange={(e) => setCommFrontage(e.target.value)}
                      placeholder="15 ft"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Road Width (Feet)
                    </label>
                    <input
                      type="number"
                      value={commRoadWidth}
                      onChange={(e) => setCommRoadWidth(e.target.value)}
                      placeholder="40 ft"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Power Load
                    </label>
                    <input
                      type="text"
                      value={commPowerLoad}
                      onChange={(e) => setCommPowerLoad(e.target.value)}
                      placeholder="10 kW 3-Phase"
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Suitable Businesses
                    </label>
                    <input
                      type="text"
                      value={commSuitableFor}
                      onChange={(e) => setCommSuitableFor(e.target.value)}
                      placeholder="Pharmacy, Clinic, Shop..."
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Amenities Checklist */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm">
                    Property Amenities & Features
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Select key amenities or add custom features.
                  </span>
                </div>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0">
                  {selectedAmenities.length} selected
                </span>
              </div>

              {/* Amenities Grid (Two lines by default, expandable) */}
              {(() => {
                const baseList = isPG
                  ? PG_AMENITIES
                  : isCommercial
                  ? COMMERCIAL_AMENITIES
                  : RESIDENTIAL_AMENITIES;

                // Two lines = 6 items by default in 3 columns
                const visibleStandard = showAllAmenities ? baseList : baseList.slice(0, 6);
                const allVisible = [...visibleStandard, ...customAmenities.filter((c) => !baseList.includes(c))];
                const hasMore = baseList.length > 6;

                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allVisible.map((amenity) => {
                        const isChecked = selectedAmenities.includes(amenity);
                        const isCustom = customAmenities.includes(amenity);
                        return (
                          <div
                            key={amenity}
                            onClick={() => handleToggleAmenity(amenity)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition cursor-pointer select-none ${
                              isChecked
                                ? "bg-primary/10 border-primary text-primary dark:text-orange-400 font-bold"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? "bg-primary border-primary text-white"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                }`}
                              >
                                {isChecked && <Check size={11} className="stroke-3" />}
                              </div>
                              <span className="truncate">{amenity}</span>
                            </div>

                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomAmenity(amenity);
                                }}
                                title="Remove amenity"
                                className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition shrink-0 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                      >
                        {showAllAmenities ? (
                          <span>Show fewer amenities</span>
                        ) : (
                          <span>+ View {baseList.length - 6} more standard amenities</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Add Custom Amenity Input (like Service Register) */}
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={customAmenityInput}
                  onChange={(e) => setCustomAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add other amenity / feature (e.g. CCTV, Modular Kitchen, Geyser)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  disabled={!customAmenityInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shrink-0 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LOCATION, WARD & TRANSIT ================= */}
        {currentStep === 3 && (
          <div className="space-y-5 text-xs animate-in fade-in">
            {/* Property Locality / Street Area Input with Autocomplete */}
            <div className="relative">
              <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <MapPin size={14} />
                </span>
                <span>Property Locality / Street Area</span>
              </label>
              <input
                type="text"
                value={streetName}
                onChange={(e) => {
                  const val = e.target.value;
                  setStreetName(val);
                  setFormError(null);
                  if (val.trim().length <= 2) {
                    setStreetResults([]);
                    return;
                  }
                  const filtered = ALL_AVADI_STREETS.filter((item) =>
                    item.streetName
                      .toLowerCase()
                      .includes(val.toLowerCase().trim()),
                  ).slice(0, 10);
                  setStreetResults(filtered);
                }}
                placeholder="e.g. Kamaraj Nagar, Near Pattabiram Railway Station, Gandhi Road..."
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
                        key={`${street.streetName}-${street.wardNo}-${idx}`}
                        onClick={() => {
                          setStreetName(street.streetName);
                          setWard(street.wardNo);
                          setStreetResults([]);
                          setFormError(null);
                        }}
                        className="px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-primary cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
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

            {/* Property Municipal Ward (with Interactive Find Your Street Search) */}
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mb-1.5">
                Property Municipal Ward <span className="text-rose-500">*</span>
              </label>
              <div
                onClick={() => setIsStreetWardModalOpen(true)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                    W{ward}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs truncate">
                      {streetName?.trim()
                        ? streetName.trim()
                        : "Select property street / ward"}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Search street or select ward
                    </span>
                  </div>
                </div>
                <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:underline shrink-0">
                  <Search size={13} />
                  <span>
                    {streetName?.trim() ? "Change" : "Find"}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-normal">
                <Info
                  size={13}
                  className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0"
                />
                <span>
                  We use your property ward to show this listing to verified tenants searching in this area.
                </span>
              </p>
            </div>

            {/* Property Map Location & GPS Coordinates Picker */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <MapPin size={14} />
                  </span>
                  <span>Pin Property on Map</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  (Drag marker to adjust pin)
                </span>
              </div>

              {/* Map Component */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs relative z-0 h-64 sm:h-72">
                <MapLocationPicker
                  defaultLat={latitude}
                  defaultLng={longitude}
                  onLocationSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    setLatInput(lat.toFixed(6));
                    setLngInput(lng.toFixed(6));
                    setMapError(null);
                  }}
                  onError={(msg) => setMapError(msg)}
                />
              </div>

              {mapError && (
                <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                  <AlertCircle size={14} /> {mapError}
                </p>
              )}

              {/* Coordinates Inputs */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Navigation size={13} className="text-primary" />
                    <span>Coordinates (Latitude & Longitude)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Auto-updates with pin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={latInput}
                      onChange={(e) => {
                        setLatInput(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setLatitude(val);
                      }}
                      placeholder="13.1169"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={lngInput}
                      onChange={(e) => {
                        setLngInput(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setLongitude(val);
                      }}
                      placeholder="80.0972"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* Transit Distances */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                <Compass size={16} />
                <span>Locality & Commute Distance Intel</span>
                <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Helps tenants know exact walking / driving distance to vital transit hubs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Distance to Avadi Railway Station
                  </label>
                  <input
                    type="text"
                    value={distanceToStation}
                    onChange={(e) => setDistanceToStation(e.target.value)}
                    placeholder="e.g. 800m / 5 mins walk"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Distance to Bus Terminus / Stop
                  </label>
                  <input
                    type="text"
                    value={distanceToBusStand}
                    onChange={(e) => setDistanceToBusStand(e.target.value)}
                    placeholder="e.g. 500m to Avadi Bus Stand"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nearby Schools, Colleges or Hospitals
                </label>
                <input
                  type="text"
                  value={nearbyLandmarks}
                  onChange={(e) => setNearbyLandmarks(e.target.value)}
                  placeholder="e.g. Near Avadi Checkpost, Market Road, St. Joseph School"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: PRICING & MOVE-IN BREAKDOWN ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mb-1">
                  {transactionType === "Sale" ? "Total Sale Price (₹) *" : transactionType === "Lease" ? "Total Lease Amount (₹) *" : "Monthly Rent (₹) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => {
                      setMonthlyRent(e.target.value);
                      setPricingConfirmed(false);
                      setFormError(null);
                    }}
                    placeholder={transactionType === "Sale" ? "e.g. 4500000" : "e.g. 12000"}
                    className="w-full pl-8 pr-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mb-1">
                  {transactionType === "Sale" ? "Booking Advance (₹)" : "Security Deposit / Advance (₹) *"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => {
                      setSecurityDeposit(e.target.value);
                      setPricingConfirmed(false);
                      setFormError(null);
                    }}
                    placeholder={transactionType === "Sale" ? "e.g. 100000" : "e.g. 50000"}
                    className="w-full pl-8 pr-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Monthly Maintenance (₹)
                </label>
                <input
                  type="number"
                  value={maintenance}
                  onChange={(e) => {
                    setMaintenance(e.target.value);
                    setPricingConfirmed(false);
                  }}
                  placeholder="e.g. 500 (or 0 if none)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Electricity & Water Policy
                </label>
                <input
                  type="text"
                  value={electricityWater}
                  onChange={(e) => setElectricityWater(e.target.value)}
                  placeholder="e.g. Separate EB Meter · Borewell Free"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                />
              </div>
            </div>

            {/* Estimated Total Move-In / Purchase Cost Summary Box - Generates only when details are filled */}
            {monthlyRent.trim() !== "" && parseFloat(monthlyRent) > 0 && securityDeposit.trim() !== "" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-primary/5 to-amber-500/10 border border-primary/25 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      {transactionType === "Sale" ? "Purchase Cost Transparency" : "Move-In Cost Transparency"} · Direct (0% Brokerage)
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {transactionType === "Sale" ? "Estimated Total Purchase Cost" : "Estimated Total Move-In Cost"}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-2xl font-black font-sora tracking-tight text-primary tabular-nums">
                      ₹{estimatedMoveInCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary/10 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">{transactionType === "Sale" ? "Total Price:" : "1st Month Rent:"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{(parseFloat(monthlyRent) || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{transactionType === "Sale" ? "Booking Advance:" : "Security Deposit:"}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{(parseFloat(securityDeposit) || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Maintenance:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{(parseFloat(maintenance) || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Cash Details Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/25 bg-white/90 dark:bg-slate-900/90 transition cursor-pointer select-none hover:border-primary/50 shadow-xs">
                  <input
                    type="checkbox"
                    checked={pricingConfirmed}
                    onChange={(e) => {
                      setPricingConfirmed(e.target.checked);
                      setFormError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary accent-primary cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    I confirm that the {transactionType === "Sale" ? "total sale price, booking advance" : "monthly rent, security deposit"}, and breakdown figures above are accurate.
                  </span>
                </label>
              </div>
            )}

            {/* Divider between Pricing and Photos */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800" />

            {/* Multiple Photos Upload Section (Compulsory, Max 3) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Property Photos ({images.length}/3)</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      Compulsory
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Upload 1 to 3 property photos (hall, bedroom, kitchen, or front elevation). Maximum 3 photos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing || images.length >= 3}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    images.length >= 3
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-primary hover:bg-orange-600 text-white cursor-pointer"
                  }`}
                >
                  {isCompressing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  <span>{images.length >= 3 ? "Max 3 Photos" : "Add Photos"}</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {/* Photo Previews or Empty Upload Dropzone */}
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-rose-300 dark:border-rose-900/60 hover:border-primary dark:hover:border-primary rounded-2xl bg-rose-50/30 dark:bg-rose-950/10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                      Click to upload property photos <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      At least 1 photo required (Maximum 3 photos allowed · JPEG, PNG, WebP)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {images.map((img, idx) => (
                    <div
                      key={`${img.slice(0, 30)}-${idx}`}
                      className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Property Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                          Cover Photo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white opacity-90 transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {images.length < 3 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/50 rounded-xl aspect-video flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer transition p-2 text-center"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold mt-1">Add Photo ({images.length}/3)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Owner / Contact Details */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Owner Contact Information</span>
              </h3>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. G. Shanmugam"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Primary Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    WhatsApp Number (for instant enquiries)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Same as mobile number"
                      className="w-full pl-11 pr-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 transition cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={(e) => setDeclarationAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary accent-primary cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  I confirm that I am the owner or authorized representative for this property in Avadi City. All rental rates, specs, and photos provided are accurate.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Bottom Error Banner if validation fails */}
        {formError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <span>Continue</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitListing}
              disabled={isSubmitting || !declarationAgreed}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-extrabold text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isSubmitting ? "Publishing Listing..." : "Publish Property Listing"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Street to Ward Mapping Modal (Find Your Street) */}
      <Modal
        isOpen={isStreetWardModalOpen}
        onClose={() => setIsStreetWardModalOpen(false)}
        title="Select Property Ward & Street"
      >
        <WardSelector
          onClose={() => setIsStreetWardModalOpen(false)}
          onCustomSelect={(wardNo, selectedStreet) => {
            setWard(wardNo);
            if (selectedStreet) {
              setStreetName(selectedStreet);
            }
            setFormError(null);
            setIsStreetWardModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
