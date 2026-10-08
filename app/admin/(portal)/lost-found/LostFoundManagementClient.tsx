"use client";

import React, { useState, useTransition } from "react";
import {
  updateLostFoundStatusAction,
  deleteLostFoundItemAction,
} from "@/app/actions/adminActions";
import {
  Search,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Package,
} from "lucide-react";
import Link from "next/link";

interface LostFoundRecord {
  id: string;
  itemId: string;
  type: string;
  title: string;
  description: string;
  category: string;
  ward: number;
  location: string;
  lostFoundDate: string;
  status: string;
  imageUrl?: string | null;
  contactName: string;
  claimsCount: number;
  user: {
    name: string;
    email: string;
  };
}

interface LostFoundManagementClientProps {
  initialItems: LostFoundRecord[];
  currentWard: number;
  isSuperAdmin: boolean;
}

export function LostFoundManagementClient({
  initialItems,
  currentWard,
  isSuperAdmin,
}: LostFoundManagementClientProps) {
  const [items, setItems] = useState<LostFoundRecord[]>(initialItems);
  const [filterType, setFilterType] = useState<"ALL" | "lost" | "found">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Resolved" : "Active";
    startTransition(async () => {
      const res = await updateLostFoundStatusAction(id, newStatus);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
        );
        showToast("success", res.message);
      } else {
        showToast("error", res.message || "Failed to update item status");
      }
    });
  };

  const handleDelete = (id: string, itemId: string) => {
    if (!confirm(`Are you sure you want to permanently delete record #${itemId}?`)) return;

    startTransition(async () => {
      const res = await deleteLostFoundItemAction(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast("success", `Record #${itemId} deleted.`);
      } else {
        showToast("error", res.message || "Failed to delete item");
      }
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === "ALL" ? true : item.type === filterType;
    const matchesQuery =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesQuery;
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Lost & Found Registry Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track claims, resolve recovered possessions, and protect citizen privacy.
          </p>
        </div>

        <Link
          href="/lost-found"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
        >
          <span>Live Lost & Found Hub</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "ALL"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>All Items ({items.length})</span>
          </button>
          <button
            onClick={() => setFilterType("lost")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "lost"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Lost ({items.filter((i) => i.type === "lost").length})</span>
          </button>
          <button
            onClick={() => setFilterType("found")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "found"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Found ({items.filter((i) => i.type === "found").length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking ID, item, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {item.itemId}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.type === "lost"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.status === "Resolved"
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <span className="text-[11px] text-slate-500">{item.category}</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                  {item.description}
                </p>
              </div>

              <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  <span>
                    Ward {item.ward} · {item.location}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Reported Date: {item.lostFoundDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  <span>Reporter: {item.contactName} ({item.user.email})</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleStatusToggle(item.id, item.status)}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  item.status === "Resolved"
                    ? "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <CheckCircle size={13} />
                <span>{item.status === "Resolved" ? "Reopen Item" : "Mark as Resolved"}</span>
              </button>

              <button
                onClick={() => handleDelete(item.id, item.itemId)}
                disabled={isPending}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Delete item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
