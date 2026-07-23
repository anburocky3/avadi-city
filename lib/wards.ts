// src/lib/wards.ts
import wardData from "@/data/avadi-wards.json";

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
