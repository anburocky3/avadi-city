import { ALL_AVADI_STREETS, StreetItem } from "@/lib/wards";

interface GeocodeAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  residential?: string;
  quarter?: string;
  city?: string;
  town?: string;
  state_district?: string;
}

// Known localities within Avadi Municipal Corporation limits
const AVADI_SCOPED_KEYWORDS = [
  "avadi",
  "pattabiram",
  "thirumullaivoyal",
  "hvf",
  "kovilpadagai",
  "mittanamalli",
  "paruthipattu",
  "sekkadu",
  "kamaraj nagar",
  "tnhb",
  "annur",
  "vellanur",
  "murugappa",
];

export function validateAndMatchAvadiLocation(
  address: GeocodeAddress,
  accuracyInMeters: number,
): {
  status: "EXACT_MATCH" | "PARTIAL_MATCH" | "OUT_OF_BOUNDS" | "LOW_ACCURACY";
  match: StreetItem | null;
  detectedName: string;
} {
  // 1. Check if GPS accuracy is too poor (e.g., > 1.5 km error radius usually means IP routing)
  if (accuracyInMeters > 1500) {
    return {
      status: "LOW_ACCURACY",
      match: null,
      detectedName: address.suburb || address.city || "Chennai Region",
    };
  }

  // Combine all location tags returned by OpenStreetMap
  const allAddressValues = Object.values(address)
    .filter(Boolean)
    .map((val) => String(val).toLowerCase());
  const fullAddressString = allAddressValues.join(" ");

  // 2. Check Municipal Scope: Does the address belong to Avadi boundaries?
  const isWithinAvadiScope = AVADI_SCOPED_KEYWORDS.some((keyword) =>
    fullAddressString.includes(keyword),
  );

  // Order of precision for street matching
  const searchTerms = [
    address.road,
    address.neighbourhood,
    address.residential,
    address.quarter,
    address.suburb,
  ].filter(Boolean) as string[];

  const detectedName =
    searchTerms[0] || address.town || address.suburb || "Detected Location";

  // If we are completely outside Avadi scope (like Anna Nagar or Adyar)
  if (!isWithinAvadiScope) {
    return {
      status: "OUT_OF_BOUNDS",
      match: null,
      detectedName: detectedName,
    };
  }

  // 3. Run Street & Ward Matching for valid Avadi locations
  for (const term of searchTerms) {
    const cleanTerm = term.toLowerCase().trim();
    if (!cleanTerm) continue;

    // Substring Match
    let found = ALL_AVADI_STREETS.find(
      (item) =>
        item.streetName.toLowerCase().includes(cleanTerm) ||
        cleanTerm.includes(item.streetName.toLowerCase()),
    );
    if (found) return { status: "EXACT_MATCH", match: found, detectedName };

    // Keyword Match (Stripping generic terms)
    const keywords = cleanTerm
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "road",
            "street",
            "nagar",
            "main",
            "layout",
            "avenue",
            "colony",
            "phase",
            "extension",
          ].includes(word),
      );

    for (const keyword of keywords) {
      found = ALL_AVADI_STREETS.find((item) =>
        item.streetName.toLowerCase().includes(keyword),
      );
      if (found) return { status: "EXACT_MATCH", match: found, detectedName };
    }
  }

  // Inside Avadi limits, but exact street wasn't found in JSON
  return {
    status: "PARTIAL_MATCH",
    match: null,
    detectedName: detectedName,
  };
}
