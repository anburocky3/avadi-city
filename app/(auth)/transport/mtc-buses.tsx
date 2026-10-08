"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bus,
  Timer,
  MapPin,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Filter,
  Navigation,
} from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/shared-components";

// --- TYPESCRIPT DEFINITIONS ---

export type BusDirection = "all" | "city" | "suburb";

export interface MtcBusRoute {
  id: string;
  routeNo: string;
  from: string;
  to: string;
  avadiStopName: string; // Exact boarding point in Avadi
  direction: "city" | "suburb"; // city = towards CMBT/Broadway, suburb = towards Redhills/Poonamallee/Tiruvallur
  timings: string[]; // Chronological 24-hr strings ["06:15", "07:30", "08:55", ...]
  stops: string[]; // Array of stop names for clean rendering
  type: "Ordinary" | "Express" | "Deluxe" | "AC";
  duration: string; // Estimated trip duration
}

// Curated verified Avadi MTC database
const AVADI_MTC_DATABASE: MtcBusRoute[] = [
  {
    id: "mtc-70h",
    routeNo: "70H",
    from: "Avadi Bus Terminus",
    to: "M.G.R. Koyambedu (CMBT)",
    avadiStopName: "Avadi Bus Depot",
    direction: "city",
    timings: [
      "05:30",
      "06:15",
      "07:00",
      "07:45",
      "08:30",
      "09:15",
      "10:00",
      "11:15",
      "13:30",
      "15:45",
      "17:15",
      "18:30",
      "19:45",
      "21:00",
    ],
    stops: [
      "Avadi Bus Terminus",
      "Avadi Checkpost",
      "Ambattur OT",
      "Ambattur Estate",
      "Wavin",
      "Collector Nagar",
      "Koyambedu Roundana",
      "M.G.R. Koyambedu (CMBT)",
    ],
    type: "Express",
    duration: "50m",
  },
  {
    id: "mtc-71e",
    routeNo: "71E",
    from: "Ambattur OT",
    to: "Broadway Bus Terminus",
    avadiStopName: "Avadi Market / Checkpost",
    direction: "city",
    timings: [
      "05:00",
      "06:20",
      "07:10",
      "08:05",
      "09:00",
      "10:20",
      "12:00",
      "14:15",
      "16:30",
      "17:50",
      "19:00",
      "20:30",
    ],
    stops: [
      "Avadi Checkpost",
      "Thirumullaivoyal",
      "Ambattur OT",
      "Padi",
      "Anna Nagar West",
      "Kilpauk",
      "Egmore",
      "Central Railway Station",
      "Broadway",
    ],
    type: "Ordinary",
    duration: "1h 15m",
  },
  {
    id: "mtc-62",
    routeNo: "62",
    from: "Poonamallee",
    to: "Redhills",
    avadiStopName: "Govardhanagiri / Avadi Junction",
    direction: "suburb",
    timings: [
      "05:45",
      "06:40",
      "07:30",
      "08:25",
      "09:30",
      "11:00",
      "13:15",
      "15:20",
      "16:45",
      "18:10",
      "19:30",
      "21:15",
    ],
    stops: [
      "Poonamallee",
      "Karayanchavadi",
      "Govardhanagiri",
      "Avadi Checkpost",
      "Thirumullaivoyal",
      "Ambattur OT",
      "Puzhal",
      "Redhills",
    ],
    type: "Ordinary",
    duration: "1h 05m",
  },
  {
    id: "mtc-27b",
    routeNo: "27B",
    from: "Avadi Bus Terminus",
    to: "Anna Square / Marina Beach",
    avadiStopName: "Avadi Bus Depot",
    direction: "city",
    timings: [
      "05:15",
      "06:30",
      "07:45",
      "08:50",
      "10:10",
      "12:30",
      "15:00",
      "17:10",
      "18:40",
      "20:15",
    ],
    stops: [
      "Avadi Bus Terminus",
      "Ambattur OT",
      "Anna Nagar",
      "Loyola College",
      "Triplicane",
      "Chepauk",
      "Anna Square",
    ],
    type: "Express",
    duration: "1h 20m",
  },
  {
    id: "mtc-77",
    routeNo: "77",
    from: "Avadi Bus Terminus",
    to: "Koyambedu Market",
    avadiStopName: "Avadi Bus Depot",
    direction: "city",
    timings: [
      "06:00",
      "07:15",
      "08:30",
      "09:45",
      "11:30",
      "14:00",
      "16:15",
      "17:45",
      "19:15",
      "20:45",
    ],
    stops: [
      "Avadi Bus Terminus",
      "Thirumullaivoyal",
      "Ambattur Estate",
      "Maduravoyal",
      "Koyambedu Market",
    ],
    type: "Ordinary",
    duration: "45m",
  },
  {
    id: "mtc-104",
    routeNo: "104",
    from: "Avadi Bus Terminus",
    to: "Tambaram",
    avadiStopName: "Avadi Bus Depot",
    direction: "suburb",
    timings: [
      "05:30",
      "07:00",
      "08:30",
      "10:30",
      "13:00",
      "16:00",
      "18:00",
      "19:30",
      "21:00",
    ],
    stops: [
      "Avadi Bus Terminus",
      "Poonamallee",
      "Porur Bypass",
      "Maduravoyal Bypass",
      "Perungalathur",
      "Tambaram",
    ],
    type: "Deluxe",
    duration: "1h 30m",
  },
  {
    id: "mtc-12g",
    routeNo: "12G",
    from: "Kadhavoor Road Junction",
    to: "Lady Willingdon College",
    avadiStopName: "Kovilpadagai / Avadi Checkpost",
    direction: "city",
    timings: [
      "06:10",
      "07:40",
      "08:55",
      "10:30",
      "13:15",
      "16:30",
      "18:15",
      "20:00",
    ],
    stops: [
      "Kadhavoor Road",
      "Srbharathi Nagar",
      "Murugappa Polytechnic",
      "Avadi Checkpost",
      "Nathamuni",
      "Kilpauk Garden",
      "Lady Willingdon College",
    ],
    type: "Ordinary",
    duration: "1h 10m",
  },
];

// Quick tap filter pills for top Avadi routes
const QUICK_ROUTES = ["All", "70H", "71E", "62", "27B", "77", "104", "12G"];

// Helper: Convert 24-hr "HH:MM" to 12-hr "H:MM AM/PM" (handles 24:00+ edge cases)
const format12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return time24;
  let [hours, minutes] = time24.split(":").map(Number);
  hours = hours % 24; // Convert 24:30 to 00:30
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
};

// Helper: Convert relative minutes into clean "Xh Ym" or "Xm" display
const formatRelativeTime = (totalMins: number): string => {
  if (totalMins <= 0) return "Departing now";
  if (totalMins < 60) return `in ${totalMins} min${totalMins === 1 ? "" : "s"}`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
};

export const MtcBuses: React.FC = () => {
  const [activeDirection, setActiveDirection] = useState<BusDirection>("all");
  const [selectedQuickRoute, setSelectedQuickRoute] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Initialize clock with real browser time
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    };
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter buses by Direction, Quick Route Pill, and Search Query
  const filteredBuses = useMemo(() => {
    return AVADI_MTC_DATABASE.filter((bus) => {
      // 1. Direction Filter
      if (activeDirection !== "all" && bus.direction !== activeDirection)
        return false;

      // 2. Quick Pill Filter
      if (selectedQuickRoute !== "All" && bus.routeNo !== selectedQuickRoute)
        return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRoute = bus.routeNo.toLowerCase().includes(q);
        const matchDest =
          bus.to.toLowerCase().includes(q) ||
          bus.from.toLowerCase().includes(q);
        const matchStop = bus.stops.some((s) => s.toLowerCase().includes(q));
        const matchAvadi = bus.avadiStopName.toLowerCase().includes(q);
        return matchRoute || matchDest || matchStop || matchAvadi;
      }

      return true;
    });
  }, [activeDirection, selectedQuickRoute, searchQuery]);

  return (
    <div className="space-y-5">
      {/* 1. DIRECTION & SEARCH HEADER DECK */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        {/* Top Row: Search Input + Direction Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedQuickRoute !== "All") setSelectedQuickRoute("All");
              }}
              placeholder="Search bus route (70H, 62) or stop (CMBT, Anna Nagar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Direction Segmented Control */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0 self-start sm:self-center">
            {[
              { id: "all", label: "All Routes" },
              { id: "city", label: "Towards City ➔" },
              { id: "suburb", label: "⬅ Suburbs" },
            ].map((tab) => {
              const isSelected = activeDirection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDirection(tab.id as BusDirection)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Quick-Tap Avadi Route Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter size={11} className="text-emerald-500" />
            Quick Route:
          </span>
          {QUICK_ROUTES.map((route) => {
            const isSelected = selectedQuickRoute === route;
            return (
              <button
                key={route}
                onClick={() => {
                  setSelectedQuickRoute(route);
                  if (searchQuery) setSearchQuery("");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-white shadow-2xs scale-[1.03]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {route === "All" ? "All" : `Route ${route}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MTC BUSES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Avadi Bus Timetable ({filteredBuses.length} Routes Found)
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Clock size={12} className="text-emerald-500" />
            Clock: {format12Hour(currentTimeStr)}
          </span>
        </div>

        {filteredBuses.length > 0 ? (
          filteredBuses.map((bus) => {
            const isExpanded = expandedCardId === bus.id;

            // Chronological departure classification
            const pastTimings: string[] = [];
            let nextTiming: string | null = null;
            const futureTimings: string[] = [];

            for (const t of bus.timings) {
              if (t < currentTimeStr) {
                pastTimings.push(t);
              } else if (!nextTiming) {
                nextTiming = t;
              } else {
                futureTimings.push(t);
              }
            }

            // Calculate live relative countdown for Next Bus
            let diffMins: number | null = null;
            if (nextTiming) {
              const [nowH, nowM] = currentTimeStr.split(":").map(Number);
              const [nextH, nextM] = nextTiming.split(":").map(Number);
              diffMins = Math.max(0, nextH * 60 + nextM - (nowH * 60 + nowM));
            }

            return (
              <Card
                key={bus.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 hover:shadow-md transition-all duration-200"
              >
                {/* Top Deck: Route Badge, Title & Live Countdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                    {/* Vibrant Route Number Pillar */}
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/10 border border-emerald-400">
                      <span className="text-sm leading-none tracking-tight">
                        {bus.routeNo}
                      </span>
                      <span className="text-[7px] uppercase tracking-tighter opacity-90 mt-0.5">
                        MTC BUS
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {bus.from} ➔ {bus.to}
                        </span>
                        <Badge
                          variant={
                            bus.type === "Express" ? "success" : "secondary"
                          }
                        >
                          {bus.type}
                        </Badge>
                      </div>

                      {/* Explicit Avadi Boarding Point Badge */}
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg w-fit border border-slate-200/60 dark:border-slate-700">
                        <MapPin
                          size={12}
                          className="text-emerald-500 shrink-0"
                        />
                        <span>
                          Board at:{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {bus.avadiStopName}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Next Departure Countdown & Trip Duration */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                    {nextTiming && diffMins !== null ? (
                      <span
                        className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 font-mono animate-pulse"
                        style={{ animationDuration: "3s" }}
                      >
                        <Timer size={13} className="shrink-0" />
                        <span>Next {formatRelativeTime(diffMins)}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                        No remaining departures
                      </span>
                    )}

                    <span
                      className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800"
                      title="Total Route Duration"
                    >
                      ⏱ {bus.duration}
                    </span>
                  </div>
                </div>

                {/* Middle Deck: Clean Timeline (Earlier / Next / Later) */}
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/60 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>
                      Avadi Schedule ({bus.timings.length} Daily Trips)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {nextTiming
                        ? `Departing at ${format12Hour(nextTiming)}`
                        : "Service Ended"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {/* Show up to 2 past timings */}
                    {pastTimings.slice(-2).map((t) => (
                      <div
                        key={`past-${t}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-mono text-xs line-through shrink-0 font-medium"
                      >
                        {format12Hour(t)}
                      </div>
                    ))}

                    {/* Show NEXT bus highlighted */}
                    {nextTiming && (
                      <div className="px-3 py-1 rounded-lg bg-orange-500 text-white font-mono text-xs font-black shadow-sm shrink-0 ring-2 ring-orange-500/30 flex items-center gap-1 scale-105">
                        <span>★ {format12Hour(nextTiming)}</span>
                      </div>
                    )}

                    {/* Show up to 4 future timings */}
                    {futureTimings.slice(0, 4).map((t) => (
                      <div
                        key={`fut-${t}`}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold shrink-0 hover:border-emerald-500 transition-colors"
                      >
                        {format12Hour(t)}
                      </div>
                    ))}

                    {futureTimings.length > 4 && (
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 pl-1">
                        +{futureTimings.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Deck: Expandable Route Stops Accordion Toggle */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <button
                    onClick={() =>
                      setExpandedCardId(isExpanded ? null : bus.id)
                    }
                    className="w-full flex items-center justify-between text-xs font-extrabold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Navigation size={13} className="text-emerald-500" />
                      <span>
                        View Route Stops ({bus.stops.length} stations)
                      </span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pt-2.5"
                      >
                        <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                            {bus.stops.map((stop, idx) => {
                              const isAvadi = stop
                                .toLowerCase()
                                .includes("avadi");
                              return (
                                <React.Fragment key={stop}>
                                  <span
                                    className={
                                      isAvadi
                                        ? "text-emerald-600 dark:text-emerald-400 font-black underline decoration-emerald-500/50 decoration-2"
                                        : ""
                                    }
                                  >
                                    {stop}
                                  </span>
                                  {idx < bus.stops.length - 1 && (
                                    <span className="text-slate-300 dark:text-slate-600 mx-1.5">
                                      ➔
                                    </span>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={Bus}
            title="No MTC buses matching this filter"
            description="We couldn't find any Avadi buses matching your active route pill or search query. Try switching back to 'All Routes'."
          />
        )}
      </div>
    </div>
  );
};

export default MtcBuses;
