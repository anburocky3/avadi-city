"use client";

import React from "react";
import { Complaint, useWard } from "@/context/wardContext";
import { useParams } from "next/navigation";
import ComplaintList from "@/components/ui/complaints/ComplaintList";

export default function NearbyComplaintsPage() {
  const { complaints } = useWard();
  const params = useParams();

  // Extract "22" from "w22"
  const rawWardParam = Array.isArray(params.wardId)
    ? params.wardId[0]
    : params.wardId;
  const targetWardId = parseInt(rawWardParam?.replace(/\D/g, "") || "1", 10);

  // Filter for nearby complaints
  const nearbyComplaints = (complaints as Complaint[]).filter(
    (c) => parseInt(String(c.ward), 10) === targetWardId,
  );

  return (
    <ComplaintList
      data={nearbyComplaints}
      emptyMessage={`No complaints found in Ward ${targetWardId}. All systems look clean!`}
    />
  );
}
