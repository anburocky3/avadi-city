"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  Bus,
  Flame,
  Search,
  Timer,
  MapPin,
  LucideIcon,
} from "lucide-react";

import { suburbanTrains, mtcBuses, fuelStations } from "@/data/transport";
import { Card, Badge, EmptyState } from "@/components/shared-components";
import mtcBusesData from "@/data/mtc-buses.json";
import { MtcBusRoute } from "@/scripts/build-mtc-buses";
import MtcBusPortal, { MtcBuses } from "./mtc-buses";
import SuburbanTrains from "./suburban-trains";
import FuelStations from "./fuel-stations";

// --- TYPESCRIPT DEFINITIONS ---

export interface SuburbanTrain {
  id: number | string;
  trainNo: string;
  type: "Fast" | "Slow" | string;
  platform: string | number;
  time: string;
  route: string;
  duration: string;
  [key: string]: any;
}

export interface MtcBus {
  id: number | string;
  routeNo: string;
  from: string;
  to: string;
  stops: string;
  [key: string]: any;
}

export interface FuelStation {
  id: number | string;
  name: string;
  ward: number | string;
  open24x7: boolean;
  fuelTypes: string[];
  distance: string;
  [key: string]: any;
}

interface TabItem {
  id: "trains" | "buses" | "bunks";
  label: string;
  icon: LucideIcon;
}

export const TransportContainer: React.FC = () => {
  const t = useTranslations();

  const [activeTab, setActiveTab] = useState<"trains" | "buses" | "bunks">(
    "trains",
  );
  const [trainRoute, setTrainRoute] = useState<string>(
    "Avadi to Chennai Central",
  );
  const [busSearch, setBusSearch] = useState<string>("");

  // Timer state for "next train" countdown simulation
  const [countdown, setCountdown] = useState<{
    minutes: number;
    seconds: number;
  }>({
    minutes: 8,
    seconds: 45,
  });

  // Ticking countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          // Reset simulation to 14:00 mins to keep it looping cleanly
          return { minutes: 14, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter trains by route
  const filteredTrains = useMemo<SuburbanTrain[]>(() => {
    return (suburbanTrains as SuburbanTrain[]).filter(
      (t) => t.route === trainRoute,
    );
  }, [trainRoute]);

  // Filter buses by route number or stops keyword
  const filteredBuses = useMemo<MtcBus[]>(() => {
    const allBuses = mtcBusesData as MtcBus[];
    if (!busSearch.trim()) return allBuses;

    const q = busSearch.toLowerCase();
    return allBuses.filter(
      (bus) =>
        bus.routeNo.toLowerCase().includes(q) ||
        bus.to.toLowerCase().includes(q) ||
        bus.from.toLowerCase().includes(q) ||
        bus.stops.toLowerCase().includes(q),
    );
  }, [busSearch]);

  const padZero = (num: number): string => num.toString().padStart(2, "0");

  const tabs: TabItem[] = [
    { id: "trains", label: "Suburban Trains", icon: Train },
    { id: "buses", label: "MTC Buses", icon: Bus },
    { id: "bunks", label: "Fuel Stations", icon: Flame },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
          {t("transportTitle")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
          <Train size={14} className="text-primary mr-1.5 animate-pulse" />
          <span>{t("transportSubtitle")}</span>
        </p>
      </div>

      {/* Main Tabs (Tailwind v4 styling with fluid layout) */}
      <div className="flex bg-slate-100/80 dark:bg-slate-950/80 p-1 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                isSelected
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60 scale-[1.01]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/40"
              }`}
            >
              <Icon
                size={15}
                className={isSelected ? "text-primary shrink-0" : "shrink-0"}
              />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">
                {tab.label.split(" ")[1] || tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* TAB 1: SUBURBAN TRAINS */}
        {activeTab === "trains" && (
          <motion.div
            key="trains-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <SuburbanTrains />
          </motion.div>
        )}

        {/* TAB 2: MTC BUSES */}
        {activeTab === "buses" && (
          <motion.div
            key="buses-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <MtcBuses />
          </motion.div>
        )}

        {/* TAB 3: PETROL/CNG BUNKS */}
        {activeTab === "bunks" && (
          <motion.div
            key="bunks-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* {(fuelStations as FuelStation[]).map((bunk) => (
              <Card
                key={bunk.id}
                className="p-4 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-start justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={bunk.open24x7 ? "success" : "default"}>
                      {bunk.open24x7 ? "Open 24/7" : "Standard hours"}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center">
                      <MapPin
                        size={11}
                        className="mr-0.5 text-primary shrink-0"
                      />
                      Ward {bunk.ward}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                    {bunk.name}
                  </h3>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {bunk.fuelTypes.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-md"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center shrink-0 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {bunk.distance}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Away
                  </span>
                </div>
              </Card>
            ))} */}
            <FuelStations />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransportContainer;
