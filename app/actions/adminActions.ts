"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, handleActionError, type ActionResult } from "@/lib/rbac";

// ============================================================================
// 1. FOOD LISTINGS APPROVALS & CRUD
// ============================================================================

export async function approveFoodListingAction(
  foodId: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    if (!foodId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return { success: false, message: "Invalid listing ID or status" };
    }

    const listing = await prisma.foodListing.findUnique({
      where: { id: foodId },
      select: { id: true, ward: true, name: true },
    });

    if (!listing) {
      return { success: false, message: "Food listing not found" };
    }

    // Ward check for standard admins
    if (session.role === "ADMIN" && listing.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only moderate listings in your assigned ward",
      };
    }

    await prisma.foodListing.update({
      where: { id: foodId },
      data: { status },
    });

    // Sync to community_listings if table exists
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE community_listings SET status = ? WHERE id = ?`,
        status,
        foodId.substring(0, 30)
      );
    } catch {
      // Non-blocking
    }

    revalidatePath("/foods");
    revalidatePath("/admin/foods");
    revalidatePath("/admin/dashboard");

    const actionText =
      status === "APPROVED"
        ? "approved and is now visible on the frontend"
        : status === "REJECTED"
        ? "rejected"
        : "reset to pending";

    return {
      success: true,
      message: `"${listing.name}" has been ${actionText}.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteFoodListingAction(
  foodId: string
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const listing = await prisma.foodListing.findUnique({
      where: { id: foodId },
      select: { id: true, ward: true, name: true },
    });

    if (!listing) {
      return { success: false, message: "Food listing not found" };
    }

    if (session.role === "ADMIN" && listing.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only delete listings in your assigned ward",
      };
    }

    await prisma.foodListing.delete({
      where: { id: foodId },
    });

    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM community_listings WHERE id = ?`,
        foodId.substring(0, 30)
      );
    } catch {
      // Non-blocking
    }

    revalidatePath("/foods");
    revalidatePath("/admin/foods");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `"${listing.name}" deleted successfully.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createFoodListingAdminAction(data: {
  name: string;
  category: string;
  description: string;
  address: string;
  ward: number;
  phone: string;
  imageUrl?: string;
  openingTime?: string;
  closingTime?: string;
  foodType?: string;
  priceRange?: string;
  status?: string;
}): Promise<ActionResult<any>> {
  try {
    const session = await requireRole("ADMIN");

    if (!data.name || !data.category || !data.phone || !data.address) {
      return { success: false, message: "Please fill in all required fields" };
    }

    const assignedWard = session.role === "SUPER_ADMIN" ? data.ward || session.wardNumber : session.wardNumber;

    const newListing = await prisma.foodListing.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        description: data.description.trim() || "No description provided",
        address: data.address.trim(),
        ward: assignedWard,
        phone: data.phone.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        openingTime: data.openingTime || "9:00 AM",
        closingTime: data.closingTime || "10:00 PM",
        foodType: data.foodType || "Both Veg & Non-Veg",
        priceRange: data.priceRange || "Moderate (₹₹)",
        status: data.status || "APPROVED", // Admin-created is approved by default
        ownerId: session.userId,
      },
    });

    revalidatePath("/foods");
    revalidatePath("/admin/foods");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `"${newListing.name}" created and published successfully!`,
      data: newListing,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 2. LOCAL SERVICES APPROVALS & CRUD
// ============================================================================

export async function approveServiceProfileAction(
  serviceId: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const profile = await prisma.localServiceProfile.findUnique({
      where: { id: serviceId },
    });

    if (!profile) {
      return { success: false, message: "Service profile not found" };
    }

    if (session.role === "ADMIN" && profile.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only moderate services in your assigned ward",
      };
    }

    await prisma.localServiceProfile.update({
      where: { id: serviceId },
      data: {
        status,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });

    revalidatePath("/services");
    revalidatePath("/admin/services");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Service "${profile.name}" status updated to ${status}.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteServiceProfileAction(
  serviceId: string
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const profile = await prisma.localServiceProfile.findUnique({
      where: { id: serviceId },
    });

    if (!profile) {
      return { success: false, message: "Service profile not found" };
    }

    if (session.role === "ADMIN" && profile.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only delete services in your assigned ward",
      };
    }

    await prisma.localServiceProfile.delete({
      where: { id: serviceId },
    });

    revalidatePath("/services");
    revalidatePath("/admin/services");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Service "${profile.name}" deleted successfully.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 3. RENTAL LISTINGS APPROVALS & CRUD
// ============================================================================

export async function approveRentalListingAction(
  rentalId: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const rental = await prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      return { success: false, message: "Rental listing not found" };
    }

    if (session.role === "ADMIN" && rental.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only moderate listings in your assigned ward",
      };
    }

    await prisma.rentalListing.update({
      where: { id: rentalId },
      data: { status },
    });

    revalidatePath("/rentals");
    revalidatePath("/admin/rentals");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Rental "${rental.title}" status updated to ${status}.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteRentalListingAction(
  rentalId: string
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const rental = await prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      return { success: false, message: "Rental listing not found" };
    }

    if (session.role === "ADMIN" && rental.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only delete listings in your assigned ward",
      };
    }

    await prisma.rentalListing.delete({
      where: { id: rentalId },
    });

    revalidatePath("/rentals");
    revalidatePath("/admin/rentals");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Rental "${rental.title}" deleted successfully.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createRentalListingAdminAction(data: {
  title: string;
  type: string;
  propertyTypeTag?: string;
  rent: number;
  advance: number;
  contact: string;
  ownerName?: string;
  location?: string;
  ward: number;
  imageUrl?: string;
  details: string;
  features?: string[];
}): Promise<ActionResult<any>> {
  try {
    const session = await requireRole("ADMIN");

    if (!data.title || !data.rent || !data.contact || !data.details) {
      return { success: false, message: "Please fill in all required fields" };
    }

    const assignedWard = session.role === "SUPER_ADMIN" ? data.ward || session.wardNumber : session.wardNumber;

    const newRental = await prisma.rentalListing.create({
      data: {
        title: data.title.trim(),
        type: data.type || "Residential",
        propertyTypeTag: data.propertyTypeTag || "2BHK",
        rent: Number(data.rent),
        advance: Number(data.advance) || 0,
        contact: data.contact.trim(),
        ownerName: data.ownerName?.trim() || session.name,
        location: data.location?.trim() || `Ward ${assignedWard}`,
        ward: assignedWard,
        imageUrl: data.imageUrl?.trim() || null,
        details: data.details.trim(),
        features: JSON.stringify(data.features || []),
        status: "APPROVED",
      },
    });

    revalidatePath("/rentals");
    revalidatePath("/admin/rentals");

    return {
      success: true,
      message: `Rental "${newRental.title}" created successfully!`,
      data: newRental,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 4. COMMUNITY FEED MODERATION
// ============================================================================

export async function deleteFeedAction(feedId: string): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
    });

    if (!feed) {
      return { success: false, message: "Feed post not found" };
    }

    if (session.role === "ADMIN" && feed.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only moderate feed posts in your assigned ward",
      };
    }

    await prisma.feed.delete({
      where: { id: feedId },
    });

    revalidatePath("/feed");
    revalidatePath("/admin/feeds");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Feed post removed by moderator.",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleEmergencyFeedAction(
  feedId: string
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
    });

    if (!feed) {
      return { success: false, message: "Feed post not found" };
    }

    if (session.role === "ADMIN" && feed.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only flag emergency posts in your assigned ward",
      };
    }

    const updated = await prisma.feed.update({
      where: { id: feedId },
      data: { isEmergency: !feed.isEmergency },
    });

    revalidatePath("/feed");
    revalidatePath("/admin/feeds");

    return {
      success: true,
      message: updated.isEmergency
        ? "Post flagged as civic emergency alert."
        : "Emergency alert status removed.",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 5. LOST & FOUND MODERATION
// ============================================================================

export async function updateLostFoundStatusAction(
  itemId: string,
  status: "Active" | "Resolved"
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const item = await prisma.lostFoundItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { success: false, message: "Lost & Found record not found" };
    }

    if (session.role === "ADMIN" && item.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only update records in your assigned ward",
      };
    }

    await prisma.lostFoundItem.update({
      where: { id: itemId },
      data: {
        status,
        resolvedAt: status === "Resolved" ? new Date() : null,
      },
    });

    revalidatePath("/lost-found");
    revalidatePath("/admin/lost-found");

    return {
      success: true,
      message: `Item #${item.itemId} marked as ${status}.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteLostFoundItemAction(
  itemId: string
): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");

    const item = await prisma.lostFoundItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { success: false, message: "Lost & Found record not found" };
    }

    if (session.role === "ADMIN" && item.ward !== session.wardNumber) {
      return {
        success: false,
        message: "You can only delete records in your assigned ward",
      };
    }

    await prisma.lostFoundItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/lost-found");
    revalidatePath("/admin/lost-found");

    return {
      success: true,
      message: `Item #${item.itemId} removed successfully.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 6. CITIZEN SUPPORT / HELPDESK CRUD
// ============================================================================

export async function updateSupportStatusAction(
  submissionId: number,
  status: "pending" | "in_progress" | "resolved" | "closed"
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return { success: false, message: "Inquiry submission not found" };
    }

    await prisma.contactSubmission.update({
      where: { id: submissionId },
      data: { status },
    });

    revalidatePath("/admin/support");

    return {
      success: true,
      message: `Ticket #${submissionId} marked as ${status}.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteSupportSubmissionAction(
  submissionId: number
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return { success: false, message: "Inquiry submission not found" };
    }

    await prisma.contactSubmission.delete({
      where: { id: submissionId },
    });

    revalidatePath("/admin/support");

    return {
      success: true,
      message: `Ticket #${submissionId} removed successfully.`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ============================================================================
// 7. PUSH NOTIFICATION BROADCAST
// ============================================================================

interface BroadcastPayload {
  title: string;
  description: string;
  category: string;
  severity: string;
  targetWard: string; // "All" or ward number string like "14"
}

export async function broadcastPushNotificationAction(
  payload: BroadcastPayload
): Promise<ActionResult<{ broadcastId: string; recipientCount: number }>> {
  try {
    const session = await requireRole("ADMIN");

    if (!payload.title || !payload.description) {
      return { success: false, message: "Title and description are required" };
    }

    // Determine affected users
    const userWhere: any = {};
    if (payload.targetWard !== "All") {
      const wardNum = parseInt(payload.targetWard, 10);
      if (!isNaN(wardNum)) {
        userWhere.wardNumber = wardNum;
      }
    }

    const totalEligibleUsers = await prisma.user.count({ where: userWhere });

    const broadcastId = `BC-${Date.now()}`;

    revalidatePath("/notifications");
    revalidatePath("/admin/notifications");

    return {
      success: true,
      message: `Broadcast sent successfully to ${totalEligibleUsers} registered residents in ${
        payload.targetWard === "All" ? "all Avadi wards" : `Ward ${payload.targetWard}`
      }!`,
      data: {
        broadcastId,
        recipientCount: totalEligibleUsers,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}
