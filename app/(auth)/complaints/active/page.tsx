"use client";

import React from "react";
import { Complaint, useWard } from "@/context/wardContext";
import ComplaintList from "@/components/ui/complaints/ComplaintList";

export default function MyComplaintsPage() {
  const { userProfile, complaints } = useWard();

  // Filter for my complaints
  const myComplaints = (complaints as Complaint[]).filter(
    (c) => c.author === userProfile.name || c.isUserSubmitted === true,
  );

  return (
    <ComplaintList
      data={myComplaints}
      emptyMessage="You haven't filed any complaints yet. Report a local civic issue if you notice one."
    />
  );
}
