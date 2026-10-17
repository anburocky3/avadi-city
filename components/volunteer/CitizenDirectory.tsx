"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Droplet,
  Phone,
  MessageCircle,
  Lock,
  UserCheck,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Volunteer } from "@/types/volunteer";
import { StatusBadge } from "./StatusBadge";
import { RequestContactModal } from "./RequestContactModal";

const BLOOD_GROUPS = ["All", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const INTEREST_OPTIONS = [
  "All",
  "Disaster Relief",
  "Teaching Kids",
  "Animal Rescue",
  "Clean-up Drives",
  "Blood Donation",
  "Elderly Care",
  "Medical First Aid",
  "Tree Plantation",
  "Food Distribution",
  "Traffic/Crowd Management",
  "Event Support",
];

export interface CitizenDirectoryProps {
  volunteers: Volunteer[];
  currentUserName?: string;
  currentUserPhone?: string;
  activeWardId?: number;
}

export const CitizenDirectory: React.FC<CitizenDirectoryProps> = ({
  volunteers,
  currentUserName,
  currentUserPhone,
  activeWardId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState("All");
  const [wardFilter, setWardFilter] = useState<string>("All");
  const [availableNowOnly, setAvailableNowOnly] = useState<boolean>(false);

  // Contact modal state
  const [selectedVolunteerForContact, setSelectedVolunteerForContact] =
    useState<Volunteer | null>(null);

  // Available now calculation (active status + not paused + today's day of week matches)
  const isAvailableNow = (v: Volunteer) => {
    if (v.status !== "active") return false;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = days[new Date().getDay()];
    return v.availability.days.includes(today) || v.availability.type === "Anytime";
  };

  // Filtered list
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((vol) => {
      // Only show approved/active volunteers in the public Citizens Directory.
      // Newly registered volunteers have status "pending" until approved in the database by admin.
      if (vol.status !== "active" && vol.status !== "approved") return false;

      // Name search
      const matchesSearch =
        !searchQuery.trim() ||
        vol.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vol.contact?.area.toLowerCase().includes(searchQuery.toLowerCase());

      // Blood filter
      const matchesBlood =
        bloodFilter === "All" || vol.health.bloodGroup === bloodFilter;

      // Interest filter
      const matchesInterest =
        interestFilter === "All" || vol.interests.includes(interestFilter);

      // Ward filter
      const matchesWard =
        wardFilter === "All" || String(vol.ward) === String(wardFilter);

      // Available now filter
      const matchesAvailable = !availableNowOnly || isAvailableNow(vol);

      return (
        matchesSearch &&
        matchesBlood &&
        matchesInterest &&
        matchesWard &&
        matchesAvailable
      );
    });
  }, [
    volunteers,
    searchQuery,
    bloodFilter,
    interestFilter,
    wardFilter,
    availableNowOnly,
  ]);

  const handleWhatsAppContact = (vol: Volunteer) => {
    const text = `Hi ${vol.fullName}, I found your profile on the Avadi City Volunteer Force. We have a civic drive in Ward ${vol.ward} and would love your assistance!`;
    const cleanPhone = vol.contact.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePhoneCall = (vol: Volunteer) => {
    window.open(`tel:+91${vol.contact.mobile.replace(/\D/g, "")}`, "_self");
  };

  return (
    <div className="space-y-4">
      {/* Directory Title & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <UserCheck size={16} className="text-primary" />
            <span>Citizens Volunteer Directory</span>
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            {filteredVolunteers.length} verified resident volunteers in Avadi
          </p>
        </div>

        {/* Available now quick toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={availableNowOnly}
            onChange={(e) => setAvailableNowOnly(e.target.checked)}
            className="rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Available Today
          </span>
        </label>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or area..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
          />
        </div>

        {/* Ward Filter */}
        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          <option value="All">All 48 Wards</option>
          {Array.from({ length: 48 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={String(w)}>
              Ward {w}
            </option>
          ))}
        </select>

        {/* Blood Group Filter */}
        <select
          value={bloodFilter}
          onChange={(e) => setBloodFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg === "All" ? "All Blood Groups" : `Blood: ${bg}`}
            </option>
          ))}
        </select>

        {/* Interest Filter */}
        <select
          value={interestFilter}
          onChange={(e) => setInterestFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
        >
          {INTEREST_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {i === "All" ? "All Interests" : i}
            </option>
          ))}
        </select>
      </div>

      {/* Directory List of Cards */}
      <div className="space-y-3">
        {filteredVolunteers.length > 0 ? (
          filteredVolunteers.map((vol) => {
            const availableToday = isAvailableNow(vol);
            const isPaused = vol.status === "paused";

            return (
              <div
                key={vol.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
              >
                {/* Top Card Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-orange-100 dark:border-orange-900/40 mt-0.5">
                      {vol.fullName ? vol.fullName[0].toUpperCase() : "V"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                          {vol.fullName}
                        </span>

                        {/* Availability Pill */}
                        {isPaused ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Paused
                          </span>
                        ) : availableToday ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Available Today
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {vol.availability.type}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <MapPin size={11} className="text-primary" />
                        Ward {vol.ward} · Age {vol.age} · {vol.gender}
                        {vol.contact.area && ` · ${vol.contact.area}`}
                      </p>
                    </div>
                  </div>

                  {/* Blood Group Badge */}
                  <StatusBadge
                    type="bloodGroup"
                    value={vol.health.bloodGroup}
                  />
                </div>

                {/* Interests Chips */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {vol.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-lg border border-teal-100/60 dark:border-teal-900/40"
                    >
                      {interest}
                    </span>
                  ))}
                  {vol.skills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg"
                    >
                      🛠 {skill}
                    </span>
                  ))}
                </div>

                {/* Bio snippet if available */}
                {vol.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{vol.bio}"
                  </p>
                )}

                {/* Contact Controls respecting privacy toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {vol.availability.days.join(", ")} ({vol.availability.slots.join(", ")})
                  </span>

                  <div className="flex items-center gap-2">
                    {vol.contact.showPhonePublic ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePhoneCall(vol)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Phone size={11} className="text-primary" />
                          <span>Call</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsAppContact(vol)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                        >
                          <MessageCircle size={11} />
                          <span>WhatsApp</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedVolunteerForContact(vol)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Lock size={11} className="text-slate-400" />
                        <span>Request Contact</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No volunteers match your selected filters.
            </p>
            <p className="text-[11px] text-slate-400">
              Try adjusting the blood group, ward, or search keywords.
            </p>
          </div>
        )}
      </div>

      {/* In-app Request Contact Modal */}
      <RequestContactModal
        isOpen={Boolean(selectedVolunteerForContact)}
        onClose={() => setSelectedVolunteerForContact(null)}
        volunteer={selectedVolunteerForContact}
        currentUserName={currentUserName}
        currentUserPhone={currentUserPhone}
      />
    </div>
  );
};

export default CitizenDirectory;
