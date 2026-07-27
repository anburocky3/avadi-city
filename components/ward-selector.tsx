"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Search,
  MapPin,
  X,
  CheckCircle2,
  Building2,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWard } from "@/context/wardContext";
import { ALL_AVADI_STREETS } from "@/lib/wards";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface StreetItem {
  id: string | number;
  streetName: string;
  wardNo: number;
}

export interface WardItem {
  id: number;
  name: string;
  hints?: string;
  streets?: string[];
}

export interface WardSelectorProps {
  onClose?: () => void;
  onCustomSelect?: (wardId: number, streetName?: string) => void;
  allStreetsData?: StreetItem[];
}

// Zod Validation Schema
const wardSelectionSchema = zod.object({
  wardNumber: zod.number().min(1, { message: "Select a valid ward number" }),
  streetName: zod.string().min(2, { message: "Enter street name or landmark" }),
});

type WardSelectionFormData = zod.infer<typeof wardSelectionSchema>;

export const WardSelector: React.FC<WardSelectorProps> = ({ onClose }) => {
  const { wards, selectWard } = useWard();

  const queryClient = useQueryClient();

  // Street Search State
  const [streetQuery, setStreetQuery] = useState<string>("");
  const [streetResults, setStreetResults] = useState<StreetItem[]>([]);
  const [selectedStreetItem, setSelectedStreetItem] =
    useState<StreetItem | null>(null);
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);

  // Form Setup
  const {
    register: registerWard,
    handleSubmit: handleSubmitWard,
    setValue: setValueWard,
    formState: { errors: errorsWard, isValid: isValidWard },
  } = useForm<WardSelectionFormData>({
    resolver: zodResolver(wardSelectionSchema),
    mode: "onChange",
    defaultValues: {
      wardNumber: 0,
      streetName: "",
    },
  });

  const { mutate: updateWard, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: WardSelectionFormData) => {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Force Number conversion before sending to API
          wardNumber: Number(data.wardNumber),
          streetName: data.streetName,
          address: data.streetName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to update ward selection in profile.",
        );
      }

      return response.json();
    },
    onSuccess: (responseData, variables) => {
      // 1. Get the confirmed ward ID as a strict Number
      const confirmedWardId = Number(
        responseData?.user?.wardNumber || variables.wardNumber,
      );

      // 2. Update context & local storage immediately
      selectWard(confirmedWardId);

      // 3. Invalidate authUser query in the background to guarantee 100% database sync
      queryClient.invalidateQueries({ queryKey: ["authUser"] });

      // 4. Close modal
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      console.error("Ward update error:", error);
      alert(
        error?.message ||
          "Could not update your ward selection. Please try again.",
      );
    },
  });

  // Dynamic filter for live street search dropdown
  const handleStreetSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setStreetQuery(searchTerm);
    setSelectedStreetItem(null);
    setValueWard("streetName", searchTerm, { shouldValidate: true });

    if (!searchTerm.trim()) {
      setStreetResults([]);
      return;
    }

    // 1. Search in explicitly provided streets list
    const directMatches = ALL_AVADI_STREETS.filter((item) =>
      item.streetName.toLowerCase().includes(searchTerm),
    );

    if (directMatches.length > 0) {
      setStreetResults(directMatches.slice(0, 15));
      return;
    }

    // setStreetResults(wardMatches.slice(0, 15));
  };

  const handleSelectStreetItem = (item: StreetItem) => {
    setSelectedStreetItem(item);
    setStreetQuery(item.streetName);
    setStreetResults([]);
    setValueWard("wardNumber", item.wardNo, { shouldValidate: true });
    setValueWard("streetName", item.streetName, { shouldValidate: true });
  };

  const handleWardSelectSubmit = (data: WardSelectionFormData) => {
    updateWard(data);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg mx-auto w-full">
      <div className="text-center pb-3">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          Find Your Street
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto font-medium">
          Search for your street or road name. We will map your municipal ward
          automatically.
        </p>
      </div>

      <form
        onSubmit={handleSubmitWard(handleWardSelectSubmit)}
        className="space-y-4"
      >
        {!showManualFallback ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Street Name / Landmark *
              </label>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  value={streetQuery}
                  onChange={handleStreetSearchChange}
                  placeholder="Type street name (e.g. MTH Road, Gandhi Nagar)..."
                  className="w-full h-12.5 pl-10 pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none transition shadow-xs"
                />
                {streetQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setStreetQuery("");
                      setStreetResults([]);
                      setSelectedStreetItem(null);
                      setValueWard("wardNumber", 0, { shouldValidate: true });
                      setValueWard("streetName", "", { shouldValidate: true });
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {errorsWard.streetName && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errorsWard.streetName.message}
                </p>
              )}
            </div>

            {/* Live Street Search Auto-complete Suggestions */}
            {streetResults.length > 0 && !selectedStreetItem && (
              <ul className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 shadow-xl max-h-56 overflow-y-auto text-left">
                {streetResults.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleSelectStreetItem(item)}
                    className="p-3 hover:bg-amber-50/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-start gap-3 transition group"
                  >
                    <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition">
                      <MapPin size={16} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                        {item.streetName.toLocaleLowerCase()}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        <Building2 size={12} className="shrink-0" />
                        <span>Ward {item.wardNo}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Empty Search Result Fallback */}
            {streetQuery.trim() &&
              streetResults.length === 0 &&
              !selectedStreetItem && (
                <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No street found matching &quot;{streetQuery}&quot;
                  </p>
                  {/* <button
                    type="button"
                    onClick={() => {
                      setShowManualFallback(true);
                      setValueWard("streetName", streetQuery, {
                        shouldValidate: true,
                      });
                    }}
                    className="text-[11px] text-primary hover:underline font-bold mt-1 inline-block cursor-pointer"
                  >
                    Pick your ward number manually instead →
                  </button> */}
                </div>
              )}

            {/* Selected Street Success Card */}
            {selectedStreetItem && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start justify-between gap-3 text-left">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                        Your Street is in
                      </span>
                      <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                        Ward {selectedStreetItem.wardNo}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white capitalize truncate">
                      {selectedStreetItem.streetName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStreetItem(null);
                    setStreetQuery("");
                    setStreetResults([]);
                    setValueWard("wardNumber", 0, { shouldValidate: true });
                    setValueWard("streetName", "", { shouldValidate: true });
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold underline px-1 py-0.5 shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            {/* {!selectedStreetItem && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualFallback(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium underline transition cursor-pointer"
                >
                  Can&apos;t find your street? Select ward manually
                </button>
              </div>
            )} */}
          </div>
        ) : (
          /* MANUAL WARD SELECTION FALLBACK FORM */
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
              <span>Manual Ward Selection Mode</span>
              <button
                type="button"
                onClick={() => setShowManualFallback(false)}
                className="text-primary font-bold hover:underline ml-2 cursor-pointer"
              >
                ← Back to Search
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Ward Number *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                  <MapPin size={18} />
                </span>
                <select
                  {...registerWard("wardNumber", { valueAsNumber: true })}
                  className="w-full h-12.5 pl-10 pr-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value={0} disabled>
                    Select your Ward (1 to 48)
                  </option>
                  {wards.map((w: WardItem) => (
                    <option key={w.id} value={w.id}>
                      Ward {w.id} - {w.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
              {errorsWard.wardNumber && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errorsWard.wardNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Street Name / Landmark *
              </label>
              <input
                type="text"
                placeholder="e.g. Kamaraj Nagar Main Road"
                {...registerWard("streetName")}
                className="w-full h-12.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-bold text-xs focus:ring-2 focus:ring-primary/50 focus:outline-none transition"
              />
              {errorsWard.streetName && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errorsWard.streetName.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form Action Footer */}
        <div className="flex space-x-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition text-xs flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!isValidWard}
            className="flex-1 h-12 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
          >
            <span>Confirm Ward & Location</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default WardSelector;
