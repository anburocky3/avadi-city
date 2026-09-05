"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Image as ImageIcon,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

// --- TYPES ---
export interface FeedPostProps {
  feed: {
    id: string;
    text: string;
    imageUrl?: string | null;
    timestamp: Date | string;
    likesCount: number;
    author: {
      name: string;
      avatar?: string;
    };
    complaint?: {
      issueId: string;
      title: string;
      description: string;
      category: string;
      subCategory: string;
      status: string;
      address: string;
      lat: number;
      lng: number;
      upvotes: number;
      imageUrls?: string[] | null;
    } | null;
  };
  onUpvote: (feedId: string, complaintId?: string) => void;
  onComment: (feedId: string) => void;
  onShare: (feedId: string) => void;
}

// --- STATIC FEED MAP COMPONENT ---
const FeedStaticMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      mapRef.current &&
      !mapInstance.current
    ) {
      const L = require("leaflet");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: false, // Keeps it from panning when scrolling down the feed
        scrollWheelZoom: false, // Keeps desktop scroll clean
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: true, // <-- Enabled pinch-to-zoom for mobile
        attributionControl: false, // <-- Removes the Leaflet watermark
      }).setView([lat, lng], 15);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {},
      ).addTo(map);

      L.marker([lat, lng]).addTo(map);
      mapInstance.current = map;

      // FIX: Double-Failsafe to ensure Leaflet renders all tiles properly within CSS Grid
      const observer = new ResizeObserver(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      });
      observer.observe(mapRef.current);

      // Force recalculation after layout paints
      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 100);
      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 500);

      return () => {
        observer.disconnect();
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    }
  }, [lat, lng]);

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-800">
      <div ref={mapRef} className="w-full h-full z-0" />
      {/* Read-only overlay to prevent scroll interference */}
      <div className="absolute inset-0 z-10 bg-transparent" />
    </div>
  );
};

export default function ComplaintFeedCard({
  feed,
  onUpvote,
  onComment,
  onShare,
}: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const complaint = feed.complaint;

  // Slider & Lightbox State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Combine image sources safely
  const images =
    complaint?.imageUrls && complaint.imageUrls.length > 0
      ? complaint.imageUrls
      : feed.imageUrl
        ? [feed.imageUrl]
        : [];

  // Auto-Slider Logic
  useEffect(() => {
    if (images.length <= 1 || isHovered || lightboxIndex !== null) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [images.length, isHovered, lightboxIndex]);

  // Derive Status Config
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return {
          color: "text-amber-500",
          bg: "bg-amber-500/10 border-amber-500/20",
          icon: Clock,
        };
      case "in progress":
        return {
          color: "text-blue-500",
          bg: "bg-blue-500/10 border-blue-500/20",
          icon: Wrench,
        };
      case "resolved":
        return {
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          icon: CheckCircle2,
        };
      default:
        return {
          color: "text-slate-500",
          bg: "bg-slate-500/10 border-slate-500/20",
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = complaint
    ? getStatusConfig(complaint.status)
    : getStatusConfig("submitted");
  const StatusIcon = statusConfig.icon;

  const handleLike = () => {
    setIsLiked(!isLiked);
    onUpvote(feed.id, complaint?.issueId);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* 1. HEADER: Author & Context */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-sm overflow-hidden shrink-0">
              {feed.author.avatar ? (
                <img
                  src={feed.author.avatar}
                  alt={feed.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                feed.author.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {feed.author.name}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Reported an Issue •{" "}
                {new Date(feed.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* 2. COMPLAINT DETAILS WIDGET */}
        {complaint && (
          <div className="px-4 sm:px-5 pb-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              {/* Top Section: Grid Split for Text (2/3) and Map (1/3) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 sm:p-5 items-stretch">
                {/* Left Side: Content */}
                <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between md:justify-start gap-3 mb-3">
                      <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500 text-xs font-black font-mono tracking-wide">
                        {complaint.issueId}
                      </span>
                      <span
                        className={`px-3 py-1.5 rounded-lg border text-xs font-black flex items-center gap-1.5 uppercase tracking-wide ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        <StatusIcon size={14} />
                        {complaint.status}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {complaint.description}
                      </p>
                    </div>
                  </div>

                  {/* Address Pill */}
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-auto">
                    <MapPin size={18} className="text-rose-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                      {complaint.address}
                    </span>
                  </div>
                </div>

                {/* Right Side: Responsive Map Link */}
                {complaint.lat && complaint.lng && (
                  <div className="md:col-span-1 relative w-full h-48 md:h-auto min-h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
                    <a
                      href={`https://www.google.com/maps?q=${complaint.lat},${complaint.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 w-full h-full block cursor-pointer"
                    >
                      <FeedStaticMap lat={complaint.lat} lng={complaint.lng} />

                      {/* Interactive Map Overlay */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors">
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                          Open in Maps
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Bottom Section: Auto-Sliding Image Gallery */}
              {images.length > 0 && (
                <div
                  className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative h-56 sm:h-72 overflow-hidden cursor-pointer group"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={() => setLightboxIndex(currentIndex)}
                >
                  <motion.div
                    className="flex w-full h-full"
                    animate={{ x: `-${currentIndex * 100}%` }}
                    transition={{
                      type: "tween",
                      ease: "easeInOut",
                      duration: 0.4,
                    }}
                  >
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-full h-full flex-shrink-0 relative"
                      >
                        <img
                          src={img}
                          alt={`Complaint Evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Hover Overlay Hint */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                          <div className="bg-slate-900/60 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity scale-95 group-hover:scale-100">
                            Click to expand
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Image Counter Badge */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur-md border border-white/10 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10">
                      <ImageIcon size={12} />
                      {currentIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Manual Controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(
                            (prev) =>
                              (prev - 1 + images.length) % images.length,
                          );
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex((prev) => (prev + 1) % images.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/50 hover:bg-slate-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. FOOTER ACTIONS */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1.5 sm:space-x-2 text-sm font-bold transition-colors active:scale-95 ${
                isLiked
                  ? "text-primary"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isLiked ? "bg-orange-500/10" : "bg-transparent"}`}
              >
                <ThumbsUp size={18} className={isLiked ? "fill-primary" : ""} />
              </div>
              <span>{feed.likesCount + (isLiked ? 1 : 0)} Upvotes</span>
            </button>

            <button
              onClick={() => onComment(feed.id)}
              className="flex items-center space-x-1.5 sm:space-x-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors active:scale-95"
            >
              <div className="p-1.5 sm:p-2 rounded-xl bg-transparent">
                <MessageSquare size={18} />
              </div>
              <span className="hidden sm:inline">Discuss</span>
            </button>
          </div>

          <button
            onClick={() => onShare(feed.id)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors active:scale-95 shadow-sm"
          >
            <Share2 size={18} />
          </button>
        </div>
      </motion.div>

      {/* --- FULLSCREEN LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* 1. Explicit Clickable Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
              onClick={() => setLightboxIndex(null)}
            />

            {/* 2. Close Button (Needs relative z-index to sit above backdrop) */}
            <button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={24} />
            </button>

            {/* 3. Main Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={images[lightboxIndex]}
              alt="Fullscreen Evidence"
              className="w-11/12 h-5/6 object-contain rounded-xl shadow-2xl relative z-10 cursor-default"
              onClick={(e) => e.stopPropagation()} // Extra safety to prevent clicks on the image from closing it
            />

            {/* 4. Navigation Controls */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 sm:left-8 text-white p-4 bg-slate-900/50 hover:bg-slate-900/80 rounded-full transition-colors z-10 backdrop-blur-sm border border-white/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(
                      (prev) => (prev! - 1 + images.length) % images.length,
                    );
                  }}
                >
                  <ArrowLeft size={28} />
                </button>
                <button
                  className="absolute right-4 sm:right-8 text-white p-4 bg-slate-900/50 hover:bg-slate-900/80 rounded-full transition-colors z-10 backdrop-blur-sm border border-white/10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev! + 1) % images.length);
                  }}
                >
                  <ArrowRight size={28} />
                </button>

                {/* Lightbox Counter Badge */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg z-10 pointer-events-none">
                  {lightboxIndex + 1} / {images.length}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
