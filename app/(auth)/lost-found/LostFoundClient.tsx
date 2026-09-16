"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch,
  MapPin,
  Plus,
  Search,
  Filter,
  X,
  Camera,
  CheckCircle2,
  Clock,
  Tag,
  Calendar,
  Phone,
  User,
  Trash2,
  Pencil,
  ChevronDown,
  ArrowRight,
  LocateFixed,
  Loader2,
  MessageSquare,
  ShieldCheck,
  HandshakeIcon,
  Bell,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  Badge,
  EmptyState,
  SkeletonLoader,
  Modal,
} from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- TYPES ---
interface LostFoundItem {
  id: string;
  itemId: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  ward: number;
  location: string;
  lostFoundDate: string;
  lostFoundTime?: string | null;
  imageUrl?: string | null;
  imageUrls?: any;
  status: "Active" | "Resolved";
  contactName: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isOwner?: boolean;
  contactPhone?: string; // Only present in My Reports
}

interface LostFoundClaim {
  id: string;
  lostFoundItemId: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  requester: { id: string; name: string };
  owner: { id: string; name: string };
  item: { id: string; itemId: string; title: string; type: string; category: string; imageUrl?: string | null; status: string };
}

const CATEGORIES = [
  "Wallet",
  "Phone",
  "Keys",
  "Pet",
  "Bag",
  "Documents",
  "Jewellery",
  "Other",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  Wallet: "💳",
  Phone: "📱",
  Keys: "🔑",
  Pet: "🐾",
  Bag: "👜",
  Documents: "📄",
  Jewellery: "💍",
  Other: "📦",
};

// --- 12-HOUR (NORMAL TIME) HELPERS & PICKER ---
export function parse12Hour(timeStr?: string | null): {
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!timeStr) return { hour: "", minute: "00", period: "AM" };

  const trimmed = timeStr.trim();
  // Check for 12-hour format: e.g. "02:30 PM", "2:30 PM", "08:15 AM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    const h = String(parseInt(match12[1], 10)).padStart(2, "0");
    return {
      hour: h,
      minute: match12[2],
      period: match12[3].toUpperCase() as "AM" | "PM",
    };
  }

  // Check for 24-hour (Railway) format: e.g. "14:30", "09:15", "00:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    let h24 = parseInt(match24[1], 10);
    const m = match24[2];
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    if (h24 === 0) {
      h24 = 12;
    } else if (h24 > 12) {
      h24 -= 12;
    }
    return {
      hour: String(h24).padStart(2, "0"),
      minute: m,
      period,
    };
  }

  return { hour: "", minute: "00", period: "AM" };
}

export function formatTo12Hour(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parsed = parse12Hour(timeStr);
  if (!parsed.hour) return timeStr;
  return `${parsed.hour}:${parsed.minute} ${parsed.period}`;
}

function Time12Picker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const parsed = parse12Hour(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const p = parse12Hour(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const update = (h: string, m: string, p: "AM" | "PM") => {
    if (!h) {
      onChange("");
      return;
    }
    const cleanHour = String(parseInt(h, 10)).padStart(2, "0");
    const cleanMin = m || "00";
    onChange(`${cleanHour}:${cleanMin} ${p}`);
  };

  const selectCls =
    "px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer";

  return (
    <div>
      {label && (
        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 block">
          {label}{" "}
          <span className="font-normal text-slate-400">(12-Hour)</span>
        </label>
      )}
      <div className="flex items-center gap-1.5">
        <select
          value={hour}
          onChange={(e) => {
            const newH = e.target.value;
            setHour(newH);
            update(newH, minute, period);
          }}
          className={`flex-1 min-w-[64px] ${selectCls}`}
        >
          <option value="">Hour</option>
          {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(
            (h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ),
          )}
        </select>

        <span className="text-slate-400 font-black text-sm">:</span>

        <select
          value={minute}
          onChange={(e) => {
            const newM = e.target.value;
            setMinute(newM);
            update(hour, newM, period);
          }}
          className={`flex-1 min-w-[64px] ${selectCls}`}
        >
          {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ),
          )}
        </select>

        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5">
          <button
            type="button"
            onClick={() => {
              setPeriod("AM");
              if (hour) update(hour, minute, "AM");
            }}
            className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg transition cursor-pointer ${
              period === "AM"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod("PM");
              if (hour) update(hour, minute, "PM");
            }}
            className={`px-2.5 py-1.5 text-[11px] font-black rounded-lg transition cursor-pointer ${
              period === "PM"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            PM
          </button>
        </div>

        {hour && (
          <button
            type="button"
            onClick={() => {
              setHour("");
              setMinute("00");
              onChange("");
            }}
            title="Clear time"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// --- ITEM CARD ---
function LostFoundCard({
  item,
  authUserId,
  onView,
}: {
  item: LostFoundItem;
  authUserId: string | undefined;
  onView: (item: LostFoundItem) => void;
}) {
  const isOwner = authUserId === item.userId;
  const isLost = item.type === "lost";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={() => onView(item)}
        className="flex flex-col space-y-3 p-4 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          {item.imageUrl ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 border border-slate-200 dark:border-slate-800">
              {CATEGORY_ICONS[item.category] || "📦"}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isLost
                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {isLost ? "🔴 Lost" : "🟢 Found"}
              </span>
              {item.status === "Resolved" && (
                <Badge variant="success" className="text-[10px] py-0 px-2">
                  Resolved
                </Badge>
              )}
              {isOwner && (
                <span className="text-[10px] font-bold text-orange-500">
                  Your Report
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug truncate group-hover:text-orange-500 transition-colors">
              {item.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Tag size={11} className="shrink-0" />
            {item.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <MapPin size={11} className="shrink-0" />
            Ward {item.ward}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Calendar size={11} className="shrink-0" />
            {item.lostFoundDate}
          </span>
          {item.lostFoundTime && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <Clock size={11} className="shrink-0" />
              {formatTo12Hour(item.lostFoundTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[60%]">
            📍 {item.location}
          </span>
          <span className="text-[11px] font-black text-orange-500 flex items-center gap-1">
            View Details
            <ArrowRight size={11} />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

// --- REPORT FORM ---
function ReportForm({
  type,
  wards,
  activeWardId,
  defaultPhone,
  onSuccess,
  onClose,
}: {
  type: "lost" | "found";
  wards: { id: number; name: string }[];
  activeWardId: number;
  defaultPhone?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isLost = type === "lost";
  const [form, setForm] = useState({
    category: "" as (typeof CATEGORIES)[number] | "",
    title: "",
    description: "",
    ward: String(activeWardId),
    location: "",
    lostFoundDate: new Date().toISOString().split("T")[0],
    lostFoundTime: "",
    contactPhone: defaultPhone || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationGpsStatus, setLocationGpsStatus] = useState<"idle" | "success" | "error">("idle");

  const queryClient = useQueryClient();

  const handleAutoDetect = async () => {
    if (!navigator.geolocation) {
      setLocationGpsStatus("error");
      return;
    }
    setIsLocating(true);
    setLocationGpsStatus("idle");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road || addr.pedestrian || addr.footway,
            addr.suburb || addr.neighbourhood || addr.quarter,
            addr.city_district || addr.county,
            addr.city || addr.town || addr.village,
          ].filter(Boolean);
          const locationStr = parts.length > 0 ? parts.join(", ") : data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          setForm((prev) => ({ ...prev, location: locationStr }));
          setErrors((prev) => ({ ...prev, location: "" }));
          setLocationGpsStatus("success");
        } catch {
          // Fallback to raw coordinates if reverse geocoding fails
          const { latitude: lat, longitude: lon } = pos.coords;
          setForm((prev) => ({ ...prev, location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }));
          setLocationGpsStatus("success");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationGpsStatus("error");
      },
      { timeout: 10000, maximumAge: 30000 },
    );
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.category) newErrors.category = "Please select a category";
    if (form.title.trim().length < 5)
      newErrors.title = "Title must be at least 5 characters";
    if (form.description.trim().length < 10)
      newErrors.description = "Description must be at least 10 characters";

    if (form.location.trim().length < 3)
      newErrors.location = "Location is required";
    if (!form.lostFoundDate) newErrors.lostFoundDate = "Date is required";
    if (form.contactPhone.trim().length < 10)
      newErrors.contactPhone = "Enter a valid phone number (min 10 digits)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("category", form.category);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("ward", form.ward);
      formData.append("location", form.location.trim());
      formData.append("lostFoundDate", form.lostFoundDate);
      if (form.lostFoundTime) formData.append("lostFoundTime", form.lostFoundTime);
      formData.append("contactPhone", form.contactPhone.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/lost-found", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-my"] });
      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all";
  const labelCls = "text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 block";
  const errorCls = "text-[11px] text-red-500 font-semibold mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black ${
          isLost
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50"
            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
        }`}
      >
        <PackageSearch size={14} />
        <span>Reporting a {isLost ? "Lost" : "Found"} Item</span>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category *</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className={inputCls}
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c]} {c}
            </option>
          ))}
        </select>
        {errors.category && <p className={errorCls}>{errors.category}</p>}
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>
          {isLost ? "Lost Item" : "Found Item"} Title *
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder={
            isLost
              ? "e.g., Blue leather wallet with ID cards"
              : "e.g., Black phone found near bus stop"
          }
          className={inputCls}
          maxLength={100}
        />
        {errors.title && <p className={errorCls}>{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description *</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder={
            isLost
              ? "Describe the item in detail — color, brand, distinguishing features..."
              : "Describe the item you found — where, condition, any identifiers..."
          }
          rows={3}
          className={`${inputCls} resize-none`}
          maxLength={500}
        />
        {errors.description && (
          <p className={errorCls}>{errors.description}</p>
        )}
      </div>



      {/* Location */}
      <div>
        <label className={labelCls}>
          {isLost ? "Lost Location" : "Found Location"} *
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={(e) => {
                handleChange(e);
                setLocationGpsStatus("idle");
              }}
              placeholder="Type location or use GPS →"
              className={`${inputCls} pl-9 pr-3`}
              maxLength={150}
            />
          </div>
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isLocating}
            title="Auto-detect my current location"
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border disabled:cursor-not-allowed ${
              locationGpsStatus === "success"
                ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : locationGpsStatus === "error"
                  ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                  : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/40"
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">Locating…</span>
              </>
            ) : locationGpsStatus === "success" ? (
              <>
                <CheckCircle2 size={14} />
                <span className="hidden sm:inline">GPS Set</span>
              </>
            ) : locationGpsStatus === "error" ? (
              <>
                <LocateFixed size={14} />
                <span className="hidden sm:inline">Retry GPS</span>
              </>
            ) : (
              <>
                <LocateFixed size={14} />
                <span className="hidden sm:inline">Use GPS</span>
              </>
            )}
          </button>
        </div>
        {locationGpsStatus === "error" && (
          <p className="text-[11px] text-red-500 font-semibold mt-1">
            ⚠️ Location access denied. Please type your location manually.
          </p>
        )}
        {locationGpsStatus === "success" && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            ✅ Location auto-detected! You can edit it if needed.
          </p>
        )}
        {errors.location && locationGpsStatus !== "error" && (
          <p className={errorCls}>{errors.location}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            {isLost ? "Lost Date" : "Found Date"} *
          </label>
          <input
            type="date"
            name="lostFoundDate"
            value={form.lostFoundDate}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={inputCls}
          />
          {errors.lostFoundDate && (
            <p className={errorCls}>{errors.lostFoundDate}</p>
          )}
        </div>
        <div>
          <Time12Picker
            value={form.lostFoundTime}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, lostFoundTime: val }))
            }
            label={isLost ? "Lost Time" : "Found Time"}
          />
        </div>
      </div>

      {/* Contact Phone */}
      <div>
        <label className={labelCls}>
          Your Contact Phone *{" "}
          <span className="text-slate-400 font-medium">
            (shown only to logged-in users who request it)
          </span>
        </label>
        <input
          type="tel"
          name="contactPhone"
          value={form.contactPhone}
          onChange={handleChange}
          placeholder="e.g., 9876543210"
          className={inputCls}
          maxLength={15}
        />
        {errors.contactPhone && (
          <p className={errorCls}>{errors.contactPhone}</p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelCls} mb-0`}>
            {isLost ? "🔍 Missing Item Photo" : "📸 Found Item Photo"}
          </label>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Optional
          </span>
        </div>
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-orange-400/40 dark:border-orange-500/30 shadow-lg shadow-orange-500/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-white">Photo added</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute top-2.5 right-2.5 w-8 h-8 bg-slate-900/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-red-600/80 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <label className="group flex flex-col items-center justify-center gap-3 h-36 rounded-2xl cursor-pointer transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-500/70 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 hover:from-orange-50/60 hover:to-amber-50/40 dark:hover:from-orange-950/20 dark:hover:to-amber-950/10">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isLost
                ? "bg-red-100 dark:bg-red-950/40 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/40"
                : "bg-emerald-100 dark:bg-emerald-950/40 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40"
            }`}>
              <Camera size={22} className={isLost ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {isLost ? "Upload Missing Item Photo" : "Upload Found Item Photo"}
              </p>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                Clear photos help others recognise the item faster
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
              JPG, PNG, WEBP · Max 5MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </label>
        )}
      </div>

      {apiError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-700 dark:text-red-400">
          {apiError}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-black transition cursor-pointer shadow-md shadow-orange-500/25"
        >
          {isSubmitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </form>
  );
}

// --- CLAIM REQUEST MODAL (inline — shown inside the detail modal) ---
function ClaimRequestModal({
  item,
  onClose,
  onSent,
}: {
  item: LostFoundItem;
  onClose: () => void;
  onSent: (claimId: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError("Please write at least 10 characters describing how you identify this item.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lost-found/claims", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostFoundItemId: item.id, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSent(data.claim.id);
    } catch (err: any) {
      setError(err.message || "Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={15} className="text-orange-500" />
              Send Contact Request
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              For: <span className="font-bold text-slate-700 dark:text-slate-300">{item.title}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info box */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50">
            <ShieldCheck size={13} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-relaxed font-medium">
              Your message will be sent to the item owner for review. Phone numbers are only shared after <span className="font-black">mutual consent</span>.
            </p>
          </div>

          {/* Mandatory message */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Identification Proof / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(null); }}
              rows={4}
              maxLength={500}
              placeholder={
                item.type === "lost"
                  ? "Describe where and when you found this item. Include any identifying details (e.g., 'Found near Avadi bus stand gate 2, has Aadhar card inside, black colour')…"
                  : "Describe why this is your item. Include unique identifiers (e.g., 'My wallet has a small tear on the right corner, contains bank card ending in 4521')…"
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
            />
            <div className="flex justify-between mt-1">
              {error ? (
                <p className="text-[11px] text-red-500 font-semibold">{error}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Minimum 10 characters required</p>
              )}
              <span className="text-[11px] text-slate-400">{message.length}/500</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || message.trim().length < 10}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition cursor-pointer shadow-md shadow-orange-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={13} className="animate-spin" /> Sending…</>
              ) : (
                <><MessageSquare size={13} /> Send Request</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- INCOMING CLAIMS PANEL (shown inside ItemDetailModal for owners) ---
function IncomingClaimsPanel({
  item,
  onClaimActioned,
}: {
  item: LostFoundItem;
  onClaimActioned: () => void;
}) {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [expandedPhone, setExpandedPhone] = useState<Record<string, { name: string; phone: string }>>({});

  const { data: claims = [], isLoading, refetch } = useQuery<LostFoundClaim[]>({
    queryKey: ["lost-found-claims-owner", item.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/lost-found/claims?role=owner&itemId=${item.id}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });

  const pendingClaims = claims.filter((c) => c.status === "PENDING");
  const resolvedClaims = claims.filter((c) => c.status !== "PENDING");

  const handleAction = async (claimId: string, action: "ACCEPTED" | "REJECTED") => {
    setActioningId(claimId);
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
        setExpandedPhone((prev) => ({
          ...prev,
          [claimId]: { name: data.requesterName, phone: data.requesterPhone },
        }));
      }

      queryClient.invalidateQueries({ queryKey: ["lost-found-claims-owner", item.id] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-claims-badge"] });
      refetch();
      onClaimActioned();
    } catch {
      // Silently fail — UI will show stale state
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <Loader2 size={13} className="animate-spin text-slate-400" />
        <span className="text-[11px] text-slate-400">Loading requests…</span>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
          No contact requests yet for this item.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingClaims.length > 0 && (
        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <Bell size={10} className="animate-pulse" />
          {pendingClaims.length} Pending Request{pendingClaims.length > 1 ? "s" : ""}
        </p>
      )}
      {claims.map((claim) => (
        <div
          key={claim.id}
          className={`p-3 rounded-xl border space-y-2 ${
            claim.status === "PENDING"
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
              : claim.status === "ACCEPTED"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                <User size={13} className="text-orange-600" />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                  {claim.requester.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              claim.status === "PENDING"
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                : claim.status === "ACCEPTED"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}>
              {claim.status}
            </span>
          </div>

          {/* Their identification message */}
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Their Message</p>
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              {claim.message}
            </p>
          </div>

          {/* Phone unlocked after accept */}
          {(claim.status === "ACCEPTED" || expandedPhone[claim.id]) && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
              <Phone size={13} className="text-emerald-600 shrink-0" />
              <a
                href={`tel:${expandedPhone[claim.id]?.phone}`}
                className="text-xs font-black text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                {expandedPhone[claim.id]?.phone || "—"}
              </a>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 ml-auto font-semibold">
                {expandedPhone[claim.id]?.name}
              </span>
            </div>
          )}

          {/* Action buttons for pending claims */}
          {claim.status === "PENDING" && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={actioningId === claim.id}
                onClick={() => handleAction(claim.id, "ACCEPTED")}
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {actioningId === claim.id ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                Accept & Share Numbers
              </button>
              <button
                type="button"
                disabled={actioningId === claim.id}
                onClick={() => handleAction(claim.id, "REJECTED")}
                className="flex-1 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle size={12} />
                Deny
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- ITEM DETAIL MODAL ---
function ItemDetailModal({
  item,
  authUserId,
  onClose,
  onResolved,
  onEdit,
  onDelete,
}: {
  item: LostFoundItem;
  authUserId: string | undefined;
  onClose: () => void;
  onResolved: (id: string) => void;
  onEdit: (item: LostFoundItem) => void;
  onDelete: (item: LostFoundItem) => void;
}) {
  const isOwner = authUserId === item.userId;
  const isLost = item.type === "lost";
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // For requester: track their existing claim on this item
  const [myClaimId, setMyClaimId] = useState<string | null>(null);
  const [myClaimStatus, setMyClaimStatus] = useState<"PENDING" | "ACCEPTED" | "REJECTED" | null>(null);
  const [unlockedContact, setUnlockedContact] = useState<{ name: string; phone: string } | null>(null);

  const queryClient = useQueryClient();

  // On mount (for non-owners on Active items), check if user already has a claim
  useEffect(() => {
    if (isOwner || !authUserId || item.status !== "Active") return;
    const checkClaim = async () => {
      try {
        const res = await fetch(
          `/api/lost-found/claims?role=requester&itemId=${item.id}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data: LostFoundClaim[] = await res.json();
        if (data.length > 0) {
          const c = data[0];
          setMyClaimId(c.id);
          setMyClaimStatus(c.status);
          if (c.status === "ACCEPTED") {
            // Fetch unlocked phone
            const phoneRes = await fetch(
              `/api/lost-found/${item.id}/contact`,
              { credentials: "include" },
            );
            if (phoneRes.ok) {
              const phoneData = await phoneRes.json();
              setUnlockedContact({ name: phoneData.contactName, phone: phoneData.contactPhone });
            }
          }
        }
      } catch {
        // Ignore
      }
    };
    checkClaim();
  }, [isOwner, authUserId, item.id, item.status]);

  const handleResolve = async () => {
    setIsResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(`/api/lost-found/${item.id}/resolve`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-my"] });
      onResolved(item.id);
      onClose();
    } catch (err: any) {
      setResolveError(err.message || "Failed to resolve");
    } finally {
      setIsResolving(false);
    }
  };

  const handleClaimSent = (claimId: string) => {
    setMyClaimId(claimId);
    setMyClaimStatus("PENDING");
    setShowClaimModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Image */}
      {item.imageUrl && (
        <div className="rounded-2xl overflow-hidden h-44 border border-slate-200 dark:border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Type & Status badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
            isLost
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
        >
          {isLost ? "🔴 Lost" : "🟢 Found"}
        </span>
        <Badge
          variant={item.status === "Resolved" ? "success" : "primary"}
          className="text-[11px]"
        >
          {item.status}
        </Badge>
        <Badge variant="default" className="text-[11px]">
          {CATEGORY_ICONS[item.category]} {item.category}
        </Badge>
        <span className="text-[10px] font-bold text-slate-400 flex items-center">
          #{item.itemId}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {item.description}
      </p>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            icon: MapPin,
            label: "Ward",
            value: `Ward ${item.ward}`,
          },
          {
            icon: MapPin,
            label: "Location",
            value: item.location,
          },
          {
            icon: Calendar,
            label: isLost ? "Lost Date" : "Found Date",
            value: item.lostFoundDate,
          },
          item.lostFoundTime
            ? {
                icon: Clock,
                label: isLost ? "Lost Time" : "Found Time",
                value: formatTo12Hour(item.lostFoundTime),
              }
            : null,
        ]
          .filter(Boolean)
          .map((d: any, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <d.icon size={11} className="text-orange-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {d.label}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                {d.value}
              </p>
            </div>
          ))}
      </div>

      {/* Reported by */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
        <User size={13} className="text-slate-400 shrink-0" />
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
          Reported by:{" "}
          <span className="text-slate-900 dark:text-white">
            {item.contactName}
          </span>
        </span>
      </div>

      {/* Privacy-First Contact Exchange — only for non-owners on active reports */}
      {item.status === "Active" && !isOwner && (
        <div className="space-y-2">
          {/* 🔓 ACCEPTED — Mutual phone number unlocked */}
          {myClaimStatus === "ACCEPTED" && unlockedContact && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Contact Unlocked — Owner Accepted
                </p>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-emerald-950/40">
                <Phone size={14} className="text-emerald-600 shrink-0" />
                <a
                  href={`tel:${unlockedContact.phone}`}
                  className="text-sm font-black text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  {unlockedContact.phone}
                </a>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 ml-auto font-semibold">
                  {unlockedContact.name}
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                📞 You can now contact the owner directly. Please coordinate for safe handover.
              </p>
            </div>
          )}

          {/* ⏳ PENDING — Waiting for owner response */}
          {myClaimStatus === "PENDING" && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-amber-600 shrink-0 animate-pulse" />
                <p className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                  Request Sent — Waiting for Owner
                </p>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium">
                Your claim request is under review. Once the owner accepts, you will see their contact number here.
              </p>
            </div>
          )}

          {/* ❌ REJECTED — Owner denied the request */}
          {myClaimStatus === "REJECTED" && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-1">
              <div className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-[11px] font-black text-red-700 dark:text-red-400">
                  Request Rejected
                </p>
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-500 font-medium">
                The owner reviewed your request and did not accept it. No contact information was shared.
              </p>
              <button
                type="button"
                onClick={() => { setMyClaimStatus(null); setMyClaimId(null); }}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 underline mt-1 cursor-pointer"
              >
                Send a new request with more details
              </button>
            </div>
          )}

          {/* 🆕 No claim yet — show the claim button */}
          {!myClaimStatus && (
            <>
              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                <ShieldCheck size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                  <span className="font-black">Privacy Protected.</span> Contact info is never shown directly. Send a request with proof — the owner will review and accept to unlock mutual contact.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-black transition shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageSquare size={14} />
                {isLost ? "I Found This Item — Contact Owner" : "This Is My Item — Contact Finder"}
              </button>
            </>
          )}

          {/* Claim Modal */}
          {showClaimModal && (
            <ClaimRequestModal
              item={item}
              onClose={() => setShowClaimModal(false)}
              onSent={handleClaimSent}
            />
          )}
        </div>
      )}

      {/* Owner controls — only if Active */}
      {isOwner && item.status === "Active" && (
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Incoming Contact Requests */}
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Bell size={10} />
              Contact Requests
            </p>
            <IncomingClaimsPanel
              item={item}
              onClaimActioned={() => {}}
            />
          </div>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Your Report Controls
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/50 transition cursor-pointer"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 space-y-2">
              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                Are you sure you want to delete this report? This cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(item);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-black cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleResolve}
            disabled={isResolving}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-black transition cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={15} />
            {isResolving ? "Marking…" : "Mark as Resolved (Item Retrieved)"}
          </button>
          {resolveError && (
            <p className="text-[11px] text-red-500 font-semibold">
              {resolveError}
            </p>
          )}
        </div>
      )}

      {/* Resolved info */}
      {item.status === "Resolved" && item.resolvedAt && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            Resolved on{" "}
            {new Date(item.resolvedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

// --- EDIT FORM MODAL ---
function EditForm({
  item,
  onSuccess,
  onClose,
}: {
  item: LostFoundItem;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    location: item.location,
    lostFoundDate: item.lostFoundDate,
    lostFoundTime: item.lostFoundTime || "",
    contactPhone: item.contactPhone || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all";
  const labelCls =
    "text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/lost-found/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-my"] });
      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>Location</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Date</label>
          <input
            type="date"
            value={form.lostFoundDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, lostFoundDate: e.target.value }))
            }
            max={new Date().toISOString().split("T")[0]}
            className={inputCls}
          />
        </div>
        <div>
          <Time12Picker
            value={form.lostFoundTime}
            onChange={(val) =>
              setForm((p) => ({ ...p, lostFoundTime: val }))
            }
            label="Time"
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Contact Phone</label>
        <input
          type="tel"
          value={form.contactPhone}
          onChange={(e) =>
            setForm((p) => ({ ...p, contactPhone: e.target.value }))
          }
          className={inputCls}
          maxLength={15}
        />
      </div>
      {apiError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-700 dark:text-red-400">
          {apiError}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-black transition cursor-pointer shadow-md shadow-orange-500/25"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// --- MAIN CLIENT ---
export default function LostFoundClient() {
  const { activeWard, wards, authUser } = useWard();

  const [activeTab, setActiveTab] = useState<"lost" | "found" | "my">("lost");
  const [reportModal, setReportModal] = useState<"lost" | "found" | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [editItem, setEditItem] = useState<LostFoundItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterWard, setFilterWard] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("Active");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Public listing query
  const { data: items = [], isLoading } = useQuery<LostFoundItem[]>({
    queryKey: ["lost-found", activeTab, filterWard, filterCategory, filterStatus, search],
    queryFn: async () => {
      if (activeTab === "my") return [];
      const params = new URLSearchParams();
      params.set("type", activeTab);
      if (filterWard !== "all") params.set("ward", filterWard);
      if (filterCategory) params.set("category", filterCategory);
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/lost-found?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: activeTab !== "my",
  });

  // My Reports query
  const { data: myItems = [], isLoading: isLoadingMy } = useQuery<LostFoundItem[]>({
    queryKey: ["lost-found-my", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/lost-found/my?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: activeTab === "my",
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lost-found/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      queryClient.invalidateQueries({ queryKey: ["lost-found-my"] });
      showSuccess("Report deleted successfully.");
    },
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Pending incoming claim requests badge (for owner's My Reports tab)
  const { data: pendingClaimsCount = 0 } = useQuery<number>({
    queryKey: ["lost-found-claims-badge"],
    queryFn: async () => {
      const res = await fetch("/api/lost-found/claims?role=owner&status=PENDING", {
        credentials: "include",
      });
      if (!res.ok) return 0;
      const data: LostFoundClaim[] = await res.json();
      return data.length;
    },
    refetchInterval: 30000, // check every 30s
  });

  const displayItems = activeTab === "my" ? myItems : items;
  const isLoadingAny = activeTab === "my" ? isLoadingMy : isLoading;

  const tabs = [
    { key: "lost" as const, label: "Lost Items", emoji: "🔴", badge: 0 },
    { key: "found" as const, label: "Found Items", emoji: "🟢", badge: 0 },
    { key: "my" as const, label: "My Reports", emoji: "📋", badge: pendingClaimsCount },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-sans select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2"
            >
              <CheckCircle2 size={14} />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <PackageSearch className="text-orange-500" size={24} />
              Lost & Found Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Report lost items or help reunite found items with their owners
            </p>
          </div>
          <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 shrink-0 w-fit">
            <MapPin size={14} />
            <span>Ward {String(activeWard.id).padStart(2, "0")}</span>
          </span>
        </div>

        {/* Report Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              type: "lost" as const,
              label: "I Lost Something",
              color:
                "from-red-500 to-rose-600 shadow-red-500/25 hover:from-red-600 hover:to-rose-700",
            },
            {
              type: "found" as const,
              label: "I Found Something",
              color:
                "from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700",
            },
          ].map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => setReportModal(btn.type)}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-linear-to-r ${btn.color} text-white text-xs sm:text-sm font-black shadow-md transition-all active:scale-95 cursor-pointer`}
            >
              <Plus size={16} />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Filters — hidden for My Reports */}
        {activeTab !== "my" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search title, description, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((p) => !p)}
                className={`px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  showFilters
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-500/50"
                }`}
              >
                <Filter size={13} />
                Filters
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <select
                      value={filterWard}
                      onChange={(e) => setFilterWard(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                    >
                      <option value="all">All Wards</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          Ward {w.id}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_ICONS[c]} {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                    >
                      <option value="Active">Active Only</option>
                      <option value="Resolved">Resolved Only</option>
                      <option value="">All Status</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* My Reports status filter */}
        {activeTab === "my" && (
          <div className="flex gap-2">
            {[
              { value: "Active", label: "Active" },
              { value: "Resolved", label: "Resolved" },
              { value: "", label: "All" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                  filterStatus === opt.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Listing */}
        {isLoadingAny ? (
          <SkeletonLoader type="card" count={3} />
        ) : displayItems.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={
              activeTab === "my"
                ? "No reports yet"
                : activeTab === "lost"
                  ? "No lost item reports"
                  : "No found item reports"
            }
            description={
              activeTab === "my"
                ? "You haven't submitted any reports. Use the buttons above to report a lost or found item."
                : activeTab === "lost"
                  ? "No lost items reported in this area. Check back later or adjust your filters."
                  : "No found items reported. If you've found something, help a fellow resident!"
            }
            actionText={
              activeTab === "my"
                ? undefined
                : activeTab === "lost"
                  ? "Report Lost Item"
                  : "Report Found Item"
            }
            onAction={
              activeTab === "my"
                ? undefined
                : () => setReportModal(activeTab === "lost" ? "lost" : "found")
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {displayItems.map((item) => (
                <LostFoundCard
                  key={item.id}
                  item={item}
                  authUserId={authUser?.id}
                  onView={setSelectedItem}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Report Modal */}
      <Modal
        isOpen={!!reportModal}
        onClose={() => setReportModal(null)}
        title={
          reportModal === "lost"
            ? "Report a Lost Item"
            : "Report a Found Item"
        }
        maxWidth="sm:max-w-lg"
      >
        {reportModal && (
          <ReportForm
            type={reportModal}
            wards={wards}
            activeWardId={activeWard.id}
            defaultPhone={authUser?.phone || ""}
            onSuccess={() =>
              showSuccess(
                reportModal === "lost"
                  ? "Lost item reported successfully!"
                  : "Found item reported successfully!",
              )
            }
            onClose={() => setReportModal(null)}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Item Details"
        maxWidth="sm:max-w-lg"
      >
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            authUserId={authUser?.id}
            onClose={() => setSelectedItem(null)}
            onResolved={() => showSuccess("Report marked as resolved!")}
            onEdit={(item) => {
              setSelectedItem(null);
              setEditItem(item);
            }}
            onDelete={(item) => {
              deleteMutation.mutate(item.id);
            }}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Report"
        maxWidth="sm:max-w-lg"
      >
        {editItem && (
          <EditForm
            item={editItem}
            onSuccess={() => showSuccess("Report updated successfully!")}
            onClose={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}
