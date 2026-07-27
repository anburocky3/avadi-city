"use client";

import React, {
  useState,
  useMemo,
  ChangeEvent,
  FormEvent,
  SubmitEvent,
} from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Adjust path aliases according to your Next.js project structure
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

// --- NATIVE IMAGE COMPRESSION & SECURITY HELPER ---
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
      "Security Alert: Only standard image formats (JPG, PNG, WebP) are allowed. SVGs and executable scripts are blocked.",
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
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () =>
        reject(new Error("Corrupted or unreadable image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read file from disk."));
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
  } = useWard();

  const router = useRouter();

  const getRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const feedDate = new Date(timestamp);
    const diffMs = now.getTime() - feedDate.getTime();
    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return feedDate.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // --- ROBUST CATEGORY NORMALIZER ---
  const getFeedCategory = (feed: FeedData): string => {
    // 1. Normalize existing DB category strings (handles case & legacy terms)
    if (feed.category) {
      const dbCat = feed.category.trim().toLowerCase();
      if (dbCat === "general" || dbCat === "general") return "General";
      if (dbCat === "news") return "News";
      if (dbCat === "complaint") return "Complaint";
      if (dbCat === "blood request" || dbCat === "emergency")
        return "Blood Request";
      if (dbCat === "announcement") return "Announcement";
      return feed.category;
    }

    if (feed.isEmergency) return "Blood Request";

    // 2. Keyword fallback for uncategorized posts
    const text = feed.text ? feed.text.toLowerCase() : "";
    if (
      text.includes("blood") ||
      text.includes("donation") ||
      text.includes("o-ve") ||
      text.includes("o-positive") ||
      text.includes("donor") ||
      text.includes("🩸")
    )
      return "Blood Request";
    if (
      text.includes("emergency") ||
      text.includes("urgent") ||
      text.includes("sos") ||
      text.includes("critical")
    )
      return "Blood Request";
    if (
      text.includes("complaint") ||
      text.includes("civic") ||
      text.includes("official") ||
      text.includes("issue")
    )
      return "Complaint";
    if (
      text.includes("traffic") ||
      text.includes("jam") ||
      text.includes("road") ||
      text.includes("news")
    )
      return "News";

    return "General";
  };

  const getCategoryBadgeStyle = (category: string): string => {
    switch (category) {
      case "General":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60";
      case "News":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60";
      case "Blood Request":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60";
      case "Complaint":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60";
      case "Announcement":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const [feedMode, setFeedMode] = useState<FeedMode>("all-avadi");
  const [selectedFeed, setSelectedFeed] = useState<FeedData | null>(null);

  // Feed Creator Modal State
  const [isFeedModalOpen, setIsFeedModalOpen] = useState<boolean>(false);
  const [feedText, setFeedText] = useState<string>("");
  const [feedCategory, setFeedCategory] = useState<FeedCategory>("General");
  const [feedVisibility, setFeedVisibility] =
    useState<FeedVisibility>("within-ward");

  // Image Compression & Upload State
  const [feedImagePreview, setFeedImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Comment Creator State
  const [commentText, setCommentText] = useState<string>("");

  // Share Feedback State (for desktop/non-PWA fallback)
  const [copiedFeedId, setCopiedFeedId] = useState<string | number | null>(
    null,
  );

  // Pagination
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // --- CASE-INSENSITIVE FILTERING ---
  const filteredFeeds = useMemo<FeedData[]>(() => {
    let list = feeds as FeedData[];

    if (feedMode === "my-ward") {
      list = list.filter((feed) => {
        return (
          parseInt(feed.ward, 10) === activeWard.id ||
          feed.ward === "all" ||
          feed.ward === "avadi"
        );
      });
    } else if (feedMode === "general") {
      list = list.filter((feed) => {
        const category = getFeedCategory(feed).toLowerCase();
        return category === "general" || category === "announcement";
      });
    } else if (feedMode === "news") {
      list = list.filter((feed) => {
        const category = getFeedCategory(feed).toLowerCase();
        const text = (feed.text || "").toLowerCase();
        return (
          category === "news" ||
          text.includes("news") ||
          text.includes("update") ||
          text.includes("notice") ||
          text.includes("press")
        );
      });
    } else if (feedMode === "blood-feed") {
      list = list.filter((feed) => {
        const category = getFeedCategory(feed).toLowerCase();
        const isEmergencyFeed = feed.isEmergency === true;
        const textContainsBlood =
          feed.text &&
          (feed.text.toLowerCase().includes("blood") ||
            feed.text.toLowerCase().includes("donat") ||
            feed.text.includes("🩸"));
        return (
          isEmergencyFeed || category === "blood request" || textContainsBlood
        );
      });
    }
    return list;
  }, [feeds, feedMode, activeWard.id]);

  // Paginated list
  const paginatedFeeds = useMemo<FeedData[]>(() => {
    return filteredFeeds.slice(0, visibleCount);
  }, [filteredFeeds, visibleCount]);

  // --- PWA SHARE INTENT HANDLER ---
  const handleShare = async (feed: FeedData) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/feed/${feed.id}`;
    const shareTitle = `Avadi City • Ward ${feed.ward} Update by ${feed.authorName}`;
    const shareText =
      feed.text.length > 120 ? `${feed.text.substring(0, 120)}...` : feed.text;

    // Trigger PWA Native Web Share API if supported
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n\nRead more on Avadi City Portal:`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Native share error:", err);
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      // Fallback for desktop browsers without Web Share support: Copy formatted link
      try {
        await navigator.clipboard.writeText(
          `${shareTitle}\n\n"${shareText}"\n\n🔗 View Discussion: ${shareUrl}`,
        );
        setCopiedFeedId(feed.id);
        setTimeout(() => setCopiedFeedId(null), 2500);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
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

  const handleCreateFeed = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedText.trim() && !feedImagePreview) return;
    if (isCompressing || uploadError) return;

    const newFeed: Partial<FeedData> = {
      authorId: authUser?.id,
      authorName: authUser?.name || "Avadi Resident",
      authorAvatar: authUser?.avatarUrl || "/default-avatar.png",
      ward:
        feedVisibility === "entire-avadi"
          ? "all"
          : authUser?.wardNumber?.toString() || activeWard.id.toString(),
      text: feedText,
      imageUrl: feedImagePreview,
      category: feedCategory,
      isEmergency: feedCategory === "Blood Request",
      likes: 0,
      likedByMe: false,
      comments: [],
    };

    await addFeed(newFeed);

    // Clear state
    setFeedText("");
    setFeedCategory("General");
    setFeedVisibility("within-ward");
    setFeedImagePreview(null);
    setUploadError(null);
    setIsFeedModalOpen(false);
  };

  const handleCreateComment = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedFeed) return;

    await addCommentToFeed(selectedFeed.id, commentText);

    const updatedFeed = (feeds as FeedData[]).find(
      (f) => f.id === selectedFeed.id,
    );
    if (updatedFeed) {
      setSelectedFeed((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [
            ...prev.comments,
            {
              id: Date.now(),
              author: authUser?.name || "Anonymous Resident",
              text: commentText,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
    }

    setCommentText("");
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
      label: "Issues",
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
    // { id: "Announcement", label: "Announcement", icon: "📢" },
  ];

  const getPlaceholderText = (cat: FeedCategory): string => {
    switch (cat) {
      case "General":
        return "What's happening around your street?";
      case "News":
        return "Share verified local news, road closures, water supply updates, or public events in Avadi...";
      case "Complaint":
        return "Describe the civic issue (e.g., broken streetlights, garbage overflow, drainage). For official tracking, use Report Issue...";
      case "Blood Request":
        return "URGENT: State patient name, blood group required, hospital name, and contact phone number...";
      case "Announcement":
        return "Make an important public announcement to your neighbors...";
      default:
        return "What's happening in your neighborhood?";
    }
  };

  if (isLoadingFeeds && feeds.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 animate-pulse" />
        <div className="flex gap-2 pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 sm:pb-12 relative">
      {/* 1. Header & Desktop Create CTA */}
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
          onClick={() => setIsFeedModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>New Feed</span>
        </button>
      </div>

      {/* 2. Responsive Horizontal Filter Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto scrollbar-none max-w-full gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = feedMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFeedMode(tab.id as FeedMode)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 focus:outline-none ${
                isActive
                  ? "text-slate-900 dark:text-white font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
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
        {feedMode === "complaints" ? (
          <motion.div
            key="complaints-feed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Civic Issue Banner */}
            <Card className="p-4 sm:p-5 bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                  Have a Civic Issue in your Ward?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  File an official complaint directly to Avadi Municipal
                  Corporation.
                </p>
              </div>
              <button
                onClick={() => router.push("/complaints")}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
              >
                + Report Issue
              </button>
            </Card>

            {/* Public Complaints List */}
            {complaints && (complaints as Complaint[]).length > 0 ? (
              (complaints as Complaint[]).map((complaint) => {
                const getStatusStyle = (status: string): string => {
                  switch (status) {
                    case "Resolved":
                      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                    case "In Progress":
                      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
                    case "Acknowledged":
                      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
                    default:
                      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
                  }
                };

                return (
                  <Card
                    key={complaint.id}
                    className="p-4 sm:p-5 border-l-4 border-l-orange-500 space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {complaint.category}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            Ward {complaint.ward}
                          </span>
                        </div>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug tracking-tight">
                          {complaint.title}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 ${getStatusStyle(complaint.status)}`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {complaint.description}
                    </p>

                    {complaint.imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 max-h-56 relative aspect-video">
                        <img
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-slate-500">
                      <button
                        onClick={() => upvoteComplaint(complaint.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer text-xs font-bold"
                      >
                        <ThumbsUp size={14} />
                        <span>{complaint.upvotes} Upvotes</span>
                      </button>
                      <span className="text-[11px] font-medium text-slate-400">
                        By {complaint.author || "Avadi Resident"}
                      </span>
                    </div>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="No Public Complaints"
                description="No civic issues reported yet in your community."
                actionText="File New Complaint"
                onAction={() => router.push("/complaints")}
              />
            )}
          </motion.div>
        ) : paginatedFeeds.length > 0 ? (
          <div className="space-y-4 mb-10">
            {paginatedFeeds.map((feed) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`p-4 sm:p-5 transition-all duration-300 shadow-xs ${
                    feed.isEmergency
                      ? "bg-rose-500/5 dark:bg-rose-950/10 border-2 border-rose-500/30"
                      : "border border-slate-200/90 dark:border-slate-800/90"
                  }`}
                >
                  {feed.isEmergency && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider mb-3.5 select-none">
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

                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
                        <Image
                          src={feed.authorAvatar}
                          alt={feed.authorName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate">
                            {feed.authorName}
                          </span>

                          {/* Ward / City Badge */}
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                            {feed.ward === "all" || feed.ward === "avadi"
                              ? "🌐 All Avadi"
                              : `Ward ${feed.ward}`}
                          </span>

                          {/* Category Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getCategoryBadgeStyle(getFeedCategory(feed))}`}
                          >
                            #{getFeedCategory(feed)}
                          </span>
                        </div>

                        {/* Subtitle Timestamp */}
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium select-none">
                          <Clock
                            size={12}
                            className="text-slate-400 shrink-0"
                          />
                          <span suppressHydrationWarning>
                            {getRelativeTime(feed.timestamp)}
                          </span>
                          <span>•</span>
                          <span>
                            {feed.ward === "all" || feed.ward === "avadi"
                              ? "Public Feed"
                              : "Neighborhood"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feed Text */}
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed mt-3.5 whitespace-pre-line font-normal">
                    {feed.text}
                  </p>

                  {/* Media Attachment */}
                  {feed.imageUrl && (
                    <div className="mt-3.5 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative shadow-xs">
                      <Image
                        src={feed.imageUrl}
                        alt="Feed media attachment"
                        fill
                        sizes="(max-width: 768px) 100vw, 672px"
                        className="object-cover hover:scale-[1.01] transition-transform duration-300 ease-out"
                      />
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3">
                    <button
                      onClick={() => likeFeed(feed.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold select-none cursor-pointer transition ${
                        feed.likedByMe
                          ? "text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <motion.span
                        animate={feed.likedByMe ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.25 }}
                      >
                        <Heart
                          size={16}
                          fill={feed.likedByMe ? "currentColor" : "none"}
                        />
                      </motion.span>
                      <span>{feed.likes > 0 ? feed.likes : "Like"}</span>
                    </button>

                    <button
                      onClick={() => setSelectedFeed(feed)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>{feed.comments.length} Comments</span>
                    </button>

                    {/* PWA & Desktop Share Button */}
                    <button
                      type="button"
                      onClick={() => handleShare(feed)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                      title="Share feed"
                    >
                      {copiedFeedId === feed.id ? (
                        <>
                          <Check
                            size={16}
                            className="text-emerald-500 animate-in zoom-in-50"
                          />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                            Copied!
                          </span>
                        </>
                      ) : (
                        <Share2 size={16} />
                      )}
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Pagination Load More */}
            {filteredFeeds.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="w-full py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-center shadow-xs"
              >
                Load More Feeds
              </button>
            )}
          </div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <EmptyState
              icon={Compass}
              title={`No feeds in Ward ${activeWard.id} yet`}
              description={`Be the first one in ${activeWard.name} to share updates, ask queries, or greet neighbors!`}
              actionText="Create First Feed"
              onAction={() => setIsFeedModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Floating Action Button (FAB) for Mobile */}
      <button
        onClick={() => setIsFeedModalOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition-all cursor-pointer"
        title="Create New Feed"
        aria-label="Create New Feed"
      >
        <Plus size={26} className="stroke-[2.5]" />
      </button>

      {/* 5. NEW FEED MODAL WITH CATEGORY, VISIBILITY & STRICT IMAGE SECURITY */}
      <Modal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        title="Create Community Feed"
      >
        {/* Upgraded Bounds: Taller min-height (70dvh) & max-height (92dvh) for mobile */}
        <form
          onSubmit={handleCreateFeed}
          className="flex flex-col min-h-[70dvh] max-h-[92dvh] sm:min-h-137.5 sm:max-h-[85vh] space-y-5"
        >
          {/* STATIC TOP ZONE: Facebook-style Header & Visibility Pill */}
          <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            {/* Avatar Icon */}
            <div className="w-11 h-11 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner mt-0.5">
              {feedVisibility === "entire-avadi" ? "🌐" : `W${activeWard.id}`}
            </div>

            {/* Text & FB-Style Privacy Pill Dropdown */}
            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-sm font-black text-slate-900 dark:text-white block truncate leading-snug">
                {feedVisibility === "entire-avadi"
                  ? "Broadcasting to All Avadi"
                  : `Posting in ${activeWard.name}`}
              </span>

              {/* Facebook-style compact visibility selector */}
              <div className="relative inline-flex items-center">
                <select
                  value={feedVisibility}
                  onChange={(e) => setFeedVisibility(e.target.value as any)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] py-1 pl-2.5 pr-6 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition border border-slate-200/60 dark:border-slate-700 shadow-2xs"
                >
                  <option value="within-ward">📍 Ward-Exclusive Feed</option>
                  <option value="entire-avadi">🌐 All Avadi Broadcast</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[9px]">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* SCROLLABLE MIDDLE ZONE: Expands dynamically and absorbs keyboard shifts */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
            {/* Category Tag Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                Select Category Tag:
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryConfigs.map((cat) => {
                  const isSelected = feedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm scale-[1.02]"
                          : "bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upgraded Textarea: text-base on mobile prevents iOS Safari zoom, min-h-[140px] gives double writing space */}
            <textarea
              value={feedText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFeedText(e.target.value)
              }
              rows={5}
              required={!feedImagePreview}
              placeholder={getPlaceholderText(feedCategory)}
              className="w-full p-4 text-sm sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-900 dark:text-white placeholder-slate-400 font-normal resize-none min-h-35 leading-relaxed transition shadow-2xs"
            />

            {/* Security & Error Feedback */}
            {uploadError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-shake">
                <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Compression Loading Indicator */}
            {isCompressing && (
              <div className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold animate-pulse">
                <Loader2 size={18} className="animate-spin text-orange-500" />
                <span>Sanitizing & compressing photo...</span>
              </div>
            )}

            {/* Photo Preview */}
            {feedImagePreview && !isCompressing && (
              <div className="relative rounded-2xl overflow-hidden max-h-56 border border-slate-200 dark:border-slate-800 group shadow-sm">
                <img
                  src={feedImagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 size={12} />
                  <span>Compressed & Verified</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFeedImagePreview(null);
                    setUploadError(null);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition cursor-pointer shadow-md active:scale-95"
                  title="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* STICKY BOTTOM ZONE: pb-3 sm:pb-0 adds safe area above mobile navigation bars & floating buttons */}
          <div className="flex items-center justify-between pt-4 pb-3 sm:pb-0 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
            <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition active:scale-98">
              <ImageIcon
                size={18}
                className="text-teal-600 dark:text-teal-400"
              />
              <span>{feedImagePreview ? "Change Photo" : "Attach Photo"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageChange}
                disabled={isCompressing}
                className="sr-only"
              />
            </label>

            <button
              type="submit"
              disabled={
                (!feedText.trim() && !feedImagePreview) ||
                isCompressing ||
                !!uploadError
              }
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-orange-500/25 transition cursor-pointer active:scale-98 flex items-center justify-center"
            >
              Post Now
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. DETAIL FEED VIEW MODAL */}
      {selectedFeed && (
        <Modal
          isOpen={!!selectedFeed}
          onClose={() => setSelectedFeed(null)}
          title="Feed Discussion"
        >
          <div className="space-y-4">
            {selectedFeed.isEmergency && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] uppercase tracking-wider select-none">
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

            {/* Original Feed Replication */}
            <div className="flex items-start space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
                <Image
                  src={selectedFeed.authorAvatar}
                  alt={selectedFeed.authorName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    {selectedFeed.authorName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                    {selectedFeed.ward === "all" ||
                    selectedFeed.ward === "avadi"
                      ? "🌐 All Avadi"
                      : `Ward ${selectedFeed.ward}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getCategoryBadgeStyle(getFeedCategory(selectedFeed))}`}
                  >
                    #{getFeedCategory(selectedFeed)}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium select-none">
                  <Clock size={12} className="text-slate-400 shrink-0" />
                  <span>{getRelativeTime(selectedFeed.timestamp)}</span>
                  <span>•</span>
                  <span>
                    {selectedFeed.ward === "all" ||
                    selectedFeed.ward === "avadi"
                      ? "Public Feed"
                      : "Neighborhood"}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mt-3 whitespace-pre-line font-normal">
                  {selectedFeed.text}
                </p>
              </div>
            </div>

            {selectedFeed.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-video relative shadow-xs">
                <Image
                  src={selectedFeed.imageUrl}
                  alt="Feed media"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-2.5 flex items-center justify-between text-xs text-slate-500 font-bold">
              <div className="flex items-center space-x-4">
                <span>👍 {selectedFeed.likes} Likes</span>
                <span>💬 {selectedFeed.comments.length} Comments</span>
              </div>

              {/* Modal Share Button */}
              <button
                type="button"
                onClick={() => handleShare(selectedFeed)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {copiedFeedId === selectedFeed.id ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
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

            {/* Comments Thread */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {selectedFeed.comments.length > 0 ? (
                selectedFeed.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(comment.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {comment.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No comments yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Sticky Comment Form */}
            <form
              onSubmit={handleCreateComment}
              className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCommentText(e.target.value)
                }
                required
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
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
