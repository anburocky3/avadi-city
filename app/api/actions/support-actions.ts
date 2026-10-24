"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

// 1. Strict Zod Schema (internal to Server Action)
const supportTicketSchema = z.object({
  featureCategory: z.enum([
    "EXPLORE_PLACES",
    "FOOD_DINING",
    "HOSPITALS_PHARMACIES",
    "LOCAL_SERVICES",
    "RENT_PROPERTIES",
    "JOB_VACANCIES",
    "DONATIONS",
    "TRAVEL_TRANSPORT",
    "LOST_FOUND",
    "SOS",
    "COMPLAINTS",
    "FEED",
    "PROFILE",
    "COMMERCE",
    "TRANSIT",
    "OTHER",
  ]),
  subCategory: z
    .string()
    .min(2, "Please select or specify a sub-category"),
  description: z
    .string()
    .min(10, "Please provide at least 10 characters explaining your feedback or issue")
    .max(2500, "Description cannot exceed 2500 characters"),
  screenshotUrl: z.string().optional().nullable(),
  wardId: z.coerce.number().optional().nullable(),
});

type SupportTicketInput = z.infer<typeof supportTicketSchema>;

export interface SupportActionResult {
  success: boolean;
  message?: string;
  error?: string;
  ticketId?: string;
  errors?: Record<string, string[]>;
}

/**
 * Uploads a base64 or binary file to Cloudflare R2
 */
async function uploadScreenshotToR2(
  fileOrBase64: File | string | null,
  userId: string | null
): Promise<string | null> {
  if (!fileOrBase64) return null;

  try {
    // If it's already a full public URL, return as-is
    if (typeof fileOrBase64 === "string" && fileOrBase64.startsWith("http")) {
      return fileOrBase64;
    }

    // Handle base64 string
    if (typeof fileOrBase64 === "string" && fileOrBase64.startsWith("data:image/")) {
      const matches = fileOrBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const key = `support/ticket-${userId || "guest"}-${Date.now()}.webp`;

        const uploadPromise = r2Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("R2 upload timed out")), 4000)
        );
        await Promise.race([uploadPromise, timeoutPromise]);
        return `${PUBLIC_R2_DOMAIN}/${key}`;
      }
    }

    // Handle web standard File object
    if (typeof fileOrBase64 === "object" && "arrayBuffer" in fileOrBase64) {
      const file = fileOrBase64 as File;
      if (file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = file.name.split(".").pop() || "png";
        const key = `support/ticket-${userId || "guest"}-${Date.now()}.${ext}`;

        const uploadPromise = r2Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type || "image/png",
          })
        );
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("R2 upload timed out")), 4000)
        );
        await Promise.race([uploadPromise, timeoutPromise]);
        return `${PUBLIC_R2_DOMAIN}/${key}`;
      }
    }
  } catch (err) {
    console.warn("Screenshot upload skipped or timed out:", err);
  }

  return null;
}

/**
 * Server Action: Submit Support Ticket
 */
export async function submitSupportTicket(
  payload: FormData | SupportTicketInput
): Promise<SupportActionResult> {
  try {
    // 1. Resolve session user if authenticated
    let userId: string | null = null;
    let sessionWardId: number | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("avadi_session")?.value;
      if (token) {
        const session = await verifyAuthToken(token);
        if (session?.userId) {
          userId = session.userId;
          sessionWardId = session.wardNumber ?? null;
        }
      }
    } catch {
      // Cookies store unavailable
    }

    // 2. Extract payload fields
    let rawData: Record<string, unknown> = {};
    let screenshotFileOrBase64: File | string | null = null;

    if (payload instanceof FormData) {
      rawData = {
        featureCategory: payload.get("featureCategory"),
        subCategory: payload.get("subCategory"),
        description: payload.get("description"),
        wardId: payload.get("wardId") || sessionWardId,
      };

      const file = payload.get("screenshot");
      const screenshotUrlString = payload.get("screenshotUrl");

      if (file instanceof File && file.size > 0) {
        screenshotFileOrBase64 = file;
      } else if (typeof screenshotUrlString === "string" && screenshotUrlString) {
        screenshotFileOrBase64 = screenshotUrlString;
      }
    } else {
      rawData = {
        ...payload,
        wardId: payload.wardId ?? sessionWardId,
      };
      if (payload.screenshotUrl) {
        screenshotFileOrBase64 = payload.screenshotUrl;
      }
    }

    // 3. Strict Zod Validation
    const parsed = supportTicketSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Invalid form data.";
      return {
        success: false,
        error: firstErrorMessage,
        errors: fieldErrors,
      };
    }

    // 4. Handle optional Screenshot upload to Cloudflare R2
    let finalScreenshotUrl: string | null = null;
    if (screenshotFileOrBase64) {
      finalScreenshotUrl = await uploadScreenshotToR2(screenshotFileOrBase64, userId);
    }

    // 5. Database Insertion using Prisma
    const newTicket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        featureCategory: parsed.data.featureCategory,
        subCategory: parsed.data.subCategory,
        description: parsed.data.description,
        screenshotUrl: finalScreenshotUrl,
        wardId: parsed.data.wardId ?? sessionWardId ?? null,
        status: "OPEN",
      },
    });

    return {
      success: true,
      message: "Your feedback has been submitted to the Avadi City municipal technical team.",
      ticketId: newTicket.id,
    };
  } catch (error: unknown) {
    console.error("Support Action Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred while saving your feedback.";
    return {
      success: false,
      error: msg,
    };
  }
}
