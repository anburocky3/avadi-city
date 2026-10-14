"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { HeartHandshake, Gift } from "lucide-react";
import { useWard } from "@/context/wardContext";

// Services & Seed data
import volunteerService from "@/services/volunteerService";
import donationService from "@/services/donationService";

// Types
import { Volunteer } from "@/types/volunteer";
import { DonationRequest } from "@/types/donation";

// Components
import { VolunteerWizard } from "@/components/volunteer/VolunteerWizard";
import { MyVolunteerProfile } from "@/components/volunteer/MyVolunteerProfile";
import { CitizenDirectory } from "@/components/volunteer/CitizenDirectory";
import { DonationFeed } from "@/components/donation/DonationFeed";
import { CreateDonationModal } from "@/components/donation/CreateDonationModal";
import toast from "@/utils/toast";

// Re-export for page.tsx compatibility
export type { Volunteer };
export type DonationCause = DonationRequest;

export interface VolunteersClientProps {
  initialDonations?: any[];
  initialVolunteers?: any[];
}

export const VolunteersClient: React.FC<VolunteersClientProps> = ({
  initialDonations,
  initialVolunteers,
}) => {
  const t = useTranslations("volunteers");
  const { authUser, activeWard } = useWard();

  const [activeTab, setActiveTab] = useState<"donations" | "volunteers">("donations");

  // State initialized with server-fetched database records or fallback service cache
  const [volunteersList, setVolunteersList] = useState<Volunteer[]>(() => {
    if (initialVolunteers && initialVolunteers.length > 0) return initialVolunteers;
    return volunteerService.list();
  });
  const [donationsList, setDonationsList] = useState<DonationRequest[]>(() => {
    if (initialDonations && initialDonations.length > 0) return initialDonations;
    return donationService.list();
  });

  // Volunteer Force View State
  const [isEditingVolunteer, setIsEditingVolunteer] = useState<boolean>(false);

  // Donation Modal State
  const [isCreateDonationOpen, setIsCreateDonationOpen] = useState<boolean>(false);
  const [editingDonation, setEditingDonation] = useState<DonationRequest | null>(null);

  // Sync with MySQL database on mount
  useEffect(() => {
    volunteerService.syncWithDb().then((data) => {
      if (data && data.length > 0) setVolunteersList(data);
    });
    donationService.syncWithDb().then((data) => {
      if (data && data.length > 0) setDonationsList(data);
    });
  }, []);

  // Determine if logged-in user has an active volunteer profile
  const myVolunteerProfile = React.useMemo(() => {
    if (!authUser) return null;
    return (
      volunteersList.find(
        (v) =>
          v.userId === authUser.id ||
          (authUser.phone && v.contact?.mobile === authUser.phone.replace(/\D/g, "")) ||
          (authUser.name && v.fullName.toLowerCase() === authUser.name.toLowerCase()),
      ) || null
    );
  }, [volunteersList, authUser]);

  // Keep list updated if window receives storage events or services change
  const refreshVolunteers = () => {
    setVolunteersList(volunteerService.list());
    volunteerService.syncWithDb().then((data) => {
      if (data && data.length > 0) setVolunteersList(data);
    });
  };

  const refreshDonations = () => {
    setDonationsList(donationService.list());
    donationService.syncWithDb().then((data) => {
      if (data && data.length > 0) setDonationsList(data);
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            {t("title") || "Volunteers & Donations"}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            {t("subtitle") ||
              "Join civic community drives or contribute to local charitable needs in Avadi."}
          </p>
        </div>

        {/* Two-Tab Navigation */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("donations")}
            className={`flex-1 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "donations"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Gift size={13} className={activeTab === "donations" ? "text-primary" : ""} />
            <span>{t("tabDonations") || "Donation Requests"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("volunteers")}
            className={`flex-1 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "volunteers"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <HeartHandshake
              size={13}
              className={activeTab === "volunteers" ? "text-primary" : ""}
            />
            <span>{t("tabVolunteers") || "Volunteer Force"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DONATION REQUESTS */}
      {/* ========================================================= */}
      {activeTab === "donations" && (
        <div className="space-y-6">
          <DonationFeed
            requests={donationsList}
            currentUserId={authUser?.id || "user-avadi-citizen"}
            onCreateNew={() => {
              setEditingDonation(null);
              setIsCreateDonationOpen(true);
            }}
            onEdit={(req) => {
              setEditingDonation(req);
              setIsCreateDonationOpen(true);
            }}
            onRequestUpdated={(updatedList) => {
              setDonationsList(updatedList);
            }}
          />

          {/* Create / Edit Donation Modal */}
          <CreateDonationModal
            isOpen={isCreateDonationOpen}
            onClose={() => {
              setIsCreateDonationOpen(false);
              setEditingDonation(null);
            }}
            authUser={authUser}
            activeWardId={activeWard?.id}
            editingRequest={editingDonation}
            onSuccess={() => {
              refreshDonations();
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VOLUNTEER FORCE */}
      {/* ========================================================= */}
      {activeTab === "volunteers" && (
        <div className="space-y-6">
          {/* Volunteer Registration / Profile Area */}
          {myVolunteerProfile && !isEditingVolunteer ? (
            /* Registered: Display User's Profile Card */
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                My Volunteer Force Profile
              </span>
              <MyVolunteerProfile
                volunteer={myVolunteerProfile}
                onEdit={() => setIsEditingVolunteer(true)}
                onStatusChange={() => refreshVolunteers()}
                onLeave={() => {
                  refreshVolunteers();
                  setIsEditingVolunteer(false);
                }}
              />
            </div>
          ) : (
            /* Not Registered OR Editing Profile: Multi-step Wizard */
            <VolunteerWizard
              authUser={authUser}
              activeWardId={activeWard?.id}
              initialData={isEditingVolunteer ? myVolunteerProfile : null}
              onComplete={(volunteer) => {
                refreshVolunteers();
                setIsEditingVolunteer(false);
              }}
              onCancel={
                isEditingVolunteer
                  ? () => setIsEditingVolunteer(false)
                  : undefined
              }
            />
          )}

          {/* Citizens Volunteer Directory */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <CitizenDirectory
              volunteers={volunteersList}
              currentUserName={authUser?.name}
              currentUserPhone={authUser?.phone}
              activeWardId={activeWard?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteersClient;
