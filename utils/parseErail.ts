import { SuburbanTrainSchedule } from "@/app/(auth)/transport/suburban-trains";

// Station codes that sit West of Avadi
const WESTBOUND_CODES = new Set([
  "TRL",
  "AJJ",
  "TRT",
  "PTMS",
  "PRES",
  "KBT",
  "TI",
  "PAB",
]);

// Clean display names for major suburban terminals
const TERMINAL_NAMES: Record<string, string> = {
  MASS: "Chennai Central (MMC)",
  MAS: "Chennai Central",
  MSB: "Chennai Beach",
  VLCY: "Velachery",
  TRL: "Tiruvallur (TRL)",
  AJJ: "Arakkonam (AJJ)",
  TRT: "Tiruttani (TRT)",
  PTMS: "Pattabiram Siding (PTMS)",
  PRES: "Pattabiram E Depot",
  KBT: "Kadambattur",
  TI: "Tiruninravur",
  PER: "Perambur",
  PON: "Ponneri",
  ENR: "Ennore",
};

export function parseErailDump(rawTextDump: string): SuburbanTrainSchedule[] {
  if (!rawTextDump || !rawTextDump.includes("^")) return [];

  // Split by caret (^) to get individual train records
  const rawRecords = rawTextDump.split("^");
  const parsedTrains: SuburbanTrainSchedule[] = [];

  for (const record of rawRecords) {
    if (!record.trim()) continue;

    // Split row by tilde (~)
    const fields = record.split("~");
    if (fields.length < 35) continue;

    const trainNo = fields[0]?.trim();
    const trainName = fields[1]?.trim() || "SUBURBAN LOCAL";
    const originName = fields[2]?.trim() || "Avadi";
    const destCode = fields[5]?.trim().toUpperCase() || "";
    const alightingCode = fields[9]?.trim().toUpperCase() || destCode;

    // Extract exact departure & arrival times
    const rawDepartureTime = fields[10]?.trim(); // e.g., "03.40"
    const rawArrivalTime = fields[11]?.trim(); // e.g., "04.35" -> NEW!
    const rawAvadiArrive = fields[31]?.trim(); // e.g., "03.39" -> NEW!
    const rawDuration = fields[12]?.trim(); // e.g., "00.55"

    if (!trainNo || !rawDepartureTime) continue;

    const cleanTime = rawDepartureTime.replace(".", ":").substring(0, 5);
    const cleanArrival = rawArrivalTime
      ? rawArrivalTime.replace(".", ":").substring(0, 5)
      : "";
    const cleanAvadiArrive = rawAvadiArrive
      ? rawAvadiArrive.replace(".", ":").substring(0, 5)
      : cleanTime;

    let cleanDuration = "45m";
    if (rawDuration && rawDuration.includes(".")) {
      const [hours, mins] = rawDuration.split(".");
      const h = parseInt(hours, 10);
      const m = parseInt(mins, 10);
      cleanDuration = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // Fix Platform Logic for Avadi Station:
    const isWestbound =
      WESTBOUND_CODES.has(destCode) || WESTBOUND_CODES.has(alightingCode);
    const isFast =
      trainName.includes("FAST") ||
      trainName.includes("EXP") ||
      trainName.includes("MAIL") ||
      trainName.includes("SF");

    // Avadi Station Physical Layout Rules:
    let assignedPlatform: number | string = 2;

    if (isFast) {
      // Mainline Fast / Superfast / Express trains
      assignedPlatform = 4;
    } else if (isWestbound) {
      // Down slow locals towards Tiruvallur / Arakkonam / Tiruttani
      assignedPlatform = 1;
    } else {
      // Up slow locals towards Chennai Central (MMC) / Beach / Velachery
      // We can assign Platform 2 to Central (MASS) and Platform 3 to Beach/Velachery (MSB/VLCY)
      assignedPlatform =
        destCode === "MSB" || destCode === "VLCY" || destCode === "PER" ? 3 : 2;
    }

    parsedTrains.push({
      id: `avd-${trainNo}-${cleanTime}`,
      trainNo,
      time: cleanTime,
      arrivalTime: cleanArrival,
      avadiArriveTime: cleanAvadiArrive,
      direction: isWestbound ? "west" : "east",
      origin: originName,
      destination: TERMINAL_NAMES[destCode] || destCode,
      platform: assignedPlatform, // Exactly matches your layout rule
      type: trainName.includes("AC") ? "AC" : isFast ? "Fast" : "Slow",
      duration: cleanDuration,
    });
  }

  // Return deduplicated array sorted chronologically by departure time
  return Array.from(new Map(parsedTrains.map((t) => [t.id, t])).values()).sort(
    (a, b) => a.time.localeCompare(b.time),
  );
}

export const calculateArrivalTime = (
  time24: string,
  durationStr: string,
): string => {
  if (!time24 || !time24.includes(":")) return "";

  // 1. Parse departure hours & minutes
  const [depH, depM] = time24.split(":").map(Number);
  const totalDepMins = depH * 60 + depM;

  // 2. Parse duration minutes from strings like "55m", "1h 10m", or "45m"
  let durationMins = 0;
  if (durationStr.includes("h")) {
    const parts = durationStr.split("h");
    const hours = parseInt(parts[0].trim(), 10) || 0;
    const mins = parseInt(parts[1]?.replace("m", "").trim() || "0", 10) || 0;
    durationMins = hours * 60 + mins;
  } else {
    durationMins = parseInt(durationStr.replace("m", "").trim(), 10) || 0;
  }

  // 3. Calculate total arrival minutes (handles next-day midnight wrap)
  const totalArrMins = (totalDepMins + durationMins) % (24 * 60);
  let arrH = Math.floor(totalArrMins / 60);
  const arrM = totalArrMins % 60;

  // 4. Format to 12-hour AM/PM string
  const ampm = arrH >= 12 ? "PM" : "AM";
  arrH = arrH % 12 || 12;

  return `${arrH}:${String(arrM).padStart(2, "0")} ${ampm}`;
};
