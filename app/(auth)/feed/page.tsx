"use client";

import React, { useState, useMemo, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Adjust path aliases according to your Next.js project structure
import { useWard } from "@/context/ward";
import { Card, Modal, EmptyState } from "@/components/shared-components";

// --- TYPESCRIPT INTERFACES ---

export interface Comment {
  id: number | string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: number | string;
  authorName: string;
  authorAvatar: string;
  ward: string;
  text: string;
  imageUrl?: string | null;
  isEmergency?: boolean;
  category?: string;
  timestamp?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
}

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
  | "my-ward"
  | "all-avadi"
  | "news"
  | "complaints"
  | "blood-feed";

export const Feed: React.FC = () => {
  const {
    userProfile,
    activeWard,
    posts,
    addPost,
    likePost,
    addCommentToPost,
    complaints,
    upvoteComplaint,
  } = useWard();

  const router = useRouter();

  const getRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return postDate.toLocaleDateString();
  };

  const getPostCategory = (post: Post): string => {
    if (post.category) return post.category;
    if (post.isEmergency) return "Blood Request";
    const text = post.text ? post.text.toLowerCase() : "";
    if (
      text.includes("blood") ||
      text.includes("donation") ||
      text.includes("o-ve") ||
      text.includes("o-positive") ||
      text.includes("donor")
    )
      return "Blood Request";
    if (
      text.includes("emergency") ||
      text.includes("urgent") ||
      text.includes("sos") ||
      text.includes("critical")
    )
      return "Emergency";
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
      text.includes("road")
    )
      return "News";
    if (
      text.includes("event") ||
      text.includes("celebration") ||
      text.includes("meetup")
    )
      return "Event";
    if (
      text.includes("government") ||
      text.includes("corporation") ||
      text.includes("municipal")
    )
      return "Government Update";
    return "Announcement";
  };

  const getCategoryBadgeStyle = (category: string): string => {
    switch (category) {
      case "Announcement":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/50";
      case "Event":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-450 border-sky-100 dark:border-sky-900/50";
      case "News":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-450 border-indigo-100 dark:border-indigo-900/50";
      case "Emergency":
      case "Blood Request":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/50";
      case "Complaint":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 border-amber-100 dark:border-amber-900/50";
      case "Government Update":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-450 border-purple-100 dark:border-purple-900/50";
      default:
        return "bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border-slate-100 dark:border-slate-800";
    }
  };

  const [feedMode, setFeedMode] = useState<FeedMode>("my-ward");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Post Creator Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [postText, setPostText] = useState<string>("");
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  // Comment Creator State (in details modal)
  const [commentText, setCommentText] = useState<string>("");

  // Pagination
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const filteredPosts = useMemo<Post[]>(() => {
    let list = posts as Post[];
    if (feedMode === "my-ward") {
      list = list.filter((post) => parseInt(post.ward, 10) === activeWard.id);
    } else if (feedMode === "news") {
      list = list.filter((post) => {
        const category = getPostCategory(post);
        const text = (post.text || "").toLowerCase();
        return (
          category === "News" ||
          category === "Government Update" ||
          category === "Announcement" ||
          text.includes("news") ||
          text.includes("update") ||
          text.includes("notice") ||
          text.includes("press") ||
          text.includes("inform")
        );
      });
    } else if (feedMode === "blood-feed") {
      list = list.filter((post) => {
        const isEmergencyPost = post.isEmergency === true;
        const isBloodRequestCategory =
          getPostCategory(post) === "Blood Request";
        const textContainsBlood =
          post.text &&
          (post.text.toLowerCase().includes("blood") ||
            post.text.toLowerCase().includes("donat") ||
            post.text.includes("🩸"));
        return isEmergencyPost || isBloodRequestCategory || textContainsBlood;
      });
    }
    return list;
  }, [posts, feedMode, activeWard.id]);

  // Paginated list
  const paginatedPosts = useMemo<Post[]>(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImageFile(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postText.trim() && !postImagePreview) return;

    const newPost: Partial<Post> = {
      authorName: userProfile.name || "Avadi Resident",
      authorAvatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
      ward: userProfile.wardNumber.toString(),
      text: postText,
      imageUrl: postImagePreview,
      likes: 0,
      likedByMe: false,
      comments: [],
    };

    addPost(newPost);

    // Clear state
    setPostText("");
    setPostImageFile(null);
    setPostImagePreview(null);
    setIsPostModalOpen(false);
  };

  const handleCreateComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost) return;

    addCommentToPost(selectedPost.id, commentText);

    // Sync local selectedPost in modal view
    const updatedPost = (posts as Post[]).find((p) => p.id === selectedPost.id);
    if (updatedPost) {
      setSelectedPost((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [
            ...prev.comments,
            {
              id: Date.now(),
              author: userProfile.name || "Anonymous Resident",
              text: commentText,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
    }

    setCommentText("");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-20 md:pb-6 relative">
      {/* Feed Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            Neighborhood Feed
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Share updates, see local news, and connect with people in your ward.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setFeedMode("my-ward")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              feedMode === "my-ward"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <MapPin size={13} className="text-primary" />
            <span>My Ward ({activeWard.id})</span>
          </button>
          <button
            onClick={() => setFeedMode("all-avadi")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              feedMode === "all-avadi"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Globe size={13} className="text-teal-600" />
            <span>All Wards</span>
          </button>
          <button
            onClick={() => setFeedMode("news")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              feedMode === "news"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Newspaper size={13} className="text-amber-500" />
            <span>News</span>
          </button>
          <button
            onClick={() => setFeedMode("complaints")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              feedMode === "complaints"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <AlertCircle size={13} className="text-rose-500" />
            <span>Complaints</span>
          </button>
          <button
            onClick={() => setFeedMode("blood-feed")}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
              feedMode === "blood-feed"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Heart size={13} className="text-rose-500 fill-rose-500" />
            <span>Emergency Blood Feed</span>
          </button>
        </div>
      </div>

      {/* Feed Area */}
      <AnimatePresence mode="wait">
        {feedMode === "complaints" ? (
          <motion.div
            key="complaints-feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Quick Banner to Report New Issue */}
            <Card className="p-4 bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                  Have a Civic Issue in your Ward?
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  File an official complaint directly to Avadi Municipal
                  Corporation
                </p>
              </div>
              <button
                onClick={() => router.push("/complaints")}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-extrabold hover:bg-orange-600 transition shadow-sm cursor-pointer shrink-0"
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
                      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                    case "In Progress":
                      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                    case "Acknowledged":
                      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
                    default:
                      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                  }
                };

                return (
                  <Card
                    key={complaint.id}
                    className="p-4 border-l-4 border-l-orange-500 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {complaint.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Ward {complaint.ward}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white leading-snug">
                          {complaint.title}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(complaint.status)} shrink-0`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {complaint.description}
                    </p>

                    {complaint.imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 max-h-48">
                        <img
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <button
                        onClick={() => upvoteComplaint(complaint.id)}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-500 transition cursor-pointer text-xs font-bold"
                      >
                        <span>👍</span>
                        <span>{complaint.upvotes} Upvotes</span>
                      </button>
                      <span className="text-[10px] font-semibold text-slate-400">
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
        ) : paginatedPosts.length > 0 ? (
          <div className="space-y-4">
            {paginatedPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card
                  className={`p-5 transition-all duration-300 ${
                    post.isEmergency
                      ? "bg-rose-500/2 dark:bg-rose-950/5 animate-border-pulse-red"
                      : "border-l-4 border-l-slate-200 dark:border-l-slate-800"
                  }`}
                >
                  {post.isEmergency && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider mb-4 select-none">
                      <div className="flex items-center space-x-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <span>🩸 Urgent Blood Request</span>
                      </div>
                      <span className="animate-pulse duration-1000 text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-md">
                        Live Alert
                      </span>
                    </div>
                  )}

                  {/* Author Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 w-full">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-tight">
                            {post.authorName}
                          </span>

                          {/* Ward Bubble Badge */}
                          <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-center leading-none text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shrink-0 select-none">
                            <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">
                              Ward
                            </span>
                            <span className="text-[10px] font-extrabold">
                              {post.ward}
                            </span>
                          </div>

                          {/* Category Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getCategoryBadgeStyle(getPostCategory(post))}`}
                          >
                            #{getPostCategory(post)}
                          </span>

                          {post.isEmergency && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 shrink-0">
                              Urgent SOS
                            </span>
                          )}
                        </div>

                        {/* Subtitle: Timestamp & Community Type */}
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium select-none">
                          <Clock
                            size={11}
                            className="text-slate-400 shrink-0"
                          />
                          <span suppressHydrationWarning>
                            {getRelativeTime(post.timestamp)}
                          </span>
                          <span>·</span>
                          <span>
                            {parseInt(post.ward, 10) === activeWard.id
                              ? "My Ward"
                              : "All Avadi"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Text */}
                  <p className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-3.5 whitespace-pre-line tracking-wide font-medium">
                    {post.text}
                  </p>

                  {/* Optional Image */}
                  {post.imageUrl && (
                    <div className="mt-3.5 overflow-hidden rounded-[20px] border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 aspect-4/3 sm:aspect-16/10 relative shadow-sm">
                      <img
                        src={post.imageUrl}
                        alt="Post media attachment"
                        className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Post Actions Bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4 pt-3.5">
                    {/* Like button */}
                    <button
                      onClick={() => likePost(post.id)}
                      className={`flex items-center space-x-1 text-xs font-bold select-none cursor-pointer transition ${
                        post.likedByMe
                          ? "text-rose-500"
                          : "text-slate-500 dark:text-slate-400 hover:text-rose-500"
                      }`}
                    >
                      <motion.span
                        animate={post.likedByMe ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart
                          size={16}
                          fill={post.likedByMe ? "currentColor" : "none"}
                        />
                      </motion.span>
                      <span>{post.likes}</span>
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center space-x-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>{post.comments.length} Comments</span>
                    </button>

                    {/* Share */}
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer transition hover:scale-105 active:scale-95">
                      <Share2 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Pagination Load More */}
            {filteredPosts.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer text-center"
              >
                Load More Posts
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
              title={`No posts in Ward ${activeWard.id} yet`}
              description={`Be the first one in ${activeWard.name} to share news, ask queries or greet neighbors!`}
              actionText="Create First Post"
              onAction={() => setIsPostModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating "+" button for Mobile */}
      <button
        onClick={() => setIsPostModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:absolute md:bottom-auto md:top-0 md:right-0 md:mt-2 w-12 h-12 rounded-full bg-primary hover:bg-orange-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        title="Create New Post"
      >
        <Plus size={24} />
      </button>

      {/* NEW POST MODAL */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Create Community Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-primary flex items-center justify-center font-bold text-xs">
              W{activeWard.id}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Posting in {activeWard.name}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Only visible to Ward {activeWard.id} (unless shared)
              </p>
            </div>
          </div>

          <textarea
            value={postText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setPostText(e.target.value)
            }
            rows={4}
            required
            placeholder="What's happening in your neighborhood? Share announcements, queries or alerts..."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />

          {/* Photo upload preview */}
          {postImagePreview && (
            <div className="relative rounded-2xl overflow-hidden max-h-40 border border-slate-200 dark:border-slate-800">
              <img
                src={postImagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPostImageFile(null);
                  setPostImagePreview(null);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 text-white flex items-center justify-center font-bold text-[10px] hover:bg-slate-900"
              >
                ✕
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* File picker */}
            <label className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition">
              <ImageIcon size={15} className="text-teal-600" />
              <span>Attach Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>

            <button
              type="submit"
              disabled={!postText.trim() && !postImagePreview}
              className="px-5 py-2 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Post Now
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL POST VIEW MODAL */}
      {selectedPost && (
        <Modal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title="Post Discussion"
        >
          <div className="space-y-4">
            {selectedPost.isEmergency && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider select-none">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>🩸 Urgent Blood Request</span>
                </div>
                <span className="animate-pulse duration-1000 text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-md">
                  Live Alert
                </span>
              </div>
            )}

            {/* Post content replicate */}
            <div className="flex items-start space-x-3">
              <img
                src={selectedPost.authorAvatar}
                alt={selectedPost.authorName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">
                    {selectedPost.authorName}
                  </span>

                  {/* Ward Bubble Badge */}
                  <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-center leading-none text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shrink-0 select-none">
                    <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">
                      Ward
                    </span>
                    <span className="text-[10px] font-extrabold">
                      {selectedPost.ward}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getCategoryBadgeStyle(getPostCategory(selectedPost))}`}
                  >
                    #{getPostCategory(selectedPost)}
                  </span>
                </div>

                {/* Subtitle */}
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium select-none">
                  <Clock size={11} className="text-slate-400 shrink-0" />
                  <span>{getRelativeTime(selectedPost.timestamp)}</span>
                  <span>·</span>
                  <span>
                    {parseInt(selectedPost.ward, 10) === activeWard.id
                      ? "My Ward"
                      : "All Avadi"}
                  </span>
                </div>

                {/* Post Text */}
                <p className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-3 whitespace-pre-line tracking-wide font-medium">
                  {selectedPost.text}
                </p>
              </div>
            </div>

            {selectedPost.imageUrl && (
              <div className="overflow-hidden rounded-[20px] border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 aspect-4/3 sm:aspect-16/10 relative shadow-sm">
                <img
                  src={selectedPost.imageUrl}
                  alt="Post Media"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-2.5 flex items-center space-x-4 text-[10px] text-slate-500 font-bold">
              <span>👍 {selectedPost.likes} Likes</span>
              <span>💬 {selectedPost.comments.length} Comments</span>
            </div>

            {/* Comments List */}
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {selectedPost.comments.length > 0 ? (
                selectedPost.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100/40 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                        {comment.author}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(comment.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                  No comments yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form
              onSubmit={handleCreateComment}
              className="flex space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCommentText(e.target.value)
                }
                required
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white disabled:opacity-50 shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Feed;
