import { DonationCause } from "@/app/(auth)/volunteers/volunteers-client";
import { Volunteer } from "@/context/wardContext";

export const initialDonationsData: DonationCause[] = [
  {
    id: "donation-1",
    causeName: "Monsoon Flood Relief Pack Distribution",
    description:
      "Collecting dry rations, water bottles, and emergency blankets for displaced residents near Lake area.",
    neededItems: "Rice (5kg packs), Drinking Water, Mosquito Nets, Biscuits",
    contactPhone: "+91 98765 43210",
    ward: 14,
  },
  {
    id: "donation-2",
    causeName: "Government School Book & Stationery Drive",
    description:
      "Providing notebooks and geometry sets for primary school children in Kamaraj Nagar.",
    neededItems: "Long notebooks, School bags, Pen & Pencil sets",
    contactPhone: "+91 98400 12345",
    ward: 22,
  },
];

export const initialVolunteersData: Volunteer[] = [
  {
    id: "vol-1",
    name: "K. Karthik",
    age: 28,
    gender: "Male",
    ward: 14,
    bloodGroup: "O+",
    interests: ["Disaster Relief", "Clean-up Drives"],
  },
  {
    id: "vol-2",
    name: "S. Priya",
    age: 24,
    gender: "Female",
    ward: 20,
    bloodGroup: "B+",
    interests: ["Teaching Kids", "Animal Rescue"],
  },
  {
    id: "vol-3",
    name: "M. Ramesh",
    age: 32,
    gender: "Male",
    ward: 39,
    bloodGroup: "AB+",
    interests: ["Disaster Relief", "Animal Rescue"],
  },
];
