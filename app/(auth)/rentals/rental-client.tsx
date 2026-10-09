"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import imageCompression from "browser-image-compression";
import {
  Building2,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  ShieldCheck,
  X,
  SlidersHorizontal,
  Home,
  Check,
  Sparkles,
  BedDouble,
  Car,
  Zap,
  Share2,
  ArrowUpRight,
  Train,
  Bus,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useWard } from "@/context/wardContext";
import { Card, Modal, EmptyState } from "@/components/shared-components";
import { RentalProperty, TransactionType } from "@/types/rental";

export type { RentalProperty } from "@/types/rental";

export interface RentalsClientProps {
  initialRentals: RentalProperty[];
}

export const RentalsClient: React.FC<RentalsClientProps> = ({
  initialRentals,
}) => {
  const t = useTranslations("rentals");
  const { activeWard } = useWard();

  // State
  const [rentalList, setRentalList] =
    useState<RentalProperty[]>(initialRentals);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedWard, setSelectedWard] = useState<number | "All">("All");

  // Advanced Filter Modal / Drawer
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [bhkFilter, setBhkFilter] = useState<string>("All");
  const [furnishingFilter, setFurnishingFilter] = useState<string>("All");
  const [tenantFilter, setTenantFilter] = useState<string>("All");
  const [budgetMax, setBudgetMax] = useState<number>(100000);

  // Property Detail Modal
  const [selectedProperty, setSelectedProperty] =
    useState<RentalProperty | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // My Listings — IDs of properties posted by this device (loaded from localStorage)
  const [myListingIds, setMyListingIds] = useState<Set<string>>(new Set());

  // Confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Temporary toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load newly posted user properties from localStorage on mount and sync with API
  useEffect(() => {
    let localSaved: RentalProperty[] = [];
    try {
      const stored = localStorage.getItem("avadi_user_rentals");
      if (stored) {
        const parsed: RentalProperty[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localSaved = parsed;
          setMyListingIds(new Set(parsed.map((p) => p.id)));
        }
      }
    } catch (e) {
      console.error("Failed to load user rentals from localStorage:", e);
    }

    // Always fetch fresh listings from /api/rentals on client
    async function syncRentals() {
      try {
        const res = await fetch("/api/rentals", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setRentalList((prev) => {
              const apiIds = new Set(json.data.map((r: RentalProperty) => r.id));
              // Keep any purely local items that might not have reached API yet
              const unsyncedLocal = localSaved.filter((p) => !apiIds.has(p.id));
              return [...unsyncedLocal, ...json.data];
            });
          }
        }
      } catch (err) {
        console.warn("[RentalsClient] Error fetching /api/rentals:", err);
      }
    }

    syncRentals();
  }, []);

  // Permanently delete a listing (only from localStorage + state)
  const handleDeleteListing = (id: string) => {
    setRentalList((prev) => prev.filter((r) => r.id !== id));
    setMyListingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDeleteId(null);

    try {
      const stored = localStorage.getItem("avadi_user_rentals");
      if (stored) {
        const parsed: RentalProperty[] = JSON.parse(stored);
        localStorage.setItem(
          "avadi_user_rentals",
          JSON.stringify(parsed.filter((p) => p.id !== id)),
        );
      }
    } catch {
      /* ignore */
    }

    triggerToast("🗑️ Listing deleted permanently.");
  };

  // Open & close modal helpers with clean URL sync (?id=...)
  const openPropertyModal = (property: RentalProperty) => {
    setSelectedProperty(property);
    setActiveImageIndex(0);
    try {
      window.history.replaceState(null, "", `/rentals?id=${property.id}`);
    } catch {
      // ignore
    }
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
    try {
      window.history.replaceState(null, "", "/rentals");
    } catch {
      // ignore
    }
  };

  // Auto-open property modal if ?id= is in the URL on page load / link click
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const propertyId = params.get("id");
      if (propertyId) {
        const match = rentalList.find((r) => r.id === propertyId);
        if (match) {
          setSelectedProperty(match);
          setActiveImageIndex(0);
        }
      }
    } catch {
      // ignore
    }
  }, [rentalList]);

  // Show transient toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get price display
  const formatPrice = (property: RentalProperty) => {
    const rent = property.pricing?.monthlyRent ?? property.rent ?? 0;
    if (property.transactionType === "Sale") {
      if (rent >= 10000000) {
        return `₹${(rent / 10000000).toFixed(2)} Cr`;
      }
      return `₹${(rent / 100000).toFixed(1)} Lakhs`;
    }
    if (property.transactionType === "Lease") {
      return `₹${(rent / 100000).toFixed(1)} L Lease`;
    }
    if (property.transactionType === "PG / Hostel") {
      return `₹${rent.toLocaleString("en-IN")} / bed`;
    }
    if (property.transactionType === "Daily") {
      return `₹${rent.toLocaleString("en-IN")} / day`;
    }
    return `₹${rent.toLocaleString("en-IN")} / mo`;
  };

  // Helper to get transaction color classes
  const getTransactionBadgeClasses = (type: TransactionType | string) => {
    switch (type) {
      case "Rent":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "Lease":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "PG / Hostel":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "Commercial":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Sale":
      case "Plot for Sale":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-primary/10 text-primary border border-primary/20";
    }
  };

  // Share Property handler
  const handleShare = (property: RentalProperty, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = property.title;
    const shareUrl = `${window.location.origin}/rentals?id=${property.id}`;
    const text = `Check out this property in Avadi: ${title} - ${formatPrice(property)}`;
    if (navigator.share) {
      navigator.share({ title, text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      triggerToast("Property link copied to clipboard!");
    }
  };

  // WhatsApp Owner
  const handleWhatsApp = (property: RentalProperty, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = property.owner?.phone || property.contact || "9876543210";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const shareUrl = `${window.location.origin}/rentals?id=${property.id}`;
    const msg = encodeURIComponent(
      `Hello ${property.owner?.name || "Sir/Madam"}, I found your property "${property.title}" in Ward ${property.ward}, Avadi on the Avadi City Portal (${shareUrl}). Is it currently available for a visit?`,
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, "_blank");
  };

  // Call Owner
  const handleCall = (property: RentalProperty, e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = property.owner?.phone || property.contact || "";
    if (phone) {
      triggerToast(
        `Calling ${property.owner?.name || "Property Owner"} (${phone})...`,
      );
      setTimeout(() => {
        window.location.href = `tel:${phone}`;
      }, 500);
    }
  };

  // Count active modal filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (bhkFilter !== "All") count++;
    if (furnishingFilter !== "All") count++;
    if (tenantFilter !== "All") count++;
    if (budgetMax < 100000) count++;
    if (selectedWard !== "All") count++;
    return count;
  }, [bhkFilter, furnishingFilter, tenantFilter, budgetMax, selectedWard]);

  const clearModalFilters = () => {
    setSelectedWard("All");
    setBhkFilter("All");
    setFurnishingFilter("All");
    setTenantFilter("All");
    setBudgetMax(100000);
  };

  // My listings count (for badge)
  const myListingsCount = useMemo(
    () => rentalList.filter((r) => myListingIds.has(r.id)).length,
    [rentalList, myListingIds],
  );

  // Filtered & Searched List
  const filteredRentals = useMemo(() => {
    return rentalList.filter((item) => {
      // 1. Category Filter
      if (activeCategory === "My Listings") {
        if (!myListingIds.has(item.id)) return false;
      } else if (activeCategory !== "All") {
        // For regular category filters, hide Rented/Sold listings
        if (item.status === "Rented" || item.status === "Sold") return false;
        if (activeCategory === "House Rent") {
          if (item.transactionType !== "Rent") return false;
        } else if (activeCategory === "Lease") {
          if (item.transactionType !== "Lease") return false;
        } else if (activeCategory === "PG & Hostels") {
          if (item.transactionType !== "PG / Hostel") return false;
        } else if (activeCategory === "Commercial") {
          if (item.transactionType !== "Commercial") return false;
        } else if (activeCategory === "Plots & Sale") {
          if (item.transactionType !== "Sale") return false;
        }
      } else {
        // "All" — hide Rented/Sold from public view
        if (item.status === "Rented" || item.status === "Sold") return false;
      }

      // 2. Ward Filter
      if (selectedWard !== "All" && item.ward !== selectedWard) {
        return false;
      }

      // 3. BHK Filter
      if (bhkFilter !== "All") {
        if (item.bhk !== bhkFilter) return false;
      }

      // 4. Furnishing Filter
      if (furnishingFilter !== "All") {
        if (item.furnishing !== furnishingFilter) return false;
      }

      // 5. Tenant Filter
      if (tenantFilter !== "All") {
        if (item.preferredTenants !== tenantFilter) return false;
      }

      // 6. Budget Filter
      const rent = item.pricing?.monthlyRent ?? item.rent ?? 0;
      if (budgetMax < 100000 && rent > budgetMax) {
        return false;
      }

      // 8. Natural Language & Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchableText = [
          item.title,
          item.description,
          item.location,
          item.streetName,
          item.category,
          item.transactionType,
          item.bhk,
          item.furnishing,
          item.preferredTenants,
          `ward ${item.ward}`,
          ...(item.amenities || []),
          ...(item.features || []),
          ...(item.localityIntel?.nearbyLandmarks || []),
          item.localityIntel?.distanceToStation,
          item.localityIntel?.distanceToBusStand,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Support multi-word queries like "2bhk station" or "women pg"
        const terms = q.split(/\s+/);
        const matchesAllTerms = terms.every((term) =>
          searchableText.includes(term),
        );
        if (!matchesAllTerms) return false;
      }

      return true;
    });
  }, [
    rentalList,
    activeCategory,
    selectedWard,
    bhkFilter,
    furnishingFilter,
    tenantFilter,
    budgetMax,
    searchQuery,
  ]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-28 md:pb-12 relative text-slate-900 dark:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs sm:text-sm font-black shadow-2xl border border-primary flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles size={16} className="text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/15 p-4 sm:p-4.5 rounded-2xl border border-orange-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/25 shrink-0">
              <Building2 size={20} className="stroke-[2.5]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("title")}
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl font-medium">
            Verified direct-owner houses, flats, PGs, hostels, commercial spaces
            & plots across all 48 wards.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full shadow-xs">
            <ShieldCheck size={13} className="stroke-[2.5]" />
            <span>100% Direct Owner / No Spam</span>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          <Link
            href="/rentals/post"
            className="px-4 py-2.5 bg-primary hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md shadow-primary/20 group cursor-pointer"
          >
            <Plus
              size={16}
              className="stroke-3 group-hover:rotate-90 transition-transform duration-300"
            />
            <span>Post / List Property</span>
          </Link>

          {/* My Listings shortcut — only visible after user has posted */}
          {myListingsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory("My Listings")}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border border-primary/40 bg-white dark:bg-slate-900 text-primary dark:text-orange-400 hover:bg-primary/5 dark:hover:bg-primary/10 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <UserCircle2 size={16} />
              <span>My Listings</span>
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">
                {myListingsCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search '2BHK near station', 'Women PG', 'Shop with parking', 'Ward 14'..."
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Choice Chips (Filters + Categories) */}
      <div className="flex items-center space-x-2 pb-1 overflow-x-auto scrollbar-none">
        {/* Filters Button in Choice Chip Style */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`px-3.5 py-2 rounded-xl text-xs font-black border transition cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 shrink-0 ${
            activeFiltersCount > 0
              ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-primary font-black text-[10px] flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Category Choice Chips */}
        {[
          { id: "All", label: "All Properties" },
          { id: "House Rent", label: "House Rent" },
          { id: "Lease", label: "Lease" },
          { id: "PG & Hostels", label: "PG & Hostels" },
          { id: "Commercial", label: "Commercial" },
          { id: "Plots & Sale", label: "Plots & Sale" },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition cursor-pointer whitespace-nowrap select-none shrink-0 ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Listings Count + My Listings context tip */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <span>
          {activeCategory === "My Listings" ? (
            <>
              <span className="text-primary font-black">
                {filteredRentals.length}
              </span>{" "}
              listing{filteredRentals.length !== 1 ? "s" : ""} posted by you
            </>
          ) : (
            <>
              Showing{" "}
              <span className="text-slate-900 dark:text-white font-black">
                {filteredRentals.length}
              </span>{" "}
              properties
            </>
          )}
        </span>
        {activeCategory === "My Listings" && (
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500" />
            Visible only to you
          </span>
        )}
      </div>

      {/* Property Cards Grid */}
      <div className="space-y-4">
        {filteredRentals.length > 0 ? (
          filteredRentals.map((rental) => {
            const coverPhoto =
              rental.imageUrl ||
              (rental.images && rental.images.length > 0
                ? rental.images[0]
                : null);

            return (
              <Card
                key={rental.id}
                className={`p-0 overflow-hidden rounded-3xl transition-all duration-300 group ${
                  activeCategory === "My Listings" &&
                  myListingIds.has(rental.id)
                    ? "border-2 border-primary/50 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary bg-white dark:bg-slate-900"
                    : "border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/80 hover:border-primary/50 dark:hover:border-primary/40"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  {/* Property Image Banner */}
                  <div className="md:col-span-5 relative h-56 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {/* Left accent bar — transaction type color */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${
                        rental.transactionType === "Rent"
                          ? "bg-emerald-500"
                          : rental.transactionType === "Lease"
                            ? "bg-blue-500"
                            : rental.transactionType === "PG / Hostel"
                              ? "bg-purple-500"
                              : rental.transactionType === "Commercial"
                                ? "bg-amber-500"
                                : rental.transactionType === "Sale"
                                  ? "bg-rose-500"
                                  : "bg-primary"
                      }`}
                    />
                    {coverPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPhoto}
                        alt={rental.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[220px]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 min-h-[220px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
                        <Home size={36} className="opacity-30" />
                        <span className="text-xs font-semibold opacity-60">
                          No Image Available
                        </span>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      {/* Rented / Sold status badge */}
                      {(rental.status === "Rented" ||
                        rental.status === "Sold") && (
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-md border ${
                            rental.status === "Sold"
                              ? "bg-rose-600/90 text-white border-rose-400/40"
                              : "bg-slate-700/90 text-white border-slate-500/40"
                          }`}
                        >
                          {rental.status === "Sold"
                            ? "✅ Sold"
                            : "🏠 Rented Out"}
                        </span>
                      )}
                      {(() => {
                        const isRent = rental.transactionType === "Rent";
                        const isCommercial =
                          rental.transactionType === "Commercial";
                        const isSale = rental.transactionType === "Sale";
                        const isPG = rental.transactionType === "PG / Hostel";

                        // 1. Transaction Badge: Omit for standard "Rent"
                        // Only show for Commercial, PG / Hostel, Sale / Plot for Sale, Lease
                        let txLabel: string | null = null;
                        if (!isRent) {
                          if (isSale) {
                            txLabel =
                              rental.category === "Plot / Land" ||
                              rental.propertyTypeTag
                                ?.toLowerCase()
                                .includes("plot")
                                ? "Plot for Sale"
                                : "Sale";
                          } else {
                            txLabel = rental.transactionType;
                          }
                        }

                        // 2. Secondary Tag: clean up duplicates (e.g. Commercial Shop -> Shop, etc.)
                        let secondaryTag: string | null =
                          rental.propertyTypeTag || null;
                        if (secondaryTag) {
                          const tagLower = secondaryTag.toLowerCase().trim();
                          if (isCommercial) {
                            if (
                              tagLower === "commercial" ||
                              tagLower === "commercial space"
                            ) {
                              secondaryTag = null;
                            } else if (tagLower.startsWith("commercial ")) {
                              secondaryTag = secondaryTag.slice(11).trim();
                            }
                          } else if (isSale) {
                            if (tagLower.endsWith(" for sale")) {
                              secondaryTag = secondaryTag
                                .replace(/ for sale$/i, "")
                                .trim();
                            } else if (tagLower === "sale") {
                              secondaryTag = null;
                            }
                          } else if (isPG) {
                            if (
                              tagLower === "pg / hostel" ||
                              tagLower === "pg"
                            ) {
                              secondaryTag = null;
                            }
                          } else if (isRent) {
                            if (tagLower.startsWith("rent ")) {
                              secondaryTag = secondaryTag.slice(5).trim();
                            } else if (tagLower === "rent") {
                              secondaryTag = rental.category || null;
                            }
                          }
                        }

                        // Only show tx/secondary tags if listing isn't rented/sold
                        if (
                          rental.status === "Rented" ||
                          rental.status === "Sold"
                        )
                          return null;

                        return (
                          <>
                            {txLabel && (
                              <span
                                className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-md ${getTransactionBadgeClasses(
                                  txLabel,
                                )}`}
                              >
                                {txLabel}
                              </span>
                            )}
                            {secondaryTag && (
                              <span className="bg-slate-950/80 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-1 rounded-full border border-white/20 shadow-md">
                                {secondaryTag}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Share Button (Verified badge removed per request) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleShare(rental, e)}
                        className="p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition cursor-pointer backdrop-blur-sm border border-white/20 shadow-md"
                        title="Share property"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>

                    {/* Price Ribbon */}
                    <div className="absolute bottom-3 left-3 bg-linear-to-r from-slate-950/95 to-slate-900/90 text-white px-3.5 py-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-amber-400">
                        {formatPrice(rental)}
                      </span>
                      {rental.pricing?.securityDeposit > 0 && (
                        <span className="text-[10px] text-slate-300 font-semibold border-l border-slate-700 pl-2">
                          Dep: ₹
                          {(rental.pricing.securityDeposit / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Property Content */}
                  <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/80">
                    <div>
                      {/* Ward & Street */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        <span className="flex items-center gap-1 text-primary font-bold">
                          <MapPin size={14} />
                          <span>
                            Ward {rental.ward} · {rental.streetName || "Avadi"}
                          </span>
                        </span>
                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                          {rental.availability || "Immediate"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => openPropertyModal(rental)}
                        className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug tracking-tight hover:text-primary transition-colors cursor-pointer"
                      >
                        {rental.title}
                      </h3>

                      {/* Quick Specs Grid */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {rental.bhk && (
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <BedDouble size={13} className="text-primary" />{" "}
                            {rental.bhk}
                          </span>
                        )}
                        {rental.builtUpArea && (
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                            {rental.builtUpArea} sq.ft
                          </span>
                        )}
                        {rental.furnishing && (
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                            {rental.furnishing}
                          </span>
                        )}
                        {rental.parking && rental.parking !== "None" && (
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Car size={13} className="text-emerald-500" />{" "}
                            {rental.parking}
                          </span>
                        )}
                        {rental.pgDetails?.sharingType && (
                          <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg font-bold">
                            {rental.pgDetails.sharingType} (
                            {rental.pgDetails.gender})
                          </span>
                        )}
                        {rental.commercialDetails?.powerLoad && (
                          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Zap size={13} />{" "}
                            {rental.commercialDetails.powerLoad}
                          </span>
                        )}
                      </div>

                      {/* Locality Transit Highlights */}
                      {(rental.localityIntel?.distanceToStation ||
                        rental.localityIntel?.distanceToBusStand) && (
                        <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {rental.localityIntel?.distanceToStation && (
                            <span className="flex items-center gap-1.5 bg-orange-50/70 dark:bg-orange-950/30 text-primary px-2.5 py-1 rounded-md border border-orange-200/50 dark:border-orange-900/30">
                              <Train size={12} className="shrink-0" />
                              <span>
                                {rental.localityIntel.distanceToStation}
                              </span>
                            </span>
                          )}
                          {rental.localityIntel?.distanceToBusStand && (
                            <span className="flex items-center gap-1.5 bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-200/50 dark:border-blue-900/30">
                              <Bus size={12} className="shrink-0" />
                              <span>
                                {rental.localityIntel.distanceToBusStand}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions and Owner Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      {/* Owner Controls — visible only in My Listings tab */}
                      {activeCategory === "My Listings" &&
                        myListingIds.has(rental.id) && (
                          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <UserCircle2
                                size={14}
                                className="text-primary shrink-0"
                              />
                              <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                Owner Controls
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(rental.id);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                              title="Delete listing"
                            >
                              <Trash2 size={13} />
                              <span>Delete Listing</span>
                            </button>
                          </div>
                        )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Listed by {rental.owner?.type || "Owner"}
                          </span>
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {rental.owner?.name ||
                              rental.ownerName ||
                              "Avadi Citizen"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => openPropertyModal(rental)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ArrowUpRight size={14} />
                          </button>

                          {/* WhatsApp & Call — hidden if Rented/Sold */}
                          {rental.status !== "Rented" &&
                          rental.status !== "Sold" ? (
                            <>
                              {Boolean(rental.owner?.whatsapp?.trim()) && (
                                <button
                                  onClick={(e) => handleWhatsApp(rental, e)}
                                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                                  title="WhatsApp Owner"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleCall(rental, e)}
                                className="px-3.5 py-2 bg-primary hover:bg-orange-600 active:scale-95 text-white rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                              >
                                <Phone size={13} className="fill-current" />
                                <span>Call</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {rental.status === "Sold"
                                ? "Property Sold"
                                : "No Longer Available"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={Home}
            title="No properties found matching your criteria"
            description="Try changing your search keywords, budget, or clearing some filters to explore more options."
            actionText="Clear All Filters"
            onAction={clearModalFilters}
          />
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Listing?"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                Permanently delete this listing?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                This cannot be undone. The property will be removed from Avadi
                City Portal. You can always post it again.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                confirmDeleteId && handleDeleteListing(confirmDeleteId)
              }
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              <span>Yes, Delete Listing</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ADVANCED FILTER MODAL */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Avadi Properties"
      >
        <div className="space-y-4 pt-1">
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
                selected
              </span>
              <button
                type="button"
                onClick={clearModalFilters}
                className="text-xs font-black text-primary hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
          {/* Ward Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                Select Avadi Ward
              </label>
              {selectedWard !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedWard("All")}
                  className="text-[11px] font-bold text-primary hover:underline transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <select
              value={selectedWard}
              onChange={(e) =>
                setSelectedWard(
                  e.target.value === "All" ? "All" : Number(e.target.value),
                )
              }
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
            >
              <option value="All">All 48 Wards (City Wide)</option>
              {Array.from({ length: 48 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Ward {w} {activeWard?.id === w ? "(Your Current Ward)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* BHK Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                BHK / Space Size
              </label>
              {bhkFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setBhkFilter("All")}
                  className="text-[11px] font-bold text-primary hover:underline transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {["All", "1 RK", "1 BHK", "2 BHK", "3 BHK"].map((bhk) => (
                <button
                  key={bhk}
                  type="button"
                  onClick={() => setBhkFilter(bhk)}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    bhkFilter === bhk
                      ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-orange-400 border-primary font-black shadow-xs ring-1 ring-primary/30"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {bhk}
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing Status */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                Furnishing
              </label>
              {furnishingFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setFurnishingFilter("All")}
                  className="text-[11px] font-bold text-primary hover:underline transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {["All", "Fully Furnished", "Semi Furnished", "Unfurnished"].map(
                (furnish) => (
                  <button
                    key={furnish}
                    type="button"
                    onClick={() => setFurnishingFilter(furnish)}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition cursor-pointer text-center ${
                      furnishingFilter === furnish
                        ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-orange-400 border-primary font-black shadow-xs ring-1 ring-primary/30"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {furnish.replace(" Furnished", "")}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Tenant Preference */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                Tenant Preference
              </label>
              {tenantFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setTenantFilter("All")}
                  className="text-[11px] font-bold text-primary hover:underline transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
            >
              <option value="All">Any Tenant Welcome</option>
              <option value="Family Only">Family Only</option>
              <option value="Bachelors Only">Bachelors Only</option>
              <option value="Family or Bachelors">Family or Bachelors</option>
              <option value="Working Professionals">
                Working Professionals
              </option>
              <option value="Women Only">Women Only (PG / Flat)</option>
              <option value="Men Only">Men Only (PG / Flat)</option>
            </select>
          </div>

          {/* Budget Range */}
          <div>
            <div className="flex justify-between items-center text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              <div className="flex items-center gap-2">
                <span>Max Monthly Budget</span>
                {budgetMax < 100000 && (
                  <button
                    type="button"
                    onClick={() => setBudgetMax(100000)}
                    className="text-[11px] font-bold text-primary hover:underline transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <span className="text-primary">
                {budgetMax >= 100000
                  ? "Any Budget"
                  : `Up to ₹${budgetMax.toLocaleString("en-IN")}`}
              </span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="2500"
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={clearModalFilters}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-black transition shadow-md shadow-primary/25 cursor-pointer"
            >
              Apply ({filteredRentals.length} Results)
            </button>
          </div>
        </div>
      </Modal>

      {/* COMPREHENSIVE PROPERTY DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedProperty)}
        onClose={closePropertyModal}
        title={selectedProperty?.title || "Property Details"}
      >
        {selectedProperty && (
          <div className="space-y-5 pt-1">
            {/* Gallery Section */}
            <div className="space-y-2">
              <div className="relative h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-950">
                {selectedProperty.images &&
                selectedProperty.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      selectedProperty.images[activeImageIndex] ||
                      selectedProperty.imageUrl
                    }
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Home size={40} className="opacity-40" />
                    <span className="text-xs">No photos uploaded</span>
                  </div>
                )}

                {/* Photo Counter */}
                {selectedProperty.images &&
                  selectedProperty.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full border border-white/20">
                      {activeImageIndex + 1} / {selectedProperty.images.length}
                    </div>
                  )}
              </div>

              {/* Thumbnails */}
              {selectedProperty.images &&
                selectedProperty.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProperty.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition ${
                          activeImageIndex === idx
                            ? "border-primary scale-105"
                            : "border-transparent opacity-60"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Thumb ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Price & Move-in Calculation Box */}
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                    {selectedProperty.transactionType} Pricing
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {formatPrice(selectedProperty)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    Security Deposit
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹
                    {selectedProperty.pricing?.securityDeposit?.toLocaleString(
                      "en-IN",
                    ) || 0}
                  </span>
                </div>
              </div>

              {/* Move-in Breakdown */}
              <div className="pt-2 border-t border-orange-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    Maintenance
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {selectedProperty.pricing?.maintenance
                      ? `₹${selectedProperty.pricing.maintenance}`
                      : "Included"}
                  </span>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    Brokerage
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹0 (Zero)
                  </span>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    Total Move-In
                  </span>
                  <span className="font-black text-primary font-sora tracking-tight tabular-nums">
                    ₹
                    {selectedProperty.pricing?.estimatedMoveInCost?.toLocaleString(
                      "en-IN",
                    ) || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Utility Pricing (Electricity & Water Policy) */}
            {(selectedProperty.pricing?.utilities || selectedProperty.pricing?.electricityWater) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    <span>Electricity & Water Policy</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    Transparent Utilities
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Electricity Details */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-500" />
                        <span>Electricity</span>
                      </span>
                      {selectedProperty.pricing?.utilities?.electricity && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {selectedProperty.pricing.utilities.electricity.applicable ? "Applicable" : "No Extra Fee"}
                        </span>
                      )}
                    </div>

                    {selectedProperty.pricing?.utilities?.electricity ? (
                      <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p className="flex items-center justify-between">
                          <span className="text-slate-400">Billing:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedProperty.pricing.utilities.electricity.billingMethod === "Per Unit"
                              ? `₹${selectedProperty.pricing.utilities.electricity.ratePerUnit || 0} per unit`
                              : selectedProperty.pricing.utilities.electricity.billingMethod === "Fixed Monthly Charge"
                              ? `Fixed ₹${selectedProperty.pricing.utilities.electricity.monthlyCharge || 0}/month`
                              : selectedProperty.pricing.utilities.electricity.billingMethod === "Included in Rent"
                              ? "Included in Rent"
                              : "No Separate Charges"}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {selectedProperty.pricing?.electricityWater || "Standard EB sub-meter connection"}
                      </p>
                    )}
                  </div>

                  {/* Water Supply Details */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-cyan-500 text-xs">💧</span>
                        <span>Water Supply</span>
                      </span>
                      {selectedProperty.pricing?.utilities?.water && (
                        <span
                          className={`text-[10px] font-bold ${
                            selectedProperty.pricing.utilities.water.available
                              ? "text-cyan-600 dark:text-cyan-400"
                              : "text-slate-400"
                          }`}
                        >
                          {selectedProperty.pricing.utilities.water.available ? "Available" : "Not Available"}
                        </span>
                      )}
                    </div>

                    {selectedProperty.pricing?.utilities?.water ? (
                      <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p className="flex items-center justify-between">
                          <span className="text-slate-400">Availability:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedProperty.pricing.utilities.water.available ? "Available" : "Not Available"}
                          </span>
                        </p>
                        {selectedProperty.pricing.utilities.water.available && (
                          <p className="flex items-center justify-between">
                            <span className="text-slate-400">Charges:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedProperty.pricing.utilities.water.billingType === "Free"
                                ? "Free"
                                : selectedProperty.pricing.utilities.water.billingType === "Included in Rent"
                                ? "Included in Rent"
                                : `₹${selectedProperty.pricing.utilities.water.amount || 0}${
                                    selectedProperty.pricing.utilities.water.billingMethod === "Per Person Per Month"
                                      ? "/person/month"
                                      : selectedProperty.pricing.utilities.water.billingMethod === "Per Unit"
                                      ? "/unit"
                                      : "/month"
                                  }`}
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {selectedProperty.pricing?.electricityWater
                          ? "Water included as per policy"
                          : "Potable ground water / municipal line"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Address & Locality Highlights */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Location & Connectivity
              </h4>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <span>
                  {selectedProperty.location ||
                    `Ward ${selectedProperty.ward}, ${selectedProperty.streetName || "Avadi"}`}
                </span>
              </p>

              {(selectedProperty.localityIntel?.distanceToStation ||
                selectedProperty.localityIntel?.distanceToBusStand) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {selectedProperty.localityIntel?.distanceToStation && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-primary shrink-0">
                        <Train size={15} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedProperty.localityIntel.distanceToStation}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Direct Suburban train connectivity
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedProperty.localityIntel?.distanceToBusStand && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                        <Bus size={15} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {selectedProperty.localityIntel.distanceToBusStand}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          MTC bus terminus access
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description / Property Overview — only if provided */}
            {Boolean(
              (selectedProperty.description || selectedProperty.details)?.trim()
            ) && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Property Overview
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                  {selectedProperty.description || selectedProperty.details}
                </p>
              </div>
            )}

            {/* Amenities & Facilities */}
            {selectedProperty.amenities &&
              selectedProperty.amenities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Amenities & Facilities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Check
                          size={13}
                          className="text-emerald-500 stroke-[3]"
                        />
                        <span>{amenity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Owner Profile & Direct Contacts */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {selectedProperty.owner?.type || "Property Lister"}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {selectedProperty.owner?.name ||
                      selectedProperty.ownerName ||
                      "Avadi Resident"}
                  </h4>
                  {selectedProperty.owner?.memberSince && (
                    <span className="text-[10px] text-slate-400">
                      Member since {selectedProperty.owner.memberSince}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {Boolean(selectedProperty.owner?.whatsapp?.trim()) && (
                    <button
                      onClick={(e) => handleWhatsApp(selectedProperty, e)}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-md"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleCall(selectedProperty, e)}
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Phone size={14} className="fill-current" />
                    <span>Call Owner</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
