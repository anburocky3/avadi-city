"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Power,
  Droplet,
  CloudRain,
  MapPin,
  Check,
  EyeOff,
  Radio,
  Rss,
  ArrowLeft,
  PackageSearch,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  User,
  ExternalLink,
  X,
  ShieldCheck,
  Send,
  Clock,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useWard } from "@/context/wardContext";
import { Card, Badge, Modal, EmptyState } from "@/components/shared-components";

// --- TYPESCRIPT DEFINITIONS ---

export interface AlertItem {
  id: string | number;
  title: string;
  description: string;
  category: string;
  severity: "urgent" | "maintenance" | "info" | string;
  affectedWards: "All" | number[] | string[];
  date: string | number | Date;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
}

interface WardContextType {
  activeWard: {
    id: number;
    name: string;
    [key: string]: any;
  };
  alerts: AlertItem[];
  dismissedAlerts: (string | number)[];
  readAlerts: (string | number)[];
  dismissAlert: (id: string | number) => void;
  markAlertAsRead: (id: string | number) => void;
  isAuthenticated: boolean;
  authUser: any;
}

// Incoming claim (owner's view): someone claiming my item
interface IncomingClaimNotification {
  id: string;
  lostFoundItemId: string;
  message: string;
  imageUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string };
  owner: { id: string; name: string };
  item: {
    id: string;
    itemId: string;
    title: string;
    type: "lost" | "found";
    category: string;
    imageUrl?: string | null;
    status: string;
  };
}

// Outgoing claim (requester/finder's view): claim I sent and its current status
interface OutgoingClaimNotification {
  id: string;
  lostFoundItemId: string;
  message: string;
  imageUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string };
  owner: { id: string; name: string };
  item: {
    id: string;
    itemId: string;
    title: string;
    type: "lost" | "found";
    category: string;
    imageUrl?: string | null;
    status: string;
  };
}

export const Notification: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Unwrap Ward Context with strict typing
  const {
    activeWard = { id: 14, name: "Avadi Central" },
    alerts = [],
    dismissedAlerts = [],
    readAlerts = [],
    dismissAlert = () => {},
    markAlertAsRead = () => {},
    isAuthenticated = false,
  } = useWard() as unknown as WardContextType;

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [subscribeMyWard, setSubscribeMyWard] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // Expanded proof photo preview modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Track actioning state per claim
  const [actioningClaimId, setActioningClaimId] = useState<string | null>(null);
  // Revealed phones after Accept (keyed by claimId)
  const [revealedPhones, setRevealedPhones] = useState<
    Record<string, { name: string; phone: string }>
  >({});

  // ── OWNER: Fetch incoming claims where I am the item owner ──
  const {
    data: incomingClaims = [],
    isLoading: isLoadingIncoming,
    refetch: refetchIncoming,
  } = useQuery<IncomingClaimNotification[]>({
    queryKey: ["lost-found-claims-owner-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/lost-found/claims?role=owner", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  // ── REQUESTER: Fetch claims I sent to others ──
  const {
    data: outgoingClaims = [],
    isLoading: isLoadingOutgoing,
    refetch: refetchOutgoing,
  } = useQuery<OutgoingClaimNotification[]>({
    queryKey: ["lost-found-claims-requester-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/lost-found/claims?role=requester", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const pendingIncoming = useMemo(
    () => incomingClaims.filter((c) => c.status === "PENDING"),
    [incomingClaims],
  );

  const acceptedOutgoing = useMemo(
    () => outgoingClaims.filter((c) => c.status === "ACCEPTED"),
    [outgoingClaims],
  );

  const totalClaimActivity = incomingClaims.length + outgoingClaims.length;

  // Handle Accept / Deny from notification (owner action)
  const handleClaimAction = async (
    claimId: string,
    action: "ACCEPTED" | "REJECTED",
  ) => {
    setActioningClaimId(claimId);
    try {
      const res = await fetch(`/api/lost-found/claims/${claimId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (action === "ACCEPTED") {
        setRevealedPhones((prev) => ({
          ...prev,
          [claimId]: { name: data.requesterName, phone: data.requesterPhone },
        }));
      }

      await queryClient.invalidateQueries({
        queryKey: ["lost-found-claims-owner-notifications"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["lost-found-claims-badge"],
      });
      refetchIncoming();
      refetchOutgoing();
    } catch (err: any) {
      alert(err.message || "Failed to update claim");
    } finally {
      setActioningClaimId(null);
    }
  };

  // Categories list with dynamic Claims counter
  const categories: Category[] = useMemo(() => {
    const claimBadge =
      pendingIncoming.length + acceptedOutgoing.length;
    const list: Category[] = [
      { id: "All", name: "All Alerts" },
      {
        id: "Claims",
        name: `Claim Requests${claimBadge > 0 ? ` (${claimBadge})` : ""}`,
      },
      { id: "My Ward", name: "My Ward Only" },
      { id: "TNEB/Power", name: "Power Cuts" },
      { id: "Water Supply", name: "Water Notices" },
      { id: "Civic Notices", name: "Civic Notices" },
      { id: "Weather", name: "Weather" },
    ];
    return list;
  }, [pendingIncoming.length, acceptedOutgoing.length]);

  // Filter alerts based on active toggles, read/unread state, and category
  const filteredAlerts = useMemo(() => {
    if (activeCategory === "Claims") return [];

    return alerts.filter((alert) => {
      if (dismissedAlerts.includes(alert.id)) return false;

      const matchesWard =
        alert.affectedWards === "All" ||
        (Array.isArray(alert.affectedWards) &&
          alert.affectedWards.some(
            (wardId) => Number(wardId) === activeWard.id,
          ));

      if (subscribeMyWard && !matchesWard) return false;

      if (activeCategory === "My Ward") {
        return matchesWard;
      }
      if (activeCategory !== "All") {
        return alert.category === activeCategory;
      }

      return true;
    });
  }, [alerts, dismissedAlerts, subscribeMyWard, activeCategory, activeWard.id]);

  // Show claims in All tab and Claims tab
  const showClaims =
    activeCategory === "All" || activeCategory === "Claims";

  const getSeverityStyles = (severity: string): string => {
    if (severity === "urgent")
      return "border-l-rose-500 dark:border-l-rose-600";
    if (severity === "maintenance")
      return "border-l-amber-500 dark:border-l-amber-600";
    return "border-l-sky-500 dark:border-l-sky-600";
  };

  const getSeverityBadge = (
    severity: string,
  ): "danger" | "warning" | "info" => {
    if (severity === "urgent") return "danger";
    if (severity === "maintenance") return "warning";
    return "info";
  };

  const getAlertIcon = (category: string): React.ReactNode => {
    if (category.includes("Power") || category.includes("TNEB")) {
      return <Power size={14} className="text-amber-500" />;
    }
    if (category.includes("Water")) {
      return <Droplet size={14} className="text-blue-500" />;
    }
    if (category.includes("Weather")) {
      return <CloudRain size={14} className="text-sky-500" />;
    }
    return <Bell size={14} className="text-primary" />;
  };

  const handleOpenAlert = (alert: AlertItem): void => {
    markAlertAsRead(alert.id);
    setSelectedAlert(alert);
  };

  const totalItemsCount = filteredAlerts.length + (showClaims ? totalClaimActivity : 0);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Title Header with Back to Overview Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline cursor-pointer mb-1.5"
          >
            <ArrowLeft size={13} />
            <span>Back to Overview</span>
          </button>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            Local Alerts Center
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center">
            <Radio size={12} className="text-rose-500 animate-pulse mr-1" />
            <span>Live local safety, claim requests, and civic notices.</span>
          </p>
        </div>

        {/* Live Subscribe toggle */}
        <label className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={subscribeMyWard}
            onChange={(e) => setSubscribeMyWard(e.target.checked)}
            className="rounded text-primary focus:ring-primary w-4 h-4"
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-400">
            Ward {activeWard.id} Only
          </span>
        </label>
      </div>

      {/* Filter Chips */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none flex space-x-2">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const isClaimsTab = cat.id === "Claims";
          const hasActivity = isClaimsTab && (pendingIncoming.length + acceptedOutgoing.length) > 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition duration-200 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-sm"
                  : hasActivity
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-extrabold"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {isClaimsTab && <PackageSearch size={13} className="text-orange-500" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── SECTION: INCOMING CLAIMS (Owner's View) ── */}
      {showClaims && incomingClaims.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <PackageSearch size={14} className="text-orange-500" />
              Incoming Item Contact Requests ({incomingClaims.length})
            </h2>
            <button
              onClick={() => router.push("/lost-found?tab=my")}
              className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <span>Manage My Reports</span>
              <ExternalLink size={10} />
            </button>
          </div>

          {incomingClaims.map((claim) => {
            const isPending = claim.status === "PENDING";
            const isAccepted = claim.status === "ACCEPTED";
            const isRejected = claim.status === "REJECTED";
            const phoneInfo = revealedPhones[claim.id];

            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs"
                    : isAccepted
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Header: Item & Status */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        claim.item.type === "lost"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {claim.item.type === "lost" ? "🔴 Lost Item" : "🟢 Found Item"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                      {claim.item.title}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      isPending
                        ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                        : isAccepted
                          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                {/* Claimant info */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                    <User size={12} className="text-orange-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {claim.requester.name}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {new Date(claim.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Their Description / Proof Note */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 mb-2.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Their Description / Proof Note
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {claim.message}
                  </p>
                </div>

                {/* Proof Photo (Mandatory) */}
                {claim.imageUrl && (
                  <div className="mb-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <span>Uploaded Proof Photo</span>
                      <span className="text-[9px] text-orange-500 font-bold">(Tap to enlarge)</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(claim.imageUrl || null)}
                      className="group relative w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block cursor-pointer hover:ring-2 hover:ring-orange-500 transition"
                    >
                      <img
                        src={claim.imageUrl}
                        alt="Claim proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                    </button>
                  </div>
                )}

                {/* Revealed Contact Phone (If Accepted) */}
                {(isAccepted || phoneInfo) && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-2">
                    <Phone size={15} className="text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">
                        Phone Number Exchanged
                      </p>
                      {phoneInfo ? (
                        <a
                          href={`tel:${phoneInfo.phone}`}
                          className="text-sm font-black text-emerald-900 dark:text-emerald-200 hover:underline"
                        >
                          📞 {phoneInfo.name}: {phoneInfo.phone}
                        </a>
                      ) : (
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Phone unlocked. View in My Reports section.
                        </p>
                      )}
                    </div>
                    {phoneInfo && (
                      <a
                        href={`tel:${phoneInfo.phone}`}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black transition shrink-0"
                      >
                        Call
                      </a>
                    )}
                  </div>
                )}

                {/* Rejected state */}
                {isRejected && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 mb-2">
                    <XCircle size={14} className="text-slate-400 shrink-0" />
                    <p className="text-[11px] text-slate-500 font-medium">
                      You declined this request.
                    </p>
                  </div>
                )}

                {/* Direct Action Buttons for PENDING */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actioningClaimId === claim.id}
                      onClick={() => handleClaimAction(claim.id, "ACCEPTED")}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {actioningClaimId === claim.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      <span>Accept &amp; Share Numbers</span>
                    </button>

                    <button
                      type="button"
                      disabled={actioningClaimId === claim.id}
                      onClick={() => handleClaimAction(claim.id, "REJECTED")}
                      className="py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} />
                      <span>Deny</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── SECTION: OUTGOING CLAIMS (Requester/Finder's View) ── */}
      {showClaims && outgoingClaims.length > 0 && (
        <div className="space-y-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Send size={14} className="text-blue-500" />
            My Sent Claim Requests ({outgoingClaims.length})
          </h2>

          {outgoingClaims.map((claim) => {
            const isPending = claim.status === "PENDING";
            const isAccepted = claim.status === "ACCEPTED";
            const isRejected = claim.status === "REJECTED";

            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60"
                    : isAccepted
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        claim.item.type === "lost"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {claim.item.type === "lost" ? "🔴 Lost" : "🟢 Found"}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {claim.item.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      isPending
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                        : isAccepted
                          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                {/* Status Banner */}
                {isPending && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 mb-2.5">
                    <Clock size={13} className="text-blue-500 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-[11px] font-black text-blue-700 dark:text-blue-400">
                        Claim Request Sent — Under Review
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-500 font-medium">
                        The item owner will review your request and proof photo. You will be notified here once they respond.
                      </p>
                    </div>
                  </div>
                )}

                {isAccepted && (
                  <div className="mb-2.5 space-y-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                          🎉 Claim Accepted! Owner accepted your request.
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                          Contact details have been unlocked below. Please arrange a safe handover.
                        </p>
                      </div>
                    </div>

                    {/* Direct Phone Call Card — Owner's contact */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <Phone size={16} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                          Owner&apos;s Contact (Unlocked)
                        </p>
                        <p className="text-xs font-black text-slate-800 dark:text-white">
                          {claim.owner.name}
                        </p>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            // Phone fetched from GET /api/lost-found/claims/[claimId]
                            // Navigate to item detail to see full contact
                            router.push("/lost-found");
                          }}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                        >
                          View full contact in Lost &amp; Found → My Reports
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/lost-found")}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-black transition shrink-0"
                      >
                        Go →
                      </button>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 mb-2.5">
                    <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-black text-red-700 dark:text-red-400">
                        Claim Request Declined
                      </p>
                      <p className="text-[10px] text-red-600 dark:text-red-500 font-medium">
                        The item owner reviewed your request and did not match your proof. You may try again with more specific details.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sent on info */}
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Sent on{" "}
                  {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Show empty state for Claims tab only ── */}
      {activeCategory === "Claims" && totalClaimActivity === 0 && !isLoadingIncoming && !isLoadingOutgoing && (
        <EmptyState
          icon={PackageSearch}
          title="No claim activity"
          description="You have no incoming or outgoing claim requests. Once someone contacts you about a lost/found item, you will see it here."
        />
      )}

      {/* Alerts Feed */}
      <AnimatePresence mode="wait">
        {filteredAlerts.length > 0 ? (
          <div className="space-y-3.5">
            {filteredAlerts.map((alert) => {
              const isUnread = !readAlerts.includes(alert.id);
              const affectedLabel = Array.isArray(alert.affectedWards)
                ? `Wards ${alert.affectedWards.join(", ")}`
                : "All Avadi";

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <Card
                    onClick={() => handleOpenAlert(alert)}
                    className={`flex items-start border-l-4 hover:shadow p-4 bg-white dark:bg-slate-900 border ${getSeverityStyles(
                      alert.severity,
                    )}`}
                  >
                    <div className="mr-3 mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      {getAlertIcon(alert.category)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <Badge variant={getSeverityBadge(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                          <MapPin size={10} className="mr-0.5" />
                          {affectedLabel}
                        </span>

                        {/* Pulsing unread indicator */}
                        {isUnread && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-600 font-black animate-pulse uppercase">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-2 leading-snug">
                        {alert.title}
                      </h3>

                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(alert.date).toLocaleDateString()} at{" "}
                        {new Date(alert.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Quick Dismiss icon */}
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer self-start"
                      title="Dismiss alert"
                    >
                      <EyeOff size={14} />
                    </button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : totalItemsCount === 0 && activeCategory !== "Claims" ? (
          <EmptyState
            icon={Rss}
            title="All quiet here"
            description="There are no active notifications or contact requests matching your filters."
            actionText="Clear Filters"
            onAction={() => {
              setActiveCategory("All");
              setSubscribeMyWard(false);
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* PROOF PHOTO EXPANDED MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-orange-500" />
                Claimant&apos;s Uploaded Proof Photo
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[70vh] overflow-hidden rounded-2xl bg-black/5">
              <img
                src={previewPhoto}
                alt="Proof Photo Full"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ALERT DETAIL MODAL */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={selectedAlert.category}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge
                variant={getSeverityBadge(selectedAlert.severity)}
                className="uppercase"
              >
                {selectedAlert.severity}
              </Badge>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                <MapPin size={11} className="mr-0.5" />
                {Array.isArray(selectedAlert.affectedWards)
                  ? `Wards ${selectedAlert.affectedWards.join(", ")}`
                  : "All Avadi"}
              </span>
            </div>

            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">
              {selectedAlert.title}
            </h3>

            <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {selectedAlert.description}
            </p>

            <div className="flex space-x-2.5 pt-2">
              <button
                onClick={() => {
                  dismissAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
                className="flex-1 py-3 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1 cursor-pointer"
              >
                <EyeOff size={14} />
                <span>Dismiss Alert</span>
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Check size={14} />
                <span>Done Reading</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Notification;
