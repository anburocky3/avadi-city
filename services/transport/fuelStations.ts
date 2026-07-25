// src/services/transport/fuelStations.ts

export interface FuelStation {
  id: string;
  name: string;
  brand:
    | "IndianOil"
    | "Bharat Petroleum"
    | "HPCL"
    | "Nayara Energy"
    | "Shell"
    | "Jio-bp"
    | "AG&P Pratham"
    | "EV Station"
    | "Independent";
  lat: number;
  lon: number;
  open24x7: boolean;
  hasCNG: boolean;
  hasEV: boolean;
  hasLPG: boolean;
  fuelTypes: string[];
  address: string;
  distanceKm?: number;
}

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const VERIFIED_AVADI_STATIONS: Omit<FuelStation, "distanceKm">[] = [
  {
    id: "avd-fuel-1",
    name: "IndianOil COCO Avadi (CTH Road)",
    brand: "IndianOil",
    lat: 13.1172,
    lon: 80.0991,
    open24x7: true,
    hasCNG: true,
    hasEV: true,
    hasLPG: true,
    fuelTypes: ["Petrol", "Diesel", "CNG", "EV Charging"],
    address: "CTH Road, Near Avadi Bus Depot",
  },
  {
    id: "avd-fuel-2",
    name: "HPCL B G Agencies Auto Care",
    brand: "HPCL",
    lat: 13.1205,
    lon: 80.1042,
    open24x7: true,
    hasCNG: false,
    hasEV: false,
    hasLPG: false,
    fuelTypes: ["Petrol", "Diesel"],
    address: "CTH Road, Avadi Checkpost",
  },
  {
    id: "avd-fuel-3",
    name: "Nayara Energy Fuel Station",
    brand: "Nayara Energy",
    lat: 13.1155,
    lon: 80.088,
    open24x7: true,
    hasCNG: false,
    hasEV: false,
    hasLPG: false,
    fuelTypes: ["Petrol", "Diesel"],
    address: "Poonamallee-Avadi High Road, Govardhanagiri",
  },
  {
    id: "avd-fuel-4",
    name: "AG&P Pratham CNG Station",
    brand: "AG&P Pratham",
    lat: 13.1118,
    lon: 80.0925,
    open24x7: true,
    hasCNG: true,
    hasEV: false,
    hasLPG: false,
    fuelTypes: ["CNG"],
    address: "Avadi-Poonamallee High Road, Sekkadu",
  },
  {
    id: "avd-fuel-5",
    name: "Bharat Petroleum (BPCL) Outlet",
    brand: "Bharat Petroleum",
    lat: 13.1245,
    lon: 80.111,
    open24x7: false,
    hasCNG: false,
    hasEV: false,
    hasLPG: true,
    fuelTypes: ["Petrol", "Diesel", "Auto LPG"],
    address: "CTH Road, Thirumullaivoyal",
  },
  {
    id: "avd-fuel-6",
    name: "Tata Power / Zeon EV Charging Hub",
    brand: "EV Station",
    lat: 13.1189,
    lon: 80.098,
    open24x7: true,
    hasCNG: false,
    hasEV: true,
    hasLPG: false,
    fuelTypes: ["EV Fast Charging"],
    address: "Near Avadi Railway Station Road",
  },
  {
    id: "avd-fuel-7",
    name: "Shell Fuel Station & EV Hub",
    brand: "Shell",
    lat: 13.1142,
    lon: 80.135,
    open24x7: true,
    hasCNG: true,
    hasEV: true,
    hasLPG: false,
    fuelTypes: ["V-Power Petrol", "Diesel", "CNG", "EV Charging"],
    address: "Ambattur OT - Avadi Road",
  },
  {
    id: "avd-fuel-8",
    name: "HPCL Pattabiram Fuel Care",
    brand: "HPCL",
    lat: 13.126,
    lon: 80.0635,
    open24x7: false,
    hasCNG: false,
    hasEV: false,
    hasLPG: false,
    fuelTypes: ["Petrol", "Diesel"],
    address: "CTH Road, Pattabiram",
  },
];

export async function getAvadiFuelStations(): Promise<FuelStation[]> {
  const overpassQuery = `
    [out:json][timeout:30];
    (
      node["amenity"="fuel"](13.0200,80.0000,13.2000,80.2000);
      way["amenity"="fuel"](13.0200,80.0000,13.2000,80.2000);
      node["amenity"="charging_station"](13.0200,80.0000,13.2000,80.2000);
      way["amenity"="charging_station"](13.0200,80.0000,13.2000,80.2000);
    );
    out center;
  `;

  try {
    for (const url of OVERPASS_SERVERS) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "*/*, application/json",
            "User-Agent": "AvadiSuperApp/2.0",
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          // Cache fetch results on the server for 3 days (259,200 seconds)
          next: { revalidate: 259200 },
        });

        if (!response.ok) continue;

        const data = await response.json();
        const stationMap = new Map<string, FuelStation>();

        for (const elem of data.elements || []) {
          const tags = elem.tags || {};
          const rawName =
            tags.name || tags["name:en"] || tags.brand || tags.operator || "";
          const lat = elem.lat || elem.center?.lat;
          const lon = elem.lon || elem.center?.lon;

          if (!rawName || !lat || !lon) continue;

          const upperName = rawName.toUpperCase();
          const upperBrand = (tags.brand || tags.operator || "").toUpperCase();

          // Brand Resolution with strict matching for abbreviations
          let brand: FuelStation["brand"] = "Independent";
          if (
            upperName.includes("INDIAN") ||
            upperName.includes("IOCL") ||
            upperName.includes("IOC ") ||
            upperBrand.includes("INDIAN")
          ) {
            brand = "IndianOil";
          } else if (
            upperName.includes("BHARAT") ||
            upperName.includes("BPCL") ||
            upperBrand.includes("BHARAT")
          ) {
            brand = "Bharat Petroleum";
          } else if (
            upperName.includes("HPCL") ||
            upperName.includes("HINDUSTAN") ||
            // Matches standalone "HP " or end of string " HP"
            /\bHP\b/.test(upperName) ||
            /\bHP\b/.test(upperBrand)
          ) {
            brand = "HPCL";
          } else if (
            upperName.includes("NAYARA") ||
            upperName.includes("ESSAR") ||
            upperBrand.includes("NAYARA")
          ) {
            brand = "Nayara Energy";
          } else if (
            upperName.includes("SHELL") ||
            upperBrand.includes("SHELL")
          ) {
            brand = "Shell";
          } else if (
            upperName.includes("JIO") ||
            upperName.includes("RELIANCE") ||
            upperBrand.includes("JIO")
          ) {
            brand = "Jio-bp";
          } else if (
            upperName.includes("AG&P") ||
            upperName.includes("PRATHAM") ||
            upperName.includes("TORRENT")
          ) {
            brand = "AG&P Pratham";
          } else if (
            tags.amenity === "charging_station" ||
            upperName.includes("EV ") ||
            upperName.includes("CHARG")
          ) {
            brand = "EV Station";
          }

          const open24x7 =
            tags.opening_hours === "24/7" ||
            tags["24_7"] === "yes" ||
            brand === "IndianOil" ||
            brand === "Shell" ||
            brand === "Jio-bp" ||
            brand === "Nayara Energy" ||
            upperName.includes("COCO") ||
            upperName.includes("24/7") ||
            upperName.includes("24 HOURS");

          const hasCNG =
            tags["fuel:cng"] === "yes" ||
            upperName.includes("CNG") ||
            brand === "AG&P Pratham" ||
            brand === "Jio-bp";

          const hasEV =
            tags.amenity === "charging_station" ||
            tags["fuel:electricity"] === "yes" ||
            upperName.includes("EV") ||
            upperName.includes("CHARG") ||
            brand === "EV Station";

          const hasLPG =
            tags["fuel:lpg"] === "yes" ||
            upperName.includes("LPG") ||
            upperName.includes("AUTOGAS");

          const fuelTypes: string[] = [];
          if (tags.amenity !== "charging_station") {
            fuelTypes.push("Petrol", "Diesel");
          }
          if (hasCNG) fuelTypes.push("CNG");
          if (hasLPG) fuelTypes.push("Auto LPG");
          if (hasEV) fuelTypes.push("EV Charging");

          const dedupKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

          if (!stationMap.has(dedupKey)) {
            stationMap.set(dedupKey, {
              id: `osm-fuel-${elem.id}`,
              name: rawName.replace(/"/g, "").trim(),
              brand,
              lat,
              lon,
              open24x7,
              hasCNG,
              hasEV,
              hasLPG,
              fuelTypes: Array.from(new Set(fuelTypes)),
              address:
                tags["addr:street"] || tags["addr:suburb"] || "Avadi Region",
            });
          }
        }

        const scraped = Array.from(stationMap.values());
        const mergedMap = new Map<string, FuelStation>();
        [...VERIFIED_AVADI_STATIONS, ...scraped].forEach((s) => {
          const key = s.name.toLowerCase();
          if (!mergedMap.has(key)) mergedMap.set(key, s as FuelStation);
        });

        return Array.from(mergedMap.values());
      } catch (e) {
        continue;
      }
    }
  } catch (err) {
    console.warn("Fallback to verified Avadi stations.");
  }

  return VERIFIED_AVADI_STATIONS as FuelStation[];
}
