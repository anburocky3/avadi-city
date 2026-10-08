"use client";

import React, { useState, useTransition } from "react";
import {
  deleteFeedAction,
  toggleEmergencyFeedAction,
} from "@/app/actions/adminActions";
import {
  Rss,
  Trash2,
  AlertTriangle,
  Search,
  MapPin,
  Clock,
  Heart,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface FeedItem {
  id: string;
  authorId: string;
  ward: number;
  text: string;
  imageUrl?: string | null;
  isEmergency: boolean;
  category: string;
  likesCount: number;
  timestamp: Date | string;
  author: {
    name: string;
    email: string;
  };
  comments: Array<{
    id: string;
    author: string;
    text: string;
  }>;
}

interface FeedsManagementClientProps {
  initialFeeds: FeedItem[];
  currentWard: number;
  isSuperAdmin: boolean;
}

export function FeedsManagementClient({
  initialFeeds,
  currentWard,
  isSuperAdmin,
}: FeedsManagementClientProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>(initialFeeds);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmergency, setFilterEmergency] = useState<"ALL" | "EMERGENCY">("ALL");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleEmergency = (id: string) => {
    startTransition(async () => {
      const res = await toggleEmergencyFeedAction(id);
      if (res.success) {
        setFeeds((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isEmergency: !f.isEmergency } : f))
        );
        showToast("success", res.message);
      } else {
        showToast("error", res.message || "Failed to update emergency state");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this community post?")) return;

    startTransition(async () => {
      const res = await deleteFeedAction(id);
      if (res.success) {
        setFeeds((prev) => prev.filter((f) => f.id !== id));
        showToast("success", "Feed post deleted.");
      } else {
        showToast("error", res.message || "Failed to delete post");
      }
    });
  };

  const filteredFeeds = feeds.filter((f) => {
    const matchesEmergency = filterEmergency === "ALL" ? true : f.isEmergency;
    const matchesQuery =
      searchQuery === "" ||
      f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(f.ward).includes(searchQuery);

    return matchesEmergency && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm ${
            message.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Community Feed Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor resident updates, flag civic emergencies, and remove abusive content.
          </p>
        </div>

        <Link
          href="/feed"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
        >
          <span>Live Community Feed</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilterEmergency("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterEmergency === "ALL"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>All Posts ({feeds.length})</span>
          </button>
          <button
            onClick={() => setFilterEmergency("EMERGENCY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filterEmergency === "EMERGENCY"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Emergency Only ({feeds.filter((f) => f.isEmergency).length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed posts or author..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Feed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeeds.map((post) => (
          <div
            key={post.id}
            className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs transition-shadow ${
              post.isEmergency
                ? "border-rose-400 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-linear-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {post.author.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ward {post.ward} · {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {post.isEmergency && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                    <ShieldAlert size={12} />
                    Emergency Alert
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {post.text}
              </p>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden max-h-48 bg-slate-100 dark:bg-slate-800">
                  <img src={post.imageUrl} alt="Feed attachment" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-rose-500" />
                  {post.likesCount} Likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} className="text-indigo-500" />
                  {post.comments.length} Comments
                </span>
              </div>
            </div>

            {/* Moderation Controls */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleToggleEmergency(post.id)}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  post.isEmergency
                    ? "border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert size={13} />
                <span>{post.isEmergency ? "Revoke Emergency" : "Flag as Emergency"}</span>
              </button>

              <button
                onClick={() => handleDelete(post.id)}
                disabled={isPending}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Remove feed post"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
