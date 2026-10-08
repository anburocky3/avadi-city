"use client";

import React, { useState, useTransition } from "react";
import {
  approveServiceProfileAction,
  deleteServiceProfileAction,
} from "@/app/actions/adminActions";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Wrench,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  AlertCircle,
  Briefcase,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface ServiceProfileItem {
  id: string;
  name: string;
  category: string;
  phone: string;
  ward: number;
  experience?: string | null;
  hours?: string | null;
  description?: string | null;
  specialty?: string | null;
  rate?: string | null;
  imageUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
}

interface ServicesManagementClientProps {
  initialProfiles: ServiceProfileItem[];
  currentWard: number;
  isSuperAdmin: boolean;
}

export function ServicesManagementClient({
  initialProfiles,
  currentWard,
  isSuperAdmin,
}: ServicesManagementClientProps) {
  const [profiles, setProfiles] = useState<ServiceProfileItem[]>(initialProfiles);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleApprove = (id: string, name: string) => {
    startTransition(async () => {
      const res = await approveServiceProfileAction(id, "APPROVED");
      if (res.success) {
        setProfiles((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
        );
        showToast("success", `Service profile "${name}" approved for public directory!`);
      } else {
        showToast("error", res.message || "Failed to approve service");
      }
    });
  };

  const handleReject = (id: string, name: string) => {
    startTransition(async () => {
      const res = await approveServiceProfileAction(id, "REJECTED");
      if (res.success) {
        setProfiles((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "REJECTED" } : item))
        );
        showToast("success", `Service profile "${name}" rejected.`);
      } else {
        showToast("error", res.message || "Failed to reject service");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteServiceProfileAction(id);
      if (res.success) {
        setProfiles((prev) => prev.filter((item) => item.id !== id));
        showToast("success", `"${name}" removed successfully.`);
      } else {
        showToast("error", res.message || "Failed to delete service profile");
      }
    });
  };

  const filteredProfiles = profiles.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const matchesQuery =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.specialty && item.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(item.ward).includes(searchQuery);

    return matchesTab && matchesQuery;
  });

  const pendingCount = profiles.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            message.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Local Services & Trades Directory
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white animate-pulse">
                {pendingCount} Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review and certify local technicians, electricians, plumbers, and home service providers.
          </p>
        </div>

        <Link
          href="/services"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
        >
          <span>Live Services Directory</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "PENDING"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "APPROVED"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Approved ({profiles.filter((i) => i.status === "APPROVED").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "REJECTED"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>Rejected ({profiles.filter((i) => i.status === "REJECTED").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <span>All ({profiles.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search provider, category, trade..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <Wrench size={36} className="mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No service profiles found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            There are no profiles matching this status tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden font-bold">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        item.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : item.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Serving Ward {item.ward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono">{item.phone}</span>
                  </div>
                  {item.rate && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-slate-400" />
                      <span>Visiting Charge: ₹{item.rate}</span>
                    </div>
                  )}
                  {item.specialty && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-slate-400" />
                      <span className="truncate">{item.specialty}</span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.status !== "APPROVED" && (
                    <button
                      onClick={() => handleApprove(item.id, item.name)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
                    >
                      <CheckCircle size={13} />
                      <span>Approve</span>
                    </button>
                  )}
                  {item.status !== "REJECTED" && (
                    <button
                      onClick={() => handleReject(item.id, item.name)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all active:scale-95"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  disabled={isPending}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
