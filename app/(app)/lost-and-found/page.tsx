import React from "react";
import LostFoundClient from "../../../features/lost-and-found/components/lost-found-client";

export const metadata = {
  title: "Lost & Found — Avadi City App",
  description:
    "Report lost items or help reunite found items with their owners in Avadi.",
};

export default function LostFoundPage() {
  return <LostFoundClient />;
}
