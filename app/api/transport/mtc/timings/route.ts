import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { MtcRouteTimingsResponse, MtcStageSchedule } from "@/types";

// Bypass Node.js SSL leaf signature verification for Indian government NIC servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeNo = searchParams.get("routeNo") || "62";

  try {
    // 1. Fetch from the official MTC getoriginbyroute AJAX endpoint
    // We pass empty selfrom and selto to retrieve the full route schedule
    const targetUrl = `https://mtcbus.tn.gov.in/Home/getoriginbyroute?selroute=${encodeURIComponent(
      routeNo,
    )}&selfrom=&selto=`;

    const mtcResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
      },
      next: { revalidate: 3600 }, // Cache on Next.js server for 1 hour
    });

    if (!mtcResponse.ok) {
      throw new Error(
        `MTC Server responded with status: ${mtcResponse.status}`,
      );
    }

    const rawData = await mtcResponse.text();

    // 2. Split the caret (^) delimited response
    const [selectHtml, timingsHtml] = rawData.split("^");

    // 3. Parse available origin stages from the <select> HTML
    const $select = cheerio.load(selectHtml || "");
    const availableOrigins: string[] = [];

    $select("option").each((_, elem) => {
      const val = $select(elem).attr("value")?.trim();
      if (val && val !== "") {
        availableOrigins.push(val);
      }
    });

    // 4. Parse stage headers (<h6>) and timing blocks (.stage) in document order
    const $timings = cheerio.load(timingsHtml || "");
    const scheduleMap = new Map<string, Set<string>>();
    let currentStage = "";

    // Traversing both selectors simultaneously preserves DOM order
    $timings("h6, .stage").each((_, elem) => {
      const tagName = elem.tagName.toLowerCase();

      if (tagName === "h6") {
        // We encountered a new stage header
        currentStage = $timings(elem).text().trim();
        if (currentStage && !scheduleMap.has(currentStage)) {
          scheduleMap.set(currentStage, new Set());
        }
      } else if (currentStage && $timings(elem).hasClass("stage")) {
        // We encountered a timing block belonging to the currentStage
        const rawText = $timings(elem).text().trim();
        // Extract 24-hr HH:MM pattern using Regex
        const timeMatch = rawText.match(/\b\d{2}:\d{2}\b/);

        if (timeMatch) {
          scheduleMap.get(currentStage)!.add(timeMatch[0]);
        }
      }
    });

    // 5. Format into clean array structure sorted by stage name
    const schedules: MtcStageSchedule[] = Array.from(scheduleMap.entries()).map(
      ([stage, timeSet]) => ({
        stage,
        timings: Array.from(timeSet).sort(),
      }),
    );

    const responsePayload: MtcRouteTimingsResponse = {
      routeNo,
      lastUpdated: new Date().toISOString(),
      availableOrigins,
      schedules,
    };

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`MTC Scrape Error for Route ${routeNo}:`, errorMessage);

    return NextResponse.json(
      {
        error: "Failed to fetch and parse official MTC schedule",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
