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

export interface DetectedLocation {
  streetName: string;
  address: string;
  wardNo: number;
  lat: number;
  lng: number;
  matchedReason?: string;
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

export const AVADI_AREA_WARD_MAPPINGS: { regex: RegExp; ward: number; name: string }[] = [
  // Specific areas and sub-localities first
  { regex: /j\.?b\.?\s*estate|shankarar\s*nagar|saraswathi\s*nagar/i, ward: 42, name: "JB Estate / Shankarar Nagar" },
  { regex: /mittanamallee|mittanamalli/i, ward: 3, name: "Mittanamallee" },
  { regex: /muthapudupet|muthapudhupet|karimedu/i, ward: 1, name: "Muthapudupet / Karimedu" },
  { regex: /defence\s*enclave|uzhaipalar\s*nagar/i, ward: 2, name: "Defence Enclave" },
  { regex: /crpf\s*nagar|c\.?r\.?p\.?f/i, ward: 4, name: "CRPF Nagar" },
  { regex: /brindhavan\s*nagar|eswari\s*avenue/i, ward: 5, name: "Brindhavan Nagar" },
  { regex: /ashok\s*nagar|balaji\s*nagar/i, ward: 6, name: "Ashok Nagar / Balaji Nagar" },
  { regex: /masilamanishwar|ettiamman\s*nagar|lalithambal/i, ward: 8, name: "Masilamanishwar Nagar" },
  { regex: /thendral\s*nagar/i, ward: 9, name: "Thendral Nagar" },
  { regex: /jak\s*nagar|pachaiamman\s*nagar/i, ward: 10, name: "JAK Nagar" },
  { regex: /poompozhil|poompuzhlil/i, ward: 11, name: "Poompozhil Nagar" },
  { regex: /kovilpadagai|koilpadagai/i, ward: 12, name: "Kovilpadagai" },
  { regex: /murugappa|hvf\s*road/i, ward: 13, name: "HVF Road / Murugappa" },
  { regex: /kakkanji\s*nagar|sastry\s*nagar/i, ward: 15, name: "Kakkanji Nagar / Sastry Nagar" },
  { regex: /chattiram|bharathiyar\s*nagar/i, ward: 16, name: "Chattiram / Bharathiyar Nagar" },
  { regex: /kamarajapuram|agd\s*nagar/i, ward: 17, name: "Kamarajapuram" },
  { regex: /charles\s*nagar|cholan\s*nagar/i, ward: 18, name: "Charles Nagar / Cholan Nagar" },
  { regex: /thandurai/i, ward: 19, name: "Thandurai" },
  { regex: /dhanalakshmi\s*nagar|senthamil\s*nagar/i, ward: 21, name: "Senthamil Nagar" },
  { regex: /sindhu\s*nagar|kavarapalayam/i, ward: 22, name: "Sindhu Nagar / Kavarapalayam" },
  { regex: /bakthavachalapuram/i, ward: 23, name: "Bakthavachalapuram" },
  { regex: /nagammai\s*nagar|jyothi\s*nagar/i, ward: 24, name: "Nagammai Nagar" },
  { regex: /devi\s*nagar|vaishnavi\s*nagar/i, ward: 25, name: "Devi Nagar / Vaishnavi Nagar" },
  { regex: /shanthipuram|nethaji\s*nagar/i, ward: 26, name: "Shanthipuram" },
  { regex: /cholambedu|cholabedu|k\.k\.\s*nagar/i, ward: 27, name: "Cholambedu / KK Nagar" },
  { regex: /manikandapuram|cholapuram/i, ward: 28, name: "Manikandapuram / Cholapuram" },
  { regex: /hanuman\s*nagar|vivekananda\s*nagar/i, ward: 29, name: "Hanuman Nagar" },
  { regex: /senthil\s*nagar|sri\s*nagar\s*colony/i, ward: 30, name: "Senthil Nagar" },
  { regex: /new\s*anna\s*nagar|annai\s*sathya/i, ward: 31, name: "New Anna Nagar" },
  { regex: /sri\s*sakthi\s*nagar|siva\s*sakthi/i, ward: 32, name: "Sri Sakthi Nagar" },
  { regex: /reddypalayam|annanoor|konambedu/i, ward: 33, name: "Reddypalayam / Annanoor" },
  { regex: /jeeva\s*nagar|aadhiparasakthi/i, ward: 34, name: "Jeeva Nagar" },
  { regex: /kannigapuram|nehru\s*bazar|gowripettai/i, ward: 35, name: "Kannigapuram / Nehru Bazar" },
  { regex: /nandavanamettur|modern\s*city/i, ward: 36, name: "Nandavanamettur" },
  { regex: /sekkadu/i, ward: 37, name: "Sekkadu" },
  { regex: /sri\s*devi\s*nagar/i, ward: 38, name: "Sri Devi Nagar" },
  { regex: /ramaliingapuram/i, ward: 39, name: "Ramalingapuram" },
  { regex: /tnhb/i, ward: 41, name: "TNHB Colony" },
  { regex: /vasantham\s*nagar|thillai\s*nagar/i, ward: 43, name: "Vasantham Nagar" },
  { regex: /kumran\s*nagar/i, ward: 44, name: "Kumran Nagar" },
  { regex: /ayyappan\s*nagar/i, ward: 45, name: "Ayyappan Nagar" },
  { regex: /ananda\s*nagar|pudu\s*nagar|lazar\s*nagar/i, ward: 46, name: "Ananda Nagar" },
  { regex: /paruthipattu|sapthagiri\s*nagar|lakshmipuram/i, ward: 47, name: "Paruthipattu" },
  { regex: /govarthanagiri|govardhanagiri|srinivasa\s*nagar|aravind\s*nagar/i, ward: 48, name: "Govarthanagiri" },
  // Broader regional landmarks
  { regex: /pattabiram/i, ward: 16, name: "Pattabiram" },
  { regex: /thirumullaivoyal|t\.?m\.?\s*voyal/i, ward: 7, name: "Thirumullaivoyal" },
  { regex: /kamaraj\s*nagar/i, ward: 44, name: "Kamaraj Nagar" },
  { regex: /gandhi\s*nagar/i, ward: 22, name: "Gandhi Nagar" },
  { regex: /anna\s*nagar/i, ward: 14, name: "Anna Nagar" },
];

/**
 * Intelligently detects the matching Avadi Ward based on road, suburb, and address details
 */
export function detectAvadiWard(
  road?: string,
  suburb?: string,
  displayName?: string,
  lat?: number,
  lng?: number,
): { wardNo: number; matchedReason: string } {
  const combined = `${road || ""} ${suburb || ""} ${displayName || ""}`.toLowerCase();

  // 1. Direct Street lookup in ALL_AVADI_STREETS if road has a specific name
  if (road && road.trim().length >= 4) {
    const cleanRoad = road
      .toLowerCase()
      .replace(/road|street|st|rd|salai|lane|nagar/gi, "")
      .trim();

    if (cleanRoad.length >= 3) {
      const match = ALL_AVADI_STREETS.find((s) => {
        const sClean = s.streetName
          .toLowerCase()
          .replace(/road|street|st|rd|salai|lane/gi, "")
          .trim();
        return (
          sClean.length >= 3 &&
          (sClean.includes(cleanRoad) || cleanRoad.includes(sClean))
        );
      });

      if (match) {
        return {
          wardNo: match.wardNo,
          matchedReason: `Street match: ${match.streetName}`,
        };
      }
    }
  }

  // 2. Area Keyword mappings
  for (const item of AVADI_AREA_WARD_MAPPINGS) {
    if (item.regex.test(combined)) {
      return {
        wardNo: item.ward,
        matchedReason: `Area detected: ${item.name}`,
      };
    }
  }

  // 3. Fallback based on Avadi central zone (Ward 14: Central Avadi / Anna Nagar)
  return {
    wardNo: 14,
    matchedReason: "Default Avadi Central (Ward 14)",
  };
}

/**
 * Reverse-geocodes coordinates into road, suburb, formatted address, and detected Avadi Ward
 */
export async function reverseGeocodeAvadi(
  lat: number,
  lng: number,
): Promise<DetectedLocation> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to contact geocoding service");
  }

  const data = await response.json();
  const addr = data.address || {};

  const road =
    addr.road ||
    addr.pedestrian ||
    addr.footway ||
    addr.street ||
    addr.residential ||
    addr.path ||
    "";
  const suburb =
    addr.suburb ||
    addr.neighbourhood ||
    addr.subdivision ||
    addr.city_district ||
    addr.quarter ||
    "";
  const city =
    addr.city || addr.town || addr.village || addr.municipality || "Avadi";
  const postcode = addr.postcode || "600054";
  const displayName = data.display_name || "";

  // Compute clean Street / Landmark
  let streetName = "";
  if (road && suburb) {
    streetName = road.toLowerCase().includes(suburb.toLowerCase())
      ? road
      : `${road}, ${suburb}`;
  } else if (road) {
    streetName = road;
  } else if (suburb) {
    streetName = suburb;
  } else if (displayName) {
    const parts = displayName.split(",");
    streetName = parts.slice(0, 2).join(",").trim();
  }

  // Compute clean formatted address
  const addressParts = [
    streetName,
    suburb && !streetName.includes(suburb) ? suburb : null,
    city,
    postcode,
  ].filter(Boolean);

  const address = addressParts.join(", ");

  // Detect matching Avadi Ward
  const { wardNo, matchedReason } = detectAvadiWard(
    road,
    suburb,
    displayName,
    lat,
    lng,
  );

  return {
    streetName,
    address,
    wardNo,
    lat,
    lng,
    matchedReason,
  };
}
