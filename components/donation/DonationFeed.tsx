"use client";

import React, { useState, useMemo } from "react";
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

export const DonationFeed: React.FC<DonationFeedProps> = ({
  requests,
  currentUserId,
  onCreateNew,
  onEdit,
  onRequestUpdated,
}) => {
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("All");
  const [selectedWard, setSelectedWard] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("approved"); // Default to approved community needs
  const [sortBy, setSortBy] = useState<"newest" | "urgent">("urgent");
  const [showOnlyMyRequests, setShowOnlyMyRequests] = useState<boolean>(false);

  // Report Modal state
  const [reportingRequest, setReportingRequest] =
    useState<DonationRequest | null>(null);

  // Filter & Sort Logic
  const filteredRequests = useMemo(() => {
    let result = requests.filter((req) => {
      // My Requests Filter
      if (showOnlyMyRequests && currentUserId) {
        return req.createdBy === currentUserId;
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

      // Status Filter
      const matchesStatus =
        selectedStatus === "All" || req.status === selectedStatus;

      return (
        matchesType &&
        matchesUrgency &&
        matchesWard &&
        matchesStatus
      );
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "urgent") {
        const priority: Record<DonationUrgency, number> = {
          Critical: 3,
          Urgent: 2,
          Normal: 1,
        };
        const pDiff = (priority[b.urgency] || 0) - (priority[a.urgency] || 0);
        if (pDiff !== 0) return pDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    requests,
    selectedType,
    selectedUrgency,
    selectedWard,
    selectedStatus,
    sortBy,
    showOnlyMyRequests,
    currentUserId,
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

  // Mark fulfilled
  const handleMarkFulfilled = (id: string) => {
    try {
      const updated = donationService.updateStatus(id, "fulfilled");
      toast.success("Request marked as fulfilled! Thank you for the community update.");
      onRequestUpdated(donationService.list());
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status.");
    }
  };

  // Delete Request
  const handleDeleteRequest = (id: string) => {
    if (confirm("Are you sure you want to delete this donation request?")) {
      donationService.remove(id);
      toast.info("Donation request deleted.");
      onRequestUpdated(donationService.list());
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Gift size={16} className="text-primary" />
            <span>Avadi Community Donation Needs</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Verified resident and relief requirements across all 48 wards
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Request CTA */}
          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Create Request</span>
          </button>
        </div>
      </div>

      {/* Filter Row 1: Ward, Type, Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Ward Filter */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          <option value="All">All 48 Wards</option>
          {Array.from({ length: 48 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={String(w)}>
              Ward {w}
            </option>
          ))}
        </select>

        {/* Request Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          {DONATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All Request Types" : t}
            </option>
          ))}
        </select>

        {/* Urgency Filter */}
        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          {URGENCIES.map((u) => (
            <option key={u} value={u}>
              {u === "All" ? "All Urgencies" : `Urgency: ${u}`}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Row 2: Tabs (All / My Requests / Status / Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setShowOnlyMyRequests(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !showOnlyMyRequests
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All Community Requests
          </button>

          <button
            type="button"
            onClick={() => setShowOnlyMyRequests(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              showOnlyMyRequests
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <User size={12} />
            <span>My Requests</span>
          </button>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="approved">Status: Approved</option>
            <option value="pending">Status: Pending Review</option>
            <option value="fulfilled">Status: Fulfilled</option>
            <option value="All">All Statuses</option>
          </select>
        </div>

        {/* Sort By Toggle */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-medium">Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy("urgent")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              sortBy === "urgent"
                ? "bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Most Urgent
          </button>
          <button
            type="button"
            onClick={() => setSortBy("newest")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              sortBy === "newest"
                ? "bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Donation Cards Feed */}
      <div className="space-y-4 pt-1">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isOwner = currentUserId && req.createdBy === currentUserId;

            return (
              <Card
                key={req.id}
                className="p-5 border bg-white dark:bg-slate-900 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Header Row: Type Badge, Urgency, Status, Ward Pill */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary" className="text-[10px] font-extrabold uppercase">
                      {req.type}
                    </Badge>
                    <StatusBadge type="urgency" value={req.urgency} />
                    <StatusBadge type="donationStatus" value={req.status} />
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

                {/* Needed Items Box (Shown if items present) */}
                {req.items && req.items.length > 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                        Needed Items
                      </span>
                      {req.requiredBy && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock size={11} /> Required by: {req.requiredBy}
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

                {/* Primary Action Button: WhatsApp to Donate */}
                <button
                  type="button"
                  onClick={() => handleWhatsAppDonate(req)}
                  className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm hover:shadow cursor-pointer"
                >
                  <Gift size={14} />
                  <span>Contact Coordinator via WhatsApp to Donate</span>
                </button>

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

                        {req.status !== "fulfilled" && (
                          <button
                            type="button"
                            onClick={() => handleMarkFulfilled(req.id)}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle size={11} />
                            <span>Mark Fulfilled</span>
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
              No donation requests match your active filters.
            </p>
            <p className="text-[11px] text-slate-400">
              Try switching filters or click "+ Create Request" to submit a new community need.
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
