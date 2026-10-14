import { seedDonationRequests, seedVolunteers } from "@/data/seed";
import { DonationRequest } from "@/types/donation";
import { Volunteer } from "@/types/volunteer";

export const initialDonationsData: DonationRequest[] = seedDonationRequests;
export const initialVolunteersData: Volunteer[] = seedVolunteers;
