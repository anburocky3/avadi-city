"use client";

import React, { useState, useEffect, useRef } from "react";
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
  PhoneCall,
  ArrowRight,
  Sparkles,
  UserCheck,
  Laptop,
  MapPin,
  Volume2,
  VolumeX,
  Share2,
  Navigation,
  Radio,
  Clock,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Path mapped to shared-components
import { Modal } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";
import { avadiPoliceStationsData } from "@/data/sosContacts";

// --- TYPESCRIPT DEFINITIONS ---

export interface EmergencyContact {
  id: string;
  title: string;
  number: string;
  cardBg?: string;
  iconBg?: string;
  numBadge?: string;
  border?: string;
  subtitle: string;
  iconName: string;
  category?: string;
  accentColor?: string;
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
  UserCheck,
  Laptop,
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

  const [activeTab, setActiveTab] = useState<"helplines" | "stations">(
    "helplines",
  );
  const [selectedCallCard, setSelectedCallCard] = useState<{
    title: string;
    number: string;
  } | null>(null);
  const [isBloodModalOpen, setIsBloodModalOpen] = useState<boolean>(false);
  const [showBroadcastAlert, setShowBroadcastAlert] = useState<boolean>(false);
  const [broadcastedData, setBroadcastedData] = useState<BloodFormData | null>(
    null,
  );

  // Live Location Share State
  const [locatingStatus, setLocatingStatus] = useState<string | null>(null);

  // Siren Audio Alarm State
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenTimerRef = useRef<number | null>(null);

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
    title: t("municipalityTitle") || "AVADI MUNICIPAL HELPLINE",
    number: "1800-425-5111",
    subtitle:
      t("municipalitySubtitle") || "Avadi Municipal Grievance & HQ Control",
  };

  const handleCallTrigger = (card: { title: string; number: string }) => {
    setSelectedCallCard(card);

    setTimeout(() => {
      window.location.href = `tel:${card.number}`;
    }, 1200);
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

  // --- AUDIO SIREN SYNTHESIZER ---
  const toggleSirenAlarm = () => {
    if (isSirenActive) {
      // Stop siren
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
          sirenOscRef.current.disconnect();
        } catch {
          // ignore
        }
        sirenOscRef.current = null;
      }
      if (sirenTimerRef.current) {
        window.clearInterval(sirenTimerRef.current);
        sirenTimerRef.current = null;
      }
      setIsSirenActive(false);
    } else {
      // Start siren using Web Audio API
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        sirenOscRef.current = osc;

        let high = false;
        sirenTimerRef.current = window.setInterval(() => {
          if (sirenOscRef.current && audioCtxRef.current) {
            high = !high;
            sirenOscRef.current.frequency.setValueAtTime(
              high ? 950 : 550,
              audioCtxRef.current.currentTime + 0.05,
            );
          }
        }, 350);

        setIsSirenActive(true);
      } catch (err) {
        console.error("Audio error:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (sirenTimerRef.current) {
        clearInterval(sirenTimerRef.current);
      }
    };
  }, []);

  // --- LIVE LOCATION DISPATCH VIA WHATSAPP ---
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocatingStatus("Fetching GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingStatus(null);
        const { latitude, longitude } = pos.coords;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        const message = `🚨 EMERGENCY SOS! I need immediate help in Avadi. My current GPS location: ${mapsLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      },
      (error) => {
        setLocatingStatus(null);
        alert(`Location permission denied or unavailable: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="relative p-4 sm:p-6 max-w-2xl mx-auto space-y-6 mb-16 overflow-hidden">
      {/* Dynamic Vibrant Ambient Lights & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-80 bg-linear-to-b from-rose-500/25 via-amber-500/20 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />
      <div className="absolute top-36 -left-20 w-72 h-72 bg-blue-500/20 blur-3xl pointer-events-none rounded-full -z-10" />
      <div className="absolute top-72 -right-20 w-72 h-72 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full -z-10" />

      {/* 1. Header Section */}
      <div className="relative text-center space-y-2.5">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-r from-slate-950 via-rose-600 to-indigo-900 dark:from-white dark:via-rose-300 dark:to-indigo-200 bg-clip-text text-transparent">
          {t("title") || "SOS Emergency Hub"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
          {t("subtitle") ||
            "Direct rapid helpline connection for Police, Ambulance, Fire, Women Safety & Avadi local stations."}
        </p>
      </div>

      {/* Dynamic Siren Red Alert Banner */}
      <AnimatePresence>
        {showBroadcastAlert && broadcastedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            className="p-4 bg-linear-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl shadow-2xl shadow-rose-600/30 border-2 border-white/30 flex items-start gap-3.5 relative overflow-hidden"
          >
            <div className="p-2.5 rounded-2xl bg-white/20 text-white shrink-0 mt-0.5 shadow-inner backdrop-blur-md">
              <AlertOctagon size={24} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/30 text-white px-2.5 py-0.5 rounded-full border border-white/40 shadow-xs">
                  {t("alertHeader") || "EMERGENCY RED ALERT BROADCASTED"}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white">
                Urgent {broadcastedData.bloodGroup} Blood Request Pinned to Feed
              </h3>
              <p className="text-xs text-white/95 leading-normal font-medium">
                Broadcast dispatched to all 48 wards. Local volunteers will
                receive notification details at {broadcastedData.hospitalName}.
              </p>
            </div>

            <button
              onClick={() => setShowBroadcastAlert(false)}
              className="text-white/80 hover:text-white text-sm p-1.5 cursor-pointer transition-colors bg-white/10 hover:bg-white/20 rounded-xl"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Primary 112 SOS Central Glowing Dial Button */}
      <div className="flex flex-col items-center justify-center pt-2 pb-3">
        <div className="relative flex items-center justify-center p-6">
          {/* Outer Multi-layered Radar Pulse Waves */}
          <span className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/35 animate-ping opacity-75 pointer-events-none scale-125" />
          <span className="absolute -inset-4 rounded-full bg-linear-to-r from-rose-500/25 via-red-500/20 to-amber-500/25 blur-xl pointer-events-none animate-pulse" />
          <span className="absolute -inset-1 rounded-full bg-linear-to-tr from-rose-500 via-red-600 to-amber-500 opacity-30 blur-md pointer-events-none" />

          <button
            type="button"
            onClick={() =>
              handleCallTrigger({
                title: "SOS 112 National Emergency",
                number: "112",
              })
            }
            className="group relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-linear-to-tr from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:via-red-500 hover:to-amber-400 active:scale-95 text-white shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:shadow-[0_0_70px_rgba(244,63,94,0.7)] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-4 border-white dark:border-slate-800 ring-8 ring-rose-500/30 dark:ring-rose-500/40 space-y-1.5 z-10"
          >
            {/* Top Shine Gloss Layer */}
            <div className="absolute top-2 left-6 right-6 h-16 bg-white/20 rounded-t-full blur-xs pointer-events-none" />

            {/* Inner Glass Icon Capsule */}
            <div className="bg-white/25 backdrop-blur-md p-2.5 rounded-full border border-white/40 shadow-lg group-hover:scale-115 transition-transform duration-200">
              <PhoneCall size={26} className="text-white drop-shadow-md" />
            </div>

            <span className="text-5xl sm:text-6xl font-black tracking-tighter leading-none text-white drop-shadow-lg">
              112
            </span>

            <span className="px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white font-black text-[11px] sm:text-xs tracking-widest uppercase border border-white/40 shadow-sm group-hover:bg-white group-hover:text-rose-600 transition-colors">
              INSTANT CALL 112
            </span>
          </button>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 mt-2 text-center bg-linear-to-r from-rose-100/90 via-amber-100/80 to-rose-100/90 dark:from-rose-950/70 dark:via-amber-950/60 dark:to-rose-950/70 px-5 py-2 rounded-full border border-rose-300/80 dark:border-rose-800/80 shadow-xs">
          {t("tapInstruction") || "Tap circle for instant 112 emergency call"}
        </p>

        {/* Quick Rapid Action Toolbar (Siren Alarm + Share GPS) */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-5">
          {/* 1. Audible Siren Alert Synthesizer */}
          <button
            type="button"
            onClick={toggleSirenAlarm}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs cursor-pointer transition-all border shadow-md active:scale-95 ${
              isSirenActive
                ? "bg-red-600 text-white border-red-400 animate-bounce shadow-red-500/40"
                : "bg-white/80 dark:bg-slate-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 border-rose-200 dark:border-rose-900/60 shadow-slate-200/50 dark:shadow-none"
            }`}
          >
            {isSirenActive ? (
              <>
                <VolumeX size={18} className="animate-spin" />
                <span>STOP ALARM</span>
              </>
            ) : (
              <>
                <Volume2
                  size={18}
                  className="text-rose-600 dark:text-rose-400"
                />
                <span>SOUND SIREN</span>
              </>
            )}
          </button>

          {/* 2. Instant WhatsApp Live GPS Share */}
          <button
            type="button"
            onClick={handleShareLocation}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs cursor-pointer transition-all border border-emerald-300 dark:border-emerald-800 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 active:scale-95"
          >
            <Navigation size={17} className="animate-pulse" />
            <span>{locatingStatus ? "Locating..." : "SHARE LIVE GPS"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs: Helplines vs Local Police Stations */}
      <div className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("helplines")}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "helplines"
              ? "bg-linear-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles size={15} />
          <span>DIRECT HELPLINES</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stations")}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "stations"
              ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 size={15} />
          <span>AVADI POLICE STATIONS</span>
        </button>
      </div>

      {/* 3. Emergency Contacts / Helplines Tab Content */}
      {activeTab === "helplines" ? (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-rose-500" />
              State & Rapid Emergency Lines
            </h2>
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
              Toll-Free 24/7
            </span>
          </div>

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
                  className={`group rounded-3xl p-4.5 ${contact.cardBg} ${contact.border} cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between min-h-38 space-y-3 relative overflow-hidden backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-2xl ${contact.iconBg} group-hover:scale-115 transition-transform duration-200`}
                    >
                      <IconComp size={22} />
                    </div>
                    <span className={contact.numBadge}>{contact.number}</span>
                  </div>

                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                      {contact.title}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {contact.subtitle}
                    </p>
                  </div>

                  {/* Micro Call Now Pill */}
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors pt-0.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <Phone size={11} />
                    <span>TAP TO CALL</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Avadi Local Police Stations Directory Tab Content */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-blue-500" />
              Avadi Police Commissionerate Stations
            </h2>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              Direct Desk Lines
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {avadiPoliceStationsData.map((station) => (
              <div
                key={station.id}
                className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group backdrop-blur-md"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {station.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-rose-500 shrink-0" />
                      <span>
                        {station.location} · {station.landmark}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCallTrigger({
                        title: station.name,
                        number: station.phone,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-blue-600/25 cursor-pointer active:scale-95 transition-all"
                  >
                    <Phone size={13} />
                    <span>{station.phone}</span>
                  </button>
                  {station.officerPhone && station.officerPhone !== "103" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCallTrigger({
                          title: `${station.name} Control`,
                          number: station.officerPhone,
                        })
                      }
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                      title="Secondary Helpline"
                    >
                      <PhoneCall size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Avadi Municipality Helpline Card */}
      <div
        onClick={() => handleCallTrigger(municipalityContact)}
        className="w-full p-4.5 rounded-3xl bg-linear-to-r from-blue-600/10 via-indigo-600/15 to-violet-600/10 dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-900 border-2 border-indigo-300/80 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/15 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group hover:-translate-y-0.5 backdrop-blur-md"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 shrink-0 group-hover:scale-115 transition-transform duration-200">
            <Building2 size={24} />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                {municipalityContact.title}
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                TOLL-FREE
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">
              {municipalityContact.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            {municipalityContact.number}
          </span>
          <Phone
            size={16}
            className="text-indigo-600 dark:text-indigo-400 group-hover:scale-120 transition-transform"
          />
        </div>
      </div>

      {/* 5. Additional Civic Support Utilities (Urgent Blood + 24/7 Healthcare) */}
      <div className="space-y-3.5 pt-1">
        {/* Request Urgent Blood Donor Button */}
        <button
          onClick={() => setIsBloodModalOpen(true)}
          className="w-full py-4 px-5 bg-linear-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white rounded-3xl font-black shadow-xl shadow-rose-600/30 hover:shadow-2xl hover:shadow-rose-600/40 active:scale-[0.99] transition-all text-xs sm:text-sm flex items-center justify-center gap-3 cursor-pointer border-2 border-white/30"
        >
          <HelpingHand size={20} className="animate-pulse" />
          <span className="tracking-wide">
            {t("requestBloodBtn") || "REQUEST URGENT BLOOD DONOR"}
          </span>
        </button>

        {/* 24/7 Hospitals & Pharmacies Directory Link Card */}
        <Link
          href="/healthcare"
          className="w-full p-4.5 rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-rose-500/40 hover:border-rose-400 shadow-xl shadow-indigo-950/30 hover:shadow-2xl transition-all flex items-center justify-between group cursor-pointer text-left hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-600 text-white border border-rose-400 shrink-0 group-hover:scale-115 transition-transform duration-200 shadow-lg shadow-rose-600/40">
              <HeartPulse size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xs sm:text-sm text-white tracking-tight">
                  {t("healthcareBannerTitle") || "24/7 HOSPITALS & PHARMACIES"}
                </h3>
                <span className="bg-linear-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                  {t("medicalBadge") || "Medical"}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300 line-clamp-1 mt-0.5">
                {t("healthcareBannerSubtitle") ||
                  "Find medical locations, ICU availability & emergency contacts in Avadi"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors shrink-0 pl-2">
            <span>{t("viewList") || "View List"}</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </div>
        </Link>
      </div>

      {/* Mock Dial Confirmation Modal */}
      {selectedCallCard && (
        <Modal
          isOpen={!!selectedCallCard}
          onClose={() => setSelectedCallCard(null)}
          title={t("modalDialTitle") || "Connecting Rapid Line"}
        >
          <div className="text-center py-6 flex flex-col items-center space-y-4">
            <div className="w-18 h-18 rounded-3xl bg-linear-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/35 border-2 border-white/40 animate-pulse">
              <PhoneCall size={30} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                {t("connectingCall") || "CONNECTING CALL"}
              </span>
              <h3 className="font-black text-xl text-slate-900 dark:text-white pt-2">
                {selectedCallCard.title}
              </h3>
              <p className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">
                {selectedCallCard.number}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-medium">
              {t("dialHelpInfo") ||
                "Triggering instant dialing on mobile device or system phone application."}
            </p>

            <button
              onClick={() => setSelectedCallCard(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold transition text-xs cursor-pointer"
            >
              {t("cancelCall") || "Cancel"}
            </button>
          </div>
        </Modal>
      )}

      {/* Request Urgent Blood Dialog Form Modal */}
      <Modal
        isOpen={isBloodModalOpen}
        onClose={() => setIsBloodModalOpen(false)}
        title={t("modalBloodTitle") || "Broadcast Urgent Blood Request"}
      >
        <form
          onSubmit={handleSubmit(handleBloodSubmit)}
          className="space-y-4 pt-1"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              {t("patientNameLabel") || "Patient Full Name"}
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Babu"
              {...register("patientName")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            {errors.patientName && (
              <p className="text-[10px] text-rose-500 font-bold">
                {errors.patientName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                {t("bloodGroupLabel") || "Blood Group Required"}
              </label>
              <select
                {...register("bloodGroup")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-bold"
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
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                {t("contactPhoneLabel") || "Attendant Contact Mobile"}
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                {...register("contactNumber")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono font-bold"
              />
              {errors.contactNumber && (
                <p className="text-[10px] text-rose-500 font-bold">
                  {errors.contactNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              {t("hospitalLabel") || "Hospital Name & Branch"}
            </label>
            <input
              type="text"
              placeholder="e.g. Government Hospital, Avadi"
              {...register("hospitalName")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            {errors.hospitalName && (
              <p className="text-[10px] text-rose-500 font-bold">
                {errors.hospitalName.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3.5 bg-linear-to-r from-red-600 via-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white disabled:opacity-50 rounded-2xl font-black shadow-lg shadow-rose-600/35 transition text-xs cursor-pointer mt-2"
          >
            {t("submitBroadcastBtn") || "Broadcast Red Alert"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
