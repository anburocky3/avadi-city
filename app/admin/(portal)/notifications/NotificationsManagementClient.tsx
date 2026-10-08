"use client";

import React, { useState, useTransition } from "react";
import { broadcastPushNotificationAction } from "@/app/actions/adminActions";
import {
  BellRing,
  Send,
  Radio,
  Users,
  MapPin,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface BroadcastLog {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  targetWard: string;
  sentAt: string;
  recipientCount: number;
}

interface NotificationsManagementClientProps {
  totalRegisteredUsers: number;
  currentWard: number;
  isSuperAdmin: boolean;
}

export function NotificationsManagementClient({
  totalRegisteredUsers,
  currentWard,
  isSuperAdmin,
}: NotificationsManagementClientProps) {
  const [title, setTitle] = useState("Urgent Civic Update: Avadi Corporation");
  const [description, setDescription] = useState(
    "Scheduled road restoration works commencing on CTH Road. Please use alternate transit routes via Kamaraj Nagar."
  );
  const [category, setCategory] = useState("Civic Notices");
  const [severity, setSeverity] = useState<"urgent" | "maintenance" | "info">("urgent");
  const [targetWard, setTargetWard] = useState<string>("All");
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Broadcast history state
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([
    {
      id: "BC-17912001",
      title: "Scheduled Power Shutdown: Wards 1 to 5",
      description: "TNEB maintenance shutdown on 18th July from 9:00 AM to 5:00 PM.",
      category: "TNEB/Power",
      severity: "maintenance",
      targetWard: "Wards 1-5",
      sentAt: new Date(Date.now() - 3600000 * 48).toLocaleString(),
      recipientCount: 1420,
    },
    {
      id: "BC-17912002",
      title: "Heavy Rainfall Warning: Red Alert for Avadi",
      description: "Severe heavy rains predicted in Tiruvallur district. Emergency teams on standby.",
      category: "Weather",
      severity: "urgent",
      targetWard: "All Wards",
      sentAt: new Date(Date.now() - 3600000 * 24).toLocaleString(),
      recipientCount: 3840,
    },
  ]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // Live in-browser test push notification
  const handleTestBrowserPush = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    try {
      let permission = Notification.permission;
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        new Notification(title, {
          body: description,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
        showToast("success", "Sample push notification triggered on your screen!");
      } else {
        showToast("error", "Push notification permission denied in browser settings.");
      }
    } catch (err: any) {
      showToast("error", `Notification error: ${err.message}`);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      showToast("error", "Please provide a valid notification title and body.");
      return;
    }

    startTransition(async () => {
      const res = await broadcastPushNotificationAction({
        title,
        description,
        category,
        severity,
        targetWard,
      });

      if (res.success && res.data) {
        const newLog: BroadcastLog = {
          id: res.data.broadcastId,
          title,
          description,
          category,
          severity,
          targetWard: targetWard === "All" ? "All Wards (1-48)" : `Ward ${targetWard}`,
          sentAt: new Date().toLocaleString(),
          recipientCount: res.data.recipientCount,
        };

        setBroadcastLogs((prev) => [newLog, ...prev]);
        showToast("success", res.message);

        // Also trigger browser push for immediate admin feedback
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`[BROADCAST] ${title}`, {
            body: description,
            icon: "/favicon.ico",
          });
        }
      } else {
        showToast("error", res.message || "Failed to broadcast notification.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-900/90 text-emerald-100 border-emerald-700/60"
              : "bg-rose-900/90 text-rose-100 border-rose-700/60"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Civic Push Notifications Broadcast
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 uppercase flex items-center gap-1">
              <Radio size={11} className="animate-pulse" /> Live Broadcast System
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch high-priority civic notices, power/water alerts, and disaster warnings to all registered Avadi residents.
          </p>
        </div>

        <Link
          href="/notifications"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
        >
          <span>Resident Notification Feed</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Main Studio: Form on Left, Live Mobile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Compose Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing size={16} className="text-indigo-600" />
                Compose Broadcast Message
              </span>
              <span className="text-[11px] text-slate-500">
                Audience: <strong className="text-slate-700 dark:text-slate-300">{totalRegisteredUsers} Registered Users</strong>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Headline / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Red Alert: Heavy Rainfall Warning"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Message Body *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter clear, concise details for residents..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="urgent">🔴 Urgent / Emergency</option>
                  <option value="maintenance">🟡 Maintenance / Shutdown</option>
                  <option value="info">🔵 Informational Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Civic Notices">Civic Notices</option>
                  <option value="TNEB/Power">TNEB/Power Cuts</option>
                  <option value="Water Supply">Water Supply Notices</option>
                  <option value="Weather">Weather Alerts</option>
                  <option value="Health">Health & Camps</option>
                  <option value="Traffic">Traffic & Transit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Ward
                </label>
                <select
                  value={targetWard}
                  onChange={(e) => setTargetWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="All">All 48 Wards</option>
                  {Array.from({ length: 48 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Ward {i + 1} Only
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestBrowserPush}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Test on My Screen</span>
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Broadcast to Residents Now</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Device Push Notification Preview */}
        <div className="lg:col-span-5 bg-linear-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 text-white flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Smartphone size={14} className="text-indigo-400" />
                Resident Lockscreen Preview
              </span>
              <span className="font-mono text-[11px]">Push Simulator</span>
            </div>

            {/* Mobile Lockscreen Notification Card */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white">
                    A
                  </div>
                  <span className="font-bold tracking-wide">AVADI CIVIC ALERTS</span>
                </div>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white tracking-tight">
                  {title || "Urgent Notice Title"}
                </h4>
                <p className="text-xs text-slate-200 mt-0.5 line-clamp-3">
                  {description || "Notification body text will appear here."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  Target: {targetWard === "All" ? "All Wards" : `Ward ${targetWard}`}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    severity === "urgent"
                      ? "bg-rose-500/80 text-white"
                      : severity === "maintenance"
                      ? "bg-amber-500/80 text-white"
                      : "bg-blue-500/80 text-white"
                  }`}
                >
                  {severity}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-400">
            <p>
              💡 Broadcasts are delivered instantaneously via browser Web Push APIs and stored on the user notification timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast History Log */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Clock size={16} className="text-indigo-600" />
          Recent Notification Broadcast History
        </h3>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Broadcast ID</th>
                <th className="px-4 py-3">Headline & Details</th>
                <th className="px-4 py-3">Target Scope</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Dispatched Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {broadcastLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {log.id}
                  </td>
                  <td className="px-4 py-3">
                    <strong className="text-slate-900 dark:text-white block font-semibold">
                      {log.title}
                    </strong>
                    <span className="text-slate-500 line-clamp-1">{log.description}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {log.targetWard}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.severity === "urgent"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : log.severity === "maintenance"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {log.recipientCount.toLocaleString()} residents
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {log.sentAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
