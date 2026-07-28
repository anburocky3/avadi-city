"use client";

import React, { useState, useMemo, ChangeEvent, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Heart,
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Send,
  MapPin,
  Globe,
  Share2,
  Compass,
  AlertCircle,
  Clock,
  Newspaper,
  X,
  ThumbsUp,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Check,
  MoreVertical,
  Edit3,
  Trash2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useToast from "@/hooks/useToast";

import { useWard, Feed as FeedData } from "@/context/wardContext";
import { Card, Modal, EmptyState } from "@/components/shared-components";

export interface Complaint {
  id: number | string;
  title: string;
  description: string;
  category: string;
  ward: string | number;
  status: "Resolved" | "In Progress" | "Acknowledged" | string;
  imageUrl?: string;
  upvotes: number;
  author?: string;
}

export type FeedMode =
  | "all-avadi"
  | "general"
  | "news"
  | "complaints"
  | "blood-feed"
  | "my-ward";

export type FeedVisibility = "within-ward" | "entire-avadi";
export type FeedCategory =
  | "General"
  | "News"
  | "Complaint"
  | "Blood Request"
  | "Announcement";

const validateAndCompressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.75,
): Promise<string> => {
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (
    !ALLOWED_MIME_TYPES.includes(file.type) ||
    !ALLOWED_EXTENSIONS.includes(ext)
  ) {
    throw new Error(
      "Security Alert: Only standard image formats (JPG, PNG, WebP) are allowed.",
    );
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File is too large. Please upload an image under 15MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to initialize image processor."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = () => reject(new Error("Corrupted image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
  });
};

export const FeedPage: React.FC = () => {
  const {
    authUser,
    activeWard,
    feeds,
    isLoadingFeeds,
    addFeed,
    likeFeed,
    addCommentToFeed,
    complaints,
    upvoteComplaint,
    refreshFeeds,
  } = useWard();

  const toast = useToast();

  // --- STATES ---
  const [feedMode, setFeedMode] = useState<FeedMode>("all-avadi");
  const [selectedFeed, setSelectedFeed] = useState<FeedData | null>(null);

  // Create / Edit Modal State
  const [isFeedModalOpen, setIsFeedModalOpen] = useState<boolean>(false);
  const [editingFeed, setEditingFeed] = useState<FeedData | null>(null);
  const [feedText, setFeedText] = useState<string>("");
  const [feedCategory, setFeedCategory] = useState<FeedCategory>("General");
  const [feedVisibility, setFeedVisibility] =
    useState<FeedVisibility>("entire-avadi");

  // Image Upload State
  const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Actions Dropdown & Deletion State
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(
    null,
  );
  const [isDeletingId, setIsDeletingId] = useState<string | number | null>(
    null,
  );

  // Comment State
  const [commentText, setCommentText] = useState<string>("");
  const [copiedFeedId, setCopiedFeedId] = useState<string | number | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // --- HELPERS ---
  const getRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return "Just now";
    const diffMs = new Date().getTime() - new Date(timestamp).getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const getFeedCategory = (feed: FeedData): string => {
    if (feed.category) {
      const dbCat = feed.category.trim().toLowerCase();
      if (dbCat === "general") return "General";
      if (dbCat === "news") return "News";
      if (dbCat === "complaint") return "Complaint";
      if (dbCat === "blood request" || dbCat === "emergency")
        return "Blood Request";
      if (dbCat === "announcement") return "Announcement";
      return feed.category;
    }
    if (feed.isEmergency) return "Blood Request";
    const text = (feed.text || "").toLowerCase();
    if (
      text.includes("blood") ||
      text.includes("donation") ||
      text.includes("🩸")
    )
      return "Blood Request";
    if (text.includes("complaint") || text.includes("civic"))
      return "Complaint";
    if (text.includes("traffic") || text.includes("news")) return "News";
    return "General";
  };

  const getCategoryBadgeStyle = (category: string): string => {
    switch (category) {
      case "General":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/60";
      case "News":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60";
      case "Blood Request":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60";
      case "Complaint":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60";
      case "Announcement":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  // --- FILTERING ---
  const filteredFeeds = useMemo<FeedData[]>(() => {
    let list = feeds as FeedData[];
    if (feedMode === "my-ward") {
      list = list.filter(
        (f) =>
          parseInt(f.ward, 10) === activeWard.id ||
          f.ward === "all" ||
          f.ward === "avadi",
      );
    } else if (feedMode === "general") {
      list = list.filter((f) =>
        ["general", "announcement"].includes(getFeedCategory(f).toLowerCase()),
      );
    } else if (feedMode === "news") {
      list = list.filter(
        (f) =>
          getFeedCategory(f).toLowerCase() === "news" ||
          (f.text || "").toLowerCase().includes("news"),
      );
    } else if (feedMode === "blood-feed") {
      list = list.filter(
        (f) =>
          f.isEmergency ||
          getFeedCategory(f).toLowerCase() === "blood request" ||
          (f.text || "").includes("🩸"),
      );
    }
    return list;
  }, [feeds, feedMode, activeWard.id]);

  const paginatedFeeds = useMemo(
    () => filteredFeeds.slice(0, visibleCount),
    [filteredFeeds, visibleCount],
  );

  // --- HANDLERS ---
  const openCreateModal = () => {
    setEditingFeed(null);
    setFeedText("");
    setFeedCategory("General");
    setFeedVisibility("entire-avadi");
    setFeedImagePreview(null);
    setUploadError(null);
    setIsFeedModalOpen(true);
  };

  const openEditModal = (feed: FeedData) => {
    setEditingFeed(feed);
    setFeedText(feed.text || "");
    setFeedCategory((getFeedCategory(feed) as FeedCategory) || "General");
    setFeedVisibility(
      feed.ward === "all" || feed.ward === "avadi"
        ? "entire-avadi"
        : "within-ward",
    );
    setFeedImagePreview(feed.imageUrl || null);
    setUploadError(null);
    setActiveMenuId(null);
    setIsFeedModalOpen(true);
  };

  const handleDeleteFeed = async (feedId: string | number) => {
    if (
      !confirm(
        "Are you sure you want to delete this post and its image permanently?",
      )
    )
      return;
    setIsDeletingId(feedId);
    setActiveMenuId(null);
    try {
      const res = await fetch(`/api/feeds/${feedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete feed");
      await refreshFeeds();
      toast.success("Post deleted");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete post. Please try again.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    setUploadError(null);
    try {
      const compressedDataUrl = await validateAndCompressImage(file);
      setFeedImagePreview(compressedDataUrl);
    } catch (error: any) {
      setUploadError(error.message || "Failed to process image.");
      setFeedImagePreview(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFormSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedText.trim() && !feedImagePreview) return;
    if (isCompressing || uploadError || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingFeed) {
        // UPDATE MODE: Strictly ignore imageUrl changes
        const res = await fetch(`/api/feeds/${editingFeed.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: feedText,
            category: feedCategory,
            ward:
              feedVisibility === "entire-avadi"
                ? "all"
                : activeWard.id.toString(),
            isEmergency: feedCategory === "Blood Request",
          }),
        });
        if (!res.ok) throw new Error("Failed to update post");
        await refreshFeeds();
        toast.success("Post updated");
      } else {
        // CREATE MODE
        await addFeed({
          authorId: authUser?.id,
          authorName: authUser?.name || "Avadi Resident",
          authorAvatar: authUser?.avatar || "/default-avatar.png",
          ward:
            feedVisibility === "entire-avadi"
              ? "all"
              : activeWard.id.toString(),
          text: feedText,
          imageUrl: feedImagePreview,
          category: feedCategory,
          isEmergency: feedCategory === "Blood Request",
          likes: 0,
          likedByMe: false,
          comments: [],
        });
        toast.success("Posted to feed");
      }
      setIsFeedModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (feed: FeedData) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/feed/${feed.id}`;
    const shareTitle = `Avadi City • Ward ${feed.ward} Update by ${feed.authorName}`;
    const shareText =
      feed.text.length > 120 ? `${feed.text.substring(0, 120)}...` : feed.text;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n\nRead more:`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError")
          console.error("Share error:", err);
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${shareTitle}\n\n"${shareText}"\n\n🔗 ${shareUrl}`,
        );
        setCopiedFeedId(feed.id);
        setTimeout(() => setCopiedFeedId(null), 2500);
      } catch (err) {
        console.error("Clipboard failed:", err);
      }
    }
  };

  const tabs = [
    {
      id: "all-avadi",
      label: "All Avadi",
      icon: Globe,
      color: "text-teal-500",
    },
    {
      id: "general",
      label: "General",
      icon: MessageCircle,
      color: "text-teal-600 dark:text-teal-400",
    },
    { id: "news", label: "News", icon: Newspaper, color: "text-indigo-500" },
    {
      id: "complaints",
      label: "Complaints",
      icon: AlertCircle,
      color: "text-amber-500",
    },
    {
      id: "blood-feed",
      label: "SOS Blood",
      icon: Heart,
      color: "text-rose-600 fill-rose-600",
    },
    {
      id: "my-ward",
      label: `Ward ${activeWard.id}`,
      icon: MapPin,
      color: "text-orange-500",
    },
  ];

  const categoryConfigs: { id: FeedCategory; label: string; icon: string }[] = [
    { id: "General", label: "General", icon: "💬" },
    { id: "News", label: "News", icon: "📰" },
    { id: "Complaint", label: "Complaint", icon: "⚠️" },
    { id: "Blood Request", label: "Blood Request", icon: "🩸" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 sm:pb-12 relative">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Neighborhood Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Share local updates, see civic news, and connect with people in your
            ward.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>New Feed</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto scrollbar-none max-w-full gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = feedMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFeedMode(tab.id as FeedMode)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "text-slate-900 dark:text-white font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="feedTabIndicator"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon size={14} className={tab.color} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Feed Display Area */}
      <AnimatePresence mode="wait">
        {paginatedFeeds.length > 0 ? (
          <div className="space-y-4 mb-10">
            {paginatedFeeds.map((feed) => {
              const isAuthor =
                authUser?.id === feed.authorId ||
                authUser?.name === feed.authorName;

              // Dynamic SEO descriptive alt tags
              const avatarAlt = `Profile photo of Avadi Ward ${feed.ward} resident ${feed.authorName}`;
              const imageAlt = `${getFeedCategory(feed)} update in Avadi Ward ${feed.ward} by ${feed.authorName}: ${feed.text ? feed.text.slice(0, 50).replace(/\n/g, " ") : "attachment"}...`;

              return (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`p-4 sm:p-5 transition-all duration-300 shadow-xs relative ${
                      feed.isEmergency
                        ? "bg-rose-500/5 dark:bg-rose-950/10 border-2 border-rose-500/30"
                        : "border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {/* Emergency Badge (Unchanged) */}
                    {feed.isEmergency && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider mb-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500"></span>
                          </span>
                          <span>🩸 Urgent Blood Request</span>
                        </div>
                        <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
                          Live Alert
                        </span>
                      </div>
                    )}
                    {/* 🟢 MODERNIZED AUTHOR HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0 flex-1">
                        {/* Clickable Avatar */}
                        <button
                          type="button"
                          className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 transition active:scale-95 bg-slate-100 dark:bg-slate-800"
                        >
                          <Image
                            src={feed.authorAvatar || "/default-avatar.png"}
                            alt={avatarAlt}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </button>

                        {/* Identity & Minimalist Metadata */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          {/* Line 1: Name, Verification, Timestamp */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate hover:underline cursor-pointer text-left"
                            >
                              {feed.authorName}
                            </button>

                            {(feed as any).isAuthorVerified && (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-500 shrink-0 fill-emerald-500/10"
                              />
                            )}

                            <span className="text-slate-300 dark:text-slate-700 select-none font-bold">
                              ·
                            </span>

                            <span className="text-xs text-slate-400 dark:text-slate-500 font-normal shrink-0">
                              {getRelativeTime(feed.timestamp)}
                            </span>
                          </div>

                          {/* Line 2: Visibility (Public vs Ward), Street Hint, and Subtle Category */}
                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium select-none">
                            {/* Visibility Indicator */}
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                              {feed.ward === "all" || feed.ward === "avadi" ? (
                                <>
                                  <Globe
                                    size={11}
                                    className="text-teal-500 shrink-0"
                                  />
                                  <span>Public</span>
                                </>
                              ) : (
                                <>
                                  <MapPin
                                    size={11}
                                    className="text-orange-500 shrink-0"
                                  />
                                  <span>Ward {feed.ward}</span>
                                </>
                              )}
                            </span>

                            {/* Street Location Hint */}
                            {(feed as any).authorStreet && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">
                                  ·
                                </span>
                                <span className="truncate max-w-36 text-slate-400 dark:text-slate-500">
                                  {(feed as any).authorStreet}
                                </span>
                              </>
                            )}

                            <span className="text-slate-300 dark:text-slate-700">
                              ·
                            </span>

                            {/* Subtle Category Tag */}
                            <span className="text-primary dark:text-orange-400 font-semibold">
                              #{getFeedCategory(feed)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Author Actions Menu (Edit/Delete) */}
                      {isAuthor && (
                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === feed.id ? null : feed.id,
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            aria-label="Feed actions"
                          >
                            {isDeletingId === feed.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin text-rose-500"
                              />
                            ) : (
                              <MoreVertical size={16} />
                            )}
                          </button>

                          {activeMenuId === feed.id && (
                            <>
                              {/* 🟢 1. INVISIBLE BACKDROP OVERLAY */}
                              {/* Catches any click outside the menu and closes it immediately */}
                              <div
                                className="fixed inset-0 z-10 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevents clicking through to cards underneath
                                  setActiveMenuId(null);
                                }}
                              />

                              {/* 🟢 2. DROPDOWN MENU (Sat at z-20 above the backdrop) */}
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 text-xs font-bold animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null); // Close menu when option is clicked
                                    openEditModal(feed);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-left cursor-pointer"
                                >
                                  <Edit3
                                    size={14}
                                    className="text-indigo-500"
                                  />
                                  <span>Edit Post</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null); // Close menu when option is clicked
                                    handleDeleteFeed(feed.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition text-left cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Feed Text */}
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-300 leading-relaxed mt-3 whitespace-pre-line font-normal">
                      {feed.text}
                    </p>
                    {/* Media Attachment */}
                    {feed.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative shadow-2xs">
                        <Image
                          src={feed.imageUrl}
                          alt={imageAlt}
                          fill
                          sizes="(max-width: 768px) 100vw, 672px"
                          className="object-cover hover:scale-[1.01] transition-transform duration-300 ease-out"
                        />
                      </div>
                    )}
                    {/* 🟢 MODERNIZED AIRY FOOTER */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-2.5 -mb-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            likeFeed(feed.id);
                            // optimistic feedback
                            if (feed.likedByMe) toast.info("Removed like");
                            else toast.success("Liked post");
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition active:scale-95 ${
                            feed.likedByMe
                              ? "text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/30 font-bold"
                              : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Heart
                            size={16}
                            fill={feed.likedByMe ? "currentColor" : "none"}
                            className={feed.likedByMe ? "text-rose-600" : ""}
                          />
                          <span>{feed.likes > 0 ? feed.likes : ""}</span>
                        </button>

                        <button
                          onClick={() => setSelectedFeed(feed)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition cursor-pointer active:scale-95"
                        >
                          <MessageSquare size={16} />
                          <span>
                            {feed.comments.length > 0
                              ? `${feed.comments.length} Comments`
                              : "Comment"}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShare(feed)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer active:scale-95"
                        title="Share feed"
                      >
                        {copiedFeedId === feed.id ? (
                          <Check size={16} className="text-emerald-500" />
                        ) : (
                          <Share2 size={16} />
                        )}
                      </button>
                    </div>
                    {feed.comments && feed.comments.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                        {/* Shows up to 3 most recent comments */}
                        {feed.comments
                          .slice(-3)
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp).getTime() -
                              new Date(a.timestamp).getTime(),
                          )
                          .map((comment: any) => (
                            <div
                              key={comment.id}
                              className="flex items-start gap-2 text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
                            >
                              {/* Commenter Avatar */}
                              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 mt-0.5">
                                <Image
                                  src={
                                    comment.authorAvatar ||
                                    "/default-avatar.png"
                                  }
                                  alt={comment.author}
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                    {comment.author}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {getRelativeTime(comment.timestamp)}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 font-normal leading-snug break-words mt-0.5">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}

                        {/* "View All Comments" link if there are more than 3 */}
                        {feed.comments.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setSelectedFeed(feed)}
                            className="text-[11px] font-bold text-primary hover:underline pl-1 cursor-pointer block"
                          >
                            View all {feed.comments.length} comments →
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}

            {filteredFeeds.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 transition cursor-pointer text-center shadow-xs"
              >
                Load More Feeds
              </button>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Compass}
            title={`No feeds in Ward ${activeWard.id} yet`}
            description="Be the first one to share updates or ask queries!"
            actionText="Create First Feed"
            onAction={openCreateModal}
          />
        )}
      </AnimatePresence>

      {/* 4. Mobile FAB */}
      <button
        onClick={openCreateModal}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
        aria-label="Create New Feed"
      >
        <Plus size={26} className="stroke-[2.5]" />
      </button>

      {/* 5. CREATE & EDIT FEED MODAL */}
      <Modal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        title={editingFeed ? "Edit Feed Post" : "Create Community Feed"}
      >
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col min-h-[60dvh] max-h-[90dvh] space-y-5"
        >
          <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="w-11 h-11 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
              {feedVisibility === "entire-avadi" ? "🌐" : `W${activeWard.id}`}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-sm font-black text-slate-900 dark:text-white block truncate">
                {feedVisibility === "entire-avadi"
                  ? "Broadcasting to All Avadi"
                  : `Posting in ${activeWard.name}`}
              </span>
              <select
                value={feedVisibility}
                onChange={(e) => setFeedVisibility(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] py-1 pl-2.5 pr-6 rounded-lg cursor-pointer border border-slate-200/60"
              >
                <option value="within-ward">📍 Ward-Exclusive Feed</option>
                <option value="entire-avadi">🌐 All Avadi Broadcast</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
            {/* Category Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Select Category:
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryConfigs.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      feedCategory === cat.id
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-extrabold"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={feedText}
              onChange={(e) => setFeedText(e.target.value)}
              rows={5}
              required={!feedImagePreview}
              placeholder="What's happening in your neighborhood?"
              className="w-full p-4 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-900 dark:text-white placeholder-slate-400 resize-none min-h-35"
            />

            {/* ERROR / COMPRESSION FEEDBACK */}
            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                <ShieldAlert size={16} />
                <span>{uploadError}</span>
              </div>
            )}
            {isCompressing && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 text-xs font-bold">
                <Loader2 size={16} className="animate-spin text-orange-500" />
                <span>Sanitizing & compressing photo...</span>
              </div>
            )}

            {/* IMAGE PREVIEW & STRICT EDIT LOCK UX */}
            {feedImagePreview && !isCompressing && (
              <div className="space-y-2">
                {editingFeed ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                    <Lock
                      size={16}
                      className="shrink-0 mt-0.5 text-amber-600"
                    />
                    <span>
                      Photos cannot be replaced during edits. To change the
                      photo, please delete this post and publish a new one.
                    </span>
                  </div>
                ) : null}

                <div className="relative rounded-2xl overflow-hidden max-h-56 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <img
                    src={feedImagePreview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  {!editingFeed && (
                    <button
                      type="button"
                      onClick={() => setFeedImagePreview(null)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {editingFeed ? (
              <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
                <Lock size={14} />
                <span>Image editing locked</span>
              </span>
            ) : (
              <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition">
                <ImageIcon size={18} className="text-teal-600" />
                <span>
                  {feedImagePreview ? "Change Photo" : "Attach Photo"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  disabled={isCompressing || !!editingFeed}
                  className="sr-only"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={
                (!feedText.trim() && !feedImagePreview) ||
                isCompressing ||
                !!uploadError ||
                isSubmitting
              }
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>{editingFeed ? "Save Changes" : "Post Now"}</span>
            </button>
          </div>
        </form>
      </Modal>
      {/* 🟢 MODERNIZED FEED DISCUSSION & COMMENTS MODAL */}
      {selectedFeed && (
        <Modal
          isOpen={!!selectedFeed}
          onClose={() => setSelectedFeed(null)}
          title="Feed Discussion"
        >
          <div className="space-y-5">
            {/* Emergency Alert Banner */}
            {selectedFeed.isEmergency && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider select-none">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-500"></span>
                  </span>
                  <span>🩸 Urgent Blood Request</span>
                </div>
                <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
                  Live Alert
                </span>
              </div>
            )}

            {/* 1. MAIN POST REPLICATION */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={selectedFeed.authorAvatar || "/default-avatar.png"}
                    alt={selectedFeed.authorName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {selectedFeed.authorName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 font-bold">
                      ·
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      {getRelativeTime(selectedFeed.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                      {selectedFeed.ward === "all" ||
                      selectedFeed.ward === "avadi" ? (
                        <>
                          <Globe size={11} className="text-teal-500 shrink-0" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <MapPin
                            size={11}
                            className="text-orange-500 shrink-0"
                          />
                          <span>Ward {selectedFeed.ward}</span>
                        </>
                      )}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-primary dark:text-orange-400 font-semibold">
                      #{getFeedCategory(selectedFeed)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal pl-1">
                {selectedFeed.text}
              </p>

              {/* Modal Image Attachment */}
              {selectedFeed.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative shadow-2xs mt-2">
                  <Image
                    src={selectedFeed.imageUrl}
                    alt="Feed media"
                    fill
                    sizes="(max-width: 640px) 100vw, 500px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Stats & Share Divider */}
              <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-2.5 flex items-center justify-between text-xs text-slate-500 font-bold">
                <div className="flex items-center space-x-4">
                  <span>❤️ {selectedFeed.likes} Likes</span>
                  <span>💬 {selectedFeed.comments.length} Comments</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShare(selectedFeed)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                  {copiedFeedId === selectedFeed.id ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Copied Link!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Share Feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. COMMENTS THREAD (Sorted Newest First & Compact Horizontal Layout) */}
            <div className="space-y-3 max-h-[44vh] sm:max-h-80 overflow-y-auto pr-1.5 scrollbar-thin py-0.5">
              {selectedFeed.comments && selectedFeed.comments.length > 0 ? (
                /* 👇 Sort descending: Newest comments jump to the top */
                [...selectedFeed.comments]
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  )
                  .map((comment: any) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Left Column: Avatar */}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                        <Image
                          src={comment.authorAvatar || "/default-avatar.png"}
                          alt={comment.author}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>

                      {/* Right Column: Name, Time, and Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {comment.author}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                            {getRelativeTime(comment.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal mt-1 wrap-break-word">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No comments yet. Be the first to start the conversation! 👇
                </div>
              )}
            </div>

            {/* 3. STICKY COMMENT SUBMISSION FORM */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim() || !selectedFeed) return;

                await addCommentToFeed(selectedFeed.id, commentText);

                setCommentText("");
                setSelectedFeed(null); // Closes modal
                toast.success("Comment posted");
              }}
              className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80"
            >
              {/* User Avatar next to Input */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 hidden sm:block">
                <Image
                  src={authUser?.avatar || "/default-avatar.png"}
                  alt="My Avatar"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>

              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition"
              />

              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white disabled:opacity-50 shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                title="Send comment"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FeedPage;
