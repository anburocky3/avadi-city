// src/app/api/transport/fuel/route.ts
import { NextResponse } from "next/server";
import { getAvadiFuelStations } from "@/services/transport/fuelStations";

export async function GET() {
  try {
    const stations = await getAvadiFuelStations();
    return NextResponse.json(
      {
        lastUpdated: new Date().toISOString(),
        cacheTTL: "3 Days (259,200 seconds)",
        totalStations: stations.length,
        stations,
      },
      {
        status: 200,
        headers: {
          // Cache in CDN/Next.js for exactly 3 days, serve stale while updating in background
          "Cache-Control":
            "public, s-maxage=259200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load fuel stations", details: message },
      { status: 500 },
    );
  }
}
