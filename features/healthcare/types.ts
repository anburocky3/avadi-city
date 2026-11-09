export interface HealthcareFacility {
  id: string | number;
  name: string;
  category: "Hospitals" | "Pharmacies" | "Clinics" | "Diagnostics" | string;
  facilityType?: string;
  specialty: string;
  description: string;
  address: string;
  imageUrl: string;
  phone: string;
  alternatePhone?: string;
  rating: number;
  ward: number;
  timings: string;
  is24x7?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasEmergencyUnit?: boolean;
  ambulancePhone?: string;
  services?: string[];
  hasPharmacy?: boolean;
  hasHomeDelivery?: boolean;
  appointments?: string;
  consultationFee?: number | null;
  status?: string;
  isVerified?: boolean;
}
