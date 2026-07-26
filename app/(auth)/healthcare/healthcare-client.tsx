"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  HeartPulse,
  Search,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  Star,
  Pill,
  Stethoscope,
  Activity,
  Building2,
  Navigation,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Path mapped to shared-components as requested
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface HealthcareFacility {
  id: string | number;
  name: string;
  category: "Hospitals" | "Pharmacies" | "Clinics" | "Diagnostics" | string;
  specialty: string;
  description: string;
  address: string;
  imageUrl: string;
  phone: string;
  rating: number;
  ward: number;
  timings: string;
  is24x7?: boolean;
  hasEmergencyUnit?: boolean;
  ambulancePhone?: string;
  services?: string[];
}

export interface FilterCategory {
  id: string;
  nameKey: string;
  icon: LucideIcon;
  badgeBg?: string;
}

export interface HealthcareClientProps {
  initialFacilities: HealthcareFacility[];
}

// Category filter configuration
const CATEGORIES: FilterCategory[] = [
  { id: "All", nameKey: "allSpots", icon: Activity },
  { id: "24x7 Emergency", nameKey: "emergency24x7", icon: ShieldAlert },
  { id: "Hospitals", nameKey: "hospitals", icon: HeartPulse },
  { id: "Pharmacies", nameKey: "pharmacies", icon: Pill },
  { id: "Clinics", nameKey: "clinics", icon: Stethoscope },
  { id: "Diagnostics", nameKey: "diagnostics", icon: Building2 },
];

export const HealthcareClient: React.FC<HealthcareClientProps> = ({
  initialFacilities,
}) => {
  const t = useTranslations("healthcare");
  const { activeWard } = useWard();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFacility, setSelectedFacility] =
    useState<HealthcareFacility | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Smooth filter simulation trigger
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Filter and sort healthcare spots (active ward facilities prioritized at top)
  const filteredFacilities = useMemo(() => {
    let list = [...initialFacilities];

    // Category filter
    if (selectedCategory !== "All") {
      if (selectedCategory === "24x7 Emergency") {
        list = list.filter((f) => f.is24x7 || f.hasEmergencyUnit);
      } else {
        list = list.filter((f) => f.category === selectedCategory);
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.specialty.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q),
      );
    }

    // Prioritize active ward items
    return list.sort((a, b) => {
      const aInWard = a.ward === activeWard.id;
      const bInWard = b.ward === activeWard.id;
      if (aInWard && !bInWard) return -1;
      if (!aInWard && bInWard) return 1;
      return 0;
    });
  }, [selectedCategory, searchQuery, activeWard.id, initialFacilities]);

  const getDirectionsUrl = (name: string): string => {
    const formattedName = encodeURIComponent(name.replace(/\s+/g, "+"));
    return `https://www.google.com/maps/search/?api=1&query=${formattedName}+Avadi+Healthcare`;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
          {t("title")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
          <HeartPulse size={14} className="text-rose-500 mr-1 animate-pulse" />
          <span>{t("subtitle")}</span>
        </p>
      </div>

      {/* 24/7 Emergency Quick Banner */}
      <div className="py-3 px-4 bg-linear-to-r from-rose-950 via-slate-900 to-red-950 text-white rounded-2xl shadow-md border border-rose-800/50 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
            <ShieldAlert size={18} className="animate-bounce" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs text-white leading-tight flex items-center gap-2">
              <span>{t("emergencyBannerTitle")}</span>
              <span className="text-[9px] font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 uppercase">
                {t("live247")}
              </span>
            </h3>
            <p className="text-[10px] text-rose-200/80 font-medium truncate mt-0.5">
              {t("emergencyBannerDesc")}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedCategory("24x7 Emergency")}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-sm transition shrink-0 cursor-pointer ml-2"
        >
          {t("viewEmergencySpots")} ➔
        </button>
      </div>

      {/* Search Input */}
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
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Category Filter Chips */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none flex space-x-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition duration-150 cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-rose-600 border-rose-600 text-white shadow-md scale-[1.02]"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{t(`categories.${cat.nameKey}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Facilities Vertical List */}
      <div className="space-y-3 pt-1">
        <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          {selectedCategory === "All"
            ? t("allHealthcareHeader")
            : `${selectedCategory} (${filteredFacilities.length})`}
        </h2>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <SkeletonLoader type="card" count={3} />
          ) : filteredFacilities.length > 0 ? (
            <motion.div
              key="facilities-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 max-w-2xl mx-auto"
            >
              {filteredFacilities.map((facility) => (
                <Card
                  key={facility.id}
                  onClick={() => setSelectedFacility(facility)}
                  className={`rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border transition cursor-pointer p-0 flex flex-col justify-between group shadow-sm hover:shadow-md ${
                    facility.is24x7 || facility.hasEmergencyUnit
                      ? "border-rose-300 dark:border-rose-800/80 ring-2 ring-rose-500/10"
                      : "border-slate-200/90 dark:border-slate-800 hover:border-rose-400/40"
                  }`}
                >
                  {/* Image Holder */}
                  <div className="h-44 sm:h-52 w-full relative bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-t-3xl">
                    <img
                      src={facility.imageUrl}
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {facility.is24x7 && (
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                          <ShieldAlert size={12} />
                          24/7 Emergency
                        </span>
                      )}
                      <span className="bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md">
                        Ward {facility.ward}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black flex items-center shadow-md">
                      <Star
                        size={12}
                        className="fill-slate-950 text-slate-950 mr-1"
                      />
                      <span>{facility.rating}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          {facility.category}
                        </span>
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {facility.timings}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {facility.name}
                      </h3>

                      <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                        {facility.specialty}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {facility.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[50%] flex items-center">
                        <MapPin size={12} className="mr-1 shrink-0" />
                        <span className="truncate">{facility.address}</span>
                      </span>

                      <div className="flex items-center space-x-2 shrink-0">
                        {facility.phone && (
                          <a
                            href={`tel:${facility.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
                          >
                            <Phone size={12} />
                            <span>{t("call")}</span>
                          </a>
                        )}

                        <a
                          href={getDirectionsUrl(facility.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
                        >
                          <Navigation size={12} />
                          <span>{t("maps")}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <EmptyState
                icon={HelpCircle}
                title={t("emptyTitle")}
                description={t("emptyDesc")}
                actionText={t("resetFilter")}
                onAction={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FACILITY DETAIL MODAL */}
      {selectedFacility && (
        <Modal
          isOpen={!!selectedFacility}
          onClose={() => setSelectedFacility(null)}
          title={selectedFacility.name}
        >
          <div className="space-y-4">
            <div className="h-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 relative">
              <img
                src={selectedFacility.imageUrl}
                alt={selectedFacility.name}
                className="w-full h-full object-cover"
              />
              {selectedFacility.is24x7 && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                  <ShieldAlert size={12} />
                  24/7 Emergency Services
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge
                variant={selectedFacility.is24x7 ? "danger" : "secondary"}
                className="uppercase font-bold"
              >
                {selectedFacility.category}
              </Badge>
              <div className="flex items-center text-xs font-bold text-slate-400">
                <Clock size={12} className="mr-1 text-rose-500" />
                <span>{selectedFacility.timings}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {selectedFacility.description}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start space-x-2">
              <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {selectedFacility.address}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {selectedFacility.phone && (
                <a
                  href={`tel:${selectedFacility.phone}`}
                  className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call ({selectedFacility.phone})</span>
                </a>
              )}

              <a
                href={getDirectionsUrl(selectedFacility.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm ${
                  !selectedFacility.phone ? "col-span-full" : ""
                }`}
              >
                <Navigation size={14} />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
