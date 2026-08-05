"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  Heart,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  FileText,
  CheckCircle2,
  Users,
  Building2,
  GitFork,
} from "lucide-react";
import {
  SiForgejo,
  SiGithub,
  SiGithubHex,
  SiInstagram,
} from "@icons-pack/react-simple-icons";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

// --- INLINE DATA ARRAYS (Easy to edit) ---

const contributors = [
  {
    name: "Mr. Anbu Selvan",
    role: "Founder/CEO",
    contribution:
      "Designed core system architecture, ward location workflows, and emergency SOS routing.",
    avatarUrl: "https://github.com/anburocky3.png", // Replace with real photos or use initials
    initials: "AS",
    badge: "Project Lead",
  },
  {
    name: "Mr. Krithick Balan",
    role: "Civic Data Coordinator",
    contribution:
      "Mapped all 48 municipal wards, street landmarks, and public transport schedules.",
    avatarUrl: "https://github.com/krithickbalan.png", // Replace with real photos or use initials
    initials: "RK",
    badge: "Data Lead",
  },
  {
    name: "Mr. Anbumani",
    role: "Healthcare Advisor",
    contribution:
      "Verified 24/7 hospital directories, blood donor networks, and pharmacy contacts.",
    avatarUrl: "https://github.com/anbumani.png", // Replace with real photos or use initials
    initials: "KS",
    badge: "Medical",
  },
  {
    name: "Mr. Dhanush",
    role: "Community Operations",
    contribution:
      "Coordinated volunteer testing, merchant onboarding, and rental directory verification.",
    avatarUrl: "https://github.com/dhanush.png", // Replace with real photos or use initials
    initials: "VK",
    badge: "Operations",
  },
];

const instagramInfluencers = [
  {
    handle: "@anbuden_avadi",
    name: "anbuden_avadi",
    role: "Awareness Partner",
    followers: "65K+ Avadians",
    desc: "Helped broadcast emergency SOS features and municipal complaint workflows to the local community.",
    avatarUrl: "/img/supporters/anbuden-avadi.jpg",
    link: "https://instagram.com/anbuden_avadi",
  },
  {
    handle: "@avadi_pasangada",
    name: "Chennai Food Explorer",
    role: "Food Module Collaborator",
    followers: "82K+ Foodies",
    desc: "Curated hidden street food gems, late-night cafes, and top restaurants for the Food Explorer module.",
    avatarUrl: "/img/supporters/avadi_pasangada.jpg",
    link: "https://www.instagram.com/avadi_pasangada/",
  },
  {
    handle: "@avadi_media_",
    name: "Avadi Media",
    role: "Youth Engagement",
    followers: "120K+ Reach",
    desc: "Promoted civic participation, blood donor sign-ups, and clean ward initiatives among college students.",
    avatarUrl: "/img/supporters/avadi_media_.jpg",
    link: "https://www.instagram.com/avadi_media_/",
  },
  {
    handle: "@explore_avadi",
    name: "Heritage & Travel",
    role: "City Directory Guide",
    followers: "30K+ Explorers",
    desc: "Provided photography and historical details for local parks, temples, and landmark attractions.",
    avatarUrl: "/img/supporters/explore_avadi.jpg",
    link: "https://www.instagram.com/explore_avadi/",
  },
];

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/60 relative z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
                CONNECTING AVADIANS
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 my-auto py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-10">
        {/* Title Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2.5">
            <Link
              href="/"
              className="inline-flex mt-1 items-center space-x-1 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/70 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition mb-1 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Link>
            <span>Credits & Community</span>
            <Award className="text-amber-500 shrink-0" size={32} />
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Avadi City is a collaborative community initiative. A heartfelt
            thank you to the creators, local advisors, and digital influencers
            who brought this vision to life.
          </p>
        </div>

        {/* Section 1: Company & License Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-amber-500/30 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left: Company Details */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[10px] uppercase tracking-wider">
                  Official Creator & Maintainer
                </span>
                <Sparkles size={14} className="text-amber-400 animate-pulse" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Building2 className="text-amber-500 shrink-0" size={24} />
                <span>CyberDude Networks Pvt. Ltd.</span>
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Established on December 06, 2016, CyberDude Networks designed,
                engineered, and deployed this platform to empower civic
                participation across all 48 municipal wards of Avadi.
              </p>

              {/* Action Buttons: Website & GitHub Fork */}
              <div className="pt-1.5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <a
                  href="https://cyberdudenetworks.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-500 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  <span>Visit Company Website</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href="https://github.com/anburocky3/avadi-city/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white font-black text-xs border border-slate-700/80 hover:border-amber-500/40 shadow-md transition active:scale-95 cursor-pointer group"
                >
                  <SiGithub
                    size={15}
                    className="text-slate-300 group-hover:text-white transition-colors"
                  />
                  <span>Fork on GitHub</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-700/80 text-[9px] text-amber-400 font-extrabold flex items-center gap-1 border border-slate-600/50">
                    <span>Contribute</span>
                  </span>
                </a>
              </div>

              {/* Developer Callout */}
              <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>
                  Open for community developers — fork the repo to build custom
                  ward modules!
                </span>
              </p>
            </div>

            {/* Right: License Box */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5">
              <div className="flex items-center space-x-2 text-amber-400">
                <FileText size={18} />
                <span className="font-extrabold text-xs uppercase tracking-wider">
                  Open Community License
                </span>
              </div>
              <h4 className="font-black text-sm text-white">
                MIT / Civic Benefit License
              </h4>
              <p className="text-[11px] text-slate-300 leading-normal font-medium">
                This platform is released for the general welfare of the public.
                Municipal data, SOS directories, and ward workflows remain free
                for civic non-profit use and community enrichment.
              </p>
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400 pt-1">
                <CheckCircle2 size={13} />
                <span>Verified Public Interest Project</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Key Contributors & Advisors (Modern Avatars) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={16} className="text-primary" />
              <span>Core Team & Advisors</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              The People Behind The Code
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contributors.map((person, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Avatar & Badge */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl p-0.5 bg-linear-to-tr from-orange-500 via-amber-500 to-primary group-hover:scale-105 transition-transform duration-200">
                      {person.avatarUrl ? (
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-full h-full object-cover rounded-[14px] bg-slate-100 dark:bg-slate-800"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                          {person.initials}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-black text-[9px] border border-orange-200/60 dark:border-orange-900/60 uppercase tracking-wider">
                    {person.badge}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                    {person.name}
                  </h4>
                  <p className="text-[11px] font-extrabold text-primary">
                    {person.role}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal pt-1 line-clamp-3">
                    {person.contribution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Instagram Community & Influencers */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <SiInstagram size={16} className="text-pink-500" />
              <span>Instagram Community & Local Influencers</span>
            </h3>
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
              #AvadiCity #NammaAvadi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {instagramInfluencers.map((insta, idx) => (
              <a
                key={idx}
                href={insta.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-pink-500/40 dark:hover:border-pink-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                {/* Insta Avatar Ring */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full p-0.5 bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={insta.avatarUrl}
                      alt={insta.handle}
                      className="w-full h-full object-cover rounded-full bg-white dark:bg-slate-900 p-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-xs text-slate-900 dark:text-white block truncate group-hover:text-pink-500 transition">
                      {insta.handle}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
                      {insta.followers}
                    </span>
                  </div>
                </div>

                {/* Role & Contribution */}
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 font-extrabold text-[10px] border border-pink-200/50 dark:border-pink-900/50">
                    {insta.role}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal pt-1 line-clamp-3">
                    {insta.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Section 4: Citizen Volunteer Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-orange-500/10 via-amber-500/10 to-primary/10 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1 max-w-lg">
            <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>Want to Contribute to Your Ward?</span>
              <Heart size={18} className="text-rose-500 fill-rose-500" />
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 font-medium leading-relaxed">
              We are constantly updating local shop directories, bus timings,
              and emergency numbers. If you run an Instagram page or want to
              volunteer in your ward, let us know!
            </p>
          </div>

          <Link
            href="/contact"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs shadow-md transition shrink-0 cursor-pointer active:scale-95"
          >
            Join as Ward Volunteer →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 px-4 text-center border-t border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
          {/* Navigation Links Group */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link href="/contact" className="hover:text-orange-500 transition">
              Contact & Support
            </Link>
          </div>

          {/* Bullet Separator (Hidden on mobile stack) */}
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
            •
          </span>

          {/* Attribution Group */}
          <div className="flex items-center gap-1.5 justify-center flex-wrap text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Developed with</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
            <span>by</span>
            <a
              href="https://cyberdudenetworks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-primary hover:underline"
            >
              CyberDude Networks Pvt. Ltd.
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
