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

export interface SupportTicketItem {
  id: string;
  userId: string | null;
  featureCategory: string;
  subCategory: string;
  description: string;
  screenshotUrl: string | null;
  status: "REVIEWING" | "RESOLVED";
  rawStatus?: string;
  wardId: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Server Action: Fetch Support Ticket History for Current User
 */
export async function getUserSupportTickets(
  cachedTicketIds: string[] = []
): Promise<{
  success: boolean;
  tickets: SupportTicketItem[];
  error?: string;
}> {
  try {
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("avadi_session")?.value;
      if (token) {
        const session = await verifyAuthToken(token);
        if (session?.userId) {
          userId = session.userId;
        }
      }
    } catch {
      // Cookies unavailable
    }

    // Build query conditions
    const orConditions: Array<Record<string, unknown>> = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (Array.isArray(cachedTicketIds) && cachedTicketIds.length > 0) {
      orConditions.push({ id: { in: cachedTicketIds } });
    }

    if (orConditions.length === 0) {
      return { success: true, tickets: [] };
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: orConditions,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted: SupportTicketItem[] = tickets.map((t) => {
      const raw = String(t.status || "").toUpperCase();
      const isCleared =
        raw === "CLEARED" ||
        raw === "RESOLVED" ||
        raw === "CLEAR" ||
        raw === "CLOSED";

      return {
        id: t.id,
        userId: t.userId,
        featureCategory: t.featureCategory,
        subCategory: t.subCategory,
        description: t.description,
        screenshotUrl: t.screenshotUrl,
        status: isCleared ? "RESOLVED" : "REVIEWING",
        rawStatus: raw,
        wardId: t.wardId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    return {
      success: true,
      tickets: formatted,
    };
  } catch (error: unknown) {
    console.error("Fetch Support Tickets Error:", error);
    return {
      success: false,
      tickets: [],
      error: error instanceof Error ? error.message : "Failed to load support history.",
    };
  }
}

/**
 * Server Action: Update Ticket Status (e.g. Cleared/Resolved or Re-opened)
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  newStatus: "OPEN" | "REVIEWING" | "RESOLVED"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("avadi_session")?.value;
      if (token) {
        const session = await verifyAuthToken(token);
        if (session?.userId) {
          userId = session.userId;
        }
      }
    } catch {
      // Cookies unavailable
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, error: "Support ticket not found." };
    }

    // Allow user to update their own ticket, or if ticket has no user id assigned
    if (userId && ticket.userId && ticket.userId !== userId) {
      return { success: false, error: "Unauthorized to update this ticket." };
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });

    const statusLabel =
      newStatus === "RESOLVED"
        ? "Cleared / Resolved"
        : newStatus === "REVIEWING"
        ? "In Technical Review"
        : "Re-opened";

    return {
      success: true,
      message: `Feedback ticket status updated to: ${statusLabel}`,
    };
  } catch (error: unknown) {
    console.error("Update Ticket Status Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update ticket status.",
    };
  }
}

/**
 * Server Action: Delete / Withdraw Support Ticket
 */
export async function deleteSupportTicket(
  ticketId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("avadi_session")?.value;
      if (token) {
        const session = await verifyAuthToken(token);
        if (session?.userId) {
          userId = session.userId;
        }
      }
    } catch {
      // Cookies unavailable
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, error: "Support ticket not found." };
    }

    if (userId && ticket.userId && ticket.userId !== userId) {
      return { success: false, error: "Unauthorized to delete this ticket." };
    }

    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return {
      success: true,
      message: "Ticket removed successfully.",
    };
  } catch (error: unknown) {
    console.error("Delete Ticket Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete ticket.",
    };
  }
}

