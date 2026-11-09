import { LucideIcon } from "lucide-react";

export interface PlaceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  isHighlighted?: boolean;
  color?: string;
}

export interface PlaceDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  areaLandmark?: string | null;
  ward: number;
  imageUrl?: string | null;
  additionalImages?: string[] | null;
  timings?: string;
  is24x7?: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  entryFeeType?: string | null;
  entryFeeAmount?: number | null;
  activities?: string[] | null;
  visitorTypes?: string[] | null;
  facilities?: string[] | null;
  bestTimeToVisit?: string | null;
  guidelines?: string | null;
  phone?: string | null;
  website?: string | null;
  officialUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Place {
  id: number | string;
  name: string;
  category: string;
  description: string;
  address: string;
  imageUrl: string;
  timings: string;
  ward?: number;
  rating?: number;
  is24x7?: boolean;
  phone?: string;
  activities?: string[];
  entryFeeType?: string;
  entryFeeAmount?: number;
  facilities?: string[];
  guidelines?: string;
  website?: string;
  officialUrl?: string;
  bestTimeToVisit?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlaceReviewStats {
  averageRating: number | null;
  reviewCount: number;
}

export const DEFAULT_REVIEW_STATS: Record<string, PlaceReviewStats> = {};

export interface PlaceReviewItem {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwn?: boolean;
}
