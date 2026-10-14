export type DonationType =
  | "Charity Need"
  | "Emergency Relief"
  | "Blood Requirement"
  | "Medical Help"
  | "Education Support"
  | "Food & Clothing"
  | "Other";

export type DonationUrgency = "Normal" | "Urgent" | "Critical";

export type BeneficiaryType =
  | "Individual"
  | "Family"
  | "Community or Institution";

export type DonationStatus =
  | "pending"
  | "approved"
  | "fulfilled"
  | "closed"
  | "rejected";

export interface DonationItem {
  id?: string;
  name: string;
  qty: number | string;
  unit: string;
}

export interface DonationTarget {
  amount?: number | string;
  upi?: string;
}

export interface DonationContact {
  name: string;
  phone: string;
  whatsapp: string;
}

export interface DonationOrganisation {
  name?: string;
  regNo?: string;
}

export interface DonationReport {
  reason: string;
  reportedAt: string;
  reportedBy?: string;
}

export interface DonationRequest {
  id: string; // e.g. "AVC-DON-0001"
  createdBy: string;
  createdByName?: string;
  type: DonationType;
  urgency: DonationUrgency;
  title: string;
  description?: string; // Optional
  ward: number;
  address: string;
  lat?: number;
  lng?: number;
  beneficiary: BeneficiaryType;
  items?: DonationItem[]; // Optional
  target: DonationTarget | null;
  requiredBy: string; // ISO date YYYY-MM-DD
  contact: DonationContact;
  images: string[]; // URLs or base64 data
  organisation: DonationOrganisation | null;
  supportingProof?: string | null;
  status: DonationStatus;
  reports: DonationReport[];
  createdAt: string;
  updatedAt: string;
}

export type DonationFormData = Omit<
  DonationRequest,
  "id" | "createdAt" | "updatedAt" | "status" | "reports"
> & {
  id?: string;
  status?: DonationStatus;
  confirmedGenuine: boolean;
  agreedGuidelines: boolean;
};
