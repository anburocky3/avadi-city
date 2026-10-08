import { EmergencyContact } from "@/app/(auth)/sos/sos-client";

export const initialSosContactsData: EmergencyContact[] = [
  {
    id: "police",
    title: "POLICE (LAW & ORDER)",
    number: "100",
    cardBg:
      "bg-linear-to-br from-blue-600/10 via-indigo-600/15 to-blue-700/5 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-blue-900/30 hover:from-blue-600/15 hover:via-indigo-600/20",
    iconBg:
      "bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30",
    border:
      "border-2 border-blue-500/30 hover:border-blue-500 dark:border-blue-500/40 dark:hover:border-blue-400 shadow-sm hover:shadow-xl hover:shadow-blue-500/20",
    subtitle: "Avadi City Police HQ",
    iconName: "Siren",
    category: "primary",
    accentColor: "blue",
  },
  {
    id: "ambulance",
    title: "AMBULANCE",
    number: "108",
    cardBg:
      "bg-linear-to-br from-emerald-600/10 via-teal-600/15 to-emerald-700/5 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-emerald-900/30 hover:from-emerald-600/15 hover:via-teal-600/20",
    iconBg:
      "bg-linear-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
    border:
      "border-2 border-emerald-500/30 hover:border-emerald-500 dark:border-emerald-500/40 dark:hover:border-emerald-400 shadow-sm hover:shadow-xl hover:shadow-emerald-500/20",
    subtitle: "Emergency Medical Rapid",
    iconName: "Heart",
    category: "primary",
    accentColor: "emerald",
  },
  {
    id: "fire",
    title: "FIRE & RESCUE",
    number: "101",
    cardBg:
      "bg-linear-to-br from-amber-500/10 via-orange-600/15 to-red-600/5 dark:from-amber-950/60 dark:via-orange-950/50 dark:to-red-900/30 hover:from-amber-500/15 hover:via-orange-600/20",
    iconBg:
      "bg-linear-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/30",
    border:
      "border-2 border-orange-500/30 hover:border-orange-500 dark:border-orange-500/40 dark:hover:border-orange-400 shadow-sm hover:shadow-xl hover:shadow-orange-500/20",
    subtitle: "Avadi Fire Station Ops",
    iconName: "Flame",
    category: "primary",
    accentColor: "amber",
  },
  {
    id: "women",
    title: "WOMEN HELPLINE",
    number: "1091",
    cardBg:
      "bg-linear-to-br from-pink-500/10 via-fuchsia-600/15 to-purple-600/5 dark:from-pink-950/60 dark:via-fuchsia-950/50 dark:to-purple-900/30 hover:from-pink-500/15 hover:via-fuchsia-600/20",
    iconBg:
      "bg-linear-to-tr from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-pink-600 text-white shadow-md shadow-pink-600/30",
    border:
      "border-2 border-pink-500/30 hover:border-pink-500 dark:border-pink-500/40 dark:hover:border-pink-400 shadow-sm hover:shadow-xl hover:shadow-pink-500/20",
    subtitle: "24/7 Women Protection",
    iconName: "UserCheck",
    category: "primary",
    accentColor: "pink",
  },
  {
    id: "cyber",
    title: "CYBER HELPLINE",
    number: "1930",
    cardBg:
      "bg-linear-to-br from-cyan-500/10 via-sky-600/15 to-indigo-600/5 dark:from-cyan-950/60 dark:via-sky-950/50 dark:to-indigo-900/30 hover:from-cyan-500/15 hover:via-sky-600/20",
    iconBg:
      "bg-linear-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/30",
    border:
      "border-2 border-cyan-500/30 hover:border-cyan-500 dark:border-cyan-500/40 dark:hover:border-cyan-400 shadow-sm hover:shadow-xl hover:shadow-cyan-500/20",
    subtitle: "Financial Fraud & Cyber",
    iconName: "Laptop",
    category: "primary",
    accentColor: "cyan",
  },
  {
    id: "snake",
    title: "SNAKE & WILDLIFE",
    number: "044-22200335",
    cardBg:
      "bg-linear-to-br from-teal-500/10 via-emerald-600/15 to-cyan-600/5 dark:from-teal-950/60 dark:via-emerald-950/50 dark:to-cyan-900/30 hover:from-teal-500/15 hover:via-emerald-600/20",
    iconBg:
      "bg-linear-to-tr from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/35",
    numBadge:
      "font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30",
    border:
      "border-2 border-teal-500/30 hover:border-teal-500 dark:border-teal-500/40 dark:hover:border-teal-400 shadow-sm hover:shadow-xl hover:shadow-teal-500/20",
    subtitle: "Forest & Wildlife Rescue",
    iconName: "ShieldAlert",
    category: "primary",
    accentColor: "teal",
  },
];

export const avadiPoliceStationsData = [
  {
    id: "st-avadi",
    name: "T-6 Avadi Police Station",
    location: "Gandhi Nagar, Avadi Main",
    phone: "044-26555100",
    officerPhone: "044-26555500",
    landmark: "Near Avadi Checkpost & Bus Depot",
  },
  {
    id: "st-pattabiram",
    name: "T-7 Pattabiram Police Station",
    location: "CTH Road, Pattabiram",
    phone: "044-26850100",
    officerPhone: "9498133180",
    landmark: "Opp. Pattabiram Railway Station",
  },
  {
    id: "st-thirumullaivoyal",
    name: "T-10 Thirumullaivoyal Police Station",
    location: "Ambattur-Red Hills Road",
    phone: "044-26372100",
    officerPhone: "9498133181",
    landmark: "Near Murugappa Polytechnic",
  },
  {
    id: "st-hvf",
    name: "T-8 Tank Factory (HVF) Station",
    location: "HVF Estate, Giri Nagar",
    phone: "044-26841100",
    officerPhone: "9498133182",
    landmark: "HVF Main Gate / Heavy Vehicles Colony",
  },
  {
    id: "st-poonamallee",
    name: "T-11 Poonamallee Police Station",
    location: "Trunk Road, Poonamallee",
    phone: "044-26272100",
    officerPhone: "9498133183",
    landmark: "Near Bus Stand Junction",
  },
  {
    id: "st-traffic",
    name: "Avadi Traffic Control Room",
    location: "CTH High Road Junction",
    phone: "044-26555103",
    officerPhone: "103",
    landmark: "Avadi Traffic Enforcement Wing",
  },
];
