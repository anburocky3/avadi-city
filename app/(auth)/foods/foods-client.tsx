"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChefHat,
  Star,
  MapPin,
  Search,
  Phone,
  IceCream,
  Clock,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Adjust path aliases to match your project structure
import { useWard } from "@/context/wardContext";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useTranslations } from "next-intl";

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
  rating: number;
  ward: number;
  foodType: "Veg" | "Non-Veg" | "Ice Cream" | string;
  isVeg?: boolean;
  isLateNight?: boolean;
  timing?: string;
  address?: string;
  phone?: string;
  category?: string;
  menu?: MenuItem[];
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
    <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500" />
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
  const { activeWard } = useWard();
  const t = useTranslations();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpot, setSelectedSpot] = useState<FoodSpot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simulatedOrderMessage, setSimulatedOrderMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Filter & Sort Food Spots
  const sortedSpots = useMemo(() => {
    let list = [...initialSpots];

    // Filter Category / Food Type / Late Night
    if (selectedCategory !== "All") {
      if (selectedCategory === "Late Night") {
        list = list.filter((spot) => spot.isLateNight === true);
      } else if (selectedCategory === "Veg") {
        list = list.filter(
          (spot) => spot.foodType === "Veg" || spot.isVeg === true,
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

    // Filter Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (spot) =>
          spot.name.toLowerCase().includes(q) ||
          spot.specialty.toLowerCase().includes(q) ||
          spot.description.toLowerCase().includes(q) ||
          spot.foodType.toLowerCase().includes(q) ||
          (spot.timing && spot.timing.toLowerCase().includes(q)),
      );
    }

    // Sort: Spots in user's active ward come first
    return list.sort((a, b) => {
      const aMatches = a.ward === activeWard.id;
      const bMatches = b.ward === activeWard.id;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [selectedCategory, searchQuery, activeWard.id, initialSpots]);

  // Nearby Ward Spots
  const nearbySpots = useMemo(() => {
    return initialSpots.filter((spot) => spot.ward === activeWard.id);
  }, [activeWard.id, initialSpots]);

  const simulateWhatsAppOrder = (spot: FoodSpot | null, itemName?: string) => {
    if (!spot) return;
    const text = `Hi, I saw your listing for "${spot.name}" on the AVADI CITY App. I would like to order: ${itemName || "items from your menu"}. Please let me know availability!`;
    const encoded = encodeURIComponent(text);
    const phoneNum = spot.phone
      ? spot.phone.replace(/[^0-9]/g, "")
      : "919876543210";
    const link = `https://wa.me/${phoneNum}?text=${encoded}`;

    setSimulatedOrderMessage(
      `Redirecting to WhatsApp to chat with ${spot.name}...`,
    );

    setTimeout(() => {
      window.open(link, "_blank");
      setSimulatedOrderMessage(null);
    }, 1500);
  };

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
        <span className="tracking-wide">ICE CREAM & DESSERT</span>
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
          {t("foodTitle")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
          <ChefHat size={14} className="text-primary mr-1 animate-bounce" />
          <span>{t("foodSubtitle")}</span>
        </p>
      </div>

      {/* Slim & Compact Late Night Banner */}
      <div className="py-5 px-3.5 bg-linear-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-xl shadow-md border border-indigo-700/50 relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0 relative z-10">
          <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
            <Moon size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0 space-y-3">
            <h3 className="font-black text-xs text-white leading-tight flex items-center space-x-1.5 ">
              <span>Late Night Cravings in Avadi?</span>
              <span className="text-[9px] font-bold text-amber-300 bg-amber-400/10 px-1.5 rounded border border-amber-400/30">
                Past 11 PM
              </span>
            </h3>
            <p className="text-[10px] text-indigo-200/80 font-medium truncate">
              24/7 Tea Stalls, 4:00 AM Biryani, & Midnight Ice Creams
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedCategory("Late Night")}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] sm:text-xs shadow-sm transition shrink-0 cursor-pointer ml-2 relative z-10"
        >
          View Spots ➔
        </button>
      </div>

      {/* Search bar */}
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
          placeholder="Search by dish or timing (e.g. Dosa, Biryani, Midnight, 24 Hours)..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Category Chips */}
      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none flex space-x-2">
        {filterCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition duration-150 cursor-pointer flex items-center space-x-1.5 ${
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

      {/* Nearby / Ward-Specific Horizontal Strip */}
      {nearbySpots.length > 0 && selectedCategory === "All" && !searchQuery && (
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
                onClick={() => setSelectedSpot(spot)}
                className="w-64 shrink-0 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 transition cursor-pointer p-0"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={spot.imageUrl}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[9px] font-black flex items-center">
                    <Star
                      size={10}
                      className="fill-amber-400 text-amber-400 mr-0.5"
                    />
                    {spot.rating}
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

                    <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center pt-0.5">
                      <Clock size={10} className="mr-1 shrink-0" />
                      <span className="truncate">
                        {spot.timing || "6:00 PM - 11:00 PM"}
                      </span>
                    </p>
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

      {/* Main Food Catalog */}
      <div className="space-y-3 pt-1">
        <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          {selectedCategory === "All"
            ? "All Eateries in Avadi"
            : `${selectedCategory} Catalog`}
        </h2>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <SkeletonLoader type="card" count={3} />
          ) : sortedSpots.length > 0 ? (
            <motion.div
              key="vertical-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4 sm:gap-5 max-w-2xl mx-auto"
            >
              {sortedSpots.map((spot) => (
                <Card
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className={`rounded-3xl sm:rounded-[28px] overflow-hidden bg-white dark:bg-slate-900 border transition cursor-pointer p-0 flex flex-col justify-between group shadow-sm hover:shadow-md ${
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

                    {spot.isLateNight ? (
                      <div className="absolute top-3 left-3 bg-indigo-950/85 backdrop-blur-md border border-indigo-500/40 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
                        <Moon size={12} className="text-amber-300 mr-1.5" />
                        <span>Late-Night Hub</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3">
                        {renderDietaryBadge(spot)}
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black flex items-center shadow-md">
                      <Star
                        size={12}
                        className="fill-slate-950 text-slate-950 mr-1"
                      />
                      <span>{spot.rating}</span>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-4 sm:p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          {spot.isLateNight
                            ? "LATE-NIGHT FOOD SHOPS"
                            : spot.foodType
                              ? `${spot.foodType.toUpperCase()} EATERIES`
                              : "LOCAL FOOD SHOPS"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          Ward {spot.ward}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {spot.name}
                      </h3>

                      <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                        Specialty: {spot.specialty}
                      </p>

                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center pt-1">
                        <Clock
                          size={13}
                          className="text-amber-500 mr-1.5 shrink-0"
                        />
                        <span>
                          {spot.timing || "06:00 PM - 03:00 AM (Late Night)"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate max-w-[55%] flex items-center">
                        <MapPin
                          size={12}
                          className="mr-1 text-slate-400 shrink-0"
                        />
                        <span className="truncate">
                          {spot.address || `Avadi Main Road, Ward ${spot.ward}`}
                        </span>
                      </span>

                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          simulateWhatsAppOrder(spot);
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Phone size={13} />
                        <span>Call Shop</span>
                      </button>
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
                icon={ChefHat}
                title={`No ${selectedCategory} spots found`}
                description="Try clearing search keywords or switching category filters."
                actionText="Show All Eateries"
                onAction={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* VENDOR DETAIL MODAL */}
      {selectedSpot && (
        <Modal
          isOpen={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          title={selectedSpot.name}
        >
          <div className="space-y-4">
            <div className="h-44 overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-800 relative">
              <img
                src={selectedSpot.imageUrl}
                alt={selectedSpot.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2">
                {renderDietaryBadge(selectedSpot)}
              </div>

              {selectedSpot.isLateNight && (
                <div className="absolute top-2 right-2 bg-indigo-950/90 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center shadow-md">
                  <Moon size={11} className="mr-1" />
                  <span>Late Night Open Spot</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Badge
                  variant="primary"
                  className="uppercase font-black text-xs"
                >
                  Ward {selectedSpot.ward} Local Kitchen
                </Badge>
              </div>
              <div className="flex items-center text-xs font-black text-amber-500">
                <Star
                  size={14}
                  className="fill-amber-400 text-amber-400 mr-1"
                />
                <span>{selectedSpot.rating} (Verified Reviews)</span>
              </div>
            </div>

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

            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              {selectedSpot.description}
            </p>

            {/* Menu List */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center justify-between">
                <span>Menu & Prices (Order Direct)</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                  Commission Free
                </span>
              </h4>

              <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
                {(selectedSpot.menu || []).map((item) => (
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
                      <button
                        onClick={() =>
                          simulateWhatsAppOrder(selectedSpot, item.name)
                        }
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {simulatedOrderMessage ? (
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-2 border-teal-300 dark:border-teal-700 rounded-2xl text-center flex items-center justify-center space-x-2 text-xs font-black animate-pulse">
                <span>{simulatedOrderMessage}</span>
              </div>
            ) : (
              <button
                onClick={() => simulateWhatsAppOrder(selectedSpot)}
                className="w-full py-4 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-black transition text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Phone size={16} />
                <span>Order via WhatsApp Direct (No Fee)</span>
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
