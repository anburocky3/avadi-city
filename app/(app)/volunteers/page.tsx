import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Volunteer in Avadi",
  description:
    "Join local community initiatives and volunteer opportunities across Avadi.",
};

export default function VolunteersPage() {
  redirect("/donations");
}
