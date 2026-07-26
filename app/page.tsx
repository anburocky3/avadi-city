"use client";

import React, { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  ArrowRight,
  Award,
  Mail,
  Heart,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Feature Data Types
interface FeatureItem {
  name: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  desc: string;
  detailedDesc: string;
  howItHelps: string[];
}

export default function LandingPage() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(
    null,
  );

  const features: FeatureItem[] = [
    {
      name: "Community Feed",
      icon: MessageSquare,
      color:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
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
      color:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
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
      color:
        "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20",
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
      color:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
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

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 font-sans select-none">
      {/* Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src={"/logo.png"}
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
                CONNECTING AVADIANS
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {/* Headline & Description Section */}
        <div className="my-auto space-y-4 py-6 max-w-2xl text-center flex flex-col items-center justify-center">
          <span className="px-3.5 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black text-[10px] sm:text-xs uppercase tracking-widest border border-orange-500/20 flex items-center gap-1.5 shadow-xs">
            <Sparkles size={13} />
            <span>Civic Platform for 48 Wards</span>
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            Smart Services for a<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-orange-500 to-teal-500">
              Smarter Avadi
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-350 font-medium tracking-wide leading-relaxed max-w-lg">
            One unified platform for your community news, civic safety, and
            daily neighborhood needs across our municipality.
          </p>

          {/* Get Started Button */}
          <div className="w-full max-w-md pt-2">
            <Link
              href="/get-started"
              className="w-full py-4 px-6 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Features Deck */}
        <div className="w-full space-y-4 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/60 pb-3">
            <h2 className="text-xs sm:text-sm uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">
              Explore Modules
            </h2>
            <span className="text-[11px] font-bold text-primary animate-pulse">
              Click any feature to learn more →
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedFeature(feature)}
                  className="flex flex-col items-start justify-between p-4 sm:p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all active:scale-97 group text-left space-y-3"
                >
                  <div className="w-full flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feature.color} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition">
                      View details
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight block group-hover:text-primary transition">
                      {feature.name}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2-Column Grid for Credits & Contact */}
          <div className="w-full pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <Link
                href="/credits"
                className="flex items-center space-x-3.5 p-4 sm:p-4.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all active:scale-98 text-left group cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 group-hover:scale-110 transition-transform">
                  <Award size={22} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block truncate group-hover:text-amber-500 transition">
                    Credits & Community
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                    Meet the creators & contributors
                  </span>
                </div>
              </Link>

              <Link
                href="/contact"
                className="flex items-center space-x-3.5 p-4 sm:p-4.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-orange-500/50 dark:hover:border-orange-500/50 hover:shadow-md transition-all active:scale-98 text-left group cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0 group-hover:scale-110 transition-transform">
                  <Mail size={22} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block truncate group-hover:text-orange-500 transition">
                    Contact & Support
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                    24/7 Municipal & Police Helplines
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Feature Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden my-auto"
            >
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`p-3 rounded-2xl border ${selectedFeature.color} shrink-0`}
                  >
                    <selectedFeature.icon size={26} />
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${selectedFeature.badgeBg}`}
                    >
                      Module Overview
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedFeature.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Detailed Explanation */}
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {selectedFeature.detailedDesc}
                </p>

                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    How it helps Avadi Citizens:
                  </h4>
                  <div className="space-y-2">
                    {selectedFeature.howItHelps.map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-normal"
                      >
                        <CheckCircle2
                          size={16}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/get-started"
                  className="w-full sm:flex-1 py-3 px-4 bg-linear-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-primary text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer text-center"
                >
                  <span>Explore in App</span>
                  <ArrowRight size={16} />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md mt-12">
        <div className="max-w-xl mx-auto px-6 flex flex-col items-center space-y-3">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Avadi City - All Rights Reserved
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-center">
              <span>Developed with</span>
              <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
              <span>by</span>
              <a
                href="https://cyberdudenetworks.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                CyberDude Networks Pvt. Ltd.
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
