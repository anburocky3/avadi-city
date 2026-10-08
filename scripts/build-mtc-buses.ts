import fs from "fs";
import readline from "readline";
import path from "path";

// --- TYPESCRIPT INTERFACES ---

export interface MtcBusRoute {
  id: number;
  routeNo: string;
  from: string;
  to: string;
  stops: string;
  avadiStopName: string;
  timings: string[]; // List of HH:MM departure times at Avadi
}

interface StopSequenceItem {
  seq: number;
  stopId: string;
  name: string;
  departureTime: string;
}

type GTFSRow = Record<string, string>;

// --- PATH CONFIGURATION ---

const RAW_DIR = path.join(__dirname, "../data/transport/mtc");
const OUTPUT_PATH = path.join(__dirname, "../data/mtc-buses.json");

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function loadTable(
  filename: string,
  keyCol: string | null = null,
): Promise<Map<string | number, GTFSRow>> {
  const filePath = path.join(RAW_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  const map = new Map<string | number, GTFSRow>();
  let isFirst = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    if (isFirst) {
      headers = cols.map((h) => h.replace(/^\uFEFF/, ""));
      isFirst = false;
    } else {
      const row: GTFSRow = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      if (keyCol && row[keyCol] !== undefined) {
        map.set(row[keyCol], row);
      } else {
        map.set(map.size, row);
      }
    }
  }
  return map;
}

async function main(): Promise<void> {
  console.log("🚀 Extracting Avadi-specific MTC buses with schedules...");

  // 1. Load stops and find all Avadi stops
  // 1. Load stops and find all Avadi municipal stops using strict word boundaries
  console.log("📖 Loading stops.txt...");
  const stops = await loadTable("stops.txt", "stop_id");
  const avadiStopIds = new Set<string>();

  // \b ensures "avadi" is a standalone word, completely ignoring "Kandanchavadi" or "Chavadi"
  const AVADI_EXACT_REGEX =
    /\b(avadi|pattabiram|thirumullaivoyal|hvf|paruthipattu|sekkadu|kovilpadagai|mittanamalli)\b/i;

  stops.forEach((stop, stopId) => {
    const stopName = stop.stop_name || "";

    // Test against word-boundary regex instead of .includes()
    if (AVADI_EXACT_REGEX.test(stopName)) {
      avadiStopIds.add(String(stopId));
    }
  });

  console.log(
    `📍 Found ${avadiStopIds.size} verified Avadi municipal bus stops (excluded Kandanchavadi/Chavadi false positives).`,
  );

  // 2. Load routes and trips
  console.log("📖 Loading routes.txt & trips.txt...");
  const routes = await loadTable("routes.txt", "route_id");
  const trips = await loadTable("trips.txt", "trip_id");

  // Map trip_id -> route_id
  const tripToRouteMap = new Map<string, string>();
  trips.forEach((trip, tripId) => {
    if (trip.route_id) {
      tripToRouteMap.set(String(tripId), trip.route_id);
    }
  });

  // 3. Stream stop_times.txt to collect trips passing through Avadi
  console.log("⚡ Streaming stop_times.txt...");
  const stopTimesPath = path.join(RAW_DIR, "stop_times.txt");
  const rl = readline.createInterface({
    input: fs.createReadStream(stopTimesPath),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirst = true;
  let tripIdIdx = -1,
    stopIdIdx = -1,
    seqIdx = -1,
    depTimeIdx = -1;

  // Storage structure: route_id -> { trips: Map<tripId, StopSequenceItem[]>, avadiTimings: Set<string>, avadiStopName: string }
  const routeData = new Map<
    string,
    {
      sampleTripId: string;
      avadiTimings: Set<string>;
      avadiStopName: string;
      tripStops: Map<string, StopSequenceItem[]>;
    }
  >();

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);

    if (isFirst) {
      headers = cols.map((h) => h.replace(/^\uFEFF/, ""));
      tripIdIdx = headers.indexOf("trip_id");
      stopIdIdx = headers.indexOf("stop_id");
      seqIdx = headers.indexOf("stop_sequence");
      depTimeIdx = headers.indexOf("departure_time");
      isFirst = false;
      continue;
    }

    const tripId = cols[tripIdIdx];
    const stopId = cols[stopIdIdx];
    const seq = parseInt(cols[seqIdx], 10) || 0;
    const depTime = cols[depTimeIdx] ? cols[depTimeIdx].substring(0, 5) : ""; // Extract HH:MM

    const routeId = tripToRouteMap.get(tripId);
    if (!routeId) continue;

    // Is this stop an Avadi stop?
    const isAvadiStop = avadiStopIds.has(stopId);

    if (isAvadiStop) {
      if (!routeData.has(routeId)) {
        const stopObj = stops.get(stopId);
        routeData.set(routeId, {
          sampleTripId: tripId,
          avadiTimings: new Set(),
          avadiStopName: stopObj ? stopObj.stop_name : "Avadi Bus Stand",
          tripStops: new Map(),
        });
      }
      if (depTime) {
        routeData.get(routeId)!.avadiTimings.add(depTime);
      }
    }
  }

  // Second pass: Collect full stop sequences for representative trips of Avadi routes
  console.log("🛠️ Building route paths and schedule lists...");

  // Re-read stop_times to gather stop sequences for sampled trips
  const rl2 = readline.createInterface({
    input: fs.createReadStream(stopTimesPath),
    crlfDelay: Infinity,
  });

  const targetSampleTripIds = new Set<string>();
  routeData.forEach((data) => targetSampleTripIds.add(data.sampleTripId));

  isFirst = true;
  for await (const line of rl2) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (isFirst) {
      isFirst = false;
      continue;
    }

    const tripId = cols[tripIdIdx];
    if (targetSampleTripIds.has(tripId)) {
      const routeId = tripToRouteMap.get(tripId)!;
      const stopId = cols[stopIdIdx];
      const seq = parseInt(cols[seqIdx], 10) || 0;
      const stopObj = stops.get(stopId);

      const rEntry = routeData.get(routeId);
      if (rEntry) {
        if (!rEntry.tripStops.has(tripId)) {
          rEntry.tripStops.set(tripId, []);
        }
        rEntry.tripStops.get(tripId)!.push({
          seq,
          stopId,
          name: stopObj ? stopObj.stop_name : "Unknown",
          departureTime: cols[depTimeIdx],
        });
      }
    }
  }

  // Format final JSON array
  const mtcBuses: MtcBusRoute[] = [];
  let idCounter = 1;

  routeData.forEach((data, routeId) => {
    const route = routes.get(routeId);
    if (!route) return;

    const stopSequence = data.tripStops.get(data.sampleTripId) || [];
    stopSequence.sort((a, b) => a.seq - b.seq);
    const stopNames = stopSequence.map((s) => s.name);

    if (stopNames.length === 0) return;

    const routeNo = route.route_short_name || route.route_long_name || "MTC";
    const from = stopNames[0];
    const to = stopNames[stopNames.length - 1];

    // Pick sampled intermediate stops
    const intermediate = stopNames.filter(
      (_, idx) => idx !== 0 && idx !== stopNames.length - 1,
    );
    const step = Math.max(1, Math.floor(intermediate.length / 5));
    const sampleStops: string[] = [];
    for (let i = 0; i < intermediate.length; i += step) {
      if (sampleStops.length < 5) sampleStops.push(intermediate[i]);
    }
    const stopsString = [from, ...sampleStops, to].join(", ");

    // Sort timings chronologically
    const sortedTimings = Array.from(data.avadiTimings).sort((a, b) =>
      a.localeCompare(b),
    );

    mtcBuses.push({
      id: idCounter++,
      routeNo: routeNo.trim(),
      from: from.trim(),
      to: to.trim(),
      stops: stopsString,
      avadiStopName: data.avadiStopName,
      timings: sortedTimings,
    });
  });

  // Sort buses by route number
  mtcBuses.sort((a, b) =>
    a.routeNo.localeCompare(b.routeNo, undefined, { numeric: true }),
  );

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mtcBuses, null, 2), "utf-8");

  console.log(`\n✅ Done! Extracted ${mtcBuses.length} Avadi-route buses.`);
  console.log(`📁 Saved to: ${OUTPUT_PATH}`);
}

main().catch(console.error);
