import { FeatureItem } from "@/types/common";
import {
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Compass,
  ChefHat,
  Wrench,
  Train,
  Briefcase,
  Building2,
} from "lucide-react";

export const homeFeaturesData: FeatureItem[] = [
  {
    name: "Community Feed",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    badgeBg:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    desc: "Share updates, see local news, and connect with people in your ward.",
    detailedDesc:
      "A dedicated digital town square designed exclusively for Avadi residents to interact without the noise of broader city social networks.",
    howItHelps: [
      "Broadcast hyper-local ward announcements and neighborhood news immediately.",
      "Organize local community events, clean-up drives, and volunteer meetups.",
      "Share lost-and-found alerts and safety advisories within your specific street or ward.",
    ],
  },
  {
    name: "Civic Complaints",
    icon: AlertTriangle,
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    badgeBg: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    desc: "Report local problems like garbage, water, roads, or streetlights and track their status.",
    detailedDesc:
      "A direct digital pipeline connecting citizens with the Avadi City Municipal Corporation to report and track infrastructure grievances.",
    howItHelps: [
      "Snap photos and geo-tag potholes, broken streetlights, or overflowing garbage bins.",
      "Automatically route complaints to the responsible ward officer across all 48 wards.",
      "Track resolution timelines publicly with status updates from municipal workers.",
    ],
  },
  {
    name: "Emergency SOS",
    icon: ShieldAlert,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    badgeBg:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    desc: "Get quick help by contacting Police, Ambulance, Fire, or nearby Hospitals.",
    detailedDesc:
      "An instant critical response directory designed for rapid communication during medical, fire, or public safety emergencies.",
    howItHelps: [
      "One-tap emergency dialing to the Avadi Police Commissionerate (Dial 100/112).",
      "Direct contact lines to nearby government and private 24/7 hospitals.",
      "Connects users with local blood donor networks and emergency ambulance services.",
    ],
  },
  {
    name: "Explore Avadi",
    icon: Compass,
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badgeBg:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    desc: "Find famous places, temples, parks, shops, and attractions around Avadi.",
    detailedDesc:
      "A curated local directory highlighting the cultural heritage, recreational spots, and commercial centers of our municipality.",
    howItHelps: [
      "Discover weekend destinations like Paruthipattu Lake Park and local eco-parks.",
      "Locate historic temples, churches, and heritage landmarks across the region.",
      "Support local trade by finding top-rated neighborhood retail stores and markets.",
    ],
  },
  {
    name: "Food Explorer",
    icon: ChefHat,
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badgeBg:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    desc: "Discover restaurants, cafés, street food, and late-night food shops near you.",
    detailedDesc:
      "Your ultimate culinary guide to Avadi, mapping everything from traditional South Indian messes to trending evening food carts.",
    howItHelps: [
      "Find verified street food stalls near Avadi Railway Station and bus terminals.",
      "Explore late-night dining options and family restaurants categorized by budget.",
      "Boosts local food entrepreneurs and home bakers through community reviews.",
    ],
  },
  {
    name: "Local Services",
    icon: Wrench,
    color:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    badgeBg:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    desc: "Find trusted electricians, plumbers, mechanics, and other local workers.",
    detailedDesc:
      "A verified neighborhood service directory connecting households with skilled independent technicians and tradespeople.",
    howItHelps: [
      "Instantly contact vetted plumbers, electricians, carpenters, and AC technicians.",
      "Find emergency two-wheeler and car mechanics near your specific location.",
      "Empowers daily-wage workers and local artisans with direct customer inquiries.",
    ],
  },
  {
    name: "Public Transport",
    icon: Train,
    color: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20",
    badgeBg:
      "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-600/30",
    desc: "Check nearby bus routes, train details, and travel information.",
    detailedDesc:
      "A unified commuter guide designed to take the guesswork out of daily travel across Avadi and Western Chennai transit corridors.",
    howItHelps: [
      "Check suburban train timings passing through Avadi and Hindu College stations.",
      "View frequent MTC bus route numbers connecting Avadi to Broadway, Tambaram, and CMBT.",
      "Locate share-auto stands and standard feeder routes for interior ward travel.",
    ],
  },
  {
    name: "Rentals & Jobs",
    icon: Briefcase,
    color:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badgeBg:
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    desc: "Search for rental houses, shops, and local job opportunities.",
    detailedDesc:
      "A zero-brokerage community marketplace for residential leases, commercial rentals, and neighborhood employment opportunities.",
    howItHelps: [
      "List and discover rental houses, apartments, and commercial shop spaces directly from owners.",
      "Find part-time and full-time job openings in local businesses, schools, and offices.",
      "Connects local youth and homemakers with nearby employment without middleman fees.",
    ],
  },
  {
    name: "Government Services",
    icon: Building2,
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    badgeBg:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    desc: "Access important government services and ward office information.",
    detailedDesc:
      "Your civic administration handbook, simplifying access to municipal workflows, tax portals, and ward office directories.",
    howItHelps: [
      "Locate your exact ward number and find contact details for your elected Ward Councillor.",
      "Access direct links for online property tax, water tax, and professional tax payments.",
      "Get guidance on birth/death certificates, trade licenses, and state welfare schemes.",
    ],
  },
];
