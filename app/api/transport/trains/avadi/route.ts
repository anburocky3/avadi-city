import { NextResponse } from "next/server";
import { parseErailDump } from "@/utils/parseErail";
import { SuburbanTrainSchedule } from "@/app/(auth)/transport/suburban-trains";

// ⚠️ Bypass Node.js SSL leaf signature verification for external Indian railway servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// The 7 critical destination terminals from Avadi (AVD) covering East & West routes
const TARGET_DESTINATIONS = [
  "MASS",
  "MSB",
  "VLCY",
  "TRL",
  "AJJ",
  "TRT",
  "PRES",
];

// Reusable CORS headers for safe client-side consumption
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// In-Memory Fast-Path Cache (Survives across warm Node.js / serverless instances)
let memoryCache: {
  timestamp: number;
  payload: SuburbanTrainSchedule[];
} | null = null;
const MEMORY_CACHE_TTL_MS = 3600 * 1000; // 1 Hour in milliseconds

export async function GET() {
  try {
    const now = Date.now();

    // 1. Check In-Memory Fast-Path Cache first
    if (memoryCache && now - memoryCache.timestamp < MEMORY_CACHE_TTL_MS) {
      return NextResponse.json(
        {
          cache: "CACHED",
          cacheSource: "Server In-Memory Fast-Path",
          lastUpdated: new Date(memoryCache.timestamp).toISOString(),
          totalTrains: memoryCache.payload.length,
          trains: memoryCache.payload,
        },
        { status: 200, headers: corsHeaders },
      );
    }

    let isServedFromUpstreamCache = false;

    // 2. Fire all 7 directional queries concurrently using the official AJAX endpoint
    const fetchPromises = TARGET_DESTINATIONS.map(async (destCode) => {
      try {
        const targetUrl = `https://erail.in/rail/getTrains.aspx?Station_From=AVD&Station_To=${destCode}&DataSource=0&Language=0&Cache=true`;
        const refererUrl = `https://erail.in/trains/avadi-AVD/${destCode.toLowerCase()}-${destCode}`;

        const res = await fetch(targetUrl, {
          method: "GET",
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
            Referer: refererUrl,
            "X-Requested-With": "XMLHttpRequest",
            "sec-ch-ua":
              '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "Accept-Language": "en-US,en;q=0.9",
          },
          // Cache on Next.js Data Cache engine for 24 hours (86400 seconds)
          next: { revalidate: 86400 },
        });

        if (!res.ok) {
          console.warn(
            `[HTTP ${res.status}] Failed to fetch Avadi route to ${destCode}`,
          );
          return "";
        }

        // Check if Next.js Data Cache or Cloudflare/Upstream CDN served a cached hit
        const nextJsCache = res.headers.get("x-nextjs-cache");
        const ageHeader = parseInt(res.headers.get("age") || "0", 10);
        const cfCache = res.headers.get("cf-cache-status");

        if (nextJsCache === "HIT" || ageHeader > 0 || cfCache === "HIT") {
          isServedFromUpstreamCache = true;
        }

        return await res.text();
      } catch (err) {
        console.warn(
          `[Network Error] Failed to fetch Avadi route to ${destCode}:`,
          err,
        );
        return "";
      }
    });

    // 3. Await all concurrent network requests
    const rawResponses = await Promise.all(fetchPromises);

    // 4. Combine caret-delimited text dumps and pass into unified TypeScript parser
    const combinedTextDump = rawResponses.join("^");
    const allTrains = parseErailDump(combinedTextDump);

    // 5. Deduplicate by Train Number
    const uniqueTrainsMap = new Map<string, SuburbanTrainSchedule>();
    for (const train of allTrains) {
      if (!uniqueTrainsMap.has(train.trainNo)) {
        uniqueTrainsMap.set(train.trainNo, train);
      }
    }

    const sortedUniqueTrains = Array.from(uniqueTrainsMap.values()).sort(
      (a, b) => a.time.localeCompare(b.time),
    );

    // Store in our local memory cache wrapper
    memoryCache = {
      timestamp: now,
      payload: sortedUniqueTrains,
    };

    // 6. Return response with explicit cache status
    return NextResponse.json(
      {
        cache: isServedFromUpstreamCache ? "CACHED" : "LIVE",
        cacheSource: isServedFromUpstreamCache
          ? "Next.js Data Cache / CDN"
          : "Live Origin Scrape",
        lastUpdated: new Date(now).toISOString(),
        totalTrains: sortedUniqueTrains.length,
        trains: sortedUniqueTrains,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("Suburban Trains API Compilation Error:", message);

    return NextResponse.json(
      { error: "Failed to compile Avadi train schedule", details: message },
      { status: 500, headers: corsHeaders },
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
