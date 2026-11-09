import {
  Compass,
  GraduationCap,
  Landmark,
  Map,
  MapPin,
  Navigation,
  Star,
  Trees,
} from "lucide-react";
import { PlaceCategory } from "../types";

export const ACCESSIBILITY_FACILITIES = new Set([
  "Wheelchair Access",
  "Accessible Restrooms",
  "Accessible Parking",
]);

export const RATING_INTERPRETATIONS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const placeCategories: PlaceCategory[] = [
  { id: "All", name: "All Spots", icon: Compass },
  { id: "Parks & Gardens", name: "Parks & Gardens", icon: Trees },
  { id: "Historical Places", name: "Historical Places", icon: Landmark },
  { id: "Lakes & Nature", name: "Lakes & Nature", icon: MapPin },
  { id: "Cultural & Heritage Places", name: "Heritage", icon: Landmark },
  { id: "Sports & Recreation", name: "Sports", icon: Navigation },
  { id: "Tourist Attractions", name: "Attractions", icon: Star },
  { id: "Public Landmarks", name: "Landmarks", icon: Map },
  { id: "Schools & Colleges", name: "Colleges", icon: GraduationCap },
  { id: "Famous Spots", name: "Famous Spots", icon: Landmark },
  { id: "Temples/Places of Worship", name: "Worship", icon: MapPin },
  { id: "Government Offices", name: "Govt Offices", icon: Map },
];
