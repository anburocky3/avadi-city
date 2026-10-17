/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Landmark,
  Trees,
  Clock,
  Map,
  GraduationCap,
  Compass,
  HelpCircle,
  Navigation,
  Phone,
  ShieldAlert,
  Star,
  LucideIcon,
  X,
  Plus,
  Ticket,
  Sparkles,
  ExternalLink,
  Globe,
  Info,
  MessageSquare,
  Send,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useWard } from "@/context/wardContext";
import useToast from "@/hooks/useToast";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useTranslations } from "next-intl";

export interface Place {
  id: number | string;
  name: string;
  category: string;
  description: string;
  address: string;
  imageUrl: string;
  timings: string;
  ward?: number;
  rating?: number;
  is24x7?: boolean;
  phone?: string;
  activities?: string[];
  entryFeeType?: string;
  entryFeeAmount?: number;
  facilities?: string[];
  guidelines?: string;
  website?: string;
  officialUrl?: string;
  bestTimeToVisit?: string;
  latitude?: number;
  longitude?: number;
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

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  isHighlighted?: boolean;
  color?: string;
}

export interface ExploreClientProps {
  initialPlaces: Place[];
  initialReviewStats?: Record<string, ReviewStats>;
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

const categories: Category[] = [
  { id: "All", name: "All Spots", icon: Compass },
  { id: "Parks & Gardens", name: "Parks & Gardens", icon: Trees },
  { id: "Historical Places", name: "Historical Places", icon: Landmark },
  { id: "Lakes & Nature", name: "Lakes & Nature", icon: MapPin },
  { id: "Cultural & Heritage Places", name: "Heritage", icon: Landmark },
  { id: "Sports & Recreation", name: "Sports", icon: Navigation },
  { id: "Tourist Attractions", name: "Attractions", icon: Star },
  { id: "Public Landmarks", name: "Landmarks", icon: Map },
  { id: "Schools & Colleges", name: "Colleges", icon: GraduationCap },
  { id: "Famous Spots", name: "Famous Spots", icon: Landmark },
  { id: "Temples/Places of Worship", name: "Worship", icon: MapPin },
  { id: "Government Offices", name: "Govt Offices", icon: Map },
];

export const ExploreClient: React.FC<ExploreClientProps> = ({
  initialPlaces,
  initialReviewStats = {},
}) => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useWard();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<Record<string | number, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Feature 7: Ratings & Reviews state
  const [reviewStatsMap, setReviewStatsMap] =
    useState<Record<string, ReviewStats>>(initialReviewStats);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [placeReviews, setPlaceReviews] = useState<ReviewItem[]>([]);
  const [userExistingReview, setUserExistingReview] =
    useState<ReviewItem | null>(null);
  const [inputRating, setInputRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [inputReviewText, setInputReviewText] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Fetch reviews for selected place
  const fetchReviewsForPlace = useCallback(async (placeId: string | number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/explore/reviews?placeId=${placeId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPlaceReviews(json.data.reviews || []);
          setUserExistingReview(json.data.userReview || null);
          if (json.data.stats) {
            setReviewStatsMap((prev) => ({
              ...prev,
              [String(placeId)]: json.data.stats,
            }));
          }
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!selectedPlace) {
      setPlaceReviews([]);
      setUserExistingReview(null);
      setInputRating(0);
      setInputReviewText("");
      return;
    }
    fetchReviewsForPlace(selectedPlace.id);
  }, [selectedPlace, fetchReviewsForPlace]);

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    if (!isAuthenticated) {
      toast.error("Please log in before submitting a review.");
      router.push(`/login?redirect=/explore`);
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
          placeId: String(selectedPlace.id),
          rating: inputRating,
          reviewText: inputReviewText.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          json.message ||
            "Your review has been submitted successfully. Thank you for sharing your experience!"
        );
        setInputRating(0);
        setInputReviewText("");
        await fetchReviewsForPlace(selectedPlace.id);
      } else {
        toast.error(
          json.message || "Unable to submit your review. Please try again."
        );
      }
    } catch {
      toast.error(
        "Unable to submit your review. Please check your network and try again."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Sync category from URL search parameters if passed
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      if (cat === "Hospitals" || cat === "Hospitals & Healthcare") {
        setSelectedCategory("Hospitals & Healthcare");
      } else if (categories.some((c) => c.id === cat)) {
        setSelectedCategory(cat);
      }
    }
  }, [searchParams]);

  // Derived facilities for selected place (Feature 8)
  const availableFacilities = useMemo(() => {
    if (!selectedPlace?.facilities || !Array.isArray(selectedPlace.facilities))
      return [];
    return selectedPlace.facilities.filter(
      (f) => !ACCESSIBILITY_FACILITIES.has(f)
    );
  }, [selectedPlace]);

  const accessibilityFacilities = useMemo(() => {
    if (!selectedPlace?.facilities || !Array.isArray(selectedPlace.facilities))
      return [];
    return selectedPlace.facilities.filter((f) =>
      ACCESSIBILITY_FACILITIES.has(f)
    );
  }, [selectedPlace]);

  const currentPlaceStats = selectedPlace
    ? reviewStatsMap[String(selectedPlace.id)]
    : undefined;

  // Initial loader simulation when switching categories
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const filteredPlaces = useMemo(() => {
    let list = initialPlaces;

    // Category filter with backward-compatibility aliases
    if (selectedCategory !== "All") {
      list = list.filter((place) => {
        if (place.category === selectedCategory) return true;
        if (selectedCategory === "Parks & Gardens" && (place.category === "Parks" || place.category === "Parks & Gardens")) return true;
        if (selectedCategory === "Parks" && (place.category === "Parks" || place.category === "Parks & Gardens")) return true;
        if (selectedCategory === "Historical Places" && (place.category === "Historical Places" || place.category === "Famous Spots")) return true;
        return false;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (place) =>
          place.name.toLowerCase().includes(q) ||
          place.description.toLowerCase().includes(q) ||
          place.address.toLowerCase().includes(q) ||
          (place.category && place.category.toLowerCase().includes(q)) ||
          (place.activities && place.activities.some((a) => a.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [selectedCategory, searchQuery, initialPlaces]);

  // Construct Google Maps directions URL
  const getDirectionsUrl = (placeName: string): string => {
    const formattedName = encodeURIComponent(placeName.replace(/\s+/g, "+"));
    return `https://www.google.com/maps/search/?api=1&query=${formattedName}+Avadi`;
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header title & Post Place Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            {t("exploreTitle")}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            {t("exploreSubtitle")}
          </p>
        </div>

        {/* Dedicated "+ Post Place" button linking to /explore/create */}
        <Link
          href="/explore/create"
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary hover:bg-orange-600 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98"
        >
          <Plus size={16} />
          <span>Post Place</span>
        </Link>
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
          placeholder="Search landmarks, parks, nature, heritage, activities..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-xs sm:text-sm shadow-sm"
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

      {/* Category Chips Container */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none flex space-x-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-sm"
                  : cat.isHighlighted
                  ? `${cat.color} font-black animate-pulse-subtle`
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Places Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <SkeletonLoader type="card" count={2} />
        ) : filteredPlaces.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredPlaces.map((place) => {
              const numericId = typeof place.id === "number" ? place.id : 1;
              const wardNum = place.ward || ((numericId * 4) % 20) + 1;
              const placeStats = reviewStatsMap[String(place.id)];
              const hasReviews = placeStats && placeStats.reviewCount > 0;

              return (
                <Card
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`rounded-3xl sm:rounded-[28px] overflow-hidden bg-white dark:bg-slate-900 border transition cursor-pointer p-0 flex flex-col justify-between group shadow-sm hover:shadow-md ${
                    place.is24x7
                      ? "border-rose-300 dark:border-rose-800/60 ring-2 ring-rose-500/10"
                      : "border-slate-200/90 dark:border-slate-800 hover:border-teal-500/40"
                  }`}
                >
                  {/* Top Image Holder */}
                  <div className="relative h-48 sm:h-52 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden rounded-t-3xl sm:rounded-t-[28px]">
                    {!isImageLoading[place.id] && (
                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    )}
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      onLoad={() =>
                        setIsImageLoading((prev) => ({
                          ...prev,
                          [place.id]: true,
                        }))
                      }
                      className={`w-full h-full object-cover rounded-t-3xl sm:rounded-t-[28px] group-hover:scale-105 transition-all duration-300 ${
                        isImageLoading[place.id] ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Ward Badge (Top-Left) */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
                        Ward {wardNum}
                      </span>
                    </div>

                    {/* Entry Fee Badge and/or Real Review Rating (Top-Right) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {place.entryFeeType && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black shadow-md backdrop-blur-md ${
                          place.entryFeeType === "Free Entry"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-slate-950"
                        }`}>
                          {place.entryFeeType === "Free Entry" ? "Free Entry" : `₹${place.entryFeeAmount || 0}`}
                        </span>
                      )}

                      {hasReviews ? (
                        <span className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-black flex items-center shadow-md">
                          <Star
                            size={12}
                            className="fill-slate-950 text-slate-950 mr-1"
                          />
                          <span>{placeStats.averageRating?.toFixed(1)}</span>
                          <span className="ml-1 text-[10px] font-bold opacity-80">
                            ({placeStats.reviewCount})
                          </span>
                        </span>
                      ) : !place.entryFeeType ? (
                        <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md">
                          No reviews yet
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Details Area Below Image */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {/* Category Label */}
                      <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        {place.category
                          ? place.category.toUpperCase()
                          : "LAKE & NATURE"}
                      </span>

                      {/* Place Name */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {place.name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {place.description}
                      </p>

                      {/* Activities Display (if available) */}
                      {place.activities && place.activities.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 font-semibold shrink-0">Activities:</span>
                          <span className="truncate text-teal-700 dark:text-teal-300">
                            {place.activities.slice(0, 3).join(" · ")}
                            {place.activities.length > 3 ? "..." : ""}
                          </span>
                        </div>
                      )}

                      {/* Compact Visitor Facilities Badges on Card (Feature 8) */}
                      {place.facilities && place.facilities.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {place.facilities.slice(0, 2).map((fac) => {
                            const isAccess = ACCESSIBILITY_FACILITIES.has(fac);
                            return (
                              <span
                                key={fac}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isAccess
                                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {isAccess && <span className="text-[10px]">♿</span>}
                                <span>{fac}</span>
                              </span>
                            );
                          })}
                          {place.facilities.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{place.facilities.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Visiting Hours & Address */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <p className="flex items-center">
                        <Clock
                          size={13}
                          className="mr-1.5 text-teal-600 dark:text-teal-400 shrink-0"
                        />
                        <span className="truncate">{place.timings}</span>
                      </p>
                      <p className="flex items-center">
                        <MapPin
                          size={13}
                          className="mr-1.5 text-teal-600 dark:text-teal-400 shrink-0"
                        />
                        <span className="truncate">{place.address}</span>
                      </p>
                    </div>

                    {/* Action Buttons: View Details & Google Maps */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlace(place);
                        }}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition cursor-pointer"
                      >
                        <Info size={13} />
                        <span>View Details</span>
                      </button>

                      <a
                        href={getDirectionsUrl(place.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-600 dark:hover:bg-teal-600 border border-teal-200/80 dark:border-teal-800/80 hover:border-teal-600 text-teal-700 dark:text-teal-300 hover:text-white dark:hover:text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer shadow-2xs group/btn"
                      >
                        <Navigation
                          size={13}
                          className="text-teal-600 dark:text-teal-400 group-hover/btn:text-white transition-colors"
                        />
                        <span>Directions</span>
                      </a>
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
            <EmptyState
              icon={HelpCircle}
              title="No places found"
              description="We couldn't find any locations matching your filters or search keywords."
              actionText="Reset Category"
              onAction={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      {selectedPlace && (
        <Modal
          isOpen={!!selectedPlace}
          onClose={() => setSelectedPlace(null)}
          title={selectedPlace.name}
        >
          <div className="space-y-4">
            <div className="relative h-52 overflow-hidden rounded-2xl border dark:border-slate-800">
              <img
                src={selectedPlace.imageUrl}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
              {selectedPlace.is24x7 && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                  <ShieldAlert size={12} />
                  24/7 Open
                </div>
              )}
              {selectedPlace.entryFeeType && (
                <div className={`absolute top-3 right-3 text-xs font-black px-3 py-1 rounded-full shadow-lg ${
                  selectedPlace.entryFeeType === "Free Entry"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-slate-950"
                }`}>
                  {selectedPlace.entryFeeType === "Free Entry" ? "Free Entry" : `₹${selectedPlace.entryFeeAmount || 0} Entry Fee`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={selectedPlace.is24x7 ? "danger" : "secondary"}
                className="uppercase font-bold"
              >
                {selectedPlace.category}
              </Badge>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center">
                <Clock size={12} className="mr-1 text-teal-600" />
                {selectedPlace.timings}
              </span>
              {selectedPlace.ward && (
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-700 dark:text-slate-300">
                  Ward {selectedPlace.ward}
                </span>
              )}
              {currentPlaceStats && currentPlaceStats.reviewCount > 0 ? (
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                  <Star size={11} className="fill-amber-400 text-amber-400 mr-1" />
                  <span>
                    {currentPlaceStats.averageRating?.toFixed(1)}/5 · {currentPlaceStats.reviewCount}{" "}
                    {currentPlaceStats.reviewCount === 1 ? "Review" : "Reviews"}
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  No reviews yet
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {selectedPlace.description}
            </p>

            {/* Activities Section in Modal */}
            {selectedPlace.activities && selectedPlace.activities.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Activities &amp; Attractions:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlace.activities.map((act) => (
                    <span
                      key={act}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 text-xs font-medium"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURE 8: Visitor Facilities & Accessibility */}
            {selectedPlace.facilities && selectedPlace.facilities.length > 0 && (
              <div className="space-y-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Sparkles size={14} className="text-teal-600 dark:text-teal-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Visitor Facilities &amp; Accessibility
                  </h4>
                </div>

                {/* Available Facilities subsection */}
                {availableFacilities.length > 0 && (
                  <div className="space-y-1.5 pl-1">
                    <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Available Facilities
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {availableFacilities.map((fac) => (
                        <span
                          key={fac}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accessibility subsection */}
                {accessibilityFacilities.length > 0 && (
                  <div className="space-y-1.5 pl-1">
                    <h5 className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <span>♿</span>
                      <span>Accessibility</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {accessibilityFacilities.map((fac) => (
                        <span
                          key={fac}
                          className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5"
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

            {/* Visitor Guidelines */}
            {selectedPlace.guidelines && (
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Info size={13} />
                  <span>Visitor Guidelines:</span>
                </p>
                <p className="text-[11px] leading-relaxed whitespace-pre-line">
                  {selectedPlace.guidelines}
                </p>
              </div>
            )}

            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-800 flex items-start space-x-2">
              <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {selectedPlace.address}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {selectedPlace.phone && (
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call ({selectedPlace.phone})</span>
                </a>
              )}

              {selectedPlace.website && (
                <a
                  href={selectedPlace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Globe size={14} />
                  <span>Visit Website</span>
                </a>
              )}

              <a
                href={getDirectionsUrl(selectedPlace.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm ${
                  !selectedPlace.phone && !selectedPlace.website ? "col-span-full" : ""
                }`}
              >
                <Navigation size={14} />
                <span>Get Directions on Google Maps</span>
              </a>
            </div>

            {/* FEATURE 7: RATINGS & REVIEWS SECTION */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare size={16} className="text-primary" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Ratings &amp; Reviews
                  </h4>
                </div>
                <div>
                  {currentPlaceStats && currentPlaceStats.reviewCount > 0 ? (
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>
                        {currentPlaceStats.averageRating?.toFixed(1)}/5 · {currentPlaceStats.reviewCount}{" "}
                        {currentPlaceStats.reviewCount === 1 ? "Review" : "Reviews"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      No reviews yet
                    </span>
                  )}
                </div>
              </div>

              {/* Review Submission Form / Authentication & Duplicate Prevention */}
              {!isAuthenticated ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Want to rate this place? Sign in to share your review.
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(`/login?redirect=/explore`)}
                    className="px-3.5 py-1.5 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              ) : userExistingReview ? (
                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-start space-x-3">
                  <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      You have already reviewed this place.
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400">
                      Thank you for sharing your experience with the Avadi community!
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="space-y-1">
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
                            size={22}
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
                            } — ${
                              RATING_INTERPRETATIONS[hoverRating || inputRating]
                            }`
                          : "Select rating (1 to 5 stars)"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Write Your Review
                    </label>
                    <textarea
                      rows={3}
                      value={inputReviewText}
                      onChange={(e) => setInputReviewText(e.target.value)}
                      placeholder="Share your experience at this place..."
                      maxLength={2000}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Send size={13} />
                    <span>
                      {isSubmittingReview ? "Submitting Review..." : "Submit Review"}
                    </span>
                  </button>
                </form>
              )}

              {/* Review Cards List (Real database data, Normal users do not receive Edit/Delete controls) */}
              <div className="space-y-2.5">
                {reviewsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                    Loading reviews...
                  </div>
                ) : placeReviews.length > 0 ? (
                  placeReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          {rev.userAvatar ? (
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-2xs">
                              {(rev.userName || "U").charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {rev.userName} {rev.isOwn && "(You)"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Reviewed on:{" "}
                              {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
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
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                      No reviews yet. Be the first to share your experience!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
