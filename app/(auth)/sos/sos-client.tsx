"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useTranslations } from "next-intl";
import {
  ShieldAlert,
  Phone,
  Heart,
  AlertOctagon,
  Flame,
  Siren,
  HelpingHand,
  Building2,
  HeartPulse,
  LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Path mapped to shared-components
import { Modal } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface EmergencyContact {
  id: string;
  title: string;
  number: string;
  cardBg: string;
  iconBg: string;
  numBadge: string;
  border: string;
  subtitle: string;
  iconName: string;
}

export interface BloodRequestPayload {
  patientName: string;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  hospitalName: string;
  contactNumber: string;
}

export interface SosClientProps {
  initialContacts: EmergencyContact[];
}

// Icon mapping for contacts
const ICON_MAP: Record<string, LucideIcon> = {
  Siren,
  Heart,
  Flame,
  ShieldAlert,
  Building2,
};

// Zod schema for emergency blood request
const bloodRequestSchema = zod.object({
  patientName: zod.string().min(3, { message: "Patient Name is required" }),
  bloodGroup: zod.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], {
    error: "Select Blood Group",
  }),
  hospitalName: zod
    .string()
    .min(5, { message: "Hospital Name/Location is required" }),
  contactNumber: zod
    .string()
    .regex(/^[6-9]\d{9}$/, { message: "Enter a valid 10-digit mobile number" }),
});

type BloodFormData = zod.infer<typeof bloodRequestSchema>;

export const SosClient: React.FC<SosClientProps> = ({ initialContacts }) => {
  const t = useTranslations("sos");
  const { addBloodRequest } = useWard();

  const [selectedCallCard, setSelectedCallCard] = useState<{
    title: string;
    number: string;
  } | null>(null);
  const [isBloodModalOpen, setIsBloodModalOpen] = useState<boolean>(false);
  const [showBroadcastAlert, setShowBroadcastAlert] = useState<boolean>(false);
  const [broadcastedData, setBroadcastedData] = useState<BloodFormData | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<BloodFormData>({
    resolver: zodResolver(bloodRequestSchema),
    mode: "onChange",
    defaultValues: {
      patientName: "",
      bloodGroup: "O+",
      hospitalName: "",
      contactNumber: "",
    },
  });

  const municipalityContact = {
    id: "municipality",
    title: t("municipalityTitle"),
    number: "1800-425-5111",
    cardBg:
      "bg-blue-50/90 dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-800",
    iconBg:
      "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/40",
    numBadge:
      "bg-blue-600 text-white font-black font-mono text-xs sm:text-sm px-3 py-1 rounded-xl shadow-sm",
    border: "border-2 border-blue-300 dark:border-blue-600",
    subtitle: t("municipalitySubtitle"),
  };

  const handleCallTrigger = (card: { title: string; number: string }) => {
    setSelectedCallCard(card);

    setTimeout(() => {
      window.location.href = `tel:${card.number}`;
    }, 1500);
  };

  const handleBloodSubmit = (data: BloodFormData) => {
    if (addBloodRequest) {
      addBloodRequest(data);
    }
    setBroadcastedData(data);
    setIsBloodModalOpen(false);
    setShowBroadcastAlert(true);
    reset();

    setTimeout(() => {
      setShowBroadcastAlert(false);
    }, 8000);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 mb-10">
      {/* Title Header */}
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-black text-slate-950  dark:text-white leading-none">
          {t("title")}
        </h1>
        <p className="text-xs text-rose-600 dark:text-rose-400 font-extrabold mt-1.5 flex items-center justify-center">
          <Siren size={14} className="animate-bounce mr-1 shrink-0" />
          <span>{t("subtitle")}</span>
        </p>
      </div>

      {/* Dynamic Animated Siren Red Alert Banner */}
      <AnimatePresence>
        {showBroadcastAlert && broadcastedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center space-x-3.5 border-2 border-red-400 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-700/30 animate-pulse" />

            <AlertOctagon
              size={32}
              className="relative z-10 shrink-0 animate-spin"
            />

            <div className="relative z-10 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {t("alertHeader")}
              </span>
              <h3 className="font-extrabold text-xs">
                {t("urgentBloodText", { group: broadcastedData.bloodGroup })}
              </h3>
              <p className="text-[10px] text-white/80 leading-normal">
                {t("alertDetails", { hospital: broadcastedData.hospitalName })}
              </p>
            </div>

            <button
              onClick={() => setShowBroadcastAlert(false)}
              className="absolute top-2 right-2.5 text-white/80 hover:text-white text-xs font-black p-1 z-20 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP CIRCULAR BLINKING SOS EMERGENCY BUTTON */}
      <div className="pt-3 pb-4 flex flex-col items-center justify-center">
        <div className="relative group flex items-center justify-center p-3">
          <span className="absolute inset-0 rounded-full bg-red-600/40 animate-ping opacity-60 pointer-events-none scale-105" />
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse pointer-events-none scale-110" />

          {/* Tailwind CSS v4 class: bg-linear-to-br */}
          <button
            type="button"
            onClick={() =>
              handleCallTrigger({
                title: "SOS 112 National Emergency",
                number: "112",
              })
            }
            className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-linear-to-br from-red-600 via-red-700 to-red-900 hover:from-red-700 hover:to-red-950 text-white shadow-2xl shadow-red-700/60 flex flex-col items-center justify-center cursor-pointer border-4 border-white dark:border-slate-800 active:scale-95 transition-all ring-8 ring-red-600/30 z-10 space-y-1.5"
          >
            <Siren
              size={38}
              className="animate-spin text-white drop-shadow-md"
            />

            <span className="text-3xl sm:text-4xl font-black tracking-widest leading-none drop-shadow-lg text-white">
              SOS
            </span>

            <span className="px-3.5 py-1 rounded-full bg-white/25 text-white font-black text-xs tracking-wider uppercase border border-white/30 shadow-sm">
              CALL 112
            </span>
          </button>
        </div>

        <p className="text-[11px] sm:text-xs font-black uppercase text-red-600 dark:text-rose-400 tracking-wider mt-6 sm:mt-7 text-center bg-red-50 dark:bg-red-950/40 px-3.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
          {t("tapInstruction")}
        </p>
      </div>

      {/* 2. COMPACT 4-GRID CARDS */}
      <div className="grid grid-cols-2 gap-3.5">
        {initialContacts.map((contact) => {
          const IconComp = ICON_MAP[contact.iconName] || ShieldAlert;
          return (
            <div
              key={contact.id}
              onClick={() =>
                handleCallTrigger({
                  title: contact.title,
                  number: contact.number,
                })
              }
              className={`rounded-2xl p-4 ${contact.cardBg} ${contact.border} cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-md flex flex-col justify-between h-32 sm:h-36 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${contact.iconBg}`}>
                  <IconComp size={20} />
                </div>
                <span className={contact.numBadge}>{contact.number}</span>
              </div>

              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight leading-tight">
                  {contact.title}
                </h3>
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-100 leading-snug mt-1 truncate">
                  {contact.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MUNICIPALITY HELPLINE BUTTON */}
      <div>
        <div
          onClick={() => handleCallTrigger(municipalityContact)}
          className={`w-full p-4 rounded-2xl ${municipalityContact.cardBg} ${municipalityContact.border} shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-95`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${municipalityContact.iconBg} shrink-0`}
            >
              <Building2 size={22} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight leading-tight">
                {municipalityContact.title}
              </h3>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-100 leading-snug mt-1">
                {municipalityContact.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className={municipalityContact.numBadge}>
              {municipalityContact.number}
            </span>
            <Phone size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* 4. URGENT BLOOD REQUEST BUTTON */}
      <div className="pt-1 space-y-3 text-center">
        {/* Tailwind CSS v4 class: bg-linear-to-r */}
        <button
          onClick={() => setIsBloodModalOpen(true)}
          className="w-full py-3.5 px-4 bg-linear-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-extrabold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer border border-rose-400/30"
        >
          <HelpingHand size={18} />
          <span>{t("requestBloodBtn")}</span>
        </button>

        {/* 5. 24/7 HOSPITALS & PHARMACIES DIRECTORY BANNER */}
        <Link
          href="/healthcare"
          className="w-full p-4 rounded-2xl bg-slate-900 dark:bg-slate-900/90 text-white border border-rose-500/40 hover:border-rose-500 shadow-md hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <HeartPulse size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-xs sm:text-sm text-white tracking-tight leading-tight">
                  {t("healthcareBannerTitle")}
                </h3>
                <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                  {t("medicalBadge")}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-300 leading-snug mt-0.5">
                {t("healthcareBannerSubtitle")}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform shrink-0">
            {t("viewList")} →
          </span>
        </Link>
      </div>

      {/* Mock Dial confirmation modal */}
      {selectedCallCard && (
        <Modal
          isOpen={!!selectedCallCard}
          onClose={() => setSelectedCallCard(null)}
          title={t("modalDialTitle")}
        >
          <div className="text-center py-6 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center animate-bounce">
              <Phone size={28} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">
                {t("connectingCall")}
              </span>
              <h3 className="font-black text-lg text-slate-800 dark:text-white">
                {t("callingText", { title: selectedCallCard.title })}
              </h3>
              <p className="text-xs font-bold text-rose-600">
                {t("helplineText", { number: selectedCallCard.number })}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              {t("dialHelpInfo")}
            </p>

            <button
              onClick={() => setSelectedCallCard(null)}
              className="w-full py-3 bg-slate-900 text-white hover:bg-slate-850 rounded-xl font-bold transition text-xs cursor-pointer"
            >
              {t("cancelCall")}
            </button>
          </div>
        </Modal>
      )}

      {/* REQUEST URGENT BLOOD DIALOG FORM */}
      <Modal
        isOpen={isBloodModalOpen}
        onClose={() => setIsBloodModalOpen(false)}
        title={t("modalBloodTitle")}
      >
        <form onSubmit={handleSubmit(handleBloodSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {t("patientNameLabel")}
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Babu"
              {...register("patientName")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {errors.patientName && (
              <p className="text-[10px] text-rose-500 font-medium">
                {errors.patientName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {t("bloodGroupLabel")}
              </label>
              <select
                {...register("bloodGroup")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="A+">A+ (Positive)</option>
                <option value="A-">A- (Negative)</option>
                <option value="B+">B+ (Positive)</option>
                <option value="B-">B- (Negative)</option>
                <option value="O+">O+ (Positive)</option>
                <option value="O-">O- (Negative)</option>
                <option value="AB+">AB+ (Positive)</option>
                <option value="AB-">AB- (Negative)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {t("contactPhoneLabel")}
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                {...register("contactNumber")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
              {errors.contactNumber && (
                <p className="text-[10px] text-rose-500 font-medium">
                  {errors.contactNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              {t("hospitalLabel")}
            </label>
            <input
              type="text"
              placeholder="e.g. Government Hospital, Avadi"
              {...register("hospitalName")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
            {errors.hospitalName && (
              <p className="text-[10px] text-rose-500 font-medium">
                {errors.hospitalName.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-xl font-bold shadow-md transition text-xs cursor-pointer"
          >
            {t("submitBroadcastBtn")}
          </button>
        </form>
      </Modal>
    </div>
  );
};
