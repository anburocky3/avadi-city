"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWard } from "@/context/wardContext";

// Services & Seed data
import donationService from "@/services/donationService";

// Types
import { DonationRequest } from "@/types/donation";

// Components
import { DonationFeed } from "@/components/donation/DonationFeed";
import { CreateDonationModal } from "@/components/donation/CreateDonationModal";
import { getDbDonations } from "@/lib/donation-db";

// Re-export for page.tsx compatibility
export type DonationCause = DonationRequest;

export const DonationClient = () => {
  const router = useRouter();
  const t = useTranslations("volunteers");
  const { authUser, activeWard } = useWard();

  const [donationsList, setDonationsList] = useState<DonationRequest[]>(() => {
    return donationService.list();
  });

  // Donation Modal State
  const [isCreateDonationOpen, setIsCreateDonationOpen] =
    useState<boolean>(false);
  const [editingDonation, setEditingDonation] =
    useState<DonationRequest | null>(null);

  // Sync with MySQL database on mount
  useEffect(() => {
    donationService.syncWithDb().then((data) => {
      if (data && data.length > 0) setDonationsList(data);
    });
  }, []);

  const refreshDonations = async () => {
    setDonationsList(donationService.list());
    try {
      const data = await donationService.syncWithDb();
      if (data && data.length > 0) {
        setDonationsList(data);
      }
    } catch {}
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto md:max-w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            {t("title") || "Donations & Relief"}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
            {t("subtitle") ||
              "Contribute to local charitable needs or submit requests for community assistance in Avadi."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            router.push("/donations/request");
          }}
          className="px-4 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>+ Request Donation</span>
        </button>
      </div>

      {/* DONATION REQUESTS FEED */}
      <div className="space-y-6">
        <DonationFeed
          requests={donationsList}
          currentUserId={authUser?.id || "user-avadi-citizen"}
          authUser={authUser}
          onCreateNew={() => {
            router.push("/donations/request");
          }}
          onEdit={(req) => {
            router.push(
              `/donations/request?edit=${encodeURIComponent(req.id)}`,
            );
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
          onSuccess={(created) => {
            if (created) {
              setDonationsList((prev) => [
                created,
                ...prev.filter((r) => r.id !== created.id),
              ]);
            }
            refreshDonations();
          }}
        />
      </div>
    </div>
  );
};

export default DonationClient;
