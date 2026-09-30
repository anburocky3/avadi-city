// src/lib/wards.ts
import wardData from "@/data/avadi-wards.json";
import { WARD_MAP } from "@/data/wards";

export interface StreetItem {
  id: string;
  streetName: string;
  wardNo: number;
  wardCode: string;
}

export interface WardRecord {
  ward_no: number;
  ward_code: string;
  ward_id: string;
  streets: { value: string; text: string }[] | string[];
}

// Flatten all streets from all wards into a single searchable array
export const ALL_AVADI_STREETS: StreetItem[] = (() => {
  const streetsList: StreetItem[] = [];

  if (wardData && Array.isArray(wardData.wards)) {
    (wardData.wards as WardRecord[]).forEach((ward) => {
      if (Array.isArray(ward.streets)) {
        ward.streets.forEach((street, index) => {
          // Handle both string arrays and object arrays { value, text }
          const name = typeof street === "string" ? street : street.text;
          const cleanStreet = name?.trim();

          if (cleanStreet) {
            streetsList.push({
              id: `w${ward.ward_no}-s${index}-${cleanStreet.replace(/\s+/g, "-").toLowerCase()}`,
              streetName: cleanStreet,
              wardNo: ward.ward_no,
              wardCode: ward.ward_code,
            });
          }
        });
      }
    });
  }

  return streetsList;
})();

/**
 * Place names that are NOT within Avadi Corporation limits.
 * When Nominatim reverse-geocoding returns these, we suppress them
 * and fall back to Avadi-local area names.
 */
const NON_AVADI_LOCALITIES = [
  "poonamallee",
  "porur",
  "ambattur",
  "anna nagar",
  "koyambedu",
  "mogappair",
  "redhills",
  "tiruvallur",
  "tindivanam",
  "sriperumbudur",
  "perumbakkam",
];

/**
 * Given a Nominatim reverse-geocode address object, returns a clean
 * Avadi-local location string. Filters out non-Avadi suburb/district names.
 */
export function sanitiseReverseGeocodedAddress(
  addr: Record<string, string>,
  wardNo?: number
): string {
  const road = addr.road || addr.pedestrian || addr.footway || "";
  const suburb = addr.suburb || addr.neighbourhood || "";
  const district = addr.city_district || addr.county || "";

  // Check if suburb or district is a known non-Avadi place
  const isSuburbAvadi = !NON_AVADI_LOCALITIES.some((p) =>
    suburb.toLowerCase().includes(p)
  );
  const isDistrictAvadi = !NON_AVADI_LOCALITIES.some((p) =>
    district.toLowerCase().includes(p)
  );

  const parts: string[] = [];
  if (road) parts.push(road);
  if (suburb && isSuburbAvadi) parts.push(suburb);
  else if (district && isDistrictAvadi) parts.push(district);

  // If we couldn't build a meaningful Avadi name, fall back to ward area name
  if (parts.length === 0 && wardNo) {
    return WARD_MAP[wardNo]?.hints?.split(",")[0] ?? `Avadi Ward ${wardNo}`;
  }

  // Append ", Avadi" if not already present
  const joined = parts.join(", ");
  if (joined && !joined.toLowerCase().includes("avadi")) {
    return `${joined}, Avadi`;
  }
  return joined || "Avadi";
}
