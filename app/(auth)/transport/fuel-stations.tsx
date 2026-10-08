"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Flame,
  Zap,
  Clock,
  MapPin,
  Car,
  Loader2,
  Navigation,
  LocateFixed,
} from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/shared-components";
import { FuelStation } from "@/services/transport/fuelStations";

type FuelFilterTab = "all" | "24x7" | "standard" | "cng" | "ev";

const DEFAULT_AVADI_LAT = 13.1187;
const DEFAULT_AVADI_LON = 80.1001;

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Upgraded SVG Brand Avatar with exact corporate color palettes
const BrandAvatar: React.FC<{ brand: FuelStation["brand"] }> = ({ brand }) => {
  switch (brand) {
    case "HPCL":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#002b66] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#e60000] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter text-white">
            HPCL
          </span>
          <span className="text-[7px] font-bold text-[#ff4d4d] tracking-normal mt-0.5">
            HP FUEL
          </span>
        </div>
      );
    case "IndianOil":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#002147] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#f37021] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter text-[#f37021]">
            IOCL
          </span>
          <span className="text-[7px] font-bold text-white tracking-normal mt-0.5">
            IndianOil
          </span>
        </div>
      );
    case "Bharat Petroleum":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#fcd116] text-[#003366] flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#003366] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter">
            BPCL
          </span>
          <span className="text-[7px] font-extrabold text-[#003366] tracking-normal mt-0.5">
            BHARAT
          </span>
        </div>
      );
    case "Nayara Energy":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#0077c8] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#84bd00] shadow-xs">
          <span className="text-[10px] leading-none tracking-tighter">
            NAYARA
          </span>
          <span className="text-[7px] font-bold text-[#a4e800] tracking-normal mt-0.5">
            ENERGY
          </span>
        </div>
      );
    case "Shell":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#fbce07] text-[#dd1d21] flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#dd1d21] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter">
            SHELL
          </span>
          <span className="text-[7px] font-bold text-[#dd1d21] tracking-normal mt-0.5">
            V-POWER
          </span>
        </div>
      );
    case "Jio-bp":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#004f32] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#80c342] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter text-[#80c342]">
            Jio-bp
          </span>
          <span className="text-[7px] font-bold text-white tracking-normal mt-0.5">
            PULSE
          </span>
        </div>
      );
    case "AG&P Pratham":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#006666] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#00cc99] shadow-xs">
          <span className="text-[11px] leading-none tracking-tighter">
            AG&amp;P
          </span>
          <span className="text-[7px] font-bold text-[#80ffe5] tracking-normal mt-0.5">
            CNG HUB
          </span>
        </div>
      );
    case "EV Station":
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#4b0082] text-white flex flex-col items-center justify-center font-black shrink-0 border-2 border-[#00ffff] shadow-xs animate-pulse">
          <Zap size={15} className="fill-current text-[#00ffff]" />
          <span className="text-[7px] font-bold text-[#00ffff] tracking-normal mt-0.5">
            EV FAST
          </span>
        </div>
      );
    default:
      return (
        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center font-black shrink-0 border border-slate-300 dark:border-slate-700">
          <Flame size={18} className="text-primary" />
          <span className="text-[7px] mt-0.5">FUEL</span>
        </div>
      );
  }
};

export const FuelStations: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FuelFilterTab>("all");
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationLabel, setLocationLabel] = useState<string>(
    "Avadi Junction (Default)",
  );

  useEffect(() => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setLocationLabel("Your Current GPS Location");
          setIsLocating(false);
        },
        (err) => {
          console.warn("GPS access declined. Using Avadi center default.", err);
          setUserLocation({ lat: DEFAULT_AVADI_LAT, lon: DEFAULT_AVADI_LON });
          setIsLocating(false);
        },
        { timeout: 10000, maximumAge: 60000 },
      );
    } else {
      setUserLocation({ lat: DEFAULT_AVADI_LAT, lon: DEFAULT_AVADI_LON });
    }
  }, []);

  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetch("/api/transport/fuel");
        const data = await res.json();
        if (data.stations && Array.isArray(data.stations)) {
          setStations(data.stations);
        }
      } catch (err) {
        console.error("Failed to load fuel stations:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStations();
  }, []);

  const stationsWithDistance = useMemo(() => {
    const lat = userLocation?.lat || DEFAULT_AVADI_LAT;
    const lon = userLocation?.lon || DEFAULT_AVADI_LON;

    return stations
      .map((s) => ({
        ...s,
        distanceKm: calculateDistanceKm(lat, lon, s.lat, s.lon),
      }))
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [stations, userLocation]);

  const filteredStations = useMemo(() => {
    return stationsWithDistance.filter((station) => {
      if (activeFilter === "24x7") return station.open24x7;
      if (activeFilter === "standard") return !station.open24x7;
      if (activeFilter === "cng") return station.hasCNG;
      if (activeFilter === "ev") return station.hasEV;
      return true;
    });
  }, [stationsWithDistance, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: stationsWithDistance.length,
      open24x7: stationsWithDistance.filter((s) => s.open24x7).length,
      standard: stationsWithDistance.filter((s) => !s.open24x7).length,
      cng: stationsWithDistance.filter((s) => s.hasCNG).length,
      ev: stationsWithDistance.filter((s) => s.hasEV).length,
    };
  }, [stationsWithDistance]);

  return (
    <div className="space-y-5">
      {/* 1. CURRENT LOCATION & PROXIMITY HEADER BANNER */}
      <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <LocateFixed
            size={16}
            className="text-primary shrink-0 animate-pulse"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              Search Anchor
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate block">
              📍 {locationLabel}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if ("geolocation" in navigator) {
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({
                  lat: pos.coords.latitude,
                  lon: pos.coords.longitude,
                });
                setLocationLabel("Your Current GPS Location");
                setIsLocating(false);
              });
            }
          }}
          className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[11px] hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          {isLocating ? "Locating..." : "Refresh GPS"}
        </button>
      </div>

      {/* 2. CATEGORY & OPERATING HOURS FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Outlets", count: counts.all, icon: Flame },
          {
            id: "24x7",
            label: "Open 24/7",
            count: counts.open24x7,
            icon: Clock,
            highlight: true,
          },
          {
            id: "standard",
            label: "Standard Hours",
            count: counts.standard,
            icon: Clock,
          },
          { id: "cng", label: "CNG Pumps", count: counts.cng, icon: Car },
          { id: "ev", label: "EV Charging", count: counts.ev, icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as FuelFilterTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 border transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-primary border-primary text-white shadow-xs scale-[1.02]"
                  : tab.highlight
                    ? "bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon
                size={14}
                className={
                  isSelected
                    ? "text-white"
                    : tab.highlight
                      ? "text-emerald-500"
                      : "text-primary"
                }
              />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. FUEL STATIONS LIST */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-xs font-bold">
              Scanning Avadi fuel stations &amp; CNG/EV hubs...
            </span>
          </div>
        ) : filteredStations.length > 0 ? (
          filteredStations.map((station) => (
            <Card
              key={station.id}
              className={`p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                station.open24x7
                  ? "bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300"
              }`}
            >
              {/* Left: Brand Avatar + Details */}
              <div className="flex items-start space-x-3.5 min-w-0">
                <BrandAvatar brand={station.brand} />

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Operating Hours Tag */}
                    {station.open24x7 ? (
                      <span className="bg-emerald-500 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Open 24/7
                      </span>
                    ) : (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                        Standard Hours
                      </span>
                    )}

                    {/* CNG & EV Badges */}
                    {station.hasCNG && (
                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        ⛽ CNG Available
                      </span>
                    )}
                    {station.hasEV && (
                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                        ⚡ EV Charging
                      </span>
                    )}
                  </div>

                  {/* Station Name */}
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {station.name}
                  </h3>

                  {/* Address */}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </p>

                  {/* Available Fuels List */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {station.fuelTypes.map((fuel) => (
                      <span
                        key={fuel}
                        className="text-[9px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-md"
                      >
                        {fuel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Distance Badge + Google Maps Navigation */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white block">
                    {station.distanceKm} km
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Away
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-primary text-white dark:bg-slate-100 dark:hover:bg-primary dark:text-slate-900 dark:hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Navigation size={13} />
                  <span>Navigate</span>
                </a>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={Flame}
            title="No stations found for this category"
            description="There are no fuel stations matching your active filter in the immediate Avadi region."
          />
        )}
      </div>
    </div>
  );
};

export default FuelStations;
