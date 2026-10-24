"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  Timer,
  Zap,
  Ticket,
  ExternalLink,
  Clock,
  Sparkles,
  MapPin,
  Filter,
} from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/shared-components";
import { calculateArrivalTime } from "@/utils/parseErail";

// --- TYPESCRIPT DEFINITIONS ---

export type TrainDirection = "all" | "east" | "west";

export interface SuburbanTrainSchedule {
  id: string;
  trainNo: string;
  time: string;
  direction: "east" | "west";
  origin: string;
  arrivalTime: string;
  avadiArriveTime: string;
  destination: string;
  platform: number | string;
  type: "Slow" | "Fast" | "AC" | string;
  duration: string;
}

const getDestCode = (destName: string): string => {
  const upper = destName.toUpperCase();
  if (
    upper.includes("MMC") ||
    upper.includes("CENTRAL SUBURBAN") ||
    upper === "MASS"
  )
    return "MASS";
  if (upper.includes("CENTRAL") || upper === "MAS") return "MAS";
  if (upper.includes("BEACH") || upper === "MSB") return "MSB";
  if (upper.includes("VELACHERY") || upper === "VLCY") return "VLCY";
  if (upper.includes("TIRUVALLUR") || upper === "TRL") return "TRL";
  if (upper.includes("ARAKKONAM") || upper === "AJJ") return "AJJ";
  if (upper.includes("TIRUTTANI") || upper === "TRT") return "TRT";
  if (upper.includes("SIDING") || upper === "PTMS") return "PTMS";
  if (upper.includes("DEPOT") || upper === "PRES") return "PRES";
  if (upper.includes("PERAMBUR") || upper === "PER") return "PER";
  if (upper.includes("KADAMBATTUR") || upper === "KBT") return "KBT";
  return destName.substring(0, 4).toUpperCase();
};

const format12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hoursStr, minutesStr] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutesStr} ${ampm}`;
};

const formatRelativeTime = (totalMins: number): string => {
  if (totalMins <= 0) return "Departing now";
  if (totalMins < 60) return `in ${totalMins} min${totalMins === 1 ? "" : "s"}`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
};

export const SuburbanTrains: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrainDirection>("all");
  const [trainsList, setTrainsList] = useState<SuburbanTrainSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    async function loadAvadiTrains() {
      try {
        const res = await fetch("/api/transport/trains/avadi");
        const data = await res.json();
        if (data.trains && Array.isArray(data.trains)) {
          setTrainsList(data.trains);
        }
      } catch (err) {
        console.error("Failed to load trains:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAvadiTrains();
  }, []);

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

  const filteredTrains = useMemo(() => {
    return trainsList
      .filter((train) => {
        const isFuture = train.time >= currentTimeStr;
        if (!isFuture) return false;
        if (activeTab === "all") return true;
        return train.direction === activeTab;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [trainsList, activeTab, currentTimeStr]);

  const soonestTrain = filteredTrains[0] || null;

  const minsUntilDeparture = useMemo(() => {
    if (!soonestTrain) return null;
    const [nowH, nowM] = currentTimeStr.split(":").map(Number);
    const [trainH, trainM] = soonestTrain.time.split(":").map(Number);
    const diff = trainH * 60 + trainM - (nowH * 60 + nowM);
    return diff >= 0 ? diff : 0;
  }, [soonestTrain, currentTimeStr]);

  // Dynamic helper text for the active directional filter
  const getFilterDescription = () => {
    switch (activeTab) {
      case "east":
        return "Showing Eastbound: MMC / Chennai Beach / Velachery";
      case "west":
        return "Showing Westbound: Tiruvallur / Arakkonam / Tiruttani";
      default:
        return "Showing All East & Westbound Avadi Departures";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. COMPACT INLINE DIRECTIONAL FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="space-y-0.5 min-w-0 pl-0.5">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-primary shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Avadi Station Direction
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
            {getFilterDescription()}
          </p>
        </div>

        {/* Sleek Right-Aligned Segmented Control */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0 self-start sm:self-center">
          {[
            { id: "west", label: "⬅ Tiruttani" },
            { id: "all", label: "All" },
            { id: "east", label: "Central ➔" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TrainDirection)}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {/* 2. ADAPTIVE HERO COUNTDOWN CARD */}
          {soonestTrain ? (
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/10 border border-orange-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 z-10 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Sparkles
                      size={10}
                      className="text-amber-200 animate-spin"
                    />
                    SOONEST DEPARTURE
                  </span>
                  <span className="text-[10px] font-bold text-white/90">
                    {soonestTrain.direction === "east"
                      ? "➔ Eastbound"
                      : "➔ Westbound"}
                  </span>
                  {soonestTrain.type === "Fast" && (
                    <span className="bg-rose-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full animate-pulse border border-rose-300">
                      ⚡ Fast Train
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-black tracking-tight pt-0.5 truncate">
                  To {soonestTrain.destination}
                </h3>

                <p className="text-xs text-white/90 font-semibold flex items-center gap-1.5 flex-wrap">
                  <span>
                    Train #{soonestTrain.trainNo} ({soonestTrain.type})
                  </span>
                  <span>·</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded font-black text-[10px]">
                    Platform {soonestTrain.platform}
                  </span>
                  <span>·</span>
                  <span>Departs at {format12Hour(soonestTrain.time)}</span>
                </p>
              </div>

              {minsUntilDeparture !== null && (
                <div className="bg-slate-950/40 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 text-center sm:text-right z-10 shrink-0">
                  <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <Timer
                      size={12}
                      className="animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                    <span>DEPARTS IN</span>
                  </div>
                  <span className="font-black text-2xl sm:text-3xl font-mono tracking-tight block mt-0.5">
                    {minsUntilDeparture >= 60
                      ? `${Math.floor(minsUntilDeparture / 60)}h ${minsUntilDeparture % 60}m`
                      : `${minsUntilDeparture} mins`}
                  </span>
                </div>
              )}

              <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                No upcoming trains remaining today for this direction.
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Suburban service resumes tomorrow morning at 4:30 AM from Avadi
                station.
              </span>
            </div>
          )}

          {/* 3. TIMETABLE LIST VIEW */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                Upcoming Trains Timetable ({filteredTrains.length} Trips)
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Clock size={12} className="text-primary" />
                Clock: {format12Hour(currentTimeStr)}
              </span>
            </div>

            {filteredTrains.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTrains.map((train) => {
                  const isSoonest = train.id === soonestTrain?.id;
                  const isFast =
                    train.type === "Fast" ||
                    train.type?.includes("Fast") ||
                    train.type === "AC";
                  const destCode = getDestCode(train.destination);

                  const [nowH, nowM] = currentTimeStr.split(":").map(Number);
                  const [tH, tM] = train.time.split(":").map(Number);
                  const cardDiffMins = Math.max(
                    0,
                    tH * 60 + tM - (nowH * 60 + nowM),
                  );

                  return (
                    <div
                      key={train.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSoonest
                          ? "bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/40 shadow-xs ring-1 ring-orange-500/20"
                          : isFast
                            ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 dark:border-rose-500/30 border-l-4 border-l-rose-500"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Left: Icon box with Code + Time & Destination */}
                      <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-11 h-10 rounded-t-xl flex items-center justify-center border-t border-x shadow-2xs ${
                              isSoonest
                                ? "bg-orange-500 text-white border-orange-600"
                                : isFast
                                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                                  : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {isFast ? (
                              <Zap size={18} className="fill-current" />
                            ) : (
                              <Train size={19} />
                            )}
                          </div>
                          <span
                            className={`w-11 py-0.5 text-[9px] font-mono font-black text-center rounded-b-xl border-b border-x tracking-tighter uppercase ${
                              isSoonest
                                ? "bg-orange-600 text-white border-orange-700"
                                : isFast
                                  ? "bg-rose-600 text-white border-rose-700"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {destCode}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-base text-slate-900 dark:text-white font-mono tracking-tight">
                              {format12Hour(train.time)}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                              ➔ {train.destination}{" "}
                              <span
                                className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800"
                                title="Estimated ride duration"
                              >
                                {train.duration}
                              </span>
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-900 dark:text-white font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Platform {train.platform}
                            </span>
                            <span>·</span>
                            <span>Train #{train.trainNo}</span>
                            <span>·</span>
                            <span>From {train.origin}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Live Countdown, Fast Badge & Minimal Arrival Time */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800/80 shrink-0">
                        {/* Top Row: Fast Tag + Live Countdown Timer */}
                        <div className="flex items-center gap-1.5">
                          {isFast && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-0.5">
                              ⚡ Fast
                            </span>
                          )}

                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono transition-all ${
                              isSoonest
                                ? "bg-orange-500 text-white shadow-xs animate-bounce"
                                : cardDiffMins <= 15
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                            style={{ animationDuration: "3s" }}
                          >
                            <Timer size={12} className="shrink-0 opacity-80" />
                            <span>{formatRelativeTime(cardDiffMins)}</span>
                          </span>
                        </div>

                        {/* Bottom Row: Clean, Un-bordered Arrival Typography */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <span>Arrives</span>
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                            {calculateArrivalTime(train.time, train.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Train}
                title="No active trains matching this direction"
                description="There are no remaining trains listed for this route in our schedule today. Please try switching back to 'All Directions'."
              />
            )}
          </div>
        </motion.div>
        {/* 0. OFFICIAL TICKETING BOOKING BANNER */}
        <div className="p-4 bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Ticket size={20} className="text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                Official Railway Ticketing
              </span>
              <h4 className="text-xs font-black tracking-wide">
                Book Local Suburban &amp; Express Tickets Online
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="https://utsonmobile.indianrail.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>UTS App (Local)</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://www.irctc.co.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all border border-white/20 flex items-center gap-1.5"
            >
              <span>IRCTC</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
};

export default SuburbanTrains;
