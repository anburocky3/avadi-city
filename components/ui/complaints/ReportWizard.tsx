"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import "leaflet/dist/leaflet.css";

import {
  MapPin,
  Camera,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Map as MapIcon,
  Share2,
  Search,
  CheckCircle,
  Circle,
  Info,
  Edit3,
  FileText,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Complaint, useWard } from "@/context/wardContext";
import { Modal } from "@/components/shared-components";
import { toast } from "@/utils/toast";
import { ALL_AVADI_STREETS } from "@/lib/wards";
import { RICH_CIVIC_CATEGORIES } from "@/app/(auth)/complaints/page copy";

const complaintSchema = zod.object({
  category: zod.string(),
  subCategory: zod
    .string()
    .min(3, "Please select or describe the specific issue"),
  streetName: zod
    .string()
    .min(3, "Please enter at least 3 characters for the street name"),
  lat: zod.number(),
  lng: zod.number(),
  title: zod
    .string()
    .min(6, { message: "Title must be at least 6 characters long" }),
  description: zod
    .string()
    .min(15, { message: "Description must be at least 15 characters long" }),
  shareOnFeed: zod.boolean().default(true),
});

type ComplaintFormData = zod.infer<typeof complaintSchema>;

// Map Component
const MapLocationPicker = ({
  onLocationSelect,
  onError,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      mapRef.current &&
      !mapInstance.current
    ) {
      const L = require("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultLat = 13.1169;
      const defaultLng = 80.0972;
      const avadiBounds = L.latLngBounds(
        L.latLng(13.01, 79.99),
        L.latLng(13.22, 80.2),
      );

      const map = L.map(mapRef.current, {
        maxBounds: avadiBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 12,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
      }).addTo(map);

      const validateAndSetLocation = (latlng: any) => {
        if (avadiBounds.contains(latlng)) {
          marker.setLatLng(latlng);
          onLocationSelect(latlng.lat, latlng.lng);
          onError(null);
        } else {
          marker.setLatLng([defaultLat, defaultLng]);
          map.setView([defaultLat, defaultLng], 14);
          onLocationSelect(defaultLat, defaultLng);
          onError("Location must be within Avadi Corporation limits.");
        }
      };

      marker.on("dragend", () => validateAndSetLocation(marker.getLatLng()));
      map.on("click", (e: any) => validateAndSetLocation(e.latlng));

      mapInstance.current = map;
      markerInstance.current = marker;
      onLocationSelect(defaultLat, defaultLng);
    }
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-2xl z-0 relative border border-slate-200 dark:border-slate-700 shadow-sm"
    />
  );
};

export default function ReportWizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { userProfile, activeWard, addComplaint } = useWard();

  const [reportStep, setReportStep] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<
    (typeof RICH_CIVIC_CATEGORIES)[0] | null
  >(null);
  const [subSearchQuery, setSubSearchQuery] = useState<string>("");
  const [customSubCategory, setCustomSubCategory] = useState<string>("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 13.1169,
    lng: 80.0972,
  });
  const [mapError, setMapError] = useState<string | null>(null);
  const [streetResults, setStreetResults] = useState<any[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] = useState<any | null>(
    null,
  );
  const [submittedComplaint, setSubmittedComplaint] =
    useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Need to store actual File objects alongside preview URLs to send to backend
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    mode: "onChange",
    defaultValues: {
      category: "",
      subCategory: "",
      streetName: "",
      lat: 13.1169,
      lng: 80.0972,
      title: "",
      description: "",
    },
  });

  const watchSubCategory = watch("subCategory");
  const watchStreetName = watch("streetName");

  useEffect(() => {
    if (watchSubCategory && reportStep === 2) {
      const locationContext = watchStreetName || "Selected Location";
      setValue(
        "title",
        `Request for ${watchSubCategory} at ${locationContext}`,
        { shouldValidate: true },
      );
      setValue(
        "description",
        `Reporting an issue regarding ${watchSubCategory}.\n\nLocation: ${locationContext}.\n\nPlease arrange for an inspection and resolve at the earliest.`,
        { shouldValidate: true },
      );
    }
  }, [watchSubCategory, watchStreetName, mapCoords, setValue, reportStep]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - imageFiles.length);

    // Store actual files for backend processing
    setImageFiles((prev) => [...prev, ...files]);

    // Generate object URLs for UI previews
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectStreet = (street: any) => {
    setSelectedStreetItem(street);
    setValue("streetName", street.streetName, { shouldValidate: true });
    setStreetResults([]);
  };

  const handleReportSubmit: SubmitHandler<ComplaintFormData> = async (data) => {
    if (mapError || imageFiles.length === 0) return;

    const defaultImage =
      RICH_CIVIC_CATEGORIES.find((c) => c.id === data.category)?.image ||
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60";

    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const generatedIssueId = `AVD-${new Date().getFullYear()}-${uniqueNumber}`;

    const newComplaint = {
      title: data.title,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      userWard: activeWard.id,
      streetName: data.streetName,
      address: data.streetName,
      lat: data.lat,
      lng: data.lng,
      shareOnFeed: data.shareOnFeed,
      status: "Submitted" as const,
      isUserSubmitted: true,
      images: imageFiles, // Pass the actual File objects to the API context handler
      imageUrl: imagePreviews[0] || defaultImage,
      author: userProfile.name || "Avadi Resident",
      date: new Date().toISOString(),
      upvotes: 1,
      issueId: generatedIssueId,
    };

    // Assume `addComplaint` makes the API request to `/api/complaints` and returns the object
    const created = await addComplaint(newComplaint);
    setSubmittedComplaint(created as unknown as Complaint);
    setReportStep(3);
    toast.success("Complaint submitted successfully!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Modal
      isOpen={true} // Since it's an intercepted route, it's always open when rendered
      onClose={onClose}
      maxWidth="sm:max-w-2xl md:max-w-4xl xl:max-w-5xl"
      title={
        reportStep === 3 ? (
          <span className="text-lg font-black text-slate-900 dark:text-white truncate">
            Grievance Registered
          </span>
        ) : (
          ((
            <div className="space-y-4 mr-5 w-full">
              <div className="flex items-center gap-3 w-full pr-8">
                <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black rounded-lg border border-orange-500/20 uppercase tracking-widest shrink-0">
                  Step {reportStep} of 2
                </span>
                <span className="truncate text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {reportStep === 1 && !selectedGroup && "Select Department"}
                  {reportStep === 1 &&
                    selectedGroup &&
                    `Select Issue in ${selectedGroup.title}`}
                  {reportStep === 2 && "Describe Issue & Pinpoint Location"}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-0 shrink-0 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: reportStep === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>
          ) as any)
        )
      }
    >
      <div className="flex flex-col min-h-screen sm:min-h-0 sm:h-auto sm:max-h-128 lg:max-h-full bg-white dark:bg-slate-900 rounded-b-3xl">
        {/* STEP 1 */}
        {reportStep === 1 && (
          <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden mt-4">
            <AnimatePresence mode="wait">
              {!selectedGroup ? (
                <motion.div
                  key="master-grid"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 shrink-0 mb-4 px-2">
                    Select the department that handles your civic problem:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 overflow-y-auto pr-2 px-2 custom-scrollbar pb-4">
                    {RICH_CIVIC_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <motion.div
                          key={cat.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setSelectedGroup(cat);
                            setValue("category", cat.id);
                            setValue("subCategory", "");
                            setSubSearchQuery("");
                            setCustomSubCategory("");
                          }}
                          className="rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 hover:border-primary shadow-xs sm:hover:shadow-md transition-all cursor-pointer group flex flex-col bg-white dark:bg-slate-900"
                        >
                          <div className="relative h-32 md:h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img
                              src={cat.image}
                              alt={cat.title}
                              className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                              <div
                                className={`p-2 rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-sm flex items-center space-x-2 px-3 border border-white/20`}
                              >
                                <CatIcon size={14} />
                                <span className="text-xs font-black tracking-wider uppercase">
                                  {cat.badge}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 space-y-1 border-t border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight sm:group-hover:text-primary transition-colors">
                                {cat.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
                                {cat.desc}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex justify-between items-center">
                              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                                {cat.issues.length > 0
                                  ? `${cat.issues.length} Issues`
                                  : "Custom"}
                              </span>
                              <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 sm:group-hover:bg-primary sm:group-hover:text-white transition-colors">
                                SELECT
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="sub-list"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0 px-2"
                >
                  <div className="shrink-0 space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="flex items-center text-xs font-black text-slate-500 hover:text-primary transition cursor-pointer"
                    >
                      <ArrowLeft size={14} className="mr-1" /> Back to
                      Departments
                    </button>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex items-center gap-3">
                      <Info className="text-blue-500 shrink-0" size={20} />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        You have selected the{" "}
                        <strong>{selectedGroup.title}</strong> department.{" "}
                        {selectedGroup.id === "Others"
                          ? " Please describe your issue below."
                          : " Now search or pick a specific issue inside it."}
                      </p>
                    </div>
                    {selectedGroup.id !== "Others" && (
                      <div className="relative">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder={`Search inside ${selectedGroup.title}...`}
                          value={subSearchQuery}
                          onChange={(e) => setSubSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-2 max-h-128 custom-scrollbar">
                    {selectedGroup.id === "Others" ? (
                      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">
                          Please describe the exact nature of your issue:
                        </label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="E.g., Abandoned vehicle blocking the road"
                          value={customSubCategory}
                          onChange={(e) => {
                            setCustomSubCategory(e.target.value);
                            setValue("subCategory", e.target.value);
                          }}
                          className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    ) : (
                      selectedGroup.issues
                        .filter((sub) =>
                          sub
                            .toLowerCase()
                            .includes(subSearchQuery.toLowerCase()),
                        )
                        .map((sub, i) => {
                          const isSelected = watchSubCategory === sub;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setValue("subCategory", sub);
                                setTimeout(() => setReportStep(2), 300);
                              }}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${isSelected ? "bg-orange-500/10 border-primary ring-1 ring-primary shadow-sm" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"}`}
                            >
                              <span
                                className={`text-sm font-bold ${isSelected ? "text-primary dark:text-orange-400" : "text-slate-700 dark:text-slate-200"}`}
                              >
                                {sub}
                              </span>
                              {isSelected ? (
                                <CheckCircle
                                  className="text-primary"
                                  size={20}
                                />
                              ) : (
                                <Circle
                                  className="text-slate-300 dark:text-slate-700"
                                  size={20}
                                />
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                  <div className="shrink-0 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setReportStep(2)}
                      disabled={!watchSubCategory}
                      className="w-full sm:w-auto sm:float-right min-w-64 py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm flex items-center justify-center space-x-2 cursor-pointer tracking-wider uppercase"
                    >
                      <span>NEXT STEP</span>
                      <ArrowRight size={18} />
                    </button>
                    <div className="clear-both" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* STEP 2 */}
        {reportStep === 2 && (
          <form
            onSubmit={handleSubmit(handleReportSubmit)}
            className="flex flex-col flex-1 min-h-0 mt-4 px-2"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <button
                type="button"
                onClick={() => setReportStep(1)}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Change Issue</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black border border-slate-200 dark:border-slate-700 truncate max-w-40">
                  {selectedGroup?.title}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black border border-orange-500/20 truncate max-w-48">
                  {watchSubCategory}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6 max-h-[60vh] custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                      <MapPin size={18} />
                    </div>{" "}
                    Street Name & Landmark
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Near Pattabiram Railway Station"
                    {...register("streetName", {
                      onChange: (e) => {
                        setSelectedStreetItem(null);
                        const val = e.target.value;
                        if (val.trim().length < 3) {
                          setStreetResults([]);
                          return;
                        }
                        const filtered = ALL_AVADI_STREETS.filter((item) =>
                          item.streetName
                            .toLowerCase()
                            .includes(val.toLowerCase().trim()),
                        ).slice(0, 15);
                        setStreetResults(filtered);
                      },
                    })}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <AnimatePresence>
                    {streetResults.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl custom-scrollbar top-full"
                      >
                        {streetResults.map((street, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleSelectStreet(street)}
                            className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-500/10 hover:text-primary cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-none flex items-center gap-2"
                          >
                            <MapPin size={14} className="text-slate-400" />
                            {street.streetName}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                  {errors.streetName && (
                    <p className="text-xs text-rose-500 font-medium">
                      {errors.streetName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <MapIcon size={18} />
                    </div>{" "}
                    Pinpoint Location on Map
                  </label>
                  <MapLocationPicker
                    onLocationSelect={(lat, lng) => {
                      setValue("lat", lat);
                      setValue("lng", lng);
                      setMapCoords({ lat, lng });
                    }}
                    onError={(msg) => setMapError(msg)}
                  />
                  {mapError && (
                    <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                      {mapError}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                        <FileText size={18} />
                      </div>{" "}
                      Issue Summary Title
                    </label>
                    <span className="text-[10px] text-orange-500 font-extrabold px-2 py-0.5 bg-orange-500/10 rounded-md">
                      Auto-Drafted
                    </span>
                  </div>
                  <input
                    type="text"
                    {...register("title")}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.title && (
                    <p className="text-xs text-rose-500 font-medium">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Edit3 size={18} />
                    </div>{" "}
                    Detailed Problem Description
                  </label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400 resize-none min-h-32"
                  />
                  {errors.description && (
                    <p className="text-xs text-rose-500 font-medium">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                      <Camera size={18} />
                    </div>{" "}
                    Upload Issue Photos (Max 3){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 items-center pt-2">
                  {imagePreviews.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <img
                        src={url}
                        alt="Attached issue"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-950/80 text-white flex items-center justify-center font-bold text-xs hover:bg-slate-950 cursor-pointer shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 3 && (
                    <label className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
                      <Camera size={24} className="mb-1" />
                      <span className="text-xs font-extrabold mt-1">
                        Upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                {imageFiles.length === 0 && (
                  <p className="text-xs text-rose-500 font-medium">
                    At least one photo is required to submit a grievance.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      {...register("shareOnFeed")}
                      className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    />
                    <Check
                      size={14}
                      className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                      Post to Community Feed
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">
                      Allow other residents in Ward {activeWard.id} to see and
                      upvote this issue to escalate priority.
                    </span>
                  </div>
                </label>
              </div>

              <div className="shrink-0 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={
                    !isValid || mapError !== null || imageFiles.length === 0
                  }
                  className="w-full sm:w-auto sm:float-right min-w-64 py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-md hover:shadow-lg transition text-sm cursor-pointer tracking-wider uppercase"
                >
                  Submit Grievance Report
                </button>
                <div className="clear-both" />
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {reportStep === 3 && submittedComplaint && (
          <div className="flex flex-col flex-1 items-center justify-center space-y-6 text-center py-8 w-full max-w-2xl mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Grievance Submitted Successfully!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
                Your report has been securely logged and dispatched to the
                Municipal Corporation & Zonal Officer.
              </p>
            </div>
            <div className="w-full p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 space-y-3">
              <span className="text-sm font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                Official Grievance ID
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-widest">
                  {submittedComplaint.issueId}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(submittedComplaint.issueId || "")
                  }
                  className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary transition text-xs font-extrabold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <Copy size={16} />
                  <span>{copiedId ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
            <div className="w-full space-y-4 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-center gap-2">
                <Share2 size={14} /> Share to Escalate Visibility
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`I have registered a civic grievance (ID: ${submittedComplaint.issueId}) regarding ${watchSubCategory} via the Avadi City Portal. Let's build a better city! https://avadi.vercel.app 🏙️`)}`,
                      "_blank",
                    )
                  }
                  className="w-full sm:flex-1 py-3.5 bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I have registered a civic grievance (ID: ${submittedComplaint.issueId}) regarding ${watchSubCategory} via the Avadi City Portal. https://avadi.vercel.app @AvadiCorp`)}`,
                      "_blank",
                    )
                  }
                  className="w-full sm:flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border border-slate-700 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  X (Twitter)
                </button>
              </div>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black transition text-sm cursor-pointer order-2 sm:order-1"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/complaints/active");
                }}
                className="w-full py-4 bg-primary hover:bg-orange-600 text-white rounded-2xl font-black shadow-md transition text-sm cursor-pointer flex items-center justify-center space-x-2 order-1 sm:order-2"
              >
                <FileText size={18} />
                <span>Track Status</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
