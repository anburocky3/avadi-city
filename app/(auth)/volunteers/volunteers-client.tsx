"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  HeartHandshake,
  Search,
  MapPin,
  Gift,
  Check,
  Shield,
  Droplet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Path mapped to shared-components
import { Card, Badge } from "@/components/shared-components";
import { useWard } from "@/context/wardContext";

// --- INLINE TYPESCRIPT DEFINITIONS ---

export interface DonationCause {
  id: string | number;
  causeName: string;
  description: string;
  neededItems: string;
  contactPhone: string;
  ward: number;
}

export interface Volunteer {
  id?: string | number;
  name: string;
  age: number;
  gender: string;
  ward: number;
  bloodGroup: string;
  interests: string[];
}

export interface VolunteersClientProps {
  initialDonations: DonationCause[];
  initialVolunteers: Volunteer[];
}

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const INTEREST_TYPES = [
  "Disaster Relief",
  "Teaching Kids",
  "Animal Rescue",
  "Clean-up Drives",
];

export const VolunteersClient: React.FC<VolunteersClientProps> = ({
  initialDonations,
  initialVolunteers,
}) => {
  const t = useTranslations("volunteers");
  const { authUser, activeWard, addVolunteer } = useWard();

  const [activeTab, setActiveTab] = useState<"donations" | "volunteers">(
    "donations",
  );
  const [volunteersList, setVolunteersList] =
    useState<Volunteer[]>(initialVolunteers);
  useState<Volunteer[]>(initialVolunteers);

  // Volunteer Join Form State
  const [bloodGroup, setBloodGroup] = useState<string>(
    authUser?.bloodGroup || "O+",
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showJoinForm, setShowJoinForm] = useState<boolean>(true);
  const [joinedSuccess, setJoinedSuccess] = useState<boolean>(false);
  const [whatsappSimulationMsg, setWhatsappSimulationMsg] = useState<
    string | null
  >(null);

  // Directory Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bloodFilter, setBloodFilter] = useState<string>("All");
  const [interestFilter, setInterestFilter] = useState<string>("All");

  // Check if current user is already registered in volunteers list
  const isAlreadyRegistered = volunteersList.some(
    (v) => v.name === authUser?.name,
  );

  useEffect(() => {
    if (isAlreadyRegistered) {
      setShowJoinForm(false);
    }
  }, [isAlreadyRegistered]);

  // Toggle interests selection helper
  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleJoinVolunteerForce = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) return;

    const dobYear = authUser?.dob ? new Date(authUser.dob).getFullYear() : 2000;
    const computedAge = new Date().getFullYear() - dobYear;

    const newVolunteer: Volunteer = {
      id: `vol-${Date.now()}`,
      name: authUser?.name || "Avadi Resident",
      age: computedAge > 0 ? computedAge : 25,
      gender: authUser?.gender || "Male",
      ward: authUser?.wardNumber || activeWard?.id || 14,
      bloodGroup,
      interests: selectedInterests,
    };

    setVolunteersList((prev) => [newVolunteer, ...prev]);
    if (addVolunteer) {
      addVolunteer(newVolunteer);
    }

    setJoinedSuccess(true);
    setShowJoinForm(false);

    setTimeout(() => {
      setJoinedSuccess(false);
    }, 3000);
  };

  const simulateWhatsAppDonate = (cause: DonationCause) => {
    const text = `Hi, I saw your donation request for "${cause.causeName}" on the AVADI CITY App. I would like to contribute: ${cause.neededItems}. Let me know how I can drop this off!`;
    const link = `https://wa.me/${cause.contactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;

    setWhatsappSimulationMsg(
      `Opening WhatsApp to contact the coordinator for ${cause.causeName}...`,
    );
    setTimeout(() => {
      window.open(link, "_blank");
      setWhatsappSimulationMsg(null);
    }, 1500);
  };

  // Filter Directory Volunteers
  const filteredVolunteers = volunteersList.filter((volunteer) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBlood =
      bloodFilter === "All" || volunteer.bloodGroup === bloodFilter;
    const matchesInterest =
      interestFilter === "All" || volunteer.interests.includes(interestFilter);

    return matchesSearch && matchesBlood && matchesInterest;
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            {t("title")}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm">
          <button
            onClick={() => setActiveTab("donations")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "donations"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"
            }`}
          >
            {t("tabDonations")}
          </button>
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "volunteers"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-400"
            }`}
          >
            {t("tabVolunteers")}
          </button>
        </div>
      </div>

      {/* WhatsApp Loader */}
      <AnimatePresence>
        {whatsappSimulationMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900 rounded-2xl text-center text-xs font-bold"
          >
            {whatsappSimulationMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {joinedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-center text-xs font-bold flex items-center justify-center space-x-2"
          >
            <Check size={16} />
            <span>{t("joinSuccessMsg")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: DONATIONS FEED */}
      {activeTab === "donations" && (
        <div className="space-y-4">
          {initialDonations.map((cause) => (
            <Card
              key={cause.id}
              className="p-5 border bg-white dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge
                    variant="secondary"
                    className="uppercase font-bold text-[9px]"
                  >
                    {t("charityNeed")}
                  </Badge>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mt-1.5 leading-snug">
                    {cause.causeName}
                  </h3>
                </div>
                <div className="text-[10px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 border px-2 py-0.5 rounded-lg flex items-center">
                  <MapPin size={11} className="mr-0.5 text-primary" />
                  Ward {cause.ward}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {cause.description}
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("neededItems")}
                </span>
                <p className="text-xs font-bold text-teal-700 dark:text-teal-400 leading-normal">
                  🎁 {cause.neededItems}
                </p>
              </div>

              <button
                onClick={() => simulateWhatsAppDonate(cause)}
                className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs flex items-center justify-center space-x-1.5 shadow-sm hover:shadow cursor-pointer"
              >
                <Gift size={14} />
                <span>{t("donateBtn")}</span>
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: VOLUNTEER FORCE */}
      {activeTab === "volunteers" && (
        <div className="space-y-6">
          {/* Volunteer Signup Form */}
          {showJoinForm ? (
            <Card className="p-5 border bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-primary rounded-xl">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    {t("joinTitle")}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {t("joinSubtitle")}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleJoinVolunteerForce}
                className="space-y-4 pt-2"
              >
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-bold">
                  <div>
                    <span>Name: </span>
                    <span className="text-slate-700 dark:text-slate-400">
                      {authUser?.name || "Set in profile"}
                    </span>
                  </div>
                  <div>
                    <span>Active Ward: </span>
                    <span className="text-slate-700 dark:text-slate-400">
                      Ward {authUser?.wardNumber || activeWard?.id}
                    </span>
                  </div>
                  <div>
                    <span>Date of Birth: </span>
                    <span className="text-slate-700 dark:text-slate-400">
                      {authUser?.dob || "Set in profile"}
                    </span>
                  </div>
                  <div>
                    <span>Gender: </span>
                    <span className="text-slate-700 dark:text-slate-400">
                      {authUser?.gender || "Set in profile"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {t("bloodGroupLabel")}
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {t("interestsLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TYPES.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer select-none ${
                            isSelected
                              ? "bg-primary border-primary text-white shadow-sm"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedInterests.length === 0}
                  className="w-full py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition text-xs cursor-pointer"
                >
                  {t("submitJoinBtn")}
                </button>
              </form>
            </Card>
          ) : (
            <Card className="p-4 bg-teal-50/45 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-900 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-teal-800 dark:text-teal-400 flex items-center">
                <Shield size={16} className="text-emerald-500 mr-2" />
                <span>{t("alreadyRegisteredMsg")}</span>
              </span>
              <button
                onClick={() => setShowJoinForm(true)}
                className="text-[10px] font-black text-primary underline hover:no-underline"
              >
                {t("editInfo")}
              </button>
            </Card>
          )}

          {/* Volunteer directory filter controls */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
              {t("directoryHeader")} ({filteredVolunteers.length} Active)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchByName")}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
              >
                <option value="All">{t("allBloodGroups")}</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    Blood: {bg}
                  </option>
                ))}
              </select>

              <select
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
              >
                <option value="All">{t("allInterests")}</option>
                {INTEREST_TYPES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            {/* Directory List */}
            <div className="space-y-2.5">
              {filteredVolunteers.length > 0 ? (
                filteredVolunteers.map((volunteer, idx) => (
                  <div
                    key={volunteer.id || idx}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start justify-between"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {volunteer.name ? volunteer.name[0] : "V"}
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                          {volunteer.name}
                        </span>

                        <div className="flex flex-wrap gap-1 items-center">
                          {volunteer.interests.map((i) => (
                            <span
                              key={i}
                              className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded border border-teal-100/50"
                            >
                              {i}
                            </span>
                          ))}
                        </div>

                        <p className="text-[10px] text-slate-400 font-semibold pt-1">
                          Ward {volunteer.ward} · Age: {volunteer.age} ·{" "}
                          {volunteer.gender}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 ml-4 p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
                      <Droplet
                        size={14}
                        className="text-rose-600 fill-rose-500"
                      />
                      <span className="text-[9px] font-black text-rose-700 dark:text-rose-400 mt-0.5">
                        {volunteer.bloodGroup}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  {t("noVolunteersFound")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
