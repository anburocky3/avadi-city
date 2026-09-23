"use client";

import React, { useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useTranslations } from "next-intl";
import imageCompression from "browser-image-compression";
import {
  Home,
  Search,
  Phone,
  MapPin,
  Plus,
  CheckCircle2,
  Building2,
  Check,
  X,
  Upload,
  Loader2,
  Trash2,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Path mapped to shared-components
import { Card, Modal, EmptyState } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface RentalProperty {
  id: string;
  title: string;
  type: "Residential" | "Commercial" | string;
  propertyTypeTag?: string;
  rent: number;
  advance: number;
  contact: string;
  ownerName?: string;
  location?: string;
  ward: number;
  imageUrl?: string;
  details: string;
  features?: string[];
}

export interface RentalsClientProps {
  initialRentals: RentalProperty[];
}

// Zod Schema for Posting a Rental
const rentalSchema = zod.object({
  title: zod.string().min(5, {
    message: "Title must be at least 5 characters (e.g. 2BHK House for Rent)",
  }),
  type: zod.string().min(3, { message: "Select property type" }),
  rent: zod
    .string()
    .min(3, { message: "Enter monthly rent amount (e.g. 8500)" }),
  advance: zod
    .string()
    .min(3, { message: "Enter security advance deposit (e.g. 50000)" }),
  contact: zod.string().regex(/^[6-9]\d{9}$/, {
    message: "Must enter a valid 10-digit mobile number",
  }),
  details: zod.string().min(10, {
    message: "Add details like 24/7 water, parking, landmark etc.",
  }),
});

type RentalFormData = zod.infer<typeof rentalSchema>;

export const RentalsClient: React.FC<RentalsClientProps> = ({
  initialRentals,
}) => {
  const t = useTranslations("rentals");
  const { activeWard, userProfile } = useWard();

  const [rentalList, setRentalList] =
    useState<RentalProperty[]>(initialRentals);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rentalFilter, setRentalFilter] = useState<string>("All");

  // Post modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [justPostedIds, setJustPostedIds] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Property Photo upload state
  const [rentalPhotoUrl, setRentalPhotoUrl] = useState<string>("");
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      type: "Residential",
      rent: "",
      advance: "",
      contact: userProfile?.wardNumber?.toString() || "",
      details: "",
    },
  });

  // Filter rentals by category and search keyword
  const filteredRentals = useMemo(() => {
    let list = rentalList;

    if (rentalFilter !== "All") {
      list = list.filter((r) => {
        const type = r.type ? r.type.toLowerCase() : "";
        if (rentalFilter === "Residential") {
          return (
            type === "residential" ||
            type.includes("house") ||
            type.includes("apartment")
          );
        }
        if (rentalFilter === "Commercial") {
          return (
            type === "commercial" ||
            type.includes("shop") ||
            type.includes("office") ||
            type.includes("lease")
          );
        }
        return r.type === rentalFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q),
      );
    }

    return list;
  }, [rentalList, rentalFilter, searchQuery]);

  const handleApplyCall = (item: RentalProperty, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMsg(
      `Connecting call to owner for "${item.title}" at ${item.contact}...`,
    );
    setTimeout(() => {
      window.location.href = `tel:${item.contact}`;
      setActionMsg(null);
    }, 1500);
  };

  const handleRentalPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoUploadError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    setPhotoUploadError(null);
    setIsCompressingPhoto(true);
    try {
      let dataUrl: string;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        });
        dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      } catch {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      setRentalPhotoUrl(dataUrl);
    } catch (err) {
      console.error("Photo processing error:", err);
      setPhotoUploadError("Could not process image. Please try another photo.");
    } finally {
      setIsCompressingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRentalSubmit = (data: RentalFormData) => {
    const newId = `rent-${Date.now()}`;
    const bhkMatch = data.title.match(/\b\d+BHK\b/i);
    const typeTag = bhkMatch
      ? bhkMatch[0].toUpperCase()
      : data.type === "Commercial"
        ? "Commercial Shop"
        : "Residential";

    const newRental: RentalProperty = {
      id: newId,
      title: data.title,
      type: data.type,
      propertyTypeTag: typeTag,
      rent: parseInt(data.rent.replace(/[^0-9]/g, ""), 10) || 12000,
      advance: parseInt(data.advance.replace(/[^0-9]/g, ""), 10) || 50000,
      contact: data.contact,
      ownerName: userProfile?.name || "Avadi Resident",
      location: `Ward ${activeWard.id}, Avadi`,
      ward: activeWard.id,
      imageUrl: rentalPhotoUrl || undefined,
      details: data.details,
      features: ["24/7 Water", "Covered Bike Parking", "3-Phase Electricity"],
    };

    setRentalList((prev) => [newRental, ...prev]);

    // Track newly posted item
    setJustPostedIds((prev) => [...prev, newId]);
    setTimeout(() => {
      setJustPostedIds((prev) => prev.filter((id) => id !== newId));
    }, 6000);

    reset();
    setRentalPhotoUrl("");
    setPhotoUploadError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none flex items-center gap-2">
            <Building2 className="text-primary" size={24} />
            <span>{t("title")}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={16} className="stroke-3" />
          <span>{t("postHouseBtn")}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
        />
      </div>

      {/* Toast Action Msg */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-3.5 bg-slate-950 text-white border-2 border-primary rounded-2xl text-center text-xs font-black animate-pulse shadow-xl"
          >
            {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rentals List */}
      <div className="space-y-4">
        {/* Category Chips */}
        <div className="flex space-x-2 pb-1 overflow-x-auto scrollbar-none">
          {[
            { id: "All", labelKey: "allProperties" },
            { id: "Residential", labelKey: "residential" },
            { id: "Commercial", labelKey: "commercial" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setRentalFilter(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer select-none ${
                rentalFilter === chip.id
                  ? "bg-orange-50 border-orange-200 text-primary dark:bg-orange-950/40 dark:border-orange-900/60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {t(`categories.${chip.labelKey}`)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredRentals.length > 0 ? (
            filteredRentals.map((rental) => {
              const isJustPosted = justPostedIds.includes(rental.id);
              return (
                <Card
                  key={rental.id}
                  className={`p-0 overflow-hidden border bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[28px] transition-all duration-300 shadow-sm hover:shadow-md ${
                    isJustPosted
                      ? "ring-2 ring-emerald-500 border-emerald-500 shadow-emerald-500/10"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-slate-100 dark:bg-slate-950 group">
                    {rental.imageUrl ? (
                      <img
                        src={rental.imageUrl}
                        alt={rental.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
                        <ImageIcon size={40} className="opacity-50" />
                        <span className="text-xs font-semibold opacity-70">No photo uploaded</span>
                      </div>
                    )}

                    {/* Property Type Badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full border border-white/20 shadow-md">
                      {rental.propertyTypeTag ||
                        (rental.type === "Commercial"
                          ? "Commercial Shop"
                          : rental.title.match(/\b\d+BHK\b/i)?.[0] || "2BHK")}
                    </div>

                    {/* Monthly Rent Badge */}
                    <div className="absolute bottom-3 left-3 bg-emerald-600 dark:bg-emerald-500 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1 tracking-tight">
                      <span>
                        ₹
                        {rental.rent
                          ? rental.rent.toLocaleString("en-IN")
                          : "13,500"}{" "}
                        / {t("perMonth")}
                      </span>
                    </div>

                    {/* Just Posted Badge */}
                    {isJustPosted && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-md animate-bounce flex items-center space-x-1">
                        <CheckCircle2 size={11} />
                        <span>{t("justPosted")}</span>
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug tracking-tight">
                      {rental.title}
                    </h3>

                    <div className="flex items-start space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <MapPin
                        size={15}
                        className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5"
                      />
                      <span>
                        {rental.location ||
                          `Kamaraj Nagar 2nd Street, 5 mins walk to Avadi Station (Ward ${rental.ward})`}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(
                        rental.features || [
                          "24/7 Water",
                          "Covered Bike Parking",
                          "3-Phase Electricity",
                          "Balcony",
                        ]
                      ).map((feature, idx) => (
                        <span
                          key={idx}
                          className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50 px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1"
                        >
                          <Check
                            size={12}
                            className="stroke-3 text-purple-600 dark:text-purple-400"
                          />
                          <span>{feature}</span>
                        </span>
                      ))}
                    </div>

                    {/* Owner & Call Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {t("ownerContact")}
                        </span>
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-35 sm:max-w-47.5">
                          {rental.ownerName || "G. Shanmugam"}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleApplyCall(rental, e)}
                        className="px-4.5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl font-black text-xs transition flex items-center space-x-1.5 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                      >
                        <Phone size={14} className="fill-current" />
                        <span>{t("callOwner")}</span>
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={Home}
              title={t("emptyTitle")}
              description={t("emptyDesc")}
              actionText={t("postBuildingAction")}
              onAction={() => setIsModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Floating Plus Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:fixed md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-lienar-to-tr from-primary to-orange-600 hover:from-orange-600 hover:to-primary text-white flex items-center justify-center shadow-2xl hover:shadow-orange-500/30 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-800"
        title={t("postBuildingAction")}
      >
        <Plus size={28} className="stroke-3" />
      </button>

      {/* POST RENTAL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("modalTitle")}
      >
        <form
          onSubmit={handleSubmit(handleRentalSubmit)}
          className="space-y-4 pt-1"
        >
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Listing Title *
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="e.g. 2BHK Independent House with Car Parking"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
            />
            {errors.title && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Property Type *
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              >
                <option value="Residential">Residential (House / Flat)</option>
                <option value="Commercial">
                  Commercial (Shop / Office Space)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Contact Mobile *
              </label>
              <input
                type="tel"
                {...register("contact")}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              />
              {errors.contact && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {errors.contact.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Monthly Rent (₹) *
              </label>
              <input
                type="text"
                {...register("rent")}
                placeholder="e.g. 8500"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              />
              {errors.rent && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {errors.rent.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Advance Deposit (₹) *
              </label>
              <input
                type="text"
                {...register("advance")}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              />
              {errors.advance && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {errors.advance.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Property Photo (Optional)
            </label>

            {/* Gallery Upload UI */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3.5">
                {/* Preview */}
                <div className="relative shrink-0">
                  {rentalPhotoUrl ? (
                    <img
                      src={rentalPhotoUrl}
                      alt="Property preview"
                      className="w-20 h-16 rounded-xl object-cover border-2 border-primary shadow-sm ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-20 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <ImageIcon size={22} className="text-slate-400" />
                    </div>
                  )}
                  {rentalPhotoUrl && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                      <CheckCircle2 size={11} className="stroke-3" />
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    id="rental-photo-upload"
                    accept="image/*"
                    onChange={handleRentalPhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="rental-photo-upload"
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCompressingPhoto
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-primary hover:bg-orange-600 text-white active:scale-95"
                      }`}
                    >
                      {isCompressingPhoto ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>{rentalPhotoUrl ? "Change Photo" : "Upload from Gallery"}</span>
                        </>
                      )}
                    </label>
                    {rentalPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setRentalPhotoUrl("");
                          setPhotoUploadError(null);
                          if (photoInputRef.current) photoInputRef.current.value = "";
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-900/60 cursor-pointer transition"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight">
                    {rentalPhotoUrl ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles size={12} /> Photo loaded and compressed (WebP)
                      </span>
                    ) : (
                      "Optional. If no photo uploaded, a placeholder will be shown."
                    )}
                  </p>
                </div>
              </div>
              {photoUploadError && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                  {photoUploadError}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Property Description & Facilities *
            </label>
            <textarea
              rows={3}
              {...register("details")}
              placeholder="Provide key details: 24/7 borewell water, separate EB meter, car parking, near bus stop..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
            />
            {errors.details && (
              <p className="text-[10px] text-rose-500 font-bold mt-1">
                {errors.details.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
          >
            Publish House Listing
          </button>
        </form>
      </Modal>
    </div>
  );
};
