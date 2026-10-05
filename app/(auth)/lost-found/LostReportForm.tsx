"use client";

import MapLocationPicker from "@/components/ui/MapLocationPicker";
import {
  ALL_AVADI_STREETS,
  StreetItem,
  sanitiseReverseGeocodedAddress,
} from "@/lib/wards";
import { useQueryClient } from "@tanstack/react-query";
import { PackageSearch, MapPin, CheckCircle2, X, Camera } from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { CATEGORIES, CATEGORY_ICONS } from "./LostFoundClient";
import Image from "next/image";

// Avadi Ward Center coordinates
const WARD_CENTERS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 13.13, lng: 80.115 },
  2: { lat: 13.128, lng: 80.108 },
  3: { lat: 13.125, lng: 80.102 },
  4: { lat: 13.122, lng: 80.098 },
  5: { lat: 13.121, lng: 80.11 },
  6: { lat: 13.1175, lng: 80.101 },
  7: { lat: 13.1169, lng: 80.0972 },
  8: { lat: 13.1145, lng: 80.094 },
  9: { lat: 13.112, lng: 80.09 },
  10: { lat: 13.093, lng: 80.082 },
  11: { lat: 13.105, lng: 80.087 },
  12: { lat: 13.065, lng: 80.083 },
  13: { lat: 13.07, lng: 80.078 },
  14: { lat: 13.076, lng: 80.072 },
  15: { lat: 13.099, lng: 80.08 },
  16: { lat: 13.101, lng: 80.075 },
  17: { lat: 13.108, lng: 80.07 },
  18: { lat: 13.106, lng: 80.066 },
  19: { lat: 13.099, lng: 80.062 },
  20: { lat: 13.088, lng: 80.064 },
  21: { lat: 13.092, lng: 80.058 },
  22: { lat: 13.116, lng: 80.027 },
};

export default function LastReportForm({
  type,
  scrollRef,
  wards,
  activeWardId,
  defaultPhone,
  onSuccess,
  onClose,
}: {
  type: "lost" | "found";
  scrollRef: React.RefObject<any>;
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
    ward: String(activeWardId || 7),
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

  // Map & Street Autocomplete state
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(WARD_CENTERS[activeWardId] || { lat: 13.1169, lng: 80.0972 });
  const [mapError, setMapError] = useState<string | null>(null);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetInputRef = React.useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLFormElement>(null);

  const queryClient = useQueryClient();

  // Close street dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        streetInputRef.current &&
        !streetInputRef.current.contains(e.target as Node)
      ) {
        setShowStreetDropdown((prev) => (prev ? false : prev));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Avadi verified streets
  const streetSuggestions = useMemo(() => {
    const q = form.location.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return ALL_AVADI_STREETS.filter((s) =>
      s.streetName.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [form.location]);

  const handleSelectStreet = (street: StreetItem) => {
    setForm((prev) => ({
      ...prev,
      location: street.streetName,
      ward: String(street.wardNo),
    }));
    setShowStreetDropdown(false);
    setErrors((prev) => ({ ...prev, location: "", ward: "" }));
    const coords = {
      lat: 13.1168,
      lng: 80.0972,
    };
    setSelectedCoords(coords);
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      const addr = data.address || {};
      // Use sanitiser to strip non-Avadi place names (e.g. Poonamallee, Ambattur)
      const wardNo = form.ward ? Number(form.ward) : undefined;
      const locationStr = sanitiseReverseGeocodedAddress(addr, wardNo);
      setForm((prev) => ({ ...prev, location: locationStr }));
      setErrors((prev) => ({ ...prev, location: "" }));
    } catch {
      // Ignore reverse geocode network fallback
    }
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

    scrollRef?.current?.scrollTo({ top: 0, behavior: "smooth" });

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
      if (form.lostFoundTime)
        formData.append("lostFoundTime", form.lostFoundTime);
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
  const labelCls =
    "text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 block";
  const errorCls = "text-[11px] text-red-500 font-semibold mt-1";

  return (
    <form ref={contentRef} onSubmit={handleSubmit} className="space-y-4">
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
        {errors.description && <p className={errorCls}>{errors.description}</p>}
      </div>

      {/* Ward Selection & Street / Location with Avadi Boundaries */}
      <div className="space-y-3">
        {/* Street Autocomplete / Location Input */}
        <div className="relative" ref={streetInputRef}>
          <label className={labelCls}>
            {isLost ? "Lost Street / Area *" : "Found Street / Area *"}
          </label>
          <div className="relative">
            <MapPin
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              name="location"
              value={form.location}
              onFocus={() => setShowStreetDropdown(true)}
              onChange={(e) => {
                handleChange(e);
                setShowStreetDropdown(true);
              }}
              placeholder="Type street name (e.g., Gandhi St, Kamaraj Nagar)…"
              className={`${inputCls} pl-9 pr-3`}
              maxLength={150}
              autoComplete="off"
            />
          </div>

          {/* Street Suggestions Dropdown */}
          {showStreetDropdown && streetSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Avadi Verified Streets
              </div>
              {streetSuggestions.map((street) => (
                <button
                  key={street.id}
                  type="button"
                  onClick={() => handleSelectStreet(street)}
                  className="w-full px-3.5 py-2 text-left hover:bg-orange-50 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 transition">
                    {street.streetName}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Ward {street.wardNo}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Leaflet + OpenStreetMap Location Picker with GPS Guard */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Where you {isLost ? "lost" : "found"} the item? *
            </span>
          </div>

          <MapLocationPicker
            onLocationSelect={() => {
              setMapError(null);
            }}
            onError={(err) => setMapError(err)}
            selectedCoords={selectedCoords}
            onReverseGeocode={handleReverseGeocode}
          />

          {mapError && (
            <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
              ⚠️ {mapError}
            </p>
          )}
          {errors.location && <p className={errorCls}>{errors.location}</p>}
        </div>
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
          <label className={labelCls}>
            {isLost ? "Lost Time" : "Found Time"} *
          </label>
          <input
            type="time"
            name="lostFoundTime"
            value={form.lostFoundTime}
            onChange={handleChange}
            className={inputCls}
          />
          {/* <Time12Picker
            value={form.lostFoundTime}
            onChange={(val) =>
              setForm((prev) => ({ ...prev, lostFoundTime: val }))
            }
            label={isLost ? "Lost Time" : "Found Time"}
          /> */}
        </div>
      </div>

      {/* Contact Phone */}
      <div>
        <label className={labelCls}>
          Your Contact Phone * <br />
          <span className="text-slate-400 font-medium mt-1">
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
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={300}
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
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
          <label className="group flex flex-col items-center justify-center gap-3 h-36 rounded-2xl cursor-pointer transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-500/70 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 hover:from-orange-50/60 hover:to-amber-50/40 dark:hover:from-orange-950/20 dark:hover:to-amber-950/10 py-20">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isLost
                  ? "bg-red-100 dark:bg-red-950/40 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/40"
                  : "bg-emerald-100 dark:bg-emerald-950/40 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40"
              }`}
            >
              <Camera
                size={22}
                className={
                  isLost
                    ? "text-red-500 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {isLost
                  ? "Upload Missing Item Photo"
                  : "Upload Found Item Photo"}
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
