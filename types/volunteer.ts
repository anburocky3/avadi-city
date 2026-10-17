export type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced";
export type VehicleType = "None" | "Two-wheeler" | "Four-wheeler";
export type AvailabilityType =
  | "Weekends only"
  | "Weekdays"
  | "Anytime"
  | "Emergency-only";
export type TravelRadius =
  | "My ward only"
  | "Nearby wards"
  | "Anywhere in Avadi";
export type VolunteerStatus =
  | "active"
  | "paused"
  | "left"
  | "pending"
  | "approved";

export interface VolunteerContact {
  mobile: string;
  whatsapp: string;
  area: string;
  showPhonePublic: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface VolunteerAvailability {
  days: string[]; // e.g. ["Mon", "Sat", "Sun"]
  slots: string[]; // ["Morning", "Afternoon", "Evening", "Night"]
  type: AvailabilityType;
  radius: TravelRadius;
}

export interface VolunteerHealth {
  bloodGroup: string;
  willDonateBlood: boolean;
  lastDonation?: string;
  fitness: "Yes" | "Limited";
  conditions?: string;
}

export interface VolunteerGuardian {
  name: string;
  consent: boolean;
}

export interface VolunteerConsents {
  conduct: boolean;
  directory: boolean;
  truthful: boolean;
}

export interface Volunteer {
  id: string; // format: "AVC-VOL-0001"
  userId: string;
  fullName: string;
  ward: number;
  gender: string;
  age: number;
  dob?: string;
  contact: VolunteerContact;
  emergencyContact: EmergencyContact;
  languages: string[];
  interests: string[];
  skills: string[];
  otherSkill?: string;
  experience: ExperienceLevel;
  bio?: string;
  vehicle: VehicleType;
  availability: VolunteerAvailability;
  health: VolunteerHealth;
  guardian: VolunteerGuardian | null;
  consents: VolunteerConsents;
  status: VolunteerStatus;
  createdAt: string;
  updatedAt: string;
}

export type VolunteerFormData = Omit<
  Volunteer,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  id?: string;
  status?: VolunteerStatus;
};
