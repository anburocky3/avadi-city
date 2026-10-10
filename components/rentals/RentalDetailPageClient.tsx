"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Phone,
  MessageCircle,
  Check,
  MapPin,
  Calendar,
  ShieldCheck,
  Home,
  Layers,
  Car,
  Compass,
  Maximize2,
  Building2,
  UserCircle2,
  Trash2,
  Zap,
  Droplets,
  AlertCircle,
  IndianRupee,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { RentalProperty } from "@/types/rental";
import { getPropertySharePath } from "@/lib/rental-slugs";
import { Card, Modal } from "@/components/shared-components";

interface RentalDetailPageClientProps {
  initialProperty: RentalProperty | null;
  propertyId: string;
  similarProperties?: RentalProperty[];
}

export const RentalDetailPageClient: React.FC<RentalDetailPageClientProps> = ({
  initialProperty,
  propertyId,
  similarProperties = [],
}) => {
  const router = useRouter();
  const [property, setProperty] = useState<RentalProperty | null>(initialProperty);
  const [loading, setLoading] = useState<boolean>(!initialProperty);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [myListingIds, setMyListingIds] = useState<Set<string>>(new Set());

  // Show transient toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check localStorage and API fallback on client mount
  useEffect(() => {
    let localSaved: RentalProperty[] = [];
    let deletedIds = new Set<string>();

    try {
      const deletedStored = localStorage.getItem("avadi_deleted_rentals");
      if (deletedStored) {
        const parsed = JSON.parse(deletedStored);
        if (Array.isArray(parsed)) deletedIds = new Set(parsed);
      }
    } catch {
      /* ignore */
    }

    try {
      const stored = localStorage.getItem("avadi_user_rentals");
      if (stored) {
        const parsed: RentalProperty[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localSaved = parsed.filter((p) => !deletedIds.has(p.id));
          setMyListingIds(new Set(localSaved.map((p) => p.id)));
        }
      }
    } catch {
      /* ignore */
    }

    // If initialProperty is deleted, clear it
    if (initialProperty && deletedIds.has(initialProperty.id)) {
      setProperty(null);
      setLoading(false);
      return;
    }

    // If property was not available server-side, check local or fetch API
    if (!property) {
      const foundInLocal = localSaved.find((p) => p.id === propertyId);
      if (foundInLocal) {
        setProperty(foundInLocal);
        setLoading(false);
        return;
      }

      // Fetch from API
      async function fetchFresh() {
        try {
          const res = await fetch("/api/rentals", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              const matched = json.data.find(
                (p: RentalProperty) => p.id === propertyId && !deletedIds.has(p.id)
              );
              if (matched) {
                setProperty(matched);
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch property details:", err);
        } finally {
          setLoading(false);
        }
      }

      fetchFresh();
    }
  }, [initialProperty, propertyId]);

  // Format Price helper
  const formatPrice = (p: RentalProperty) => {
    const rent = p.pricing?.monthlyRent ?? p.rent ?? 0;
    if (p.transactionType === "Sale") {
      if (rent >= 10000000) {
        return `₹${(rent / 10000000).toFixed(2)} Cr`;
      }
      return `₹${(rent / 100000).toFixed(1)} Lakhs`;
    }
    if (p.transactionType === "Lease") {
      return `₹${(rent / 100000).toFixed(1)} L Lease`;
    }
    if (p.transactionType === "PG / Hostel") {
      return `₹${rent.toLocaleString("en-IN")} / bed`;
    }
    if (p.transactionType === "Daily") {
      return `₹${rent.toLocaleString("en-IN")} / day`;
    }
    return `₹${rent.toLocaleString("en-IN")} / mo`;
  };

  // Share Property handler
  const handleShare = () => {
    if (!property) return;
    const shareUrl = `${window.location.origin}${getPropertySharePath(property)}`;
    const text = `Check out this property in Avadi: ${property.title} - ${formatPrice(property)}`;

    if (navigator.share) {
      navigator.share({ title: property.title, text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      triggerToast("📋 Property link copied to clipboard!");
    }
  };

  // WhatsApp Owner handler
  const handleWhatsApp = () => {
    if (!property) return;
    const phone = property.owner?.phone || property.contact || "9876543210";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const shareUrl = `${window.location.origin}${getPropertySharePath(property)}`;
    const msg = encodeURIComponent(
      `Hello ${property.owner?.name || "Sir/Madam"}, I found your property "${property.title}" in Ward ${property.ward}, Avadi on the Avadi City Portal (${shareUrl}). Is it currently available for a visit?`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, "_blank");
  };

  // Call Owner handler
  const handleCall = () => {
    if (!property) return;
    const phone = property.owner?.phone || property.contact || "";
    if (phone) {
      triggerToast(`Calling ${property.owner?.name || "Property Owner"} (${phone})...`);
      setTimeout(() => {
        window.location.href = `tel:${phone}`;
      }, 400);
    }
  };

  // Delete Listing handler (for property owners)
  const handleDelete = async () => {
    if (!property) return;
    setIsDeleting(true);

    try {
      // 1. LocalStorage updates
      try {
        const stored = localStorage.getItem("avadi_user_rentals");
        if (stored) {
          const parsed: RentalProperty[] = JSON.parse(stored);
          localStorage.setItem(
            "avadi_user_rentals",
            JSON.stringify(parsed.filter((p) => p.id !== property.id))
          );
        }
        const deletedStored = localStorage.getItem("avadi_deleted_rentals");
        const deletedList: string[] = deletedStored ? JSON.parse(deletedStored) : [];
        if (!deletedList.includes(property.id)) {
          localStorage.setItem(
            "avadi_deleted_rentals",
            JSON.stringify([...deletedList, property.id])
          );
        }
      } catch {
        /* ignore */
      }

      // 2. Server delete
      await fetch(`/api/rentals?id=${encodeURIComponent(property.id)}`, {
        method: "DELETE",
      });

      triggerToast("🗑️ Listing deleted permanently.");
      setTimeout(() => {
        router.push("/rentals");
      }, 500);
    } catch (err) {
      console.error("Error deleting property:", err);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-80 sm:h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-72 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!property) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-primary">
          <Home size={38} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Property Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            This listing may have been rented out, sold, or removed by the owner on the Avadi City Portal.
          </p>
        </div>
        <div>
          <Link
            href="/rentals"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-primary/20"
          >
            <ArrowLeft size={16} />
            <span>Browse All Rentals in Avadi</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = myListingIds.has(property.id);
  const images = property.images && property.images.length > 0 ? property.images : property.imageUrl ? [property.imageUrl] : [];
  const currentPhoto = images[activeImageIndex] || images[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles size={14} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/rentals"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Properties</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            title="Share this listing"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>

          {/* Owner Delete Button */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              title="Delete this listing"
            >
              <Trash2 size={14} />
              <span>Delete Listing</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Photo Gallery */}
      <div className="space-y-3">
        <div className="relative w-full h-72 sm:h-96 md:h-[460px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto}
            alt={property.title}
            className="w-full h-full object-cover"
          />

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md bg-slate-950/75 border border-white/20 text-white flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{property.propertyTypeTag || property.category}</span>
            </span>

            {property.transactionType === "Sale" && (
              <span className="px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md bg-rose-950/75 border border-rose-400/40 text-rose-300 shadow-sm">
                For Sale
              </span>
            )}
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-full border border-white/20">
              {activeImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Ribbon */}
        {images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-2xl overflow-hidden shrink-0 border-2 cursor-pointer transition ${
                  activeImageIndex === idx
                    ? "border-primary scale-105 shadow-md shadow-primary/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Full Specifications, Policies, Amenities, Map */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Location Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <MapPin size={14} className="shrink-0" />
              <span>Ward {property.ward} · {property.streetName || "Avadi"}, Chennai</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {property.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified Direct Property</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                <span>Listed on Avadi Portal</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                0% Brokerage
              </span>
            </div>
          </div>

          {/* Mobile Pricing Quick View */}
          <div className="lg:hidden p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-primary/5 to-amber-500/10 border border-primary/25 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {property.transactionType === "Sale" ? "Sale Price" : "Monthly Rent"}
                </span>
                <div className="text-2xl font-black text-primary font-sora">
                  {formatPrice(property)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">
                  {property.transactionType === "Sale" ? "Booking Advance" : "Security Deposit"}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  ₹{(property.pricing?.securityDeposit || property.advance || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Property Key Specifications */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Property Overview & Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {property.bhk && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Configuration</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.bhk}
                  </span>
                </div>
              )}

              {property.builtUpArea ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {property.category === "Plot / Land" ? "Plot Area" : "Built-Up Area"}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.builtUpArea} sq.ft
                  </span>
                </div>
              ) : null}

              {property.floor && property.category !== "Plot / Land" && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Floor Level</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.floor}
                  </span>
                </div>
              )}

              {property.facing && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Facing Direction</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.facing}
                  </span>
                </div>
              )}

              {property.furnishing && property.category !== "Plot / Land" && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Furnishing</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.furnishing}
                  </span>
                </div>
              )}

              {property.bathrooms ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Bathrooms</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.bathrooms} Bath
                  </span>
                </div>
              ) : null}

              {property.balconies ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Balconies</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.balconies} Balcony
                  </span>
                </div>
              ) : null}

              {property.parking && property.parking !== "None" && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Parking</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.parking}
                  </span>
                </div>
              )}

              {property.preferredTenants && property.transactionType !== "Sale" && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Preferred Tenants</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.preferredTenants}
                  </span>
                </div>
              )}

              {property.pgDetails?.sharingType && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Room Sharing</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.pgDetails.sharingType} ({property.pgDetails.gender})
                  </span>
                </div>
              )}

              {property.commercialDetails?.powerLoad && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Power Load</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.commercialDetails.powerLoad}
                  </span>
                </div>
              )}

              {property.plotDetails?.approvalType && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Approval Type</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {property.plotDetails.approvalType}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Electricity & Water Policy (Rent / Commercial / PG only) */}
          {property.transactionType !== "Sale" && (property.pricing?.utilities || property.pricing?.electricityWater) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Utility Charges Policy
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Electricity Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                    <Zap size={14} />
                    <span>Electricity</span>
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {property.pricing?.utilities?.electricity?.billingMethod === "Included in Rent"
                      ? "Free (Included in Rent)"
                      : property.pricing?.utilities?.electricity?.billingMethod === "Per Unit"
                      ? `₹${property.pricing.utilities.electricity.ratePerUnit || 8}/unit`
                      : property.pricing?.electricityWater
                      ? property.pricing.electricityWater.split("·")[0]?.replace("Electricity:", "").trim() || "Per Unit"
                      : "Per Unit"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {property.pricing?.utilities?.electricity?.billingMethod === "Included in Rent"
                      ? "No separate electricity charges"
                      : "Standard meter billing"}
                  </p>
                </div>

                {/* Water Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-500 font-bold">
                    <Droplets size={14} />
                    <span>Water Supply</span>
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {property.pricing?.utilities?.water?.billingType === "Free" ||
                    property.pricing?.utilities?.water?.billingType === "Included in Rent"
                      ? "Free (Included in Rent)"
                      : property.pricing?.utilities?.water?.amount
                      ? `₹${property.pricing.utilities.water.amount}/mo`
                      : property.pricing?.electricityWater
                      ? property.pricing.electricityWater.split("·")[1]?.replace("Water:", "").trim() || "Free"
                      : "Free"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Borewell & municipal water supply
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description & Overview */}
          {(property.description || property.details) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Property Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                {property.description || property.details}
              </p>
            </div>
          )}

          {/* Amenities & Features */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Amenities & Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check size={13} className="text-emerald-500 stroke-[3]" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transit & Accessibility */}
          {Boolean(
            property.localityIntel?.distanceToStation ||
            property.localityIntel?.distanceToBusStand ||
            property.localityIntel?.nearbyLandmarks?.length
          ) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Location & Connectivity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {property.localityIntel?.distanceToStation && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Avadi Railway Station</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {property.localityIntel.distanceToStation} away
                    </span>
                  </div>
                )}
                {property.localityIntel?.distanceToBusStand && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Avadi Bus Terminus</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {property.localityIntel.distanceToBusStand} away
                    </span>
                  </div>
                )}
              </div>

              {property.localityIntel?.nearbyLandmarks && property.localityIntel.nearbyLandmarks.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Nearby Landmarks: </span>
                  {Array.isArray(property.localityIntel.nearbyLandmarks)
                    ? property.localityIntel.nearbyLandmarks.join(", ")
                    : property.localityIntel.nearbyLandmarks}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Pricing, Contact Owner, Transparency */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Price Breakdown Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                {property.transactionType === "Sale" ? "Total Property Sale Price" : "Monthly Rent"}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sora">
                {formatPrice(property)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  {property.transactionType === "Sale" ? "Booking Advance" : "Security Deposit"}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  ₹{(property.pricing?.securityDeposit || property.advance || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {property.transactionType !== "Sale" && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Maintenance</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {property.pricing?.maintenance ? `₹${property.pricing.maintenance}` : "Included"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Brokerage Fee</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹0 (Zero Brokerage)
                </span>
              </div>

              <div className="pt-2 border-t border-orange-500/20 flex items-center justify-between font-black">
                <span className="text-slate-700 dark:text-slate-200 text-xs">
                  {property.transactionType === "Sale" ? "Total Deal Cost" : "Estimated Move-In Total"}
                </span>
                <span className="text-primary text-base font-sora">
                  ₹{(
                    property.transactionType === "Sale"
                      ? (property.pricing?.monthlyRent || property.rent || 0)
                      : (property.pricing?.estimatedMoveInCost || (property.pricing?.monthlyRent || property.rent || 0) + (property.pricing?.securityDeposit || property.advance || 0))
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Direct Owner Card */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Listed by {property.owner?.type || "Owner"}
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {property.owner?.name || property.ownerName || "Avadi Citizen"}
                </h4>
                {property.owner?.memberSince && (
                  <span className="text-[11px] text-slate-400">
                    Member since {property.owner.memberSince}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCall}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Phone size={15} className="fill-current" />
                  <span>Call Owner Directly</span>
                </button>

                {Boolean(property.owner?.whatsapp?.trim()) && (
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>Chat on WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Avadi Guarantee Badge */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <span>Direct owner listing on official Avadi Portal. No agents or broker commissions.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties Section */}
      {similarProperties.length > 0 && (
        <div className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Other Properties in Avadi
            </h3>
            <Link
              href="/rentals"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {similarProperties.map((sim) => (
              <Link
                key={sim.id}
                href={getPropertySharePath(sim)}
                className="group block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50 transition shadow-xs"
              >
                <div className="relative h-40 overflow-hidden bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sim.imageUrl || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"}
                    alt={sim.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 text-white font-black text-xs backdrop-blur-md">
                    {formatPrice(sim)}
                  </div>
                </div>
                <div className="p-3.5 space-y-1">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {sim.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    Ward {sim.ward} · {sim.streetName || "Avadi"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Property Listing?"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              &quot;{property.title}&quot;
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{isDeleting ? "Deleting..." : "Yes, Delete Listing"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
