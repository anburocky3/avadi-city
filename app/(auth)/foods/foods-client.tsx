"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Star,
  MapPin,
  Search,
  Phone,
  IceCream,
  Clock,
  Moon,
  Plus,
  Heart,
  X,
  History,
  MessageSquare,
  Sparkles,
  Send,
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
import { isShopOpenNow, getSearchMatchScore } from "@/lib/food-discovery";
import { wards as allWardsData } from "@/data/wards";

export interface MenuItem {
  name: string;
  price: number;
  isVeg?: boolean;
}

export interface FoodSpot {
  id: string | number;
  name: string;
  specialty: string;
  description: string;
  imageUrl: string;
  rating?: number | null;
  reviewCount?: number;
  ward: number;
  foodType: "Veg" | "Non-Veg" | "Ice Cream" | string;
  isVeg?: boolean;
  isLateNight?: boolean;
  timing?: string;
  openingTime?: string | null;
  closingTime?: string | null;
  lateNightStartTime?: string | null;
  lateNightEndTime?: string | null;
  address?: string;
  phone?: string;
  category?: string;
  status?: string;
  menu?: MenuItem[];
  popularItems?: string[];
  cuisines?: string;
}

export interface ReviewItem {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwn?: boolean;
}

export interface FilterCategory {
  id: string;
  name: string;
  renderIcon: () => React.ReactNode;
}

export interface FoodClientProps {
  initialSpots: FoodSpot[];
}

// Authentic Indian Standard (FSSAI) Veg Symbol
export const VegSymbol: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-slate-900 rounded-[3px] p-0.5 shrink-0 ${className}`}
    title="Pure Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
  </span>
);

// Authentic Indian Standard (FSSAI) Non-Veg Symbol
export const NonVegSymbol: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-rose-600 dark:border-rose-500 bg-white dark:bg-slate-900 rounded-[3px] p-0.5 shrink-0 ${className}`}
    title="Non-Vegetarian (FSSAI Verified)"
  >
    <span className="w-2 h-2 rounded-full bg-rose-600 dark:rose-500" />
  </span>
);

// Professional Dessert / Ice Cream Icon Badge
export const IceCreamSymbol: React.FC<{ className?: string }> = ({
  className = "w-4 h-4",
}) => (
  <span
    className={`inline-flex items-center justify-center border-2 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-[3px] text-purple-600 dark:text-purple-300 p-px shrink-0 ${className}`}
    title="Desserts & Ice Creams"
  >
    <IceCream size={10} />
  </span>
);

const filterCategories: FilterCategory[] = [
  {
    id: "All",
    name: "All Eateries",
    renderIcon: () => <span className="text-xs">🍽️</span>,
  },
  {
    id: "Late Night",
    name: "Late Night (Open Past 11 PM)",
    renderIcon: () => <span className="text-xs">🌙</span>,
  },
  {
    id: "Veg",
    name: "Pure Veg",
    renderIcon: () => <VegSymbol className="w-3.5 h-3.5" />,
  },
  {
    id: "Non-Veg",
    name: "Non-Veg",
    renderIcon: () => <NonVegSymbol className="w-3.5 h-3.5" />,
  },
  {
    id: "Ice Cream",
    name: "Ice Creams & Desserts",
    renderIcon: () => <IceCreamSymbol className="w-3.5 h-3.5" />,
  },
  {
    id: "Home Chefs",
    name: "Home Chefs & Bakers",
    renderIcon: () => <span className="text-xs">👩‍🍳</span>,
  },
];

export const FoodClient: React.FC<FoodClientProps> = ({ initialSpots }) => {
  const { activeWard, isAuthenticated } = useWard();
  const router = useRouter();
  const t = useTranslations();
  const toast = useToast();

  // Primary Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [myWardOnly, setMyWardOnly] = useState<boolean>(false);
  const [myFavoritesOnly, setMyFavoritesOnly] = useState<boolean>(false);

  // Data & Modal States
  const [selectedSpot, setSelectedSpot] = useState<FoodSpot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dynamicSpots, setDynamicSpots] = useState<FoodSpot[]>([]);

  // Feature 2: Review Statistics Map: shopId -> { rating, count }
  const [reviewStatsMap, setReviewStatsMap] = useState<
    Record<string, { rating: number | null; count: number }>
  >({});

  // Feature 5: Favorited Shop IDs
  const [favoritedShopIds, setFavoritedShopIds] = useState<Set<string>>(
    new Set(),
  );

  // Feature 6: Recently Viewed Shop IDs
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Modal Review States
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [spotReviews, setSpotReviews] = useState<ReviewItem[]>([]);
  const [userExistingReview, setUserExistingReview] =
    useState<ReviewItem | null>(null);
  const [inputRating, setInputRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [inputReviewText, setInputReviewText] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // 1. Fetch Dynamic Spots & Review Stats from Server
  const fetchDynamicSpots = async () => {
    try {
      const res = await fetch("/api/foods", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: FoodSpot[] = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            specialty: item.category,
            description: item.description,
            imageUrl:
              item.imageUrl ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60",
            rating: item.rating,
            reviewCount: item.reviewCount,
            ward: item.ward,
            foodType: item.foodType || "Both Veg & Non-Veg",
            isVeg:
              item.foodType === "Pure Veg" || item.category === "Vegetarian",
            isLateNight: item.isLateNight ?? false,
            openingTime: item.openingTime || null,
            closingTime: item.closingTime || null,
            lateNightStartTime: item.lateNightStartTime || null,
            lateNightEndTime: item.lateNightEndTime || null,
            timing:
              [item.openingTime, item.closingTime]
                .filter(Boolean)
                .join(" – ") || "Open Today",
            address: item.address,
            phone: item.phone,
            category: item.category,
            status: item.status,
            popularItems: item.popularItems || [],
            cuisines: item.cuisines || null,
          }));
          setDynamicSpots(mapped);
        }

        if (json.reviewStats && typeof json.reviewStats === "object") {
          setReviewStatsMap(json.reviewStats);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // 2. Fetch User Favorites
  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/foods/favorites", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.favoritedShopIds)) {
          setFavoritedShopIds(new Set(json.favoritedShopIds.map(String)));
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // 3. Fetch Recently Viewed
  const fetchRecentlyViewed = async () => {
    try {
      // Check localStorage first for instant display
      const local = localStorage.getItem("avadi_food_recently_viewed");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setRecentlyViewedIds(parsed.map(String));
          }
        } catch {
          // ignore
        }
      }

      // Sync with server if authenticated
      if (isAuthenticated) {
        const res = await fetch("/api/foods/recently-viewed", {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.recentShopIds)) {
            const serverIds = json.recentShopIds.map(String);
            setRecentlyViewedIds(serverIds);
            localStorage.setItem(
              "avadi_food_recently_viewed",
              JSON.stringify(serverIds),
            );
          }
        }
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchDynamicSpots();
    fetchFavorites();
    fetchRecentlyViewed();
  }, [isAuthenticated]);

  // Combine initial spots and dynamic spots, applying authoritative review statistics
  const allSpots = useMemo(() => {
    const combined = [...dynamicSpots, ...initialSpots];
    return combined.map((spot) => {
      const stringId = String(spot.id);
      const stat = reviewStatsMap[stringId];
      if (stat) {
        return {
          ...spot,
          rating: stat.rating,
          reviewCount: stat.count,
        };
      }
      return spot;
    });
  }, [dynamicSpots, initialSpots, reviewStatsMap]);

  // Record Recently Viewed
  const recordRecentlyViewed = useCallback(
    async (spot: FoodSpot) => {
      const stringId = String(spot.id);
      // Update local state and localStorage
      setRecentlyViewedIds((prev) => {
        const updated = [
          stringId,
          ...prev.filter((id) => id !== stringId),
        ].slice(0, 10);
        try {
          localStorage.setItem(
            "avadi_food_recently_viewed",
            JSON.stringify(updated),
          );
        } catch {
          // ignore
        }
        return updated;
      });

      // Sync to database if authenticated
      if (isAuthenticated) {
        try {
          await fetch("/api/foods/recently-viewed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ shopId: stringId }),
          });
        } catch {
          // Non-blocking
        }
      }
    },
    [isAuthenticated],
  );

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, spot: FoodSpot) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to save your favorite food spots.");
      router.push("/login?redirect=/foods");
      return;
    }

    const stringId = String(spot.id);
    const isCurrentlyFav = favoritedShopIds.has(stringId);

    // Optimistic UI update
    setFavoritedShopIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFav) {
        next.delete(stringId);
      } else {
        next.add(stringId);
      }
      return next;
    });

    try {
      const res = await fetch("/api/foods/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopId: stringId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.favorited) {
          toast.success("Saved to your favorites.");
        } else {
          toast.info("Removed from favorites.");
        }
      } else {
        // Rollback
        setFavoritedShopIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFav) next.add(stringId);
          else next.delete(stringId);
          return next;
        });
        toast.error(
          data.message || "Unable to save this shop. Please try again.",
        );
      }
    } catch {
      // Rollback
      setFavoritedShopIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFav) next.add(stringId);
        else next.delete(stringId);
        return next;
      });
      toast.error("Unable to save this shop. Please try again.");
    }
  };

  // Open Detail Modal
  const handleOpenSpotDetails = (spot: FoodSpot) => {
    setSelectedSpot(spot);
    recordRecentlyViewed(spot);
  };

  // Helper to get realistic local area and street name for display
  const getSpotDisplayLocation = useCallback((spot: FoodSpot) => {
    if (spot.address && spot.address.trim()) {
      const cleaned = spot.address.replace(/^,\s*/, "").trim();
      if (
        cleaned &&
        !cleaned.toLowerCase().match(/^ward\s+\d+,\s*avadi$/i) &&
        !cleaned.toLowerCase().match(/^ward\s+\d+$/i)
      ) {
        return cleaned;
      }
    }

    const matchedWard = allWardsData.find((w) => w.id === spot.ward);
    if (matchedWard?.name) {
      return `${matchedWard.name}, Avadi`;
    }

    return `Ward ${spot.ward}, Avadi`;
  }, []);

  // Fetch reviews for a specific spot
  const fetchReviewsForSpot = useCallback(async (spotId: string | number) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/foods/reviews?shopId=${spotId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSpotReviews(json.data.reviews || []);
          setUserExistingReview(json.data.userReview || null);
          if (json.data.userReview) {
            setInputRating(json.data.userReview.rating);
            setInputReviewText(json.data.userReview.reviewText || "");
          } else {
            setInputRating(5);
            setInputReviewText("");
          }

          if (json.data.stats) {
            setReviewStatsMap((prev) => ({
              ...prev,
              [String(spotId)]: json.data.stats,
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
    if (!selectedSpot) {
      setSpotReviews([]);
      setUserExistingReview(null);
      return;
    }

    fetchReviewsForSpot(selectedSpot.id);
  }, [selectedSpot, fetchReviewsForSpot]);

  // Submit Review (Read-only after submission)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpot) return;

    if (!isAuthenticated) {
      toast.error("Please sign in to submit a review.");
      router.push("/login?redirect=/foods");
      return;
    }

    if (inputRating < 1 || inputRating > 5) {
      toast.error("Please select a rating between 1 and 5 stars.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/foods/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shopId: String(selectedSpot.id),
          rating: inputRating,
          reviewText: inputReviewText.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Your review was submitted successfully.");
        // Refresh reviews
        const refreshRes = await fetch(
          `/api/foods/reviews?shopId=${selectedSpot.id}`,
          {
            credentials: "include",
          },
        );
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          if (refreshJson.success && refreshJson.data) {
            setSpotReviews(refreshJson.data.reviews || []);
            setUserExistingReview(refreshJson.data.userReview || null);

            if (refreshJson.data.stats) {
              setReviewStatsMap((prev) => ({
                ...prev,
                [String(selectedSpot.id)]: refreshJson.data.stats,
              }));
            }
          }
        }
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

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, openNowOnly, myWardOnly, myFavoritesOnly]);

  // Master Filter & Smart Search
  const filteredSpots = useMemo(() => {
    let list = [...allSpots];

    // 1. My Favorites Filter
    if (myFavoritesOnly) {
      list = list.filter((spot) => favoritedShopIds.has(String(spot.id)));
    }

    // 2. My Ward Filter
    if (myWardOnly) {
      list = list.filter((spot) => spot.ward === activeWard.id);
    }

    // 3. Open Now Filter
    if (openNowOnly) {
      list = list.filter((spot) => isShopOpenNow(spot));
    }

    // 4. Category Filter
    if (selectedCategory !== "All") {
      if (selectedCategory === "Late Night") {
        list = list.filter((spot) => spot.isLateNight === true);
      } else if (selectedCategory === "Veg") {
        list = list.filter(
          (spot) =>
            spot.foodType === "Veg" ||
            spot.isVeg === true ||
            spot.category === "Vegetarian",
        );
      } else if (selectedCategory === "Non-Veg") {
        list = list.filter(
          (spot) => spot.foodType === "Non-Veg" || spot.isVeg === false,
        );
      } else if (selectedCategory === "Ice Cream") {
        list = list.filter(
          (spot) =>
            spot.foodType === "Ice Cream" || spot.category === "Ice Cream",
        );
      } else if (selectedCategory === "Home Chefs") {
        list = list.filter(
          (spot) =>
            spot.category === "Home Chefs" || spot.category === "Bakeries",
        );
      } else {
        list = list.filter((spot) => spot.category === selectedCategory);
      }
    }

    // 5. Smart Search with Priority Scoring
    if (searchQuery.trim()) {
      const scored: Array<{ spot: FoodSpot; score: number }> = [];
      for (const spot of list) {
        const score = getSearchMatchScore(spot, searchQuery);
        if (score > 0) {
          scored.push({ spot, score });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.map((item) => item.spot);
    }

    // 6. Default Sort: User's ward first
    return list.sort((a, b) => {
      const aMatches = a.ward === activeWard.id;
      const bMatches = b.ward === activeWard.id;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [
    allSpots,
    myFavoritesOnly,
    myWardOnly,
    openNowOnly,
    selectedCategory,
    searchQuery,
    favoritedShopIds,
    activeWard.id,
  ]);

  // Recently Viewed Spots
  const recentlyViewedSpots = useMemo(() => {
    if (recentlyViewedIds.length === 0) return [];
    const spotMap = new Map<string, FoodSpot>();
    for (const spot of allSpots) {
      spotMap.set(String(spot.id), spot);
    }
    const resolved: FoodSpot[] = [];
    for (const id of recentlyViewedIds) {
      const spot = spotMap.get(id);
      if (spot) resolved.push(spot);
    }
    return resolved;
  }, [recentlyViewedIds, allSpots]);

  // Nearby Ward Spots for initial strip
  const nearbySpots = useMemo(() => {
    return allSpots.filter((spot) => spot.ward === activeWard.id);
  }, [activeWard.id, allSpots]);

  const renderDietaryBadge = (spot: FoodSpot) => {
    if (spot.foodType === "Veg" || spot.isVeg === true) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1.5 shrink-0 shadow-xs">
          <VegSymbol className="w-3.5 h-3.5" />
          <span className="tracking-wide">PURE VEG</span>
        </span>
      );
    }
    if (spot.foodType === "Non-Veg" || spot.isVeg === false) {
      return (
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center space-x-1.5 shrink-0 shadow-xs">
          <NonVegSymbol className="w-3.5 h-3.5" />
          <span className="tracking-wide">NON-VEG</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center space-x-1.5 shrink-0 shadow-xs">
        <IceCreamSymbol className="w-3.5 h-3.5" />
        <span className="tracking-wide">ICE CREAM &amp; DESSERT</span>
      </span>
    );
  };

  const renderOpenStatusBadge = (spot: FoodSpot) => {
    const isOpen = isShopOpenNow(spot);
    if (isOpen) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/90 text-white backdrop-blur-md flex items-center space-x-1 shadow-sm shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>Open Now</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-slate-300 backdrop-blur-md flex items-center space-x-1 shadow-sm shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span>Closed</span>
      </span>
    );
  };

  const renderRatingSummary = (spot: FoodSpot) => {
    const count = spot.reviewCount ?? 0;
    const rating = spot.rating;
    if (count > 0 && rating !== null && rating !== undefined) {
      return (
        <div className="flex items-center space-x-1 text-xs font-bold text-amber-500">
          <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
          <span className="text-slate-900 dark:text-white font-extrabold">
            {rating}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
            · {count} {count === 1 ? "review" : "reviews"}
          </span>
        </div>
      );
    }
    return (
      <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
        No reviews yet
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* 1. Header & New Listing Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
            {t("foodTitle")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
            <ChefHat size={14} className="text-primary mr-1 animate-bounce" />
            <span>{t("foodSubtitle")}</span>
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              router.push("/login?redirect=/foods/add");
              return;
            }
            router.push("/foods/add");
          }}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm shadow-sm hover:shadow transition flex items-center space-x-1.5 cursor-pointer active:scale-98"
        >
          <Plus size={16} />
          <span>New Listing</span>
        </button>
      </div>

      {/* 2. Slim Late Night Banner */}
      <div className="py-4 px-3.5 bg-linear-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-2xl shadow-md border border-indigo-700/50 relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0 relative z-10">
          <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
            <Moon size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-black text-xs text-white leading-tight flex items-center space-x-1.5">
              <span>Late Night Cravings in Avadi?</span>
              <span className="text-[9px] font-bold text-amber-300 bg-amber-400/10 px-1.5 rounded border border-amber-400/30">
                Past 11 PM
              </span>
            </h3>
            <p className="text-[10px] text-indigo-200/80 font-medium truncate">
              24/7 Tea Stalls, 4:00 AM Biryani, &amp; Midnight Ice Creams
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedCategory("Late Night");
            setOpenNowOnly(false);
            setMyFavoritesOnly(false);
          }}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] sm:text-xs shadow-sm transition shrink-0 cursor-pointer ml-2 relative z-10"
        >
          View Spots ➔
        </button>
      </div>

      {/* 3. FEATURE 1: Smart Search Bar */}
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
          placeholder="Search by dish, shop, cuisine, location (e.g. Biryani, Dosa, Paruthipattu)..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 4. Quick Discovery Filter Chips (Open Now, My Ward, My Favorites) */}
      <div className="flex items-center space-x-2 overflow-x-auto -mx-4 px-4 pb-0.5 scrollbar-none">
        {/* Quick Filter: Open Now */}
        <button
          onClick={() => setOpenNowOnly((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            openNowOnly
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              openNowOnly ? "bg-white" : "bg-emerald-500"
            }`}
          />
          <span>Open Now</span>
        </button>

        {/* Quick Filter: My Ward */}
        <button
          onClick={() => setMyWardOnly((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            myWardOnly
              ? "bg-primary border-primary text-white shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/50"
          }`}
        >
          <MapPin size={13} />
          <span>My Ward (Ward {activeWard.id})</span>
        </button>

        {/* Quick Filter: My Favorites */}
        <button
          onClick={() => {
            if (!isAuthenticated && !myFavoritesOnly) {
              toast.error("Please sign in to view your favorite food spots.");
              router.push("/login?redirect=/foods");
              return;
            }
            setMyFavoritesOnly((prev) => !prev);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            myFavoritesOnly
              ? "bg-rose-600 border-rose-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400"
          }`}
        >
          <Heart
            size={13}
            className={
              myFavoritesOnly ? "fill-white text-white" : "text-rose-500"
            }
          />
          <span>My Favorites</span>
          {favoritedShopIds.size > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                myFavoritesOnly
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
              }`}
            >
              {favoritedShopIds.size}
            </span>
          )}
        </button>
      </div>

      {/* 5. Category Chips */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none flex space-x-2">
        {filterCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition duration-200 cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-md scale-[1.02]"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat.renderIcon()}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 6. FEATURE 6: Recently Viewed Horizontal Strip */}
      {recentlyViewedSpots.length > 0 &&
        !searchQuery &&
        selectedCategory === "All" &&
        !myFavoritesOnly &&
        !myWardOnly && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <History size={15} className="text-primary" />
                <span>Recently Viewed</span>
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">
                {recentlyViewedSpots.length} saved
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 pb-2 flex space-x-3 scrollbar-none">
              {recentlyViewedSpots.map((spot) => (
                <div
                  key={`recent-${spot.id}`}
                  onClick={() => handleOpenSpotDetails(spot)}
                  className="w-56 shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer p-0 shadow-xs flex flex-col justify-between"
                >
                  <div className="h-24 overflow-hidden relative">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      {renderOpenStatusBadge(spot)}
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(e, spot)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 active:scale-90 transition"
                      aria-label="Save to favorites"
                    >
                      <Heart
                        size={13}
                        className={
                          favoritedShopIds.has(String(spot.id))
                            ? "fill-rose-500 text-rose-500"
                            : "text-white"
                        }
                      />
                    </button>
                  </div>

                  <div className="p-3 space-y-1">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {spot.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                      {spot.specialty}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      {renderRatingSummary(spot)}
                      <span className="text-[9px] font-bold text-slate-400">
                        Ward {spot.ward}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* 7. Nearby / Ward-Specific Horizontal Strip */}
      {nearbySpots.length > 0 &&
        selectedCategory === "All" &&
        !searchQuery &&
        !myWardOnly &&
        !myFavoritesOnly && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center">
                <MapPin size={15} className="text-primary mr-1" />
                <span>Right Near You (Ward {activeWard.id})</span>
              </h2>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 pb-3 flex space-x-4 scrollbar-none">
              {nearbySpots.map((spot) => (
                <Card
                  key={spot.id}
                  onClick={() => handleOpenSpotDetails(spot)}
                  className="w-64 shrink-0 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer p-0"
                >
                  <div className="h-28 overflow-hidden relative">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      {renderOpenStatusBadge(spot)}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <button
                        onClick={(e) => handleToggleFavorite(e, spot)}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 active:scale-90 transition"
                        aria-label="Save to favorites"
                      >
                        <Heart
                          size={13}
                          className={
                            favoritedShopIds.has(String(spot.id))
                              ? "fill-rose-500 text-rose-500"
                              : "text-white"
                          }
                        />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      {renderDietaryBadge(spot)}
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {spot.name}
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                        {spot.specialty}
                      </p>
                      <div className="pt-0.5">{renderRatingSummary(spot)}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Badge
                        variant="primary"
                        className="text-[9px] w-fit font-black"
                      >
                        Ward {spot.ward} Kitchen
                      </Badge>

                      {spot.isLateNight && (
                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full flex items-center">
                          <Moon size={9} className="mr-0.5" />
                          <span>Late Night</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      {/* 8. Main Food Catalog */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {myFavoritesOnly
              ? "My Favorite Food Spots"
              : myWardOnly
                ? `Eateries in Ward ${activeWard.id}`
                : selectedCategory === "All"
                  ? "All Eateries in Avadi"
                  : `${selectedCategory} Catalog`}
          </h2>

          {(openNowOnly || myWardOnly || myFavoritesOnly || searchQuery) && (
            <button
              onClick={() => {
                setOpenNowOnly(false);
                setMyWardOnly(false);
                setMyFavoritesOnly(false);
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <SkeletonLoader type="card" count={3} />
          ) : filteredSpots.length > 0 ? (
            <motion.div
              key="vertical-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:gap-5 max-w-2xl mx-auto"
            >
              {filteredSpots.map((spot) => {
                const isFavorited = favoritedShopIds.has(String(spot.id));
                return (
                  <Card
                    key={spot.id}
                    onClick={() => handleOpenSpotDetails(spot)}
                    className={`rounded-3xl sm:rounded-[28px] overflow-hidden bg-white dark:bg-slate-900 border transition cursor-pointer p-0 flex flex-col justify-between group shadow-xs hover:shadow-md ${
                      spot.ward === activeWard.id
                        ? "border-orange-500/50 ring-2 ring-orange-500/10"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-orange-400/40"
                    }`}
                  >
                    {/* Top Image Banner */}
                    <div className="h-48 sm:h-56 w-full relative bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-t-3xl sm:rounded-t-[28px]">
                      <img
                        src={spot.imageUrl}
                        alt={spot.name}
                        className="w-full h-full object-cover rounded-t-3xl sm:rounded-t-[28px] group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top-Left: Open Now Badge */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        {renderOpenStatusBadge(spot)}
                        {spot.isLateNight && (
                          <div className="bg-indigo-950/85 backdrop-blur-md border border-indigo-500/40 text-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center shadow-md">
                            <Moon size={11} className="text-amber-300 mr-1" />
                            <span>Late-Night</span>
                          </div>
                        )}
                      </div>

                      {/* Top-Right: Favorite Button & Review Rating */}
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        {/* FEATURE 5: Favorite Action Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, spot)}
                          className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center transition shadow-md hover:scale-110 active:scale-90"
                          title={
                            isFavorited
                              ? "Saved to Favorites"
                              : "Save to Favorites"
                          }
                          aria-label="Save to favorites"
                        >
                          <Heart
                            size={16}
                            className={`transition-colors ${
                              isFavorited
                                ? "fill-rose-500 text-rose-500"
                                : "text-slate-600 dark:text-slate-300 hover:text-rose-500"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom-Left: Dietary Symbol */}
                      <div className="absolute bottom-3 left-3">
                        {renderDietaryBadge(spot)}
                      </div>
                    </div>

                    {/* Card Content Area */}
                    <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {/* Subheading row: Food Type & Ward */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {spot.isLateNight
                              ? "LATE-NIGHT FOOD SPOT"
                              : spot.foodType
                                ? `${spot.foodType.toUpperCase()} EATERIES`
                                : "LOCAL FOOD SPOT"}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            Ward {spot.ward}
                          </span>
                        </div>

                        {/* Shop Name */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                            {spot.name}
                          </h3>
                        </div>

                        {/* FEATURE 2: Rating & Reviews Summary */}
                        <div className="pt-0.5 flex items-center justify-between">
                          {renderRatingSummary(spot)}
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                            {spot.specialty}
                          </span>
                        </div>

                        {/* Timing */}
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center pt-0.5">
                          <Clock
                            size={13}
                            className="text-amber-500 mr-1.5 shrink-0"
                          />
                          <span>{spot.timing || "Open Today"}</span>
                        </p>

                        {/* CUISINES DISPLAY (Requirement 4) */}
                        {spot.cuisines && (
                          <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 overflow-hidden">
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              Cuisines:
                            </span>
                            <span className="truncate text-orange-600 dark:text-orange-400 font-semibold">
                              {spot.cuisines
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </div>
                        )}

                        {/* Popular Items preview if present */}
                        {spot.popularItems && spot.popularItems.length > 0 && (
                          <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 overflow-hidden">
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              Popular:
                            </span>
                            <span className="truncate">
                              {spot.popularItems.slice(0, 3).join(" · ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer: Address & Action */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[55%] flex items-center">
                          <MapPin
                            size={12}
                            className="mr-1 text-slate-400 shrink-0"
                          />
                          <span
                            className="truncate"
                            title={getSpotDisplayLocation(spot)}
                          >
                            {getSpotDisplayLocation(spot)}
                          </span>
                        </span>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSpotDetails(spot);
                            }}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-full transition cursor-pointer"
                          >
                            View Details
                          </button>

                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (spot.phone) {
                                window.location.href = `tel:${spot.phone}`;
                              } else {
                                toast.info(
                                  "Phone number not provided for this eatery.",
                                );
                              }
                            }}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full shadow-xs transition flex items-center space-x-1.5 cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </button>
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
              {searchQuery ? (
                <EmptyState
                  icon={Search}
                  title={`No food listings found for '${searchQuery}'`}
                  description="Try checking for spelling or searching for a different dish or area."
                  actionText="Clear Search"
                  onAction={() => setSearchQuery("")}
                />
              ) : myFavoritesOnly ? (
                <EmptyState
                  icon={Heart}
                  title="No saved food spots yet"
                  description="Click the heart icon on any food shop to save it to your favorites."
                  actionText="Show All Eateries"
                  onAction={() => setMyFavoritesOnly(false)}
                />
              ) : myWardOnly ? (
                <EmptyState
                  icon={MapPin}
                  title={`No food listings found in your ward (Ward ${activeWard.id})`}
                  description="No listings found matching your current filter in this ward."
                  actionText="View All Food Listings"
                  onAction={() => setMyWardOnly(false)}
                />
              ) : openNowOnly ? (
                <EmptyState
                  icon={Clock}
                  title="No eateries currently open"
                  description="Matching eateries are currently closed right now. Check back during opening hours."
                  actionText="Show All Eateries"
                  onAction={() => setOpenNowOnly(false)}
                />
              ) : (
                <EmptyState
                  icon={ChefHat}
                  title={`No ${selectedCategory} spots found`}
                  description="Try clearing search keywords or switching category filters."
                  actionText="Show All Eateries"
                  onAction={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 9. VENDOR DETAIL & REVIEW MODAL */}
      {selectedSpot && (
        <Modal
          isOpen={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          title={selectedSpot.name}
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Modal Image */}
            <div className="h-48 overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-800 relative">
              <img
                src={selectedSpot.imageUrl}
                alt={selectedSpot.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                {renderOpenStatusBadge(selectedSpot)}
                {renderDietaryBadge(selectedSpot)}
              </div>

              {/* Modal Top-Right: Favorite Button */}
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(e, selectedSpot)}
                  className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs flex items-center space-x-1.5 shadow-md hover:scale-105 active:scale-95 transition"
                >
                  <Heart
                    size={14}
                    className={
                      favoritedShopIds.has(String(selectedSpot.id))
                        ? "fill-rose-500 text-rose-500"
                        : "text-white"
                    }
                  />
                  <span>
                    {favoritedShopIds.has(String(selectedSpot.id))
                      ? "Saved"
                      : "Save"}
                  </span>
                </button>
              </div>
            </div>

            {/* Reviews Rating Summary */}
            <div className="flex items-center justify-end pt-1">
              <div>{renderRatingSummary(selectedSpot)}</div>
            </div>

            {/* Opening Hours Info Box */}
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center">
                <Clock
                  size={14}
                  className="mr-1.5 text-indigo-600 dark:text-indigo-400 shrink-0"
                />
                <span>Opening Hours:</span>
              </span>
              <span className="font-black font-mono text-indigo-700 dark:text-indigo-300">
                {selectedSpot.timing || "6:00 PM – 11:00 PM"}
              </span>
            </div>

            {/* Location / Area Info Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center">
                <MapPin size={14} className="mr-1.5 text-primary shrink-0" />
                <span>Location:</span>
              </span>
              <span
                className="font-semibold text-slate-900 dark:text-white truncate max-w-[65%] text-right"
                title={getSpotDisplayLocation(selectedSpot)}
              >
                {getSpotDisplayLocation(selectedSpot)}
              </span>
            </div>

            {/* About / Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                About this Spot
              </h4>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedSpot.description}
              </p>
            </div>

            {/* Popular Items Chips */}
            {selectedSpot.popularItems &&
              selectedSpot.popularItems.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center space-x-1">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Popular Items</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpot.popularItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Menu List if available */}
            {selectedSpot.menu && selectedSpot.menu.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center justify-between">
                  <span>Menu &amp; Prices</span>
                </h4>

                <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
                  {selectedSpot.menu.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        {item.isVeg ? (
                          <VegSymbol className="w-4 h-4" />
                        ) : selectedSpot.foodType === "Ice Cream" ? (
                          <IceCreamSymbol className="w-4 h-4" />
                        ) : (
                          <NonVegSymbol className="w-4 h-4" />
                        )}
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          ₹{item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FEATURE 2: RATINGS & REVIEWS SECTION */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare size={16} className="text-primary" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Ratings &amp; Reviews
                  </h4>
                </div>
                <div>{renderRatingSummary(selectedSpot)}</div>
              </div>

              {/* Review Submission Form / Edit Mode */}
              {!isAuthenticated ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Want to rate this shop? Sign in to share your review.
                  </span>
                  <button
                    onClick={() => router.push(`/login?redirect=/foods`)}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              ) : !userExistingReview ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Rate this Shop *
                  </label>

                  {/* Interactive Star Rating */}
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setInputRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition cursor-pointer text-amber-500"
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
                      {hoverRating || inputRating} / 5
                    </span>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={inputReviewText}
                      onChange={(e) => setInputReviewText(e.target.value)}
                      placeholder="Write your review here (optional)..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </span>
                  </button>
                </form>
              ) : null}

              {/* List of Customer Reviews (Preserves review cards & adds Edit/Delete on own card) */}
              <div className="space-y-2.5">
                {reviewsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                    Loading reviews...
                  </div>
                ) : spotReviews.length > 0 ? (
                  spotReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={
                                star <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 dark:text-slate-600"
                              }
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">
                            {rev.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {rev.reviewText && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          &ldquo;{rev.reviewText}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          — {rev.userName} {rev.isOwn && "(You)"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </div>
            </div>

            {/* Direct Phone Call Button */}
            {selectedSpot.phone && (
              <a
                href={`tel:${selectedSpot.phone}`}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black transition text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Phone size={16} />
                <span>Call {selectedSpot.name}</span>
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
