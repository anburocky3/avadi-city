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
} from "lucide-react";

// Adjust path aliases according to your Next.js project structure
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
}

// Alert Category configuration
const categories: Category[] = [
  { id: "All", name: "All Alerts" },
  { id: "My Ward", name: "My Ward Only" },
  { id: "TNEB/Power", name: "Power Cuts" },
  { id: "Water Supply", name: "Water Notices" },
  { id: "Civic Notices", name: "Civic Notices" },
  { id: "Weather", name: "Weather" },
];

export const Notification: React.FC = () => {
  const router = useRouter();

  // Unwrap Ward Context with strict typing
  const {
    activeWard = { id: 14, name: "Avadi Central" },
    alerts = [],
    dismissedAlerts = [],
    readAlerts = [],
    dismissAlert = () => {},
    markAlertAsRead = () => {},
  } = useWard() as unknown as WardContextType;

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [subscribeMyWard, setSubscribeMyWard] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // Filter alerts based on active toggles, read/unread state, and category
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 1. Remove dismissed alerts
      if (dismissedAlerts.includes(alert.id)) return false;

      // 2. Check Ward subscription toggle
      const matchesWard =
        alert.affectedWards === "All" ||
        (Array.isArray(alert.affectedWards) &&
          alert.affectedWards.some(
            (wardId) => Number(wardId) === activeWard.id,
          ));

      if (subscribeMyWard && !matchesWard) return false;

      // 3. Category Filter
      if (activeCategory === "My Ward") {
        return matchesWard;
      }
      if (activeCategory !== "All") {
        return alert.category === activeCategory;
      }

      return true;
    });
  }, [alerts, dismissedAlerts, subscribeMyWard, activeCategory, activeWard.id]);

  // Alert severity color helper
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
            <span>Live local safety and utility announcements.</span>
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
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

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
        ) : (
          <EmptyState
            icon={Rss}
            title="All quiet here"
            description="There are no active local notifications matching your filters. We will notify you once new updates are published."
            actionText="Clear Filters"
            onAction={() => {
              setActiveCategory("All");
              setSubscribeMyWard(false);
            }}
          />
        )}
      </AnimatePresence>

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

            {/* Map placeholder */}
            <div className="h-32 bg-slate-100 dark:bg-slate-950 border rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs select-none">
              <MapPin className="text-rose-500 animate-bounce mb-1" size={20} />
              <span>Map Overlay of Affected Wards</span>
            </div>

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
