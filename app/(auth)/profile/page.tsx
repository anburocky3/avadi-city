"use client";

import React, { useState } from "react";
import { useTheme } from "@teispace/next-themes/client";
import { useTranslations } from "next-intl";
import {
  Phone,
  MapPin,
  Moon,
  Sun,
  ShieldCheck,
  Info,
  Lock,
  ChevronRight,
  Scale,
  CheckCircle2,
  Building2,
  Share2,
  Check,
} from "lucide-react";

// Context & Component imports matching your project structure
import { useWard, APP_VERSION } from "@/context/wardContext";
import { Card, Modal } from "@/components/shared-components";

export const Profile: React.FC = () => {
  // --- Contexts & Hooks ---
  const {
    authUser,
    activeWard,
    volunteers = [],
    complaints = [],
    updateProfile,
  } = useWard();

  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const t = useTranslations();

  // --- Modal States ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // --- Share Widget State ---
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Edit Form State (Powered by authUser) ---
  const [editName, setEditName] = useState<string>(authUser?.name || "");
  const [editDob, setEditDob] = useState<string>(
    authUser?.dob
      ? new Date(authUser.dob).toISOString().split("T")[0]
      : "2000-01-01",
  );
  const [editBloodGroup, setEditBloodGroup] = useState<string>(
    authUser?.bloodGroup || "O+",
  );
  const [editGender, setEditGender] = useState<string>(
    authUser?.gender || "Male",
  );
  const [editPhone, setEditPhone] = useState<string>(authUser?.phone || "");
  const [editEmail, setEditEmail] = useState<string>(authUser?.email || "");

  // --- Derived Metrics ---
  const isVolunteer = volunteers.some((v) => v.name === authUser?.name);
  const myComplaintsCount = complaints.filter(
    (c) => c.author === (authUser?.name || "Avadi Resident"),
  ).length;

  // --- Handlers ---
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (updateProfile) {
        await updateProfile({
          name: editName,
          dob: editDob,
          bloodGroup: editBloodGroup as any,
          gender: editGender as any,
          phone: editPhone,
          email: editEmail,
        });
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 font-sans">
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/20 shrink-0 ring-4 ring-indigo-500/20 dark:ring-indigo-400/20">
            {authUser?.name ? authUser.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{authUser?.name || "Avadi Resident"}</span>
              {isVolunteer && (
                <span title="Verified Volunteer" className="inline-flex">
                  <ShieldCheck
                    size={16}
                    className="text-emerald-500 shrink-0"
                  />
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
            setEditName(authUser?.name || "");
            setEditDob(
              authUser?.dob
                ? new Date(authUser.dob).toISOString().split("T")[0]
                : "2000-01-01",
            );
            setEditBloodGroup(authUser?.bloodGroup || "O+");
            setEditGender(authUser?.gender || "Male");
            setEditPhone(authUser?.phone || "");
            setEditEmail(authUser?.email || "");
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black rounded-xl transition cursor-pointer text-center sm:w-auto"
        >
          Edit Profile
        </button>
      </Card>

      {/* Citizen Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-2 border-slate-200 dark:border-slate-800 text-center space-y-1 bg-white dark:bg-slate-900">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            Grievances Filed
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {myComplaintsCount}
          </span>
        </Card>
        <Card className="p-4 border-2 border-slate-200 dark:border-slate-800 text-center space-y-1 bg-white dark:bg-slate-900">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            Volunteer Status
          </span>
          <span
            className={`text-xs font-black block pt-1.5 ${
              isVolunteer
                ? "text-emerald-500"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isVolunteer ? "🟢 ACTIVE FORCE" : "⚪ CIVIC MEMBER"}
          </span>
        </Card>
      </div>

      {/* SECTION 0: SHARE APP FEATURE WIDGET */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Spread the Word
        </h3>

        <Card className="p-4.5 border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-950/30 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-4">
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
              {isDark ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} />
              )}
              <span>{t("darkTheme")}</span>
            </div>
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
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition"
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
          <div
            onClick={() => setIsTermsModalOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition"
          >
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              <Scale size={17} className="text-emerald-500" />
              <span>Terms &amp; Conditions</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>

          {/* Privacy & Citizen Protection Policy */}
          <div
            onClick={() => setIsPrivacyModalOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition"
          >
            <div className="flex items-center space-x-3 text-xs font-black text-slate-800 dark:text-slate-200">
              <Lock size={17} className="text-purple-500" />
              <span>Privacy &amp; Data Safety Policy</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
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

          <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-800">
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
            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shrink-0">
              A
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                Avadi City App
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {APP_VERSION} Civic Release · Built for 48 Wards
              </p>
            </div>
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

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
            © 2026 Avadi Municipal Corporation. All Rights Reserved.
          </p>
        </div>
      </Modal>

      {/* MODAL 2: TERMS & CONDITIONS */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="Terms & Conditions"
      >
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            Please read these civic platform usage terms before submitting
            reports or listings.
          </p>

          <div className="space-y-2">
            <h5 className="font-black text-slate-900 dark:text-white">
              1. Authentic Grievance Submission
            </h5>
            <p className="leading-relaxed font-medium">
              Residents must ensure all reported civic complaints (water
              leakage, road damage, street lights) are genuine and located
              within Avadi Corporation boundaries. False emergency reports are
              strictly prohibited.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-black text-slate-900 dark:text-white">
              2. Local Property &amp; Job Listings
            </h5>
            <p className="leading-relaxed font-medium">
              Building rental listings and job vacancies posted by residents
              must contain verified mobile numbers and property photos. Spam or
              fraudulent financial demands will result in instant removal.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-black text-slate-900 dark:text-white">
              3. Emergency SOS Responsible Usage
            </h5>
            <p className="leading-relaxed font-medium">
              The 1-Tap SOS button alerts nearby volunteers and emergency
              services. Misuse of the emergency SOS feature for non-emergency
              testing is punishable under municipal regulations.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-black text-slate-900 dark:text-white">
              4. Community Conduct
            </h5>
            <p className="leading-relaxed font-medium">
              Be respectful to fellow Ward residents and Municipal Officers in
              discussions and volunteer networks.
            </p>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: PRIVACY & DATA SAFETY */}
      <Modal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title="Privacy & Data Protection Policy"
      >
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-center space-x-2 text-purple-700 dark:text-purple-300 font-bold">
            <Lock size={16} className="shrink-0" />
            <span>
              Your personal data and phone numbers are encrypted locally.
            </span>
          </div>

          <div className="space-y-2 font-medium">
            <h5 className="font-black text-slate-900 dark:text-white">
              Data Protection Principles:
            </h5>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>
                Your contact mobile number is only shared when you choose to
                apply for rental listings or jobs.
              </li>
              <li>
                Location coordinates are exclusively used for geo-tagging
                municipal complaints.
              </li>
              <li>
                No personal information is sold or shared with third-party
                advertising companies.
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* EDIT PROFILE DETAILS OVERLAY */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Profile Details"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Blood Group
              </label>
              <select
                value={editBloodGroup}
                onChange={(e) => setEditBloodGroup(e.target.value)}
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
              value={editGender}
              onChange={(e) => setEditGender(e.target.value)}
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
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                Email Address
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black transition text-xs cursor-pointer shadow-md hover:shadow-lg"
          >
            {isSubmitting ? "Updating..." : "Update Profile Details"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
