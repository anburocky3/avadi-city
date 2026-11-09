import { Route } from "next";
import {
  LucideIcon,
  PlusCircle,
  MessageSquare,
  Compass,
  Building2,
  ChefHat,
  Wrench,
  Briefcase,
  Train,
  Gift,
  PackageSearch,
} from "lucide-react";

export interface PlaceSlide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
}

export interface QuickShortcut {
  name: string;
  path: Route;
  icon: LucideIcon;
  desc: string;
  badgeBg: string;
  borderHover: string;
}

export interface WardServiceData {
  name: string;
  path: Route;
  icon: LucideIcon;
  bg: string;
}

export interface TransitTiming {
  code: string;
  dest: string;
  info: string;
  time: string;
  status: string;
}

export interface HeritageMilestone {
  year: string;
  title: string;
  desc: string;
}

// --- STATIC DATA DEFINITIONS ---

export const PLACE_SLIDES: PlaceSlide[] = [
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

export const QUICK_SHORTCUTS: QuickShortcut[] = [
  {
    name: "Report Issue",
    path: "/complaints" as Route,
    icon: PlusCircle,
    desc: "Civic complaints & fixes",
    badgeBg: "from-orange-500 to-amber-500 shadow-orange-500/25",
    borderHover: "hover:border-orange-500/50",
  },
  {
    name: "Ward Feed",
    path: "/feed" as Route,
    icon: MessageSquare,
    desc: "Community updates",
    badgeBg: "from-teal-500 to-emerald-600 shadow-teal-500/25",
    borderHover: "hover:border-teal-500/50",
  },
  {
    name: "Explore Spots",
    path: "/explore-places" as Route,
    icon: Compass,
    desc: "Avadi landmarks & parks",
    badgeBg: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    borderHover: "hover:border-blue-500/50",
  },
  {
    name: "Rent & Properties",
    path: "/rentals" as Route,
    icon: Building2,
    desc: "Residential & commercial",
    badgeBg: "from-purple-600 to-indigo-600 shadow-purple-500/25",
    borderHover: "hover:border-purple-500/50",
  },
];

export const WARD_SERVICES: WardServiceData[] = [
  {
    name: "Food & Dining",
    path: "/food-and-dining" as Route,
    icon: ChefHat,
    bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
  },
  {
    name: "Local Services",
    path: "/local-services" as Route,
    icon: Wrench,
    bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Local Jobs",
    path: "/jobs" as Route,
    icon: Briefcase,
    bg: "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400",
  },
  {
    name: "Transport",
    path: "/transport" as Route,
    icon: Train,
    bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Donations",
    path: "/donations" as Route,
    icon: Gift,
    bg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Lost & Found",
    path: "/lost-and-found" as Route,
    icon: PackageSearch,
    bg: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
  },
];

export const BUS_TIMINGS: TransitTiming[] = [
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

export const TRAIN_TIMINGS: TransitTiming[] = [
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

export const HERITAGE_MILESTONES: HeritageMilestone[] = [
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
