"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Card,
  Badge,
  Modal,
  EmptyState,
  SkeletonLoader,
} from "@/components/shared-components";
import { useTranslations } from "next-intl";

export interface Place {
  id: number;
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
}

const categories: Category[] = [
  { id: "All", name: "All Spots", icon: Compass },
  { id: "Parks", name: "Parks", icon: Trees },
  { id: "Schools & Colleges", name: "Colleges", icon: GraduationCap },
  { id: "Famous Spots", name: "Famous Spots", icon: Landmark },
  { id: "Temples/Places of Worship", name: "Worship", icon: MapPin },
  { id: "Government Offices", name: "Govt Offices", icon: Map },
];

export const ExploreClient: React.FC<ExploreClientProps> = ({
  initialPlaces,
}) => {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<Record<number, boolean>>(
    {},
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Initial loader simulation when switching categories
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const filteredPlaces = useMemo(() => {
    let list = initialPlaces;

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter((place) => place.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (place) =>
          place.name.toLowerCase().includes(q) ||
          place.description.toLowerCase().includes(q) ||
          place.address.toLowerCase().includes(q),
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
      {/* Header title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
          {t("exploreTitle")}
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
          {t("exploreSubtitle")}
        </p>
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
          placeholder="Search hospitals, places by name or address..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm shadow-sm"
        />
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
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition duration-150 cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-sm"
                  : cat.isHighlighted
                    ? `${cat.color} font-black animate-pulse-subtle`
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50"
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
              const wardNum = place.ward || ((place.id * 4) % 20) + 1;
              const ratingVal =
                place.rating || (4.6 + (place.id % 4) * 0.1).toFixed(1);
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

                    {/* Rating Badge (Top-Right) */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black flex items-center shadow-md">
                        <Star
                          size={12}
                          className="fill-slate-950 text-slate-950 mr-1"
                        />
                        <span>{ratingVal}</span>
                      </span>
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
                    </div>

                    {/* Additional Information */}
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

                    {/* Action Button */}
                    <a
                      href={getDirectionsUrl(place.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-2 py-2.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-600 dark:hover:bg-teal-600 border border-teal-200/80 dark:border-teal-800/80 hover:border-teal-600 text-teal-700 dark:text-teal-300 hover:text-white dark:hover:text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:shadow-teal-500/20 hover:scale-[1.01] group/btn"
                    >
                      <Navigation
                        size={13}
                        className="text-teal-600 dark:text-teal-400 group-hover/btn:text-white transition-colors"
                      />
                      <span>Open in Google Maps</span>
                    </a>
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
            <div className="relative h-48 overflow-hidden rounded-2xl border dark:border-slate-800">
              <img
                src={selectedPlace.imageUrl}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
              {selectedPlace.is24x7 && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                  <ShieldAlert size={12} />
                  24/7 Emergency Services
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant={selectedPlace.is24x7 ? "danger" : "secondary"}
                className="uppercase font-bold"
              >
                {selectedPlace.category}
              </Badge>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                <Clock size={11} className="mr-1" />
                {selectedPlace.timings}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
              {selectedPlace.description}
            </p>

            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-850 flex items-start space-x-2">
              <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                {selectedPlace.address}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedPlace.phone && (
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Phone size={14} />
                  <span>Call Hospital ({selectedPlace.phone})</span>
                </a>
              )}

              <a
                href={getDirectionsUrl(selectedPlace.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm ${
                  !selectedPlace.phone ? "col-span-full" : ""
                }`}
              >
                <Navigation size={14} />
                <span>Get Directions on Google Maps</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
