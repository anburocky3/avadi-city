/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Navigation,
  Phone,
  ShieldAlert,
  Star,
  Share2,
  Sparkles,
  Globe,
  Info,
  MessageSquare,
  Send,
  CheckCircle2,
  Calendar,
  ImageIcon,
} from "lucide-react";

import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import { timeAgo } from "@/utils/helper";

export interface PlaceDetails {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  areaLandmark?: string | null;
  ward: number;
  imageUrl?: string | null;
  additionalImages?: string[] | null;
  timings?: string;
  is24x7?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  entryFeeType?: string | null;
  entryFeeAmount?: number | null;
  activities?: string[] | null;
  visitorTypes?: string[] | null;
  facilities?: string[] | null;
  bestTimeToVisit?: string | null;
  guidelines?: string | null;
  phone?: string | null;
  website?: string | null;
  officialUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ReviewStats {
  averageRating: number | null;
  reviewCount: number;
}

export interface ReviewItem {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwn?: boolean;
}

interface PlaceCardDetailsClientProps {
  place: PlaceDetails;
  initialReviewStats?: ReviewStats;
}

const ACCESSIBILITY_FACILITIES = new Set([
  "Wheelchair Access",
  "Accessible Restrooms",
  "Accessible Parking",
]);

const RATING_INTERPRETATIONS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const PlaceCardDetailsClient: React.FC<PlaceCardDetailsClientProps> = ({
  place,
  initialReviewStats,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useWard();
  const toast = useToast();

  const [activeImage, setActiveImage] = useState<string>(
    place.imageUrl ||
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=70",
  );
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reviews state
  const [reviewStats, setReviewStats] = useState<ReviewStats>(
    initialReviewStats || {
      averageRating: null,
      reviewCount: 0,
    },
  );
  const [placeReviews, setPlaceReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [userExistingReview, setUserExistingReview] =
    useState<ReviewItem | null>(null);
  const [inputRating, setInputRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [inputReviewText, setInputReviewText] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Filter facilities
  const availableFacilities = useMemo(() => {
    if (!place.facilities || !Array.isArray(place.facilities)) return [];
    return place.facilities.filter((f) => !ACCESSIBILITY_FACILITIES.has(f));
  }, [place.facilities]);

  const accessibilityFacilities = useMemo(() => {
    if (!place.facilities || !Array.isArray(place.facilities)) return [];
    return place.facilities.filter((f) => ACCESSIBILITY_FACILITIES.has(f));
  }, [place.facilities]);

  // Gallery images (cover + additional images)
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (place.imageUrl) list.push(place.imageUrl);
    if (Array.isArray(place.additionalImages)) {
      for (const img of place.additionalImages) {
        if (img && !list.includes(img)) list.push(img);
      }
    }
    return list;
  }, [place.imageUrl, place.additionalImages]);

  // Construct Google Maps directions URL
  const directionsUrl = useMemo(() => {
    if (place.latitude && place.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    }
    const formattedName = encodeURIComponent(place.name.replace(/\s+/g, "+"));
    return `https://www.google.com/maps/search/?api=1&query=${formattedName}+Avadi`;
  }, [place.name, place.latitude, place.longitude]);

  // Native share with clipboard fallback
  const handleShare = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/explore/card/${place.id}`;
    const shareTitle = `${place.name} | Avadi Explore`;
    const shareText = place.description
      ? place.description.length > 120
        ? `${place.description.substring(0, 117)}...`
        : place.description
      : `Check out ${place.name} in Avadi!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied successfully!");
          } catch {
            toast.error("Unable to share link.");
          }
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied successfully!");
      } catch {
        toast.error("Unable to copy link to clipboard.");
      }
    } else {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          toast.success("Link copied successfully!");
        } else {
          toast.error("Unable to copy link.");
        }
      } catch {
        toast.error("Unable to copy link.");
      }
    }
  };

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/explore/reviews?placeId=${place.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPlaceReviews(json.data.reviews || []);
          setUserExistingReview(json.data.userReview || null);
          if (json.data.stats) {
            setReviewStats(json.data.stats);
          }
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setReviewsLoading(false);
    }
  }, [place.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please log in before submitting a review.");
      router.push(`/login?redirect=/explore/card/${place.id}`);
      return;
    }

    if (!inputRating || inputRating < 1 || inputRating > 5) {
      toast.error("Please select a star rating between 1 and 5 stars.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/explore/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          placeId: String(place.id),
          rating: inputRating,
          reviewText: inputReviewText.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          json.message || "Your review has been submitted successfully.",
        );
        setInputRating(0);
        setInputReviewText("");
        await fetchReviews();
      } else {
        toast.error(
          json.message || "Unable to submit your review. Please try again.",
        );
      }
    } catch {
      toast.error(
        "Unable to submit your review. Please check your network and try again.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Explore Places</span>
        </Link>

        {/* Share Button in Header */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition shadow-xs cursor-pointer active:scale-98"
          title="Share this place"
        >
          <Share2 size={14} className="text-primary" />
          <span>Share</span>
        </button>
      </div>

      {/* Main Cover Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        {/* Main Cover Image */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          )}
          <img
            src={activeImage}
            alt={place.name}
            onLoad={() => setIsImageLoading(false)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isImageLoading ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Badges on Cover */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="bg-slate-900/85 backdrop-blur-md text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg">
              Ward {place.ward}
            </span>
            {place.is24x7 && (
              <span className="bg-rose-600 text-white font-black text-xs uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <ShieldAlert size={12} />
                24/7 Open
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
            {place.entryFeeType && (
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${
                  place.entryFeeType === "Free Entry"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-slate-950"
                }`}
              >
                {place.entryFeeType === "Free Entry"
                  ? "Free Entry"
                  : `₹${place.entryFeeAmount || 0} Entry Fee`}
              </span>
            )}

            {reviewStats && reviewStats.reviewCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black flex items-center shadow-lg">
                <Star
                  size={13}
                  className="fill-slate-950 text-slate-950 mr-1"
                />
                <span>{reviewStats.averageRating?.toFixed(1)}</span>
                <span className="ml-1 text-[10px] font-bold opacity-80">
                  ({reviewStats.reviewCount})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Gallery Thumbnails (if additional images exist) */}
        {allImages.length > 1 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0 flex items-center gap-1">
              <ImageIcon size={13} />
              <span>Photos ({allImages.length}):</span>
            </div>
            {allImages.map((img, idx) => (
              <button
                key={img}
                type="button"
                onClick={() => {
                  setIsImageLoading(true);
                  setActiveImage(img);
                }}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeImage === img
                    ? "border-primary scale-105 shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${place.name} photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Header Details Body */}
        <div className="p-5 sm:p-7 space-y-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 px-3 py-1 rounded-full">
                {place.category}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center">
                <Clock size={13} className="mr-1 text-teal-600 shrink-0" />
                {place.timings}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {place.name}
            </h1>

            {place.areaLandmark && (
              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-0.5">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>{place.areaLandmark}</span>
              </p>
            )}
          </div>

          {/* Action Buttons: Directions, Share, Phone, Website */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer active:scale-98"
            >
              <Navigation size={14} />
              <span>Get Directions</span>
            </a>

            <button
              type="button"
              onClick={handleShare}
              className="py-3 px-3 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-500 border border-orange-200/80 dark:border-orange-800/80 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:text-white dark:hover:text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-98"
            >
              <Share2 size={14} />
              <span>Share Place</span>
            </button>

            {place.phone ? (
              <a
                href={`tel:${place.phone}`}
                className="py-3 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-98"
              >
                <Phone size={14} />
                <span>Call ({place.phone})</span>
              </a>
            ) : null}

            {place.website || place.officialUrl ? (
              <a
                href={place.website || place.officialUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-98"
              >
                <Globe size={14} />
                <span>Official Website</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Description & Overview */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            About This Place
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
            {place.description}
          </p>
        </div>

        {/* Address Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-start space-x-3">
          <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Full Address
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-normal">
              {place.address}
            </p>
            {place.areaLandmark && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Landmark / Area: {place.areaLandmark}
              </p>
            )}
          </div>
        </div>

        {/* Timings & Entry Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} className="text-teal-600" />
              <span>Visiting Hours</span>
            </span>
            <p className="text-xs font-black text-slate-900 dark:text-white">
              {place.is24x7
                ? "Open 24 Hours (All Days)"
                : place.openingTime && place.closingTime
                  ? `${place.openingTime} – ${place.closingTime}`
                  : place.timings || "Timings vary"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Entry Fee</span>
            </span>
            <p className="text-xs font-black text-slate-900 dark:text-white">
              {place.entryFeeType === "Free Entry"
                ? "Free Entry (No Ticket Required)"
                : place.entryFeeAmount
                  ? `₹${place.entryFeeAmount} per person`
                  : place.entryFeeType || "Free Entry"}
            </p>
          </div>
        </div>
      </div>

      {/* Activities and Attractions */}
      {place.activities && place.activities.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Activities &amp; Attractions
          </h2>
          <div className="flex flex-wrap gap-2">
            {place.activities.map((act) => (
              <span
                key={act}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 text-xs font-bold"
              >
                {act}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Visitor Facilities & Accessibility */}
      {place.facilities && place.facilities.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-teal-600 dark:text-teal-400" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Visitor Facilities &amp; Accessibility
            </h2>
          </div>

          {availableFacilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Available Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableFacilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          {accessibilityFacilities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span>♿</span>
                <span>Accessibility Features</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {accessibilityFacilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 flex items-center gap-1.5"
                  >
                    <span>♿</span>
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Best Time to Visit & Visitor Guidelines */}
      {(place.bestTimeToVisit || place.guidelines) && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {place.bestTimeToVisit && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                <span>Best Time to Visit</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {place.bestTimeToVisit
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 text-xs font-bold"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {place.guidelines && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
              <p className="font-black flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                <Info size={14} />
                <span>Visitor Guidelines &amp; Rules:</span>
              </p>
              <p className="leading-relaxed whitespace-pre-line text-xs font-medium">
                {place.guidelines}
              </p>
            </div>
          )}
        </div>
      )}

      {/* RATINGS & REVIEWS SECTION */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Ratings &amp; Reviews
            </h2>
          </div>

          <div>
            {reviewStats && reviewStats.reviewCount > 0 ? (
              <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span>
                  {reviewStats.averageRating?.toFixed(1)}/5 ·{" "}
                  {reviewStats.reviewCount}{" "}
                  {reviewStats.reviewCount === 1 ? "Review" : "Reviews"}
                </span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                No reviews yet
              </span>
            )}
          </div>
        </div>

        {/* Review Form or Already Reviewed Status */}
        {!isAuthenticated ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Want to share your review? Sign in to rate this place.
            </span>
            <button
              type="button"
              onClick={() =>
                router.push(`/login?redirect=/explore/card/${place.id}`)
              }
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        ) : userExistingReview ? (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-start space-x-3">
            <CheckCircle2
              size={18}
              className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                You have already reviewed this place.
              </p>
              <p className="text-[11px] text-teal-700 dark:text-teal-400">
                Thank you for contributing your experience for the Avadi
                community!
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitReview}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Your Rating *
              </label>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setInputRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 transition cursor-pointer text-amber-500"
                    aria-label={`${star} star - ${RATING_INTERPRETATIONS[star]}`}
                  >
                    <Star
                      size={24}
                      className={
                        star <= (hoverRating || inputRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">
                  {(hoverRating || inputRating) > 0
                    ? `${hoverRating || inputRating} star${
                        (hoverRating || inputRating) > 1 ? "s" : ""
                      } — ${RATING_INTERPRETATIONS[hoverRating || inputRating]}`
                    : "Select rating (1 to 5 stars)"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Write Your Review
              </label>
              <textarea
                rows={3}
                value={inputReviewText}
                onChange={(e) => setInputReviewText(e.target.value)}
                placeholder="Share your experience, amenities, visiting tips, or recommendations..."
                maxLength={2000}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-slate-400">
                  {inputReviewText.length} / 2000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
            >
              <Send size={14} />
              <span>
                {isSubmittingReview ? "Submitting Review..." : "Submit Review"}
              </span>
            </button>
          </form>
        )}

        {/* Reviews Cards List */}
        <div className="space-y-3">
          {reviewsLoading ? (
            <div className="p-5 text-center text-xs text-slate-400 animate-pulse">
              Loading reviews...
            </div>
          ) : placeReviews.length > 0 ? (
            placeReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {rev.userAvatar ? (
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                        {(rev.userName || "U").charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {rev.userName} {rev.isOwn && "(You)"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Reviewed on: {timeAgo(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={11}
                        className={
                          star <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        }
                      />
                    ))}
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 ml-1">
                      {rev.rating}/5
                    </span>
                  </div>
                </div>

                {rev.reviewText && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pl-1 whitespace-pre-line">
                    &ldquo;{rev.reviewText}&rdquo;
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
