/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  HeartPulse,
  Activity,
  ShieldAlert,
  Search,
  MapPin,
  Clock,
  Phone,
  Star,
  Navigation,
  Pill,
  Stethoscope,
  Building2,
  HelpCircle,
  PawPrint,
  LucideIcon,
  X,
  Plus,
  CheckCircle2,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useWard } from "@/context/wardContext";
import {
  checkFacilityOpenStatus,
  calculateDistanceKm,
  formatDistance,
  getDirectionsUrl,
  WARD_COORDINATES,
} from "@/lib/healthcare-discovery";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface HealthcareFacility {
  id: string | number;
  name: string;
  category: "Hospitals" | "Pharmacies" | "Clinics" | "Diagnostics" | string;
  facilityType?: string;
  specialty: string;
  description: string;
  address: string;
  imageUrl: string;
  phone: string;
  alternatePhone?: string;
  rating: number;
  ward: number;
  timings: string;
  is24x7?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasEmergencyUnit?: boolean;
  ambulancePhone?: string;
  services?: string[];
  hasPharmacy?: boolean;
  hasHomeDelivery?: boolean;
  appointments?: string;
  status?: string;
  isVerified?: boolean;
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
  { id: "Recently Viewed", nameKey: "recentlyViewed", icon: History },
  { id: "24x7 Emergency", nameKey: "emergency24x7", icon: ShieldAlert },
  { id: "Hospitals", nameKey: "hospitals", icon: HeartPulse },
  { id: "Pharmacies", nameKey: "pharmacies", icon: Pill },
  { id: "Clinics", nameKey: "clinics", icon: Stethoscope },
  { id: "Diagnostics", nameKey: "diagnostics", icon: Building2 },
  { id: "Pet Hospitals", nameKey: "petHospitals", icon: PawPrint },
  { id: "Pet Clinics", nameKey: "petClinics", icon: PawPrint },
];

export const HealthcareClient: React.FC<HealthcareClientProps> = ({
  initialFacilities,
}) => {
  const t = useTranslations("healthcare");
  const { activeWard, isAuthenticated } = useWard();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [selectedFacility, setSelectedFacility] =
    useState<HealthcareFacility | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // FEATURE 11: Recently Viewed Facility IDs
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // User location: defaults to active ward coordinates, enhanced via browser geolocation if granted
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(() => {
    return WARD_COORDINATES[activeWard?.id || 14] || { lat: 13.1169, lng: 80.0972 };
  });

  useEffect(() => {
    // Sync with active ward if user changes ward
    const wardCoord = WARD_COORDINATES[activeWard?.id || 14];
    if (wardCoord) {
      setUserCoords(wardCoord);
    }

    // Try browser geolocation
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // If denied, fallback remains activeWard coordinates
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [activeWard?.id]);

  // Fetch Recently Viewed
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      // 1. Check localStorage first for instant display
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("avadi_healthcare_recently_viewed");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              setRecentlyViewedIds(parsed.map(String));
            }
          } catch {
            // ignore parse error
          }
        }
      }

      // 2. Sync with server if authenticated
      if (isAuthenticated) {
        const res = await fetch("/api/hospitals/recently-viewed", {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.recentFacilityIds)) {
            const serverIds = json.recentFacilityIds.map(String);
            setRecentlyViewedIds(serverIds);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "avadi_healthcare_recently_viewed",
                JSON.stringify(serverIds)
              );
            }
          }
        }
      }
    } catch {
      // Non-blocking
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  // Record Recently Viewed (persists to localStorage + database for authenticated users)
  const recordRecentlyViewed = useCallback(
    async (facility: HealthcareFacility) => {
      const stringId = String(facility.id);
      // Update local state and localStorage
      setRecentlyViewedIds((prev) => {
        const updated = [
          stringId,
          ...prev.filter((id) => id !== stringId),
        ].slice(0, 10);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "avadi_healthcare_recently_viewed",
              JSON.stringify(updated)
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });

      // Sync to database if authenticated
      if (isAuthenticated) {
        try {
          await fetch("/api/hospitals/recently-viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ facilityId: stringId }),
          });
        } catch {
          // Non-blocking
        }
      }
    },
    [isAuthenticated]
  );

  // Remove individual item from Recently Viewed list
  const handleRemoveRecentlyViewed = useCallback(
    async (e: React.MouseEvent, facilityId: string) => {
      e.stopPropagation();
      setRecentlyViewedIds((prev) => {
        const updated = prev.filter((id) => id !== facilityId);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "avadi_healthcare_recently_viewed",
              JSON.stringify(updated)
            );
          } catch {
            // ignore
          }
        }
        return updated;
      });

      if (isAuthenticated) {
        try {
          await fetch(
            `/api/hospitals/recently-viewed?facilityId=${encodeURIComponent(facilityId)}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );
        } catch {
          // Non-blocking
        }
      }
    },
    [isAuthenticated]
  );

  // Clear all Recently Viewed items
  const handleClearAllRecentlyViewed = useCallback(async () => {
    setRecentlyViewedIds([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("avadi_healthcare_recently_viewed");
      } catch {
        // ignore
      }
    }

    if (isAuthenticated) {
      try {
        await fetch("/api/hospitals/recently-viewed", {
          method: "DELETE",
          credentials: "include",
        });
      } catch {
        // Non-blocking
      }
    }
  }, [isAuthenticated]);

  // Open details modal and record recently viewed
  const handleOpenFacilityDetail = useCallback(
    (facility: HealthcareFacility) => {
      setSelectedFacility(facility);
      recordRecentlyViewed(facility);
    },
    [recordRecentlyViewed]
  );

  // Smooth filter simulation trigger
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, openNowOnly]);

  // Helper to calculate distance in km for a facility
  const getFacilityDistance = useCallback(
    (facility: HealthcareFacility): number | null => {
      const lat = facility.latitude ?? WARD_COORDINATES[facility.ward]?.lat;
      const lng = facility.longitude ?? WARD_COORDINATES[facility.ward]?.lng;
      if (lat && lng && userCoords) {
        return calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng);
      }
      return null;
    },
    [userCoords]
  );

  // Helper to get exact coordinates for facility directions
  const getFacilityCoords = (facility: HealthcareFacility): { lat: number; lng: number } => {
    const lat = facility.latitude ?? WARD_COORDINATES[facility.ward]?.lat ?? 13.1169;
    const lng = facility.longitude ?? WARD_COORDINATES[facility.ward]?.lng ?? 80.0972;
    return { lat, lng };
  };

  // Emergency Facilities (Approved & verified with emergency care)
  const emergencyFacilities = useMemo(() => {
    return initialFacilities
      .filter((f) => f.isVerified && (f.hasEmergencyUnit || f.is24x7))
      .sort((a, b) => {
        const distA = getFacilityDistance(a) ?? 999;
        const distB = getFacilityDistance(b) ?? 999;
        return distA - distB;
      });
  }, [initialFacilities, getFacilityDistance]);

  // Map recentlyViewedIds to full facility records in chronological order
  const recentlyViewedFacilities = useMemo(() => {
    if (recentlyViewedIds.length === 0) return [];
    const facilityMap = new Map<string, HealthcareFacility>();
    for (const f of initialFacilities) {
      facilityMap.set(String(f.id), f);
    }
    const resolved: HealthcareFacility[] = [];
    for (const id of recentlyViewedIds) {
      const facility = facilityMap.get(id);
      if (facility) resolved.push(facility);
    }
    return resolved;
  }, [recentlyViewedIds, initialFacilities]);

  // Filter and sort healthcare spots (active ward facilities prioritized at top)
  const filteredFacilities = useMemo(() => {
    let list = [...initialFacilities];

    // Recently Viewed category
    if (selectedCategory === "Recently Viewed") {
      list = [...recentlyViewedFacilities];
    } else if (selectedCategory === "24x7 Emergency") {
      list = list.filter((f) => f.is24x7 || f.hasEmergencyUnit);
    } else if (selectedCategory !== "All") {
      list = list.filter((f) => f.category === selectedCategory);
    }

    // Open Now filter
    if (openNowOnly) {
      list = list.filter((f) => checkFacilityOpenStatus(f).isOpen);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.specialty.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          (f.services && f.services.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // If viewing recently viewed, preserve timestamp order
    if (selectedCategory === "Recently Viewed") {
      return list;
    }

    // Sort: active ward items first, then closest distance
    return list.sort((a, b) => {
      const aInWard = a.ward === activeWard.id;
      const bInWard = b.ward === activeWard.id;
      if (aInWard && !bInWard) return -1;
      if (!aInWard && bInWard) return 1;

      const distA = getFacilityDistance(a);
      const distB = getFacilityDistance(b);
      if (distA !== null && distB !== null) {
        return distA - distB;
      }
      return 0;
    });
  }, [
    selectedCategory,
    searchQuery,
    openNowOnly,
    activeWard.id,
    initialFacilities,
    recentlyViewedFacilities,
    getFacilityDistance,
  ]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
            {t("title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
            <HeartPulse size={14} className="text-rose-500 mr-1 animate-pulse" />
            <span>{t("subtitle")}</span>
          </p>
        </div>

        <Link
          href="/hospitals/create"
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98"
        >
          <Plus size={16} />
          <span>New Facilities</span>
        </Link>
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

      {/* ============================================================ */}
      {/* FEATURE 5: EMERGENCY QUICK ACCESS SECTION                    */}
      {/* ============================================================ */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none flex items-center gap-2">
                <span>Emergency Facilities</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  Avadi 24/7
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Verified healthcare centres with round-the-clock emergency, casualty or ICU care.
              </p>
            </div>
          </div>
        </div>

        {emergencyFacilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {emergencyFacilities.slice(0, 4).map((facility) => {
              const openStatus = checkFacilityOpenStatus(facility);
              const dist = getFacilityDistance(facility);
              const distStr = formatDistance(dist);
              const { lat, lng } = getFacilityCoords(facility);

              return (
                <div
                  key={facility.id}
                  onClick={() => handleOpenFacilityDetail(facility)}
                  className="p-4 rounded-3xl bg-linear-to-br from-rose-50/50 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 border border-rose-200/90 dark:border-rose-900/60 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3 cursor-pointer group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {facility.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-extrabold shadow-2xs">
                            <CheckCircle2 size={11} className="text-blue-600 dark:text-blue-400" />
                            <span>Verified</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wide">
                          Emergency Care
                        </span>
                      </div>

                      {/* Open Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          openStatus.isOpen
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        <span>{openStatus.label}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition line-clamp-1">
                        {facility.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                        {facility.specialty || facility.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold pt-0.5">
                      {distStr && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                          <MapPin size={11} className="text-rose-600" />
                          <span>{distStr}</span>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 truncate">
                        Ward {facility.ward} · Avadi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {facility.phone && (
                      <a
                        href={`tel:${facility.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                      >
                        <Phone size={12} />
                        <span>Call</span>
                      </a>
                    )}
                    <a
                      href={getDirectionsUrl(lat, lng, facility.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Navigation size={12} />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-medium">
            No approved emergency facilities available in the current area.
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* FEATURE 11: RECENTLY VIEWED FACILITIES STRIP                 */}
      {/* ============================================================ */}
      {recentlyViewedFacilities.length > 0 &&
        !searchQuery &&
        selectedCategory === "All" && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-rose-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">
                  Recently Viewed
                </h2>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {recentlyViewedFacilities.length}
                </span>
              </div>

              <button
                type="button"
                onClick={handleClearAllRecentlyViewed}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 pb-2 flex space-x-3.5 scrollbar-none">
              {recentlyViewedFacilities.map((facility) => {
                const openStatus = checkFacilityOpenStatus(facility);
                const dist = getFacilityDistance(facility);
                const distStr = formatDistance(dist);

                return (
                  <div
                    key={`recent-${facility.id}`}
                    onClick={() => handleOpenFacilityDetail(facility)}
                    className="w-64 sm:w-72 shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-2.5 relative group"
                  >
                    {/* Remove Individual Item Button (x) */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentlyViewed(e, String(facility.id))}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-slate-900/60 hover:bg-rose-600 text-white transition cursor-pointer"
                      title="Remove from recently viewed"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>

                    <div className="space-y-2">
                      <div className="h-28 w-full rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                        <img
                          src={facility.imageUrl}
                          alt={facility.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {facility.isVerified && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-extrabold shadow-sm">
                              <CheckCircle2 size={10} />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-extrabold gap-1">
                          <span className="text-rose-600 dark:text-rose-400 uppercase tracking-wider truncate">
                            {facility.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[9px] border ${
                              openStatus.isOpen
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200"
                            }`}
                          >
                            {openStatus.label}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 mt-1 group-hover:text-rose-600 transition">
                          {facility.name}
                        </h3>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium mt-0.5">
                          {facility.specialty || facility.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="truncate max-w-[60%]">Ward {facility.ward} · Avadi</span>
                      {distStr && (
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {distStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Search Input & Open Now Filter */}
      <div className="space-y-2 pt-1">
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
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Chips & Open Now Filter */}
        <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none flex items-center space-x-2">
          {/* FEATURE 1: Open Now Quick Filter */}
          <button
            type="button"
            onClick={() => setOpenNowOnly((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              openNowOnly
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                openNowOnly ? "bg-white" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span>Open Now</span>
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const label =
              cat.id === "Recently Viewed"
                ? "Recently Viewed"
                : t(`categories.${cat.nameKey}`);

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  isSelected
                    ? "bg-rose-600 border-rose-600 text-white shadow-md scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Facilities Vertical List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {selectedCategory === "All"
              ? t("allHealthcareHeader")
              : selectedCategory === "Recently Viewed"
              ? "Recently Viewed Facilities"
              : `${selectedCategory} (${filteredFacilities.length})`}
            {openNowOnly && " · Open Now"}
          </h2>

          <div className="flex items-center gap-2">
            {selectedCategory === "Recently Viewed" && recentlyViewedFacilities.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllRecentlyViewed}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
            <span className="text-[11px] text-slate-400 font-semibold">
              {filteredFacilities.length} facilities
            </span>
          </div>
        </div>

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
              {filteredFacilities.map((facility) => {
                const openStatus = checkFacilityOpenStatus(facility);
                const dist = getFacilityDistance(facility);
                const distStr = formatDistance(dist);
                const { lat, lng } = getFacilityCoords(facility);

                return (
                  <Card
                    key={facility.id}
                    onClick={() => handleOpenFacilityDetail(facility)}
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
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {/* FEATURE 4: Facility Verification Badge */}
                        {facility.isVerified && (
                          <span className="inline-flex items-center gap-1 bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md">
                            <CheckCircle2 size={12} className="text-white" />
                            <span>Verified</span>
                          </span>
                        )}

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
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
                            {facility.category}
                          </span>

                          {/* FEATURE 1: Dynamic Open Now Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-2xs shrink-0 ${
                              openStatus.isOpen
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                              }`}
                            />
                            <span>{openStatus.label}</span>
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                          {facility.name}
                        </h3>

                        <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                          {facility.specialty}
                        </p>

                        {facility.services && facility.services.length > 0 && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Services: </span>
                            {facility.services.slice(0, 4).join(" · ")}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {facility.description}
                        </p>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {facility.hasEmergencyUnit && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold border border-rose-200 dark:border-rose-900">
                              Emergency Care
                            </span>
                          )}
                          {facility.hasPharmacy && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-900">
                              Pharmacy
                            </span>
                          )}
                          {facility.ambulancePhone && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-900">
                              Ambulance
                            </span>
                          )}
                          {facility.hasHomeDelivery && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold border border-blue-200 dark:border-blue-900">
                              Home Delivery
                            </span>
                          )}
                          {facility.appointments && facility.appointments !== "Not Available" && (
                            <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold border border-violet-200 dark:border-violet-900">
                              {facility.appointments}
                            </span>
                          )}
                        </div>

                        {/* Time & Distance Row */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>{openStatus.displayTimings}</span>
                          </span>

                          {/* FEATURE 2: Distance Display */}
                          {distStr && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                              <MapPin size={11} className="text-rose-500 shrink-0" />
                              <span>{distStr}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[45%] flex items-center">
                          <MapPin size={12} className="mr-1 shrink-0" />
                          <span className="truncate">{facility.address}</span>
                        </span>

                        <div className="flex items-center space-x-2 shrink-0">
                          {/* FEATURE 3: Call Button */}
                          {facility.phone && (
                            <a
                              href={`tel:${facility.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer active:scale-98"
                            >
                              <Phone size={12} />
                              <span>{t("call")}</span>
                            </a>
                          )}

                          {/* FEATURE 2: Directions Button */}
                          <a
                            href={getDirectionsUrl(lat, lng, facility.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1 cursor-pointer active:scale-98"
                          >
                            <Navigation size={12} />
                            <span>{t("maps")}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {selectedCategory === "Recently Viewed" ? (
                <EmptyState
                  icon={History}
                  title="No recently viewed facilities"
                  description="Facilities you view will appear here."
                  actionText="Explore Facilities"
                  onAction={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                />
              ) : (
                <EmptyState
                  icon={HelpCircle}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
                  actionText={t("resetFilter")}
                  onAction={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setOpenNowOnly(false);
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FACILITY DETAIL MODAL */}
      {selectedFacility && (() => {
        const modalOpenStatus = checkFacilityOpenStatus(selectedFacility);
        const modalDist = getFacilityDistance(selectedFacility);
        const modalDistStr = formatDistance(modalDist);
        const { lat: mLat, lng: mLng } = getFacilityCoords(selectedFacility);

        return (
          <Modal
            isOpen={!!selectedFacility}
            onClose={() => setSelectedFacility(null)}
            title={selectedFacility.name}
          >
            <div className="space-y-4">
              <div className="h-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800">
                <img
                  src={selectedFacility.imageUrl}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  {selectedFacility.isVerified && (
                    <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Verified Facility
                    </span>
                  )}
                  {selectedFacility.is24x7 && (
                    <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <ShieldAlert size={12} />
                      24/7 Emergency
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge
                  variant={selectedFacility.is24x7 ? "danger" : "secondary"}
                  className="uppercase font-bold"
                >
                  {selectedFacility.category}
                </Badge>

                {/* Open Status & Timings */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-2xs ${
                      modalOpenStatus.isOpen
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        modalOpenStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    <span>{modalOpenStatus.label}</span>
                  </span>

                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
                    <Clock size={12} className="mr-1 text-rose-500" />
                    <span>{modalOpenStatus.displayTimings}</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {selectedFacility.description}
              </p>

              {/* Location & Distance */}
              <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2">
                    <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        {selectedFacility.address}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        Ward {selectedFacility.ward} · Avadi Corporation
                      </p>
                    </div>
                  </div>
                  {modalDistStr && (
                    <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                      {modalDistStr}
                    </span>
                  )}
                </div>
              </div>

              {/* Healthcare Services */}
              {selectedFacility.services && selectedFacility.services.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Healthcare Services
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFacility.services.map((srv) => (
                      <span
                        key={srv}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {selectedFacility.phone && (
                  <a
                    href={`tel:${selectedFacility.phone}`}
                    className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-98"
                  >
                    <Phone size={14} />
                    <span>Call ({selectedFacility.phone})</span>
                  </a>
                )}

                {selectedFacility.alternatePhone && (
                  <a
                    href={`tel:${selectedFacility.alternatePhone}`}
                    className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-98"
                  >
                    <Phone size={14} className="text-slate-500" />
                    <span>Alt ({selectedFacility.alternatePhone})</span>
                  </a>
                )}

                <a
                  href={getDirectionsUrl(mLat, mLng, selectedFacility.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 ${
                    !selectedFacility.phone ? "col-span-full" : ""
                  }`}
                >
                  <Navigation size={14} />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
