"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Gift,
  Clock,
  Calendar,
  AlertTriangle,
  Flag,
  Edit,
  CheckCircle,
  Trash2,
  Share2,
  ChevronDown,
  User,
  RotateCcw,
} from "lucide-react";
import { Card, Badge } from "@/components/shared-components";
import {
  DonationRequest,
  DonationType,
  DonationUrgency,
  DonationStatus,
} from "@/types/donation";
import { StatusBadge } from "@/components/volunteer/StatusBadge";
import { ReportModal } from "./ReportModal";
import donationService from "@/services/donationService";
import toast from "@/utils/toast";

export interface DonationFeedProps {
  requests: DonationRequest[];
  currentUserId?: string;
  authUser?: any;
  onCreateNew: () => void;
  onEdit: (request: DonationRequest) => void;
  onRequestUpdated: (updatedList: DonationRequest[]) => void;
}

const DONATION_TYPES: (DonationType | "All")[] = [
  "All",
  "Charity Need",
  "Emergency Relief",
  "Blood Requirement",
  "Medical Help",
  "Education Support",
  "Food & Clothing",
  "Other",
];

const URGENCIES: (DonationUrgency | "All")[] = ["All", "Critical", "Urgent", "Normal"];

// Format date in human-readable DD/MM/YYYY
const formatDateDMY = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "";
  try {
    const str = String(dateInput).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return str;
  } catch {
    return String(dateInput);
  }
};

export const DonationFeed: React.FC<DonationFeedProps> = ({
  requests,
  currentUserId,
  authUser,
  onCreateNew,
  onEdit,
  onRequestUpdated,
}) => {
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("All");
  const [selectedWard, setSelectedWard] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("approved"); // Default to approved community needs
  const [sortBy, setSortBy] = useState<"newest" | "urgent">("newest");
  const [showOnlyMyRequests, setShowOnlyMyRequests] = useState<boolean>(false);
  const [myRequestsFilter, setMyRequestsFilter] = useState<"urgent" | "fulfilled">("urgent");

  // Track hydration mount state to eliminate SSR/client HTML divergence
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Report Modal state
  const [reportingRequest, setReportingRequest] =
    useState<DonationRequest | null>(null);

  // IDs created locally on this browser
  const myCreatedIds = useMemo(() => {
    if (!isMounted) return [];
    return donationService.getMyCreatedIds();
  }, [requests, isMounted]);

  const checkIsOwner = (req: DonationRequest): boolean => {
    if (!isMounted) return false;
    if (req.id && myCreatedIds.includes(req.id)) return true;
    if (currentUserId && req.createdBy && req.createdBy === currentUserId) return true;
    if (authUser?.id && req.createdBy && req.createdBy === authUser.id) return true;
    if (
      authUser?.name &&
      req.contact?.name &&
      req.contact.name.trim().toLowerCase() === authUser.name.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      authUser?.name &&
      req.createdByName &&
      req.createdByName.trim().toLowerCase() === authUser.name.trim().toLowerCase()
    ) {
      return true;
    }
    if (
      authUser?.phone &&
      req.contact?.phone &&
      req.contact.phone.replace(/\D/g, "") === authUser.phone.replace(/\D/g, "")
    ) {
      return true;
    }
    return false;
  };

  const myActiveCount = useMemo(() => {
    if (!isMounted) return 0;
    return requests.filter((r) => checkIsOwner(r) && r.status !== "fulfilled").length;
  }, [requests, isMounted, myCreatedIds, authUser, currentUserId]);

  const myFulfilledCount = useMemo(() => {
    if (!isMounted) return 0;
    return requests.filter((r) => checkIsOwner(r) && r.status === "fulfilled").length;
  }, [requests, isMounted, myCreatedIds, authUser, currentUserId]);

  const myRequestsCount = useMemo(() => {
    if (!isMounted) return 0;
    return requests.filter((r) => checkIsOwner(r)).length;
  }, [requests, isMounted, myCreatedIds, authUser, currentUserId]);

  // Filter & Sort Logic
  const filteredRequests = useMemo(() => {
    let result = requests.filter((req) => {
      // My Requests View
      if (showOnlyMyRequests) {
        if (!checkIsOwner(req)) return false;
        if (myRequestsFilter === "fulfilled") {
          if (req.status !== "fulfilled") return false;
        } else {
          // "urgent" view -> show active (non-fulfilled) requests
          if (req.status === "fulfilled") return false;
        }
        if (selectedType !== "All" && req.type !== selectedType) return false;
        if (selectedUrgency !== "All" && req.urgency !== selectedUrgency) return false;
        return true;
      }

      // Public Community Feed: hide fulfilled or rejected requests
      if (req.status === "rejected" || req.status === "fulfilled") {
        return false;
      }

      // Type Filter
      const matchesType =
        selectedType === "All" || req.type === selectedType;

      // Urgency Filter
      const matchesUrgency =
        selectedUrgency === "All" || req.urgency === selectedUrgency;

      // Ward Filter
      const matchesWard =
        selectedWard === "All" || String(req.ward) === String(selectedWard);

      return matchesType && matchesUrgency && matchesWard;
    });

    // Sorting: descending order by createdAt so newly created items appear first
    return result.sort((a, b) => {
      // When viewing fulfilled requests in My Requests, sort by latest updated/created
      if (showOnlyMyRequests && myRequestsFilter === "fulfilled") {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }

      if (sortBy === "urgent") {
        const priority: Record<DonationUrgency, number> = {
          Critical: 3,
          Urgent: 2,
          Normal: 1,
        };
        const pDiff = (priority[b.urgency] || 0) - (priority[a.urgency] || 0);
        if (pDiff !== 0) return pDiff;
      }

      // Default & newest: Descending by createdAt (newest first)
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA) {
        return timeB - timeA;
      }

      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [
    requests,
    selectedType,
    selectedUrgency,
    selectedWard,
    selectedStatus,
    sortBy,
    showOnlyMyRequests,
    myRequestsFilter,
    currentUserId,
    authUser,
    myCreatedIds,
    isMounted,
  ]);

  // WhatsApp Donate Action
  const handleWhatsAppDonate = (req: DonationRequest) => {
    const itemsList =
      req.items && req.items.length > 0
        ? req.items.map((i) => `${i.name} (${i.qty} ${i.unit})`).join(", ")
        : "Community assistance & direct coordination";

    const text = `Hi ${req.contact.name}, I saw your civic request for "${req.title}" in Ward ${req.ward} on the Avadi City App. I would like to support: ${itemsList}. Please let me know how I can coordinate!`;
    const cleanPhone = req.contact.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Mark fulfilled -> Updates request status to fulfilled
  const handleMarkFulfilled = async (id: string) => {
    try {
      await donationService.updateStatusAsync(id, "fulfilled");
      toast.success("Request marked as fulfilled!");
      onRequestUpdated(donationService.list());
    } catch (e: any) {
      toast.error(e?.message || "Failed to mark request as fulfilled.");
    }
  };

  // Reopen fulfilled request
  const handleReopenRequest = async (id: string) => {
    try {
      await donationService.updateStatusAsync(id, "approved");
      toast.success("Request reopened as active!");
      onRequestUpdated(donationService.list());
    } catch (e: any) {
      toast.error(e?.message || "Failed to reopen request.");
    }
  };

  // Delete Request
  const handleDeleteRequest = async (id: string) => {
    if (confirm("Are you sure you want to delete this donation request?")) {
      try {
        await donationService.removeAsync(id);
        toast.info("Donation request deleted.");
        onRequestUpdated(donationService.list());
      } catch (e: any) {
        toast.error(e?.message || "Failed to delete request.");
      }
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Primary Tab Switcher: Community Needs vs My Requests */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowOnlyMyRequests(false)}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            !showOnlyMyRequests
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Gift size={14} className={!showOnlyMyRequests ? "text-primary" : ""} />
          <span>Community Needs</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
            {requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowOnlyMyRequests(true)}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            showOnlyMyRequests
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <User size={14} className={showOnlyMyRequests ? "text-primary" : ""} />
          <span>My Requests</span>
          {myRequestsCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary text-white font-bold">
              {myRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Sleek Single-Row Filter & Sorting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8.5 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-2xs"
            >
              {DONATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Categories" : t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Urgency Filter */}
          <div className="relative">
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="h-8.5 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-2xs"
            >
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u === "All" ? "All Urgencies" : u === "Critical" ? "Critical Needs" : u}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Reset Filters Shortcut */}
          {(selectedType !== "All" || selectedUrgency !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSelectedType("All");
                setSelectedUrgency("All");
              }}
              className="text-xs font-bold text-primary hover:underline px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Toggle (Most Urgent / Fulfilled for My Requests, Most Urgent / Newest for Community Needs) */}
        {showOnlyMyRequests ? (
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMyRequestsFilter("urgent")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                myRequestsFilter === "urgent"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>Most Urgent</span>
              {myActiveCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold">
                  {myActiveCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMyRequestsFilter("fulfilled")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                myRequestsFilter === "fulfilled"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>Fulfilled</span>
              {myFulfilledCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold">
                  {myFulfilledCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSortBy("newest")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                sortBy === "newest"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy("urgent")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                sortBy === "urgent"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Most Urgent
            </button>
          </div>
        )}
      </div>

      {/* Donation Cards Feed */}
      <div className="space-y-4 pt-1">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isOwner = checkIsOwner(req);

            return (
              <Card
                key={req.id}
                className="p-5 border bg-white dark:bg-slate-900 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Header Row: Type Badge, Urgency, Ward Pill */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary" className="text-[10px] font-extrabold uppercase">
                      {req.type}
                    </Badge>
                    <StatusBadge type="urgency" value={req.urgency} />
                    {req.status && req.status !== "approved" && (
                      <StatusBadge type="donationStatus" value={req.status} />
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-lg flex items-center">
                    <MapPin size={11} className="mr-0.5 text-primary" />
                    Ward {req.ward}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                    {req.title}
                  </h3>
                  {req.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {req.description}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{req.address}</span>
                    {req.organisation?.name && (
                      <span className="font-semibold text-teal-700 dark:text-teal-400 ml-1">
                        · {req.organisation.name}
                      </span>
                    )}
                  </p>
                </div>

                {/* Needed Items Box (Shown if items or timeline present) */}
                {(req.items && req.items.length > 0) || req.requiredBy ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                        {req.items && req.items.length > 0 ? "Needed Items" : "Timeline"}
                      </span>
                      {req.requiredBy && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock size={11} /> Required by: {formatDateDMY(req.requiredBy)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {req.items.map((item, idx) => (
                        <span
                          key={item.id || idx}
                          className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-100/60 dark:border-teal-900/40 text-xs font-bold flex items-center gap-1"
                        >
                          <span>🎁 {item.name}:</span>
                          <span className="font-extrabold">
                            {item.qty} {item.unit}
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* Financial Target Display if present */}
                    {req.target && (req.target.amount || req.target.upi) && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        {req.target.amount && (
                          <span>
                            Target: <strong className="text-slate-800 dark:text-white">₹{req.target.amount}</strong>
                          </span>
                        )}
                        {req.target.upi && (
                          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
                            UPI: {req.target.upi}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  req.target && (req.target.amount || req.target.upi) && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      {req.target.amount && (
                        <span>
                          Target: <strong className="text-slate-800 dark:text-white">₹{req.target.amount}</strong>
                        </span>
                      )}
                      {req.target.upi && (
                        <span className="font-mono bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                          UPI: {req.target.upi}
                        </span>
                      )}
                    </div>
                  )
                )}

                {/* Image thumbnails preview if uploaded */}
                {req.images && req.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {req.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Need photo"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ))}
                  </div>
                )}

                {/* Owner Banner: Fulfilled state vs Mark as Fulfilled */}
                {isOwner && (
                  req.status === "fulfilled" ? (
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-teal-600 dark:text-teal-400 shrink-0" size={16} />
                        <div>
                          <p className="text-xs font-bold text-teal-800 dark:text-teal-300">
                            Request marked as Fulfilled
                          </p>
                          <p className="text-[10px] text-teal-600 dark:text-teal-400">
                            This civic need was successfully fulfilled. Thank you for coordinating!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReopenRequest(req.id)}
                        className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer ml-auto shrink-0 shadow-2xs"
                      >
                        <RotateCcw size={12} />
                        <span>Reopen Request</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0" size={16} />
                        <div>
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Need fulfilled or completed?
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Touch &quot;Fulfilled&quot; to mark this request completed and move it to Fulfilled.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkFulfilled(req.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-auto shrink-0"
                      >
                        <CheckCircle size={13} />
                        <span>Fulfilled</span>
                      </button>
                    </div>
                  )
                )}

                {/* Primary Action Button: WhatsApp to Donate or Fulfilled Status */}
                {req.status === "fulfilled" ? (
                  <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5">
                    <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>This donation request has been marked as fulfilled</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleWhatsAppDonate(req)}
                    className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm hover:shadow cursor-pointer"
                  >
                    <Gift size={14} />
                    <span>Contact Coordinator via WhatsApp to Donate</span>
                  </button>
                )}

                {/* Owner Actions & Report Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    {/* Owner controls */}
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(req)}
                          className="font-bold text-slate-600 dark:text-slate-300 hover:text-primary flex items-center gap-1 cursor-pointer"
                        >
                          <Edit size={11} />
                          <span>Edit</span>
                        </button>

                        {req.status === "fulfilled" ? (
                          <button
                            type="button"
                            onClick={() => handleReopenRequest(req.id)}
                            className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={11} />
                            <span>Reopen</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkFulfilled(req.id)}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle size={11} />
                            <span>Fulfilled</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(req.id)}
                          className="font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Report action for fraud / spam */}
                  <button
                    type="button"
                    onClick={() => setReportingRequest(req)}
                    className="text-slate-400 hover:text-rose-500 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Flag size={11} />
                    <span>Report this request</span>
                  </button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {showOnlyMyRequests && myRequestsFilter === "fulfilled"
                ? "No fulfilled requests yet."
                : "No donation requests match your active filters."}
            </p>
            <p className="text-[11px] text-slate-400">
              {showOnlyMyRequests && myRequestsFilter === "fulfilled"
                ? "When you mark your completed requests as fulfilled, they will appear here."
                : "Try switching filters or click '+ Request Donation' to submit a new community need."}
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={Boolean(reportingRequest)}
        onClose={() => setReportingRequest(null)}
        donation={reportingRequest}
        onReportSubmitted={() => onRequestUpdated(donationService.list())}
      />
    </div>
  );
};

export default DonationFeed;
