// src/app/api/transport/mtc/stops/route.ts
import { NextResponse } from "next/server";
import { getAvadiBusStops } from "@/services/transport/osmTransit";

export async function GET() {
  try {
    const stops = await getAvadiBusStops();

    return NextResponse.json({
      count: stops.length,
      stops,
    });
  } catch (error: any) {
    console.error("OSM Transit Fetch Error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch live Avadi bus stops" },
      { status: 500 },
    );
  }
}
