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
  Sun,
  Moon,
  LogIn,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      name: "Community Feed",
      icon: MessageSquare,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      desc: "Share updates, see local news, and connect with people in your ward.",
    },
    {
      name: "Civic Complaints",
      icon: AlertTriangle,
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      desc: "Report local problems like garbage, water, roads, or streetlights and track their status.",
    },
    {
      name: "Emergency SOS",
      icon: ShieldAlert,
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      desc: "Get quick help by contacting Police, Ambulance, Fire, or nearby Hospitals.",
    },
    {
      name: "Explore Avadi",
      icon: Compass,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      desc: "Find famous places, temples, parks, shops, and attractions around Avadi.",
    },
    {
      name: "Food Explorer",
      icon: ChefHat,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      desc: "Discover restaurants, cafés, street food, and late-night food shops near you.",
    },
    {
      name: "Local Services",
      icon: Wrench,
      color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      desc: "Find trusted electricians, plumbers, mechanics, and other local workers.",
    },
    {
      name: "Public Transport",
      icon: Train,
      color: "bg-blue-600/10 text-blue-600 border-blue-600/20",
      desc: "Check nearby bus routes, train details, and travel information.",
    },
    {
      name: "Rentals & Jobs",
      icon: Briefcase,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      desc: "Search for rental houses, shops, and local job opportunities.",
    },
    {
      name: "Government Services",
      icon: Building2,
      color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
      desc: "Access important government services and ward office information.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/40">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-750 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
            <img
              src={"/logo.png"}
              alt="AVADI CITY Official Logo"
              className="w-full h-full object-cover object-center rounded-xl"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              AVADI <span className="text-primary font-black">CITY</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
              URBAN COMMUNITY PLATFORM
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-6 py-6 max-w-xl mx-auto text-center w-full">
        {/* Headline & Description Section - Sharply centered in the middle between top header and Get Started */}
        <div className="my-auto space-y-3.5 py-6 max-w-md flex flex-col items-center justify-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
            Smart Services for a<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-orange-500 to-teal-500">
              Smarter Avadi
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-350 font-medium tracking-wide leading-relaxed max-w-sm">
            One platform for your community, safety and daily needs across all
            48 municipal wards.
          </p>
        </div>

        {/* Bottom Actions & Features Container */}
        <div className="w-full space-y-4 pt-2">
          {/* Get Started Button */}
          <Link
            href="/get-started"
            className="w-full py-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </Link>

          {/* Features Deck */}
          <div className="w-full space-y-3 pt-1">
            <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
              Our Features
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 cursor-pointer hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md transition-all active:scale-95 group"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border ${feature.color} group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-xs mt-2.5 font-bold tracking-tight text-slate-700 dark:text-slate-350 leading-tight">
                      {feature.name}
                    </span>
                    <p className="text-[10px] mt-1 font-medium text-slate-500 dark:text-slate-400 leading-tight text-center line-clamp-2">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-slate-200/60 dark:border-slate-800/40">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Avadi City - All Rights Reserved
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Developed by{" "}
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
      </footer>
    </div>
  );
}
