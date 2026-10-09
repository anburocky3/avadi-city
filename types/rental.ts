export type TransactionType =
  | "Rent"
  | "Lease"
  | "PG / Hostel"
  | "Commercial"
  | "Sale"
  | "Daily";

export type PropertyCategory =
  | "Apartment"
  | "Independent House"
  | "Villa"
  | "Single Room"
  | "Flatmate"
  | "Men's PG"
  | "Women's PG"
  | "Student Hostel"
  | "Co-living"
  | "Shop"
  | "Office"
  | "Showroom"
  | "Warehouse"
  | "Restaurant"
  | "Commercial Building"
  | "Plot / Land";

export type FurnishingType =
  | "Fully Furnished"
  | "Semi Furnished"
  | "Unfurnished";

export type TenantPreference =
  | "Family or Bachelors"
  | "Family Only"
  | "Bachelors Only"
  | "Working Professionals"
  | "Students"
  | "Women Only"
  | "Men Only";

export type ListingStatus =
  | "Available"
  | "Booking in Progress"
  | "Rented"
  | "Sold"
  | "Temporarily Unavailable";

export interface UtilityPricing {
  electricity?: {
    applicable: boolean;
    billingMethod: "Per Unit" | "Fixed Monthly Charge" | "Included in Rent" | "No Separate Charges";
    ratePerUnit?: number;
    monthlyCharge?: number;
  };
  water?: {
    available: boolean;
    billingType?: "Free" | "Included in Rent" | "Paid";
    billingMethod?: "Per Month" | "Per Person Per Month" | "Per Unit";
    amount?: number;
  };
}

export interface PricingDetails {
  monthlyRent: number; // or sale price if transaction is Sale
  securityDeposit: number;
  maintenance?: number;
  maintenanceIncluded?: boolean;
  electricityWater?: string;
  utilities?: UtilityPricing;
  brokerage?: number;
  estimatedMoveInCost: number;
}

export interface PGDetails {
  sharingType: "Single Room" | "2 Sharing" | "3 Sharing" | "4+ Sharing";
  availableBeds: number;
  foodIncluded: boolean;
  mealsOffered: string[]; // e.g. ["Breakfast", "Dinner", "3 Meals"]
  gender: "Men" | "Women" | "Co-ed / Unisex";
  rules: {
    curfew?: string;
    visitorsAllowed: boolean;
    smokingAllowed: boolean;
    alcoholAllowed: boolean;
    selfCookingAllowed: boolean;
  };
}

export interface CommercialDetails {
  carpetAreaSqFt?: number;
  builtUpAreaSqFt?: number;
  frontageFeet?: number;
  floor?: string;
  powerLoad?: string; // e.g. "15 kW 3-Phase"
  roadWidthFeet?: number;
  suitableFor?: string[]; // e.g. ["Retail Shop", "Doctor Clinic", "IT Office", "Pharmacy"]
  loadingBay?: boolean;
  signageSpace?: boolean;
}

export interface LocalityIntel {
  distanceToStation?: string; // e.g. "700m to Avadi Railway Station"
  distanceToBusStand?: string; // e.g. "400m to Avadi Bus Terminus"
  distanceToMarket?: string;
  distanceToHospital?: string;
  nearbyLandmarks?: string[];
}

export interface OwnerDetails {
  name: string;
  type: "Owner" | "Verified Broker" | "Builder" | "Property Manager";
  phone: string;
  whatsapp?: string;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isPropertyVerified: boolean;
  memberSince?: string;
}

export interface RentalProperty {
  id: string;
  title: string;
  description: string;
  transactionType: TransactionType;
  category: PropertyCategory;
  propertyTypeTag?: string; // e.g. "2BHK Flat", "3 Sharing PG", "Corner Shop"
  bhk?: "1 RK" | "1 BHK" | "2 BHK" | "3 BHK" | "4+ BHK";
  bathrooms?: number;
  balconies?: number;
  floor?: string; // e.g. "2nd of 4 Floors"
  totalFloors?: number;
  builtUpArea?: number; // in sq ft
  carpetArea?: number;
  furnishing?: FurnishingType;
  facing?: "North" | "South" | "East" | "West" | "North-East" | "North-West" | "South-East" | "South-West";
  parking?: "Car & Bike" | "Bike Only" | "Covered Car" | "Open Parking" | "None";
  petPolicy?: "Pets Allowed" | "No Pets";
  preferredTenants?: TenantPreference;
  availability?: "Immediate" | "Within 15 Days" | "From Next Month";

  ward: number;
  streetName?: string;
  location: string;
  lat?: number;
  lng?: number;

  pricing: PricingDetails;
  pgDetails?: PGDetails;
  commercialDetails?: CommercialDetails;
  localityIntel?: LocalityIntel;

  amenities: string[];
  images: string[];
  imageUrl: string; // cover image

  owner: OwnerDetails;
  status: ListingStatus;
  createdAt: string;

  // Legacy compatibility fields
  type?: string;
  rent?: number;
  advance?: number;
  contact?: string;
  ownerName?: string;
  details?: string;
  features?: string[];
}
