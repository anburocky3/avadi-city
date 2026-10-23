"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWard } from "@/context/wardContext";
import { CreateDonationModal } from "@/components/donation/CreateDonationModal";
import donationService from "@/services/donationService";
import { DonationRequest } from "@/types/donation";

export const DonationRequestClient: React.FC = () => {
  const router = useRouter();
  const { authUser, activeWard } = useWard();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [editingRequest, setEditingRequest] = useState<DonationRequest | null>(
    null,
  );

  useEffect(() => {
    if (editId) {
      const found = donationService.getById(editId);
      if (found) {
        setEditingRequest(found);
      }
    }
  }, [editId]);

  if (!authUser || !activeWard) {
    return;
  }

  return (
    <CreateDonationModal
      isOpen={true}
      isStandalonePage={true}
      authUser={authUser}
      activeWardId={activeWard?.id}
      editingRequest={editingRequest}
      onClose={() => router.push("/donations")}
      onSuccess={() => {
        router.push("/donations");
      }}
    />
  );
};

export default DonationRequestClient;
