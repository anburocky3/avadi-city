// src/services/osmTransit.ts
export interface OsmBusStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type: string;
}

// Backup public mirrors in case the primary German server is throttled
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export async function getAvadiBusStops(): Promise<OsmBusStop[]> {
  // Bounding Box covering Avadi Municipality, Tiruvallur borders, Ambattur & Poonamallee
  // Lat: 13.0200 to 13.2000 | Lon: 80.0000 to 80.2000
  const overpassQuery = `
    [out:json][timeout:30];
    (
      node["highway"="bus_stop"](13.0200,80.0000,13.2000,80.2000);
      node["public_transport"="platform"](13.0200,80.0000,13.2000,80.2000);
      node["public_transport"="stop_position"](13.0200,80.0000,13.2000,80.2000);
      node["amenity"="bus_station"](13.0200,80.0000,13.2000,80.2000);
      way["amenity"="bus_station"](13.0200,80.0000,13.2000,80.2000);
    );
    out center;
  `;

  let lastError: Error | null = null;

  for (const url of OVERPASS_SERVERS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*, application/json",
          "User-Agent": "AvadiCivicApp/2.0 (contact@avadi-resident.in)",
          Referer: "http://localhost:3000/",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        // ⚠️ CRITICAL: Bypasses Next.js cache so you get fresh OSM results immediately
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Server ${url} returned HTTP status ${response.status}`,
        );
      }

      const data = await response.json();
      const stopMap = new Map<string, OsmBusStop>();

      for (const element of data.elements || []) {
        // Capture English, Tamil, local, or official names mapped by contributors
        const rawName =
          element.tags?.name ||
          element.tags?.["name:en"] ||
          element.tags?.["name:ta"] ||
          element.tags?.official_name ||
          element.tags?.loc_name;

        // Safely extract coordinates from standalone nodes OR center calculated ways
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        const stopType =
          element.tags?.amenity === "bus_station" ? "Bus Station" : "Bus Stop";

        if (rawName && lat && lon) {
          const cleanName = rawName.replace(/"/g, "").trim();
          const dedupKey = cleanName.toLowerCase();

          // Prevent duplicate entries if a stop has both a 'stop_position' and 'platform' node
          if (!stopMap.has(dedupKey)) {
            stopMap.set(dedupKey, {
              id: element.id,
              name: cleanName,
              lat,
              lon,
              type: stopType,
            });
          }
        }
      }

      const results = Array.from(stopMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      console.log(
        `✅ Loaded ${results.length} verified Avadi regional bus stops from ${url}`,
      );
      return results;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown Overpass error";
      console.warn(`Overpass fetch failed on mirror ${url}:`, message);
      lastError = err instanceof Error ? err : new Error(message);
    }
  }

  throw new Error(
    `Failed to query all OpenStreetMap Overpass servers: ${lastError?.message}`,
  );
}
