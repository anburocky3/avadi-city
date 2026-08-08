import { AnimatePresence, animate, motion } from "framer-motion";
import {
  LucideIcon,
  PlusCircle,
  Camera,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { title, exit } from "process";
import React from "react";
import { useEffect, useState } from "react";
import { size } from "zod";

export interface GuideStep {
  stepTag: string;
  title: string;
  desc: string;
  icon: LucideIcon | React.ElementType;
  illustrationBg: string;
}

const complaintGuideSteps: GuideStep[] = [
  {
    stepTag: "STEP 1 OF 4 · SELECT",
    title: "Choose Issue Category",
    desc: "Pick from Sanitation, Roads, Electricity, Water or Streetlights.",
    icon: PlusCircle,
    illustrationBg: "from-orange-500 to-amber-500",
  },
  {
    stepTag: "STEP 2 OF 4 · EVIDENCE",
    title: "Provide Location & Photos",
    desc: "Attach up to 3 photos and a clear spot landmark description.",
    icon: Camera,
    illustrationBg: "from-blue-600 to-cyan-600",
  },
  {
    stepTag: "STEP 3 OF 4 · TRACKING",
    title: "Instant Grievance ID",
    desc: "Receive a unique Tracking ID to monitor resolution status.",
    icon: ShieldCheck,
    illustrationBg: "from-purple-600 to-indigo-600",
  },
  {
    stepTag: "STEP 4 OF 4 · ACTION",
    title: "Zonal Action & Proof",
    desc: "Ward Officer resolves the problem and logs completion proof.",
    icon: CheckCircle2,
    illustrationBg: "from-emerald-600 to-teal-600",
  },
];

export function ComplaintGuideSteps() {
  const [howSlideIndex, setHowSlideIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHowSlideIndex((prev) => (prev + 1) % complaintGuideSteps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2 text-slate-900 dark:text-white">
          <Sparkles
            size={18}
            className="text-amber-500 shrink-0 animate-pulse"
          />
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
            How Complaint Reporting Works
          </h2>
        </div>

        <div className="flex items-center space-x-1.5">
          {complaintGuideSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setHowSlideIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === howSlideIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
              aria-label={`Go to guide step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl min-h-40 sm:min-h-45 flex items-center">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={() =>
            setHowSlideIndex((prev) =>
              prev === 0 ? complaintGuideSteps.length - 1 : prev - 1,
            )
          }
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer absolute left-3 sm:left-4 z-20 transition active:scale-90"
          title="Previous Step"
        >
          <ChevronLeft size={18} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={howSlideIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col sm:flex-row items-center justify-between px-14 sm:px-16 py-6 gap-4 z-10"
          >
            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400 block">
                {complaintGuideSteps[howSlideIndex].stepTag}
              </span>
              <h3 className="font-black text-base sm:text-xl text-white leading-tight">
                {complaintGuideSteps[howSlideIndex].title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-lg">
                {complaintGuideSteps[howSlideIndex].desc}
              </p>
            </div>

            <div className="shrink-0 hidden xs:flex">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br ${complaintGuideSteps[howSlideIndex].illustrationBg} text-white flex items-center justify-center shadow-lg shadow-black/30 border border-white/20`}
              >
                {React.createElement(complaintGuideSteps[howSlideIndex].icon, {
                  size: 28,
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() =>
            setHowSlideIndex((prev) => (prev + 1) % complaintGuideSteps.length)
          }
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer absolute right-3 sm:right-4 z-20 transition active:scale-90"
          title="Next Step"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
