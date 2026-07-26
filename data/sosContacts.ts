import { EmergencyContact } from "@/app/(auth)/sos/sos-client";

export const initialSosContactsData: EmergencyContact[] = [
  {
    id: "police",
    title: "POLICE",
    number: "100",
    cardBg:
      "bg-red-50/90 dark:bg-slate-900 hover:bg-red-100 dark:hover:bg-slate-800",
    iconBg:
      "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400/40",
    numBadge:
      "bg-red-600 text-white font-black font-mono text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-sm",
    border: "border-2 border-red-300 dark:border-red-600",
    subtitle: "Avadi Law & Order",
    iconName: "Siren",
  },
  {
    id: "ambulance",
    title: "AMBULANCE",
    number: "108",
    cardBg:
      "bg-emerald-50/90 dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-slate-800",
    iconBg:
      "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40",
    numBadge:
      "bg-emerald-600 text-white font-black font-mono text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-sm",
    border: "border-2 border-emerald-300 dark:border-emerald-600",
    subtitle: "Medical Emergency",
    iconName: "Heart",
  },
  {
    id: "fire",
    title: "FIRE & RESCUE",
    number: "101",
    cardBg:
      "bg-orange-50/90 dark:bg-slate-900 hover:bg-orange-100 dark:hover:bg-slate-800",
    iconBg:
      "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/40",
    numBadge:
      "bg-orange-600 text-white font-black font-mono text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-sm",
    border: "border-2 border-orange-300 dark:border-orange-600",
    subtitle: "Fire Control & Ops",
    iconName: "Flame",
  },
  {
    id: "snake",
    title: "SNAKE RESCUE",
    number: "044-22200335",
    cardBg:
      "bg-teal-50/90 dark:bg-slate-900 hover:bg-teal-100 dark:hover:bg-slate-800",
    iconBg:
      "bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-400/40",
    numBadge:
      "bg-teal-700 dark:bg-teal-600 text-white font-black font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded-xl shadow-sm",
    border: "border-2 border-teal-300 dark:border-teal-600",
    subtitle: "Wildlife Rescue",
    iconName: "ShieldAlert",
  },
];
