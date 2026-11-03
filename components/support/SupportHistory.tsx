"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Calendar,
  Layers,
  Compass,
  ChefHat,
  HeartPulse,
  Wrench,
  Building2,
  Briefcase,
  Gift,
  Bus,
  PackageSearch,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  ImageIcon,
  Check,
  ShieldCheck,
  Copy,
} from "lucide-react";
import {
  getUserSupportTickets,
  SupportTicketItem,
} from "@/app/api/actions/support-actions";
import { toast } from "@/utils/toast";
import { Modal } from "@/components/shared-components";

// Category display mapping
const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ElementType; color: string; badge: string }
> = {
  OTHER: {
    label: "General / Suggestions",
    icon: HelpCircle,
    color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
    badge: "Ideas",
  },
  COMPLAINTS: {
    label: "Civic Complaints",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
    badge: "Grievances",
  },
  FEED: {
    label: "Community Feed",
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    badge: "Town Hall",
  },
  EXPLORE_PLACES: {
    label: "Explore Places",
    icon: Compass,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    badge: "Places",
  },
  FOOD_DINING: {
    label: "Food & Dining",
    icon: ChefHat,
    color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
    badge: "Food",
  },
  HOSPITALS_PHARMACIES: {
    label: "Hospitals & Pharmacies",
    icon: HeartPulse,
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    badge: "Health",
  },
  LOCAL_SERVICES: {
    label: "Local Services",
    icon: Wrench,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    badge: "Services",
  },
  RENT_PROPERTIES: {
    label: "Rent & Properties",
    icon: Building2,
    color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
    badge: "Rentals",
  },
  JOB_VACANCIES: {
    label: "Job Vacancies",
    icon: Briefcase,
    color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
    badge: "Jobs",
  },
  DONATIONS: {
    label: "Donations",
    icon: Gift,
    color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20",
    badge: "Donations",
  },
  TRAVEL_TRANSPORT: {
    label: "Transit & Travel",
    icon: Bus,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    badge: "Transport",
  },
  LOST_FOUND: {
    label: "Lost & Found",
    icon: PackageSearch,
    color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
    badge: "Lost & Found",
  },
};

type FilterStatus = "ALL" | "REVIEWING" | "RESOLVED";

interface SupportHistoryProps {
  onNavigateToForm?: () => void;
}

export default function SupportHistory({ onNavigateToForm }: SupportHistoryProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch tickets on mount and on refresh
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let cachedIds: string[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("avadi_user_support_tickets");
          if (raw) cachedIds = JSON.parse(raw);
        } catch {
          // ignore parsing error
        }
      }

      const res = await getUserSupportTickets(cachedIds);
      if (res.success && res.tickets) {
        setTickets(res.tickets);
      } else {
        toast.error(res.error || "Unable to fetch support history.");
      }
    } catch {
      toast.error("Failed to connect to support records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === "ALL") return true;
    return t.status === activeFilter;
  });

  // Counts (Only Total, Cleared, and Under Review)
  const totalCount = tickets.length;
  const clearedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const reviewingCount = tickets.filter((t) => t.status === "REVIEWING").length;

  const handleCopyId = (id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      toast.success("Ticket ID copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Chips & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "ALL", label: "All Tickets", count: totalCount },
              { key: "REVIEWING", label: "Under Review", count: reviewingCount },
              { key: "RESOLVED", label: "Cleared / Resolved", count: clearedCount },
            ] as const
          ).map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? filter.key === "RESOLVED"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-primary text-white border-primary shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-primary" : ""} />
            <span>Refresh</span>
          </button>
          {onNavigateToForm && (
            <button
              type="button"
              onClick={onNavigateToForm}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white text-xs font-black transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>New Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Loading / Empty / List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <RefreshCw size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Fetching ticket records from municipal database...
          </p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-14 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
            <Layers size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {activeFilter === "ALL"
              ? "No feedback submitted yet"
              : activeFilter === "RESOLVED"
              ? "No cleared / resolved reports found"
              : "No reports currently under review"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
            {activeFilter === "RESOLVED"
              ? "When municipal administrators inspect your feedback and mark it clear in the database, it will appear here."
              : "Reports you submit are directly logged into the technical queue and reviewed by the Avadi municipal team."}
          </p>
          {onNavigateToForm && (
            <button
              type="button"
              onClick={onNavigateToForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Submit a Report</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTickets.map((ticket) => {
              const catMeta = CATEGORY_MAP[ticket.featureCategory] || {
                label: ticket.featureCategory,
                icon: HelpCircle,
                color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                badge: "Feedback",
              };
              const CatIcon = catMeta.icon;
              const isCleared = ticket.status === "RESOLVED";

              const formattedDate = new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const formattedTime = new Date(ticket.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-200 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md space-y-4"
                >
                  {/* Top Bar: Meta Badges & Status Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${catMeta.color}`}
                      >
                        <CatIcon size={13} />
                        <span>{catMeta.label}</span>
                      </span>

                      {/* Ward Badge */}
                      {ticket.wardId && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <MapPin size={11} className="text-primary" />
                          <span>Ward {ticket.wardId}</span>
                        </span>
                      )}

                      {/* Monospace Short ID with click-to-copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyId(ticket.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition"
                        title="Click to copy ID"
                      >
                        <span>#{ticket.id.slice(-6).toUpperCase()}</span>
                        <Copy size={11} className="opacity-60" />
                      </button>
                    </div>

                    {/* Official Admin-Verified Status Pill */}
                    <div>
                      {isCleared ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                          <CheckCircle2 size={14} className="stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                          <span>Cleared / Resolved</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Clock size={13} className="stroke-[2.5] text-amber-600 dark:text-amber-400" />
                          <span>Under Technical Review</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Title & Clean Narrative Description */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {ticket.subCategory}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                      {ticket.description}
                    </p>

                    {/* Attached Photo Preview Trigger */}
                    {ticket.screenshotUrl && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(ticket.screenshotUrl)}
                          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <ImageIcon size={14} className="text-primary group-hover:scale-110 transition" />
                          <span>View Attached Photo</span>
                          <ExternalLink size={11} className="text-slate-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Professional Status Action Callout Banner */}
                  {isCleared ? (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check size={16} className="stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-emerald-900 dark:text-emerald-200 leading-snug">
                            Issue Verified & Cleared
                          </p>
                          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                            Action completed and closed in Avadi municipal database
                          </p>
                        </div>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                        <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Admin Verified</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Clock size={16} className="stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-amber-900 dark:text-amber-200 leading-snug">
                            Technical Review in Progress
                          </p>
                          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                            Report is currently in queue with the municipal tech department
                          </p>
                        </div>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 shrink-0 shadow-2xs">
                        <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                        <span>Active Review</span>
                      </span>
                    </div>
                  )}

                  {/* Card Footer: Timestamp & Details CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                      <Calendar size={13} />
                      <span>
                        Logged on {formattedDate} at {formattedTime}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                    >
                      <span>View Details</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Ticket Full Details Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Support Ticket Details"
        maxWidth="sm:max-w-xl"
      >
        {selectedTicket && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-mono text-xs font-bold text-primary">
                Ticket ID: {selectedTicket.id}
              </span>
              {selectedTicket.status === "RESOLVED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={13} />
                  <span>Cleared / Resolved</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Clock size={13} />
                  <span>Under Review</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Service & Subcategory
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {CATEGORY_MAP[selectedTicket.featureCategory]?.label || selectedTicket.featureCategory}{" "}
                — {selectedTicket.subCategory}
              </p>
              {selectedTicket.wardId && (
                <p className="text-xs font-semibold text-slate-500">
                  Reported from Ward {selectedTicket.wardId}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Description
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description}
              </div>
            </div>

            {selectedTicket.screenshotUrl && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Attached Screenshot
                </p>
                <div
                  className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer max-h-56 relative group"
                  onClick={() => setPreviewImage(selectedTicket.screenshotUrl)}
                >
                  <img
                    src={selectedTicket.screenshotUrl}
                    alt="Ticket attachment"
                    className="w-full h-auto object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <ExternalLink size={16} />
                    <span>Click to view full size</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Attached Screenshot"
        maxWidth="sm:max-w-3xl"
      >
        <div className="p-4">
          {previewImage && (
            <img
              src={previewImage}
              alt="Screenshot full view"
              className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
            />
          )}
          <div className="pt-4 text-right">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
