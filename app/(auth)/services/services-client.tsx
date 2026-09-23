"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Wrench,
  Search,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  Zap,
  Hammer,
  Wind,
  Paintbrush,
  Car,
  Tv,
  UserPlus,
  CheckCircle2,
  Award,
  X,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shared components path mapping
import { Card, Badge, Modal, EmptyState } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface ServiceProvider {
  id: string | number;
  name: string;
  category:
    | "Plumbers"
    | "Electricians"
    | "Carpenters"
    | "AC Repair"
    | "Painters"
    | "Mechanics"
    | "Appliance Repair"
    | string;
  phone: string;
  ward: number;
  experience?: string;
  hours?: string;
  specialty?: string;
  rate?: string;
  serviceCharge?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  verified?: boolean;
}

export interface ServiceCategory {
  id: string;
  nameKey: string;
  fallbackName: string;
  icon: LucideIcon;
}

export interface ServicesClientProps {
  initialProviders: ServiceProvider[];
  wardsList?: { id: number; name: string }[];
}

// Category filter configurations
const CATEGORIES: ServiceCategory[] = [
  {
    id: "All",
    nameKey: "allServices",
    fallbackName: "All Services",
    icon: ShieldCheck,
  },
  {
    id: "Plumbers",
    nameKey: "plumbers",
    fallbackName: "Plumbers",
    icon: Wrench,
  },
  {
    id: "Electricians",
    nameKey: "electricians",
    fallbackName: "Electricians",
    icon: Zap,
  },
  {
    id: "Carpenters",
    nameKey: "carpenters",
    fallbackName: "Carpenters",
    icon: Hammer,
  },
  {
    id: "AC Repair",
    nameKey: "acRepair",
    fallbackName: "AC Repair",
    icon: Wind,
  },
  {
    id: "Painters",
    nameKey: "painters",
    fallbackName: "Painters",
    icon: Paintbrush,
  },
  {
    id: "Mechanics",
    nameKey: "mechanics",
    fallbackName: "Mechanics",
    icon: Car,
  },
  {
    id: "Appliance Repair",
    nameKey: "applianceRepair",
    fallbackName: "Appliance Repair",
    icon: Tv,
  },
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-2007003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60",
];

// Helper to format service category badges dynamically
const formatCategoryBadge = (cat: string, lang: string): string => {
  if (!cat) return lang === "ta" ? "சேவை" : "SERVICE";
  if (lang === "ta") {
    switch (cat) {
      case "Electricians":
        return "மின்சாரப்பணியாளர்";
      case "Plumbers":
        return "குழாய் பணியாளர்";
      case "Carpenters":
        return "மரவேலையாள்";
      case "AC Repair":
        return "AC பழுது";
      case "Painters":
        return "சாயம் பூசுபவர்";
      case "Mechanics":
        return "மெக்கானிக்";
      case "Appliance Repair":
        return "சாதன பழுது";
      default:
        return cat;
    }
  }
  if (cat === "Electricians") return "ELECTRICIAN";
  if (cat === "Plumbers") return "PLUMBER";
  if (cat === "Carpenters") return "CARPENTER";
  if (cat === "AC Repair") return "AC SERVICE";
  if (cat === "Painters") return "PAINTER";
  if (cat === "Mechanics") return "MECHANIC";
  if (cat === "Appliance Repair") return "APPLIANCE REPAIR";
  return cat.replace(/s$/i, "").toUpperCase();
};

// Helper to get structured specialty text
const getCategorySpecialty = (
  cat: string,
  desc?: string,
  explicitSpecialty?: string,
  lang?: string,
): string => {
  if (lang === "ta") {
    switch (cat) {
      case "Electricians":
        return "வீட்டு வயரிங், இன்வெர்ட்டர் & மீட்டர் வேலைகள்";
      case "Plumbers":
        return "குழாய் கசிவு சீரமைப்பு, பாத்ரூம் ஃபிட்டிங் & டேப் பழுது";
      case "Carpenters":
        return "மாடுலார் கிச்சன், மரச்சாமான்கள் சீரமைப்பு & பூட்டு வேலை";
      case "AC Repair":
        return "AC சர்வீஸ், கேஸ் நிரப்புதல் & கம்ப்ரஸர் பழுது";
      case "Painters":
        return "சுவர் பெயிண்டிங், புட்டி பினிஷ் & நீர் கசிவு தடுப்பு";
      case "Mechanics":
        return "இன்ஜின் டியூனிங், ஆயில் மாற்றம் & ரோட்சைடு உதவி";
      default:
        return desc || "பழுதுபார்ப்பு மற்றும் பராமரிப்பு சேவைகள்";
    }
  }
  if (explicitSpecialty) return explicitSpecialty;
  if (desc && desc.length > 5 && !desc.startsWith("Verified local")) {
    return desc;
  }
  switch (cat) {
    case "Electricians":
      return "Home Rewiring, Inverter Installation & Meter Works";
    case "Plumbers":
      return "Pipe Leakage Repair, Bathroom Fitting & Tap Installation";
    case "Carpenters":
      return "Modular Kitchen Setup, Furniture Repair & Door Lock Fitting";
    case "AC Repair":
      return "AC Cleaning, Gas Refilling & Compressor Maintenance";
    case "Painters":
      return "Interior Wall Painting, Putty Finish & Waterproofing";
    case "Mechanics":
      return "Engine Tuning, Oil Change & Roadside Breakdown Support";
    default:
      return desc || "General repairs, maintenance & installation services";
  }
};

export const ServicesClient: React.FC<ServicesClientProps> = ({
  initialProviders,
  wardsList = [],
}) => {
  const t = useTranslations("services");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state initialized with server props
  const [providers, setProviders] =
    useState<ServiceProvider[]>(initialProviders);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvider, setSelectedProvider] =
    useState<ServiceProvider | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detect return from /services/register
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setToastMessage(t("registrationToast"));
      const timer = setTimeout(() => setToastMessage(null), 7000);
      router.replace("/services");
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, t]);

  const filteredProviders = useMemo(() => {
    let list = [...providers];

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q),
      );
    }

    return list;
  }, [providers, selectedCategory, searchQuery]);

  const handleCallProvider = (
    provider: ServiceProvider,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const msg =
      locale === "ta"
        ? `தொலைபேசி அழைப்பு தொடங்குகிறது: ${provider.name} (${provider.phone})...`
        : `Calling ${provider.name} (${provider.phone})...`;
    setToastMessage(msg);

    setTimeout(() => {
      window.location.href = `tel:${provider.phone}`;
      setToastMessage(null);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black leading-none">
              {t("servicesTitle")}
            </h1>
            <Badge
              variant="success"
              className="py-0.5 text-[10px] font-bold uppercase"
            >
              {t("skillNetwork")}
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1.5">
            {t("servicesSubtitle")}
          </p>
        </div>

        <Link
          href="/services/register"
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow shrink-0 cursor-pointer active:scale-95"
        >
          <UserPlus size={16} />
          <span>{t("createProfile")}</span>
        </Link>
      </div>

      {/* Global Search bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder={t("searchServicesPlaceholder")}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Category Chips Container */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none flex space-x-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const label = t(`categories.${cat.nameKey}`, {
            defaultValue: cat.fallbackName,
          });
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Providers Listings Grid */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center">
            <span>
              {t("listingsFor")}{" "}
              {selectedCategory === "All"
                ? t("allSkilledServices")
                : t(
                    `categories.${CATEGORIES.find((c) => c.id === selectedCategory)?.nameKey || ""}`,
                    {
                      defaultValue: selectedCategory,
                    },
                  )}
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {filteredProviders.length}{" "}
            {filteredProviders.length === 1
              ? t("providerAvailable")
              : t("providersAvailable")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                className="p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between"
              >
                {/* Worker Profile Header */}
                <div className="flex items-start space-x-3.5 relative">
                  <div className="relative shrink-0">
                    <img
                      src={
                        provider.imageUrl ||
                        "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=60"
                      }
                      alt={provider.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                    />
                    {provider.verified !== false && (
                      <div
                        className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center"
                        title="Verified Professional"
                      >
                        <CheckCircle2 size={12} className="stroke-3" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/50">
                        {formatCategoryBadge(provider.category, locale)}
                      </span>

                      <div className="flex items-center space-x-1 text-xs font-black text-amber-500 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full shrink-0">
                        <Star
                          size={12}
                          className="fill-amber-400 text-amber-400"
                        />
                        <span>{provider.rating || "4.9"}</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate leading-snug">
                      {provider.name}
                    </h3>

                    <div className="flex items-center space-x-1.5 text-xs mt-0.5">
                      <span className="flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                        <Award
                          size={13}
                          className="mr-1 shrink-0 text-emerald-500"
                        />
                        {provider.experience || "5 Years"} {t("expLabel")}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {t("ward")} {provider.ward}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specialty Box */}
                <div className="mt-3.5 mb-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 text-xs space-y-1.5">
                  <div className="text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {t("specialtyLabel")}:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {getCategorySpecialty(
                        provider.category,
                        provider.description,
                        provider.specialty,
                        locale,
                      )}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {t("rateLabel")}:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {provider.rate ||
                        provider.serviceCharge ||
                        (locale === "ta"
                          ? "₹350 ஆய்வுக் கட்டணம்"
                          : "₹350 visiting / inspection charge")}
                    </span>
                  </div>
                </div>

                {/* Call Button */}
                <button
                  onClick={(e) => handleCallProvider(provider, e)}
                  className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer active:scale-[0.98] group"
                >
                  <Phone
                    size={16}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />
                  <span>
                    {t("callWorker")} ({provider.phone})
                  </span>
                </button>
              </Card>
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                icon={Wrench}
                title={t("noProvidersFound")}
                description={t("noProvidersDesc")}
              />
            </div>
          )}
        </div>
      </div>



      {/* PROVIDER DETAIL MODAL */}
      {selectedProvider && (
        <Modal
          isOpen={!!selectedProvider}
          onClose={() => setSelectedProvider(null)}
          title={
            locale === "ta"
              ? "சேவை பணியாளர் விவரம்"
              : "Service Provider Profile"
          }
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3.5">
              <img
                src={
                  selectedProvider.imageUrl ||
                  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=60"
                }
                alt={selectedProvider.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                    {selectedProvider.name}
                  </h3>
                  {selectedProvider.verified !== false && (
                    <Badge
                      variant="success"
                      className="ml-2 py-0.5 text-[8px] font-black uppercase"
                    >
                      {t("verified")}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {formatCategoryBadge(selectedProvider.category, locale)} ·{" "}
                  {selectedProvider.experience || "5 Years"} {t("expLabel")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedProvider.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  {t("specialtyLabel")}:
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-right max-w-50 truncate">
                  {selectedProvider.specialty ||
                    getCategorySpecialty(
                      selectedProvider.category,
                      selectedProvider.description,
                      selectedProvider.specialty,
                      locale,
                    )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  {t("rateLabel")}:
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {selectedProvider.rate ||
                    selectedProvider.serviceCharge ||
                    (locale === "ta"
                      ? "₹350 ஆய்வுக் கட்டணம்"
                      : "₹350 visiting / inspection charge")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  {t("servingArea")}:
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t("ward")} {selectedProvider.ward} & {t("surroundingWards")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  {t("workingHours")}:
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Clock size={12} className="mr-1 text-primary" />
                  {selectedProvider.hours || "8:00 AM - 8:00 PM"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  {t("customerRating")}:
                </span>
                <span className="font-bold text-amber-500 flex items-center">
                  <Star size={12} className="fill-amber-400 mr-0.5" />
                  {selectedProvider.rating || "4.9"} / 5.0
                </span>
              </div>
            </div>

            <button
              onClick={(e) => handleCallProvider(selectedProvider, e)}
              className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-extrabold transition text-xs sm:text-sm flex items-center justify-center space-x-2.5 shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98] group"
            >
              <Phone
                size={16}
                className="shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <span>
                {t("callNow")} ({selectedProvider.phone})
              </span>
            </button>
          </div>
        </Modal>
      )}

      {/* Toast / Push Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 sm:max-w-md z-70 mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-3.5 sm:p-4 text-left ring-1 ring-black/5 dark:ring-white/10">
              {/* Subtle top accent gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 via-primary to-orange-500" />

              {/* Header row: App badge, Title, Time, Close */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                      Avadi City
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      • {locale === "ta" ? "உள்ளூர் சேவைகள்" : "Local Services"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {locale === "ta" ? "இப்போது" : "Just now"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    aria-label="Close notification"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Message body */}
              <p className="mt-2.5 text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                {toastMessage}
              </p>

              {/* Status pill indicator */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{locale === "ta" ? "சமர்ப்பிக்கப்பட்டது — பரிசீலனையில் உள்ளது" : "Submitted — Under Review"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
