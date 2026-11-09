"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@teispace/next-themes/client";
import { useTranslations } from "next-intl";
import {
  Phone,
  MapPin,
  Moon,
  Sun,
  Info,
  Lock,
  ChevronRight,
  Scale,
  CheckCircle2,
  Building2,
  Share2,
  Check,
  Camera,
  Loader2,
  HeartHandshake,
  Clock,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

// Context & Component imports matching your project structure
import { useWard, APP_VERSION } from "@/context/wardContext";
import { Card, Modal } from "@/components/shared-components";
import { useProfile } from "@/features/profile/hooks/useProfile";
import Image from "next/image";
import { contributors } from "@/features/pages/credits-page";

export const MyProfileClient: React.FC = () => {
  // --- Contexts & Hooks ---
  const { authUser, activeWard, complaints = [], updateProfile } = useWard();
  const {
    formData,
    setField,
    resetForm,
    previewUrl,
    isCompressing,
    isSubmitting,
    isVolunteer,
    isPendingVolunteer,
    handleAvatarChange,
    saveProfile,
  } = useProfile({ authUser, updateProfile });

  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const t = useTranslations();

  // --- Modal States ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // --- Share Widget State ---
  const [copied, setCopied] = useState<boolean>(false);
  const myComplaintsCount = complaints.filter(
    (c) => c.author === (authUser?.name || "Avadi Resident"),
  ).length;

  useEffect(() => setMounted(true), []);

  // --- Handlers ---
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (await saveProfile()) setIsEditModalOpen(false);
  };

  // --- Share Widget Handler ---
  const handleShareApp = async () => {
    const shareData = {
      title: "Avadi City Portal",
      text: "Join the official digital community platform for Avadi Corporation! Connect, report civic issues, and explore local services.",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto md:max-w-4xl space-y-6 pb-24 md:pb-8 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none">
          Hello{" "}
          {authUser?.name ? authUser.name.split(" ")[0] : "Avadi Resident"}!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          Manage your personal details, ward preferences, complaints, and
          municipal corporation details.
        </p>
      </div>

      {/* Main Avatar and Details Card */}
      <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          {/* 👇 Renders actual R2 picture if set, or falls back to letter initial */}
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/20 shrink-0 ring-4 ring-indigo-500/20 dark:ring-indigo-400/20 overflow-hidden">
            {authUser?.avatar || authUser?.avatar ? (
              <img
                src={authUser.avatar || authUser.avatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {authUser?.name ? authUser.name.charAt(0).toUpperCase() : "A"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{authUser?.name || "Avadi Resident"}</span>
              {isVolunteer && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60">
                  <span>Volunteer</span>
                </span>
              )}
              {isPendingVolunteer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60">
                  <Clock size={11} className="text-amber-500 animate-pulse" />
                  <span>Volunteer Pending</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center font-medium">
              <MapPin size={12} className="mr-1 text-primary shrink-0" />
              <span>
                Ward {authUser?.wardNumber || activeWard?.id || "00"} ·{" "}
                {authUser?.streetName || activeWard?.name || "Avadi City"}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black rounded-xl transition cursor-pointer text-center sm:w-auto"
        >
          Edit Profile
        </button>
      </Card>

      {/* Citizen Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-2 border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
              Grievances Filed
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white block pt-0.5">
              {myComplaintsCount}
            </span>
          </div>
          <div>
            <Link
              href="/complaints"
              className="inline-flex items-center justify-center gap-1 text-[11px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition hover:underline"
            >
              <span>View History</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </Card>

        <Card className="p-4 border-2 border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
              Volunteer Status
            </span>
            <div className="pt-0.5">
              {isVolunteer ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-500"
                    strokeWidth={2.5}
                  />
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    Active Volunteer
                  </span>
                </div>
              ) : isPendingVolunteer ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <Clock size={18} className="text-amber-500 animate-pulse" />
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    Awaiting Approval
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {/* <span className="text-xs font-black text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500/80" />
                    CIVIC MEMBER
                  </span> */}
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Not a volunteer yet
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2">
            {isVolunteer ? (
              <Link
                href="/profile/volunteer"
                className="inline-flex items-center justify-center gap-1 text-[11px] font-black text-primary hover:text-orange-600 transition hover:underline cursor-pointer"
              >
                <span>View Volunteer Identity</span>
                <ChevronRight size={12} />
              </Link>
            ) : isPendingVolunteer ? (
              <Link
                href="/profile/volunteer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-xl transition shadow-sm w-full cursor-pointer text-center"
              >
                <Clock size={12} />
                <span>Check Application Status</span>
              </Link>
            ) : (
              <Link
                href="/profile/volunteer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-orange-600 active:scale-95 text-white text-[11px] font-black rounded-xl transition shadow-sm shadow-orange-500/20 w-full cursor-pointer text-center"
              >
                <HeartHandshake size={13} />
                <span>Join as Volunteer</span>
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* SECTION 0: SHARE APP FEATURE WIDGET */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Spread the Word
        </h3>

        <Card className="p-4.5 border-2 border-slate-200 dark:border-slate-800 bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-950/30 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2 text-xs font-black text-slate-900 dark:text-white">
              <Share2 size={16} className="text-primary shrink-0" />
              <span>Share Avadi City App</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Invite friends and neighbors in your ward to join the portal.
            </p>
          </div>

          <button
            onClick={handleShareApp}
            className="px-4 py-2.5 bg-primary hover:bg-orange-600 text-white text-xs font-black rounded-xl transition shadow-sm active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Share App</span>
              </>
            )}
          </button>
        </Card>
      </div>

      {/* SECTION 1: APP & SYSTEM CONFIGURATIONS */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          App Configurations
        </h3>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-sm">
          {/* Theme setting */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              {mounted ? (
                isDark ? (
                  <Sun size={17} className="text-amber-400" />
                ) : (
                  <Moon size={17} />
                )
              ) : (
                <div className="w-4.25 h-4.25" /> /* Placeholder layout box during SSR */
              )}
              <span>{t("darkTheme")}</span>
            </div>
            {mounted ? (
              <button
                onClick={toggleTheme}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isDark ? "bg-primary" : "bg-slate-300"
                }`}
                aria-label="Toggle dark theme"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
                    isDark ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            ) : (
              <div className="w-11 h-6 rounded-full bg-slate-300 opacity-0" />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: ABOUT, TERMS & POLICIES */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          About &amp; Legal Policies
        </h3>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-sm">
          {/* About App */}
          <div
            onClick={() => setIsAboutModalOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              <Info size={17} className="text-blue-500" />
              <span>About Avadi City App</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-400 font-bold">
                {APP_VERSION}
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Terms & Conditions */}
          <Link
            href="/terms-and-conditions"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              <Scale size={17} className="text-emerald-500" />
              <span>Terms &amp; Conditions</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>

          {/* Privacy & Citizen Protection Policy */}
          <Link
            href="/privacy-policy"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              <Lock size={17} className="text-purple-500" />
              <span>Privacy &amp; Data Safety Policy</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        </div>
      </div>

      {/* SECTION 3: MUNICIPAL HELPDESK & SUPPORT */}
      <div className="space-y-3 mb-10">
        <h3 className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Municipal Helpdesk &amp; Emergency
        </h3>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
            <div className="flex items-center space-x-2.5">
              <Building2 size={17} className="text-primary" />
              <span>Avadi Corporation Helpline</span>
            </div>
            <a
              href="tel:04426342000"
              className="text-primary font-black underline"
            >
              044-26342000
            </a>
          </div>

          <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Phone size={17} className="text-emerald-500" />
              <span>Civic Toll-Free Number</span>
            </div>
            <a
              href="tel:18004254700"
              className="text-emerald-600 dark:text-emerald-400 font-black underline"
            >
              1800-425-4700
            </a>
          </div>
        </div>
      </div>

      {/* MODAL 1: ABOUT AVADI CITY APP */}
      <Modal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        title="About Avadi City Portal"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-2xl">
            <Image
              src="/logo.png"
              alt="Avadi City App Logo"
              width={64}
              height={64}
              className="shrink-0"
            />
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Avadi City App
              </h4>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {APP_VERSION} Civic Release
              </p>
            </div>
            <button
              onClick={handleShareApp}
              className="px-3 py-2 border dark:border-slate-600 hover:bg-orange-800 text-white text-xs font-black rounded-xl transition shadow-sm active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                </>
              )}
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Avadi City Portal is the official digital civic platform connecting
            residents across all 48 wards with the Avadi City Municipal
            Corporation administration.
          </p>
          <div className="space-y-2">
            <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Key Modules:
            </h5>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>
                  Geo-tagged Grievance Reporting &amp; Realtime Tracking
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>
                  Hyperlocal Property Rentals &amp; Job Vacancies Board
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Gourmet Food &amp; 24/7 Midnight Craving Spots</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>
                  1-Tap Emergency SOS &amp; Verified Volunteer Network
                </span>
              </li>
            </ul>
          </div>
          <hr className="border-slate-200 dark:border-slate-800" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={16} className="text-orange-500" />
                <span>Core Team & Contributors</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                The People Behind The Code
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {contributors.map((person, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-0 group"
                >
                  {/* Avatar & Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-s items-center space-x-3 space-y-2 text-center">
                      <div className="w-14 h-14 rounded-2xl p-0.5 bg-linear-to-tr from-orange-500 via-amber-500 to-primary group-hover:scale-105 transition-transform duration-200">
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-full h-full object-cover rounded-[14px] bg-slate-100 dark:bg-slate-800"
                        />
                      </div>
                      <div className="space-y-2 items-start">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                          {person.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-black text-[9px] border border-orange-200/60 dark:border-orange-900/60 uppercase tracking-wider">
                          {person.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1"></div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
            © {new Date().getFullYear()} Avadi Municipal Corporation. All Rights
            Reserved.
          </p>
        </div>
      </Modal>

      {/* EDIT PROFILE DETAILS OVERLAY */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Profile Details"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={36} className="text-slate-400" />
                )}
              </div>

              <label className="absolute inset-0 rounded-full bg-slate-900/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                {isCompressing ? (
                  <Loader2 size={20} className="animate-spin text-amber-400" />
                ) : (
                  <>
                    <Camera size={20} />
                    <span className="text-[9px] font-bold mt-0.5">Change</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void handleAvatarChange(event.target.files?.[0])
                  }
                  className="sr-only"
                />
              </label>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {isCompressing
                ? "Compressing image to WebP..."
                : "Tap photo to update"}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Date of Birth
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={formData.dob}
                onChange={(e) => setField("dob", e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setField("bloodGroup", e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setField("gender", e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 👇 Disabled state protects against submitting during compression */}
          <button
            type="submit"
            disabled={isSubmitting || isCompressing}
            className="w-full py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black transition text-xs cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            <span>
              {isSubmitting ? "Updating..." : "Update Profile Details"}
            </span>
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MyProfileClient;
