"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  MessageSquare,
  PlusCircle,
  MapPin,
  ChefHat,
  Wrench,
  HeartHandshake,
  Train,
  Briefcase,
  Building2,
  Bell,
  Bus,
  Clock,
  Moon,
  CloudSun,
  RefreshCw,
  CheckCircle2,
  Sun,
  CloudRain,
  CloudFog,
} from "lucide-react";

// Shared & Icon components (Adjust import paths to match your project)
import {
  Card,
  Badge,
  SkeletonLoader,
  Modal,
} from "@/components/shared-components";
import {
  VegSymbol,
  NonVegSymbol,
  IceCreamSymbol,
} from "@/components/food-icons";
import { Feed, useWard } from "@/context/wardContext";

// --- TYPESCRIPT DEFINITIONS ---

export interface Alert {
  id: string | number;
  title: string;
  description: string;
  category: string;
  severity: "urgent" | "warning" | "info" | "danger";
  affectedWards: "All" | number[];
}

export interface Post {
  id: string | number;
  ward: string;
  title: string;
  content: string;
}

export interface Complaint {
  id: string | number;
  ward: string;
  status: "Pending" | "In Progress" | "Resolved";
}

export interface UserProfile {
  name?: string;
  wardNumber?: number;
}

export interface Ward {
  id: number;
  name: string;
}

interface PlaceSlide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
}

interface WardContextType {
  userProfile: UserProfile;
  activeWard: Ward;
  posts: Feed[];
  alerts: Alert[];
  complaints: Complaint[];
  dismissedAlerts: (string | number)[];
  dismissAlert: (id: string | number) => void;
  markAlertAsRead: (id: string | number) => void;
}

interface HourlyForecast {
  time: string;
  rawHour: number;
  temp: string;
  desc: string;
  chanceOfRain: string;
  code: string;
}

interface WeatherData {
  temp: string;
  desc: string;
  isHumid: boolean;
  code: string;
  hourly: HourlyForecast[];
  willRainToday: boolean;
}

// --- STATIC DATA CONFIGURATIONS ---

const PLACE_SLIDES: PlaceSlide[] = [
  {
    id: 1,
    title: "Paruthipattu Eco-Park & Lake",
    subtitle:
      "3km walking track, boating facilities & scenic landscaping around Paruthipattu Lake.",
    badge: "Paruthipattu Lake",
    image: "/img/paruthipattu_eco_park.png",
  },
  {
    id: 2,
    title: "Vijayanta Tank Memorial Park",
    subtitle:
      "Honoring Avadi's proud defense legacy & Heavy Vehicles Factory (HVF) history.",
    badge: "HVF Estate",
    image: "/img/vijayanta-tank-memorial.png",
  },
  {
    id: 3,
    title: "1955 Historic Congress Grounds",
    subtitle:
      "Monumental site of the 60th Indian National Congress session held in Avadi.",
    badge: "Avadi Heritage",
    image: "/img/congress-1955.png",
  },
];

const QUICK_SHORTCUTS = [
  {
    name: "Report Issue",
    path: "/complaints",
    icon: PlusCircle,
    desc: "Civic complaints & fixes",
    badgeBg: "from-orange-500 to-amber-500 shadow-orange-500/25",
    borderHover: "hover:border-orange-500/50",
  },
  {
    name: "Ward Feed",
    path: "/feed",
    icon: MessageSquare,
    desc: "Community updates",
    badgeBg: "from-teal-500 to-emerald-600 shadow-teal-500/25",
    borderHover: "hover:border-teal-500/50",
  },
  {
    name: "Explore Spots",
    path: "/explore",
    icon: Compass,
    desc: "Avadi landmarks & parks",
    badgeBg: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    borderHover: "hover:border-blue-500/50",
  },
  {
    name: "Rent & Properties",
    path: "/rentals",
    icon: Building2,
    desc: "Residential & commercial",
    badgeBg: "from-purple-600 to-indigo-600 shadow-purple-500/25",
    borderHover: "hover:border-purple-500/50",
  },
];

const WARD_SERVICES = [
  {
    name: "Food & Dining",
    path: "/foods",
    icon: ChefHat,
    bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  },
  {
    name: "Local Services",
    path: "/services",
    icon: Wrench,
    bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Local Jobs",
    path: "/jobs",
    icon: Briefcase,
    bg: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400",
  },
  {
    name: "Transport",
    path: "/transport",
    icon: Train,
    bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Volunteers",
    path: "/volunteers",
    icon: HeartHandshake,
    bg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Local Alerts",
    path: "/notifications",
    icon: Bell,
    bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
  },
];

const BUS_TIMINGS = [
  {
    code: "70H",
    dest: "Koyambedu / Anna Nagar",
    info: "Every 15 mins",
    time: "08:15 AM",
    status: "On Time",
  },
  {
    code: "71H",
    dest: "Broadway / Central",
    info: "Every 20 mins",
    time: "08:20 AM",
    status: "On Time",
  },
  {
    code: "62",
    dest: "Red Hills / Poonamallee",
    info: "Every 25 mins",
    time: "08:30 AM",
    status: "On Time",
  },
  {
    code: "77",
    dest: "Vadapalani / Koyambedu",
    info: "Every 30 mins",
    time: "08:40 AM",
    status: "On Time",
  },
];

const TRAIN_TIMINGS = [
  {
    code: "MSB2",
    dest: "Beach / Central Local",
    info: "Platform: PF 2",
    time: "08:22 AM",
    status: "On Time",
  },
  {
    code: "AJJ4",
    dest: "Thiruvallur / Arakkonam",
    info: "Platform: PF 3",
    time: "08:30 AM",
    status: "On Time",
  },
  {
    code: "VEL2",
    dest: "Velachery Direct EMU",
    info: "Platform: PF 1",
    time: "08:45 AM",
    status: "On Time",
  },
  {
    code: "MSB4",
    dest: "Chennai Central Fast",
    info: "Platform: PF 2",
    time: "09:05 AM",
    status: "On Time",
  },
];

const HERITAGE_MILESTONES = [
  {
    year: "1856",
    title: "Railway Station Established",
    desc: "One of the earliest rail lines in Madras Presidency, predating heavy industries by a century.",
  },
  {
    year: "1955",
    title: "Historic Avadi Resolution",
    desc: "Prime Minister Jawaharlal Nehru adopts the Socialistic Pattern of Society during the 60th INC Plenary Session.",
  },
  {
    year: "1961-65",
    title: "HVF Founded & Vijayanta Tank",
    desc: "Heavy Vehicles Factory established, manufacturing India's first indigenous battle tank, the Vijayanta.",
  },
  {
    year: "Modern",
    title: "Municipal Corporation Status",
    desc: "Avadi evolves from a pastoral outpost into a bustling municipal corporation and defense sanctuary.",
  },
];

// Helper to convert military time (e.g. "1500") to 12-hour format ("3:00 PM")
const formatMilitaryTime = (timeStr: string) => {
  if (timeStr === "0") return "12:00 AM";
  const num = parseInt(timeStr);
  const hour = num / 100;
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${formattedHour}:00 ${ampm}`;
};

export const DashboardClient: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();

  // Type-Safe Hook Unwrapping
  const {
    userProfile = {},
    activeWard = { id: 1, name: "Avadi Central" },
    alerts = [],
    complaints = [],
    dismissedAlerts = [],
    dismissAlert = () => {},
    markAlertAsRead = () => {},
  } = (useWard() as unknown as WardContextType) || {};

  // Component States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isHeritageModalOpen, setIsHeritageModalOpen] =
    useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Weather States
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherDetailsOpen, setIsWeatherDetailsOpen] =
    useState<boolean>(false);
  const [isRainAlertOpen, setIsRainAlertOpen] = useState<boolean>(false);
  const [showPastHours, setShowPastHours] = useState<boolean>(false);

  // Weather API Fetcher (wttr.in) with Hourly JSON extraction
  const fetchWeather = async (forceUpdate: boolean = false) => {
    const cacheKey = "avadi_weather_data";
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date().getTime();

    try {
      if (!forceUpdate) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (now - cached.timestamp < cacheExpiry) {
            setWeather(cached.data);
            if (cached.data.willRainToday) setIsRainAlertOpen(true);
            return;
          }
        }
      }

      const res = await fetch("https://wttr.in/Avadi?format=j1");
      if (!res.ok) throw new Error("Rate limited or network error");

      const data = await res.json();
      const current = data.current_condition[0];
      const todayHourly = data.weather[0].hourly;

      // Parse 3-hour interval blocks
      const hourlyData: HourlyForecast[] = todayHourly.map((h: any) => ({
        time: formatMilitaryTime(h.time),
        rawHour: parseInt(h.time) / 100,
        temp: h.tempC,
        desc: h.weatherDesc[0].value,
        chanceOfRain: h.chanceofrain,
        code: h.weatherCode,
      }));

      // High Rain Alert Condition: If any hour today has >= 40% chance of rain
      const willRainToday = todayHourly.some(
        (h: any) => parseInt(h.chanceofrain) >= 40,
      );

      const newWeather: WeatherData = {
        temp: current.temp_C,
        desc: current.weatherDesc[0].value.toUpperCase(),
        isHumid: parseInt(current.humidity) > 60,
        code: current.weatherCode,
        hourly: hourlyData,
        willRainToday: willRainToday,
      };

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: now,
          data: newWeather,
        }),
      );

      setWeather(newWeather);
      if (willRainToday) setIsRainAlertOpen(true);
    } catch (error) {
      console.warn("Weather fetch fallback:", error);
      // Fallback state if API fails or rate-limits
      setWeather({
        temp: "32",
        desc: "CLOUDY",
        isHumid: true,
        code: "119",
        willRainToday: true,
        hourly: [
          {
            time: "9:00 AM",
            rawHour: 9,
            temp: "30",
            desc: "Cloudy",
            chanceOfRain: "10",
            code: "119",
          },
          {
            time: "12:00 PM",
            rawHour: 12,
            temp: "33",
            desc: "Sunny",
            chanceOfRain: "10",
            code: "113",
          },
          {
            time: "3:00 PM",
            rawHour: 15,
            temp: "34",
            desc: "Scattered Thunderstorms",
            chanceOfRain: "50",
            code: "389",
          },
          {
            time: "6:00 PM",
            rawHour: 18,
            temp: "31",
            desc: "Rain",
            chanceOfRain: "80",
            code: "356",
          },
        ],
      });
      setIsRainAlertOpen(true);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  // Weather Dynamic Overlay Animation Renderer
  const renderWeatherOverlay = () => {
    if (!weather) return null;
    const code = parseInt(weather.code);

    // 1. Clear / Sunny (Sun flare effect)
    if (code === 113) {
      return (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-60">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-48 h-48 bg-amber-400/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute -top-4 -right-4 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"
          />
        </div>
      );
    }

    // 2. Rain / Drizzle (Slanted falling particles)
    if ([266, 296, 302, 308, 353, 356, 359, 389].includes(code)) {
      return (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-bl from-blue-900/10 to-transparent blur-md" />
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -50, x: i * 15, opacity: 0 }}
              animate={{ y: 200, opacity: [0, 0.8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.7,
                delay: (i % 5) * 0.15,
                ease: "linear",
              }}
              className="absolute top-0 w-0.5 h-8 bg-blue-400/40 dark:bg-blue-300/30 rotate-12"
              style={{ right: `${10 + i * 8}%` }}
            />
          ))}
        </div>
      );
    }

    // 3. Fog / Mist (Slow drifting blurred blobs)
    if ([143, 248, 260].includes(code)) {
      return (
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
          <motion.div
            animate={{ x: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-full h-full bg-slate-300/30 dark:bg-slate-500/20 blur-2xl"
          />
          <motion.div
            animate={{ x: [20, -20, 20] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute bottom-0 right-10 w-3/4 h-3/4 bg-slate-200/20 dark:bg-slate-600/20 blur-3xl"
          />
        </div>
      );
    }

    // 4. Default / Cloudy (Soft floating horizontal shapes)
    return (
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [-15, 15, -15] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute -top-4 right-10 w-40 h-24 bg-slate-300/20 dark:bg-slate-600/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ x: [15, -15, 15] }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
          className="absolute top-10 -right-5 w-48 h-20 bg-slate-200/20 dark:bg-slate-700/20 rounded-full blur-2xl"
        />
      </div>
    );
  };

  // Icon Helper for Hourly Forecast Items
  const renderHourlyIcon = (codeStr: string) => {
    const code = parseInt(codeStr);
    if (code === 113) {
      return <Sun size={18} className="text-amber-400 shrink-0" />;
    }
    if ([266, 296, 302, 308, 353, 356, 359, 389].includes(code)) {
      return (
        <CloudRain
          size={18}
          className="text-blue-400 dark:text-blue-300 shrink-0"
        />
      );
    }
    if ([143, 248, 260].includes(code)) {
      return <CloudFog size={18} className="text-slate-400 shrink-0" />;
    }
    return (
      <CloudSun
        size={18}
        className="text-amber-400 dark:text-amber-300 shrink-0"
      />
    );
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PLACE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activeAlerts = alerts.filter((alert) => {
    const isWardsMatch =
      alert.affectedWards === "All" ||
      (Array.isArray(alert.affectedWards) &&
        alert.affectedWards.includes(activeWard.id));
    const isNotDismissed = !dismissedAlerts.includes(alert.id);
    return isWardsMatch && isNotDismissed && alert.severity === "urgent";
  });

  const openComplaintsCount = complaints.filter(
    (c) => parseInt(c.ward) === activeWard.id && c.status !== "Resolved",
  ).length;

  const totalAlertsCount = alerts.filter((alert) => {
    const isWardsMatch =
      alert.affectedWards === "All" ||
      (Array.isArray(alert.affectedWards) &&
        alert.affectedWards.includes(activeWard.id));
    return isWardsMatch && !dismissedAlerts.includes(alert.id);
  }).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWeather(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-2 w-1/3">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3" />
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* 1. Greeting Hero Card with Integrated Civic Status, Refresh & Weather Overlay */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-orange-500 bg-linear-to-r from-orange-500/5 via-teal-500/5 to-transparent p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        {/* Animated Background Overlay */}
        {renderWeatherOverlay()}

        {/* Foreground Content */}
        <div className="relative z-10 space-y-2 flex-1">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-linear-to-r from-orange-500/15 via-amber-500/10 to-teal-500/10 border border-orange-500/25 shadow-xs">
              <span className="bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-black text-[10px] sm:text-xs uppercase tracking-widest">
                {locale === "ta" ? "நல்வரவு" : "WELCOME BACK"}
              </span>
            </span>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors relative z-20"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-orange-500" : ""}
              />
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>
              {locale === "ta" ? "வணக்கம், " : "Hello, "}
              {userProfile.name ||
                (locale === "ta" ? "ஆவடி குடியிருப்பாளர்" : "Resident")}
            </span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDuration: "2.5s" }}
            >
              👋
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-rose-500">📍</span>
            <span className="text-slate-700 dark:text-slate-200 font-extrabold">
              {locale === "ta" ? "ஆவடி, தமிழ்நாடு" : "Avadi, TN"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-300">
              {t("ward")} {activeWard.id} – {activeWard.name}
            </span>
          </div>

          {/* Active Civic Ticker Utilizing Complaints & Alerts Metrics */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <Link
              href="/complaints"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${openComplaintsCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
              />
              <span>{openComplaintsCount} Active Complaints</span>
            </Link>

            <Link
              href="/notifications"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Bell
                size={12}
                className={
                  totalAlertsCount > 0 ? "text-rose-500" : "text-slate-400"
                }
              />
              <span>{totalAlertsCount} Ward Alerts</span>
            </Link>
          </div>
        </div>

        {/* CLICKABLE Weather & Desktop Refresh Widget */}
        <div
          onClick={() => setIsWeatherDetailsOpen(true)}
          title="Click to view 24-hour weather forecast"
          className="relative z-20 flex items-center gap-4 self-stretch sm:self-auto border-t sm:border-t-0 sm:border-l border-slate-200/70 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-6 justify-between sm:justify-end w-full sm:w-auto cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-2xl sm:-mr-2 sm:pr-2 transition-all p-2 -mx-2"
        >
          <div className="flex flex-col items-start sm:items-end justify-center text-left sm:text-right group-hover:scale-[1.02] transition-transform">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {weather ? weather.temp : "--"}°C
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:mt-0.5 max-w-[150px] truncate">
              {weather
                ? `${weather.desc}${weather.isHumid ? " • HUMID" : ""}`
                : "LOADING..."}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the modal from opening when just clicking refresh
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="hidden sm:flex items-center justify-center p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
            title="Refresh feed"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-orange-500" : ""}
            />
          </button>
        </div>
      </div>

      {/* 2. Avadi City Places Carousel */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md border border-slate-200/60 dark:border-slate-800 group h-40 sm:h-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Image
              src={PLACE_SLIDES[currentSlide].image}
              alt={PLACE_SLIDES[currentSlide].title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              priority={currentSlide === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col justify-end text-left space-y-1 z-10">
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-500/30 w-fit backdrop-blur-md">
                {PLACE_SLIDES[currentSlide].badge}
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                {PLACE_SLIDES[currentSlide].title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-1 max-w-xl font-medium">
                {PLACE_SLIDES[currentSlide].subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Pagination Dots */}
        <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-slate-950/70 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          {PLACE_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx
                  ? "w-4 bg-orange-500"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 3. Urgent Alerts Banner Strip */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.slice(0, 2).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex space-x-3 flex-1">
                    <AlertTriangle
                      className="text-red-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-red-900 dark:text-red-200 leading-normal">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-red-700 dark:text-red-300/90 leading-relaxed line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center ml-7 sm:ml-0">
                    <button
                      type="button"
                      onClick={() => {
                        markAlertAsRead(alert.id);
                        setSelectedAlert(alert);
                      }}
                      className="text-[11px] font-bold text-red-700 dark:text-red-300 underline hover:no-underline cursor-pointer shrink-0"
                    >
                      Read Details
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/50 text-[10px] font-bold text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900 cursor-pointer shrink-0 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 4. Quick-Access Shortcut Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {QUICK_SHORTCUTS.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.name}
              href={tile.path}
              className={`group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 ${tile.borderHover} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${tile.badgeBg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}
                >
                  <Icon size={20} />
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500 group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
                  <ArrowRight size={12} />
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-orange-500 transition-colors">
                  {tile.name}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {tile.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 5. Gourmet Culinary Local Food Spotlight Card */}
      <Link
        href="/foods"
        className="block p-5 sm:p-6 rounded-3xl bg-linear-to-r from-red-950 via-rose-900 to-amber-950 text-white border-2 border-amber-400/60 shadow-xl shadow-red-950/20 hover:border-amber-300 hover:scale-[1.005] transition-all duration-200 relative overflow-hidden group space-y-4"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center shadow-md">
              <ChefHat
                size={12}
                className="mr-1 text-slate-950 animate-bounce"
              />
              <span>AVADI GOURMET FOOD</span>
            </span>

            <span className="px-2.5 py-1 rounded-full bg-red-900/80 border border-red-500/50 text-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center shadow-xs">
              <Moon size={11} className="mr-1 text-amber-300" />
              <span>24/7 MIDNIGHT</span>
            </span>
          </div>

          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform shrink-0 ml-2">
            <ChefHat size={22} />
          </div>
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight group-hover:text-amber-300 transition-colors drop-shadow-md">
            Avadi Food & Midnight Cravings
          </h3>
          <p className="text-xs text-amber-100/90 font-extrabold leading-snug drop-shadow-xs max-w-xl">
            Discover home chefs, late-night meals, traditional biryanis & local
            favorites delivered across Avadi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 relative z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[10px] sm:text-[11px] font-black flex items-center space-x-1.5 border border-emerald-500/50 shadow-md backdrop-blur-md">
              <VegSymbol className="w-3.5 h-3.5" />
              <span>Pure Veg</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[10px] sm:text-[11px] font-black flex items-center space-x-1.5 border border-rose-500/50 shadow-md backdrop-blur-md">
              <NonVegSymbol className="w-3.5 h-3.5" />
              <span>Non-Veg</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[10px] sm:text-[11px] font-black flex items-center space-x-1.5 border border-purple-500/50 shadow-md backdrop-blur-md">
              <IceCreamSymbol className="w-3.5 h-3.5" />
              <span>Desserts</span>
            </span>
          </div>

          <span className="px-4 py-2.5 bg-linear-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 ring-2 ring-amber-300/50 self-end sm:self-auto shrink-0">
            <span>View Menu</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </div>

        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
      </Link>

      {/* 6. Ward Services & Utilities Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <span>Ward Services & Utilities</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {WARD_SERVICES.map((util) => {
            const Icon = util.icon;
            return (
              <Link
                key={util.name}
                href={util.path}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-xs group"
              >
                <div
                  className={`p-3 rounded-xl mb-2 ${util.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-orange-500 transition-colors">
                  {util.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 7. Did You Know? - Heritage Card */}
      <Card
        onClick={() => setIsHeritageModalOpen(true)}
        className="relative overflow-hidden border border-orange-100 dark:border-orange-950/40 bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 p-5 rounded-3xl flex items-center justify-between cursor-pointer group hover:scale-[1.005] transition-all duration-200 shadow-xs text-left"
      >
        <div className="space-y-1.5 max-w-[72%] text-left">
          <Badge
            variant="warning"
            className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full border-none"
          >
            💡 Did You Know?
          </Badge>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
            The name &quot;Avadi&quot; is often thought to be a military
            acronym, but its true Tamil origin is far older...
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors pt-0.5">
            <span>Explore Avadi&apos;s Rich Heritage & Chronicles</span>
            <ArrowRight
              size={12}
              className="ml-1 transition-transform group-hover:translate-x-1"
            />
          </p>
        </div>

        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 relative overflow-hidden shadow-md shadow-orange-500/10">
          <Compass
            size={28}
            className="animate-spin"
            style={{ animationDuration: "25s" }}
          />
          <div className="absolute right-0 bottom-0 w-8 h-8 bg-white/10 rounded-full blur-xs" />
        </div>
      </Card>

      {/* 8. Travelling & Transport Timings Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Train className="text-orange-500 mr-2" size={16} />
            <span>Travelling & Local Transit Timings</span>
          </h2>
          <Link
            href="/transport"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center hover:underline"
          >
            <span>Full Schedule</span>
            <ArrowRight size={13} className="ml-1" />
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2">
          {/* Card 1: Local Bus Timings */}
          <Card className="snap-center shrink-0 w-[88%] sm:w-[calc(50%-0.5rem)] p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
                  <Bus size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Local Bus Timings
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Avadi Bus Depot
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-500/20 shrink-0">
                4 Routes
              </span>
            </div>

            <div className="space-y-2">
              {BUS_TIMINGS.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className="w-11 text-center py-0.5 rounded-md bg-orange-500 text-white font-black text-[10px] tracking-wide shrink-0">
                      {b.code}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                        {b.dest}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                        {b.info}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-end space-x-1">
                      <Clock size={10} className="text-orange-500 mr-0.5" />
                      <span>{b.time}</span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: Local Suburban Train Timings */}
          <Card className="snap-center shrink-0 w-[88%] sm:w-[calc(50%-0.5rem)] p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                  <Train size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Suburban Train Timings
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Avadi Railway Station
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 shrink-0">
                4 Trains
              </span>
            </div>

            <div className="space-y-2">
              {TRAIN_TIMINGS.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <span className="w-11 text-center py-0.5 rounded-md bg-blue-600 text-white font-black text-[10px] tracking-wide shrink-0">
                      {t.code}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                        {t.dest}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                        {t.info}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center justify-end space-x-1">
                      <Clock size={10} className="text-blue-500 mr-0.5" />
                      <span>{t.time}</span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Weather Forecast Details Modal */}
      <Modal
        isOpen={isWeatherDetailsOpen}
        onClose={() => setIsWeatherDetailsOpen(false)}
        title="Today's Hourly Forecast"
      >
        <div className="space-y-3">
          {weather?.hourly && weather.hourly.length > 0 ? (
            (() => {
              const currentHour = new Date().getHours();
              const hasPastHours = weather.hourly.some(
                (h) => h.rawHour + 3 <= currentHour,
              );
              const displayHourly = weather.hourly.filter(
                (h) => showPastHours || h.rawHour + 3 > currentHour,
              );

              return (
                <>
                  {hasPastHours && (
                    <div className="flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => setShowPastHours(!showPastHours)}
                        className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        {showPastHours
                          ? "Hide past hours"
                          : "Show earlier hours today"}
                      </button>
                    </div>
                  )}

                  {displayHourly.length > 0 ? (
                    displayHourly.map((h, i) => {
                      const highChance = parseInt(h.chanceOfRain) >= 40;
                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl transition shadow-xs"
                        >
                          <div className="flex items-center gap-3 w-28 shrink-0">
                            <Clock size={14} className="text-slate-400" />
                            <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                              {h.time}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col pl-2 text-xs sm:text-sm truncate">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                              {h.desc}
                            </span>
                            {parseInt(h.chanceOfRain) > 20 && (
                              <span
                                className={`text-[11px] font-black mt-0.5 ${highChance ? "text-blue-600 dark:text-blue-400" : "text-blue-400 dark:text-blue-300/80"}`}
                              >
                                ☔ {h.chanceOfRain}% Chance of Rain
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 shrink-0 pl-2">
                            {renderHourlyIcon(h.code)}
                            <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                              {h.temp}°C
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs font-bold text-slate-500">
                      No remaining forecast hours for today.
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="p-4 text-center text-sm font-bold text-slate-500">
              Loading forecast...
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsWeatherDetailsOpen(false)}
          className="w-full mt-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
        >
          Close Forecast
        </button>
      </Modal>

      {/* Rain & Umbrella Alert Modal */}
      <Modal
        isOpen={isRainAlertOpen}
        onClose={() => setIsRainAlertOpen(false)}
        title="Weather Advisory"
      >
        <div className="space-y-4 text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse shadow-inner border border-blue-500/20">
              <CloudRain size={32} />
            </div>
          </div>

          <Badge
            variant="info"
            className="uppercase font-black tracking-widest text-[10px]"
          >
            High Chance of Rain Today
          </Badge>

          <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
            Scattered Showers Expected
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            Afternoon or evening showers are forecasted for Avadi. Please
            remember to carry an umbrella or a raincoat if you are stepping out
            today.
          </p>

          <button
            type="button"
            onClick={() => setIsRainAlertOpen(false)}
            className="w-full mt-4 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>Got it, thanks!</span>
          </button>
        </div>
      </Modal>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Modal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={selectedAlert.category}
        >
          <div className="space-y-4">
            <Badge variant="danger" className="uppercase font-bold text-xs">
              {selectedAlert.severity}
            </Badge>
            <h3 className="font-black text-base text-slate-800 dark:text-white">
              {selectedAlert.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              {selectedAlert.description}
            </p>

            <div className="h-36 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-semibold select-none flex-col">
              <MapPin
                className="text-orange-500 mb-1 animate-bounce"
                size={24}
              />
              <span>Affected Area: Ward {activeWard.id} Map Outline</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
            >
              Close Details
            </button>
          </div>
        </Modal>
      )}

      {/* Heritage Chronicles Modal (Updated with next/image & Standard Colors) */}
      <Modal
        isOpen={isHeritageModalOpen}
        onClose={() => setIsHeritageModalOpen(false)}
        title="Chronicles of Avadi"
      >
        <div className="space-y-6 text-slate-600 dark:text-slate-300 text-xs leading-relaxed text-left pb-4">
          <div className="text-center pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
              Discover Avadi Heritage
            </span>
            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">
              A Comprehensive Historical Blueprint
            </h2>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <span className="text-orange-500 font-black">1.</span>
              <span>Etymological Roots: Separating Fact from Fiction</span>
            </h3>
            <p>
              In modern conversations, a highly popular belief claims that the
              name <strong>AVADI</strong> is a functional military acronym
              standing for{" "}
              <em>
                &quot;Armoured Vehicles and Ammunition Depot of India&quot;
              </em>
              . While this perfectly describes the modern landscape, historical
              evidence proves this to be a creative backronym.
            </p>
            <p>
              Records indicate that a railway station going by the name of
              &quot;Avadi&quot; existed in the locality as early as{" "}
              <strong>1856</strong>, when the first public rail systems opened
              in the Madras Presidency. This predates the establishment of heavy
              defense industries by nearly a century.
            </p>
            <p>
              The true linguistic origin stems from the ancient Tamil language:
            </p>

            <div className="flex items-center justify-center space-x-3 my-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 select-none">
              <div className="text-center px-3 py-2 bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-200/70 dark:border-slate-800">
                <div className="font-extrabold text-xs text-orange-500">
                  &quot;Aa&quot; (ஆ)
                </div>
                <div className="text-[10px] text-slate-400 font-bold">Cow</div>
              </div>
              <div className="font-black text-slate-400 text-sm shrink-0">
                +
              </div>
              <div className="text-center px-3 py-2 bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-200/70 dark:border-slate-800">
                <div className="font-extrabold text-xs text-orange-500">
                  &quot;Adi&quot; (அடி)
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  Settlement
                </div>
              </div>
              <div className="font-black text-slate-400 text-sm shrink-0">
                =
              </div>
              <div className="text-center px-3.5 py-2.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl border border-orange-500/30 shrink-0">
                <div className="font-black text-xs text-orange-500 leading-none">
                  Avadi
                </div>
                <div className="text-[9px] text-orange-600 dark:text-orange-400 font-extrabold mt-1">
                  &quot;The Place of Cows&quot;
                </div>
              </div>
            </div>

            <p>
              Historically, prior to urbanization, the western suburb was a
              vast, lush pastoral landscape characterized by massive herds of
              cattle, sustained by the natural reserves of the historic
              Paruthipattu Lake. 11th-century Chalukya-era records explicitly
              cite the hamlet as <em>Āvaḍi</em>, establishing its antiquity.
            </p>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <span className="text-orange-500 font-black">2.</span>
              <span>The Historic 1955 Avadi Congress Session</span>
            </h3>
            <div className="relative w-full h-40 my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
              <Image
                src="/img/congress-1955.png"
                alt="1955 Congress Session"
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            </div>
            <p>
              Avadi holds a massive, irreversible position in the political and
              economic history of modern India. In January 1955, Avadi hosted
              the{" "}
              <strong>
                60th Plenary Session of the Indian National Congress
              </strong>
              . Chaired by U.N. Dhebar and organized under the guidance of the
              legendary leader K. Kamaraj and freedom fighter Ambujammal, this
              session shaped the nation&apos;s socioeconomic fabric.
            </p>
            <p>
              It was during this convention that Prime Minister Jawaharlal Nehru
              presented the historic{" "}
              <strong>&quot;Avadi Resolution&quot;</strong>, which officially
              adopted a <em>&quot;Socialistic Pattern of Society&quot;</em> as
              the primary goal for economic planning in India. This blueprint
              shifted India’s industrial strategy, resulting directly in the
              formulation of the Second Five-Year Plan focused heavily on large
              state-led infrastructure projects.
            </p>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Timeline Section */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <span className="text-orange-500 font-black">3.</span>
              <span>Milestones: From Pastoral Roots to Modern City</span>
            </h3>

            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-5 ml-2.5 my-4 space-y-4">
              {HERITAGE_MILESTONES.map((milestone, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6.75 top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white dark:border-slate-950 shadow-xs" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">
                      {milestone.year}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {milestone.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      {milestone.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <span className="text-orange-500 font-black">4.</span>
              <span>The Military Transformation: The Industrial Engine</span>
            </h3>
            <div className="relative w-full h-40 my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
              <Image
                src="/img/vijayanta-tank-memorial.png"
                alt="HVF Vijayanta Tank"
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            </div>
            <p>
              Following the 1955 economic mandate, Avadi was chosen as a
              strategic zone to secure India&apos;s self-reliance in military
              hardware. The availability of expansive lands, coupled with direct
              rail links to the Chennai harbor, turned the agrarian pasture into
              a heavily secured defense sanctuary.
            </p>
            <p>
              Today, Avadi houses massive federal military installations, which
              include:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Heavy Vehicles Factory (HVF):</strong> Established in
                1961, this is where India’s indigenous main battle tanks like
                the <em>Vijayanta</em>, <em>Ajeya (T-72)</em>,{" "}
                <em>Bhishma (T-90S)</em>, and the modern <em>MBT Arjun</em> are
                manufactured.
              </li>
              <li>
                <strong>CVRDE:</strong> Combat Vehicles Research and Development
                Establishement, the premier DRDO lab driving next-generation
                armored vehicle design.
              </li>
              <li>
                <strong>OCF &amp; Engine Factory:</strong> Vital manufacturing
                arms fulfilling the security infrastructure of the Indian Armed
                Forces.
              </li>
            </ul>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <span className="text-orange-500 font-black">5.</span>
              <span>Environmental Landmark: Paruthipattu Lake</span>
            </h3>
            <div className="relative w-full h-40 my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
              <Image
                src="/img/paruthipattu_eco_park.png"
                alt="Paruthipattu Lake Eco Park"
                fill
                sizes="(max-width: 640px) 100vw, 500px"
                className="object-cover"
              />
            </div>
            <p>
              An ecosystem anchor, the Paruthipattu Lake extends over 200 acres.
              Originally an invaluable water repository for old agrarian
              settlements, rapid industrial expansion left it prone to heavy
              urban encroachment and contamination.
            </p>
            <p>
              However, a landmark eco-restoration initiative transformed it into
              a majestic Eco-Park featuring structured walking tracks, central
              public plazas, and a clean avian ecosystem. This represents the
              successful bridge between Avadi&apos;s pastoral roots and its
              urbanized present.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsHeritageModalOpen(false)}
            className="w-full py-3 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-md hover:shadow-lg mt-4"
          >
            Close Chronicles
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardClient;
