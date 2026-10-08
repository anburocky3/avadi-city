"use server";

/**
 * Record management Server Actions with full RBAC enforcement.
 *
 * Each action follows the same pattern:
 *   1. Authenticate via requireAuth() / requireRole()
 *   2. Validate input with Zod
 *   3. Fetch the record from DB
 *   4. Assert ownership / role authorization
 *   5. Execute the mutation
 *   6. Return a typed ActionResult
 *
 * These actions are imported by client components and invoked via
 * React 19's `useActionState` or called directly from forms.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requireRole,
  canAccessRecord,
  assertCanModifyRecord,
  handleActionError,
  type ActionResult,
} from "@/lib/rbac";

// ---------------------------------------------------------------------------
// 1. DELETE RECORD — SUPER_ADMIN can delete any; ADMIN can delete within
//    their ward; USER can delete only their own.
// ---------------------------------------------------------------------------

export async function deleteRecordAction(
  complaintId: string,
): Promise<ActionResult> {
  try {
    // Step 1: Authenticate — throws 401 if no valid session
    const session = await requireAuth();

    // Step 2: Validate input
    if (!complaintId || typeof complaintId !== "string") {
      return { success: false, message: "Invalid complaint ID" };
    }

    // Step 3: Fetch the record (must include userId + ward for access check)
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: {
        id: true,
        userId: true,
        incidentWard: true,
        title: true,
      },
    });

    if (!complaint) {
      return { success: false, message: "Complaint not found" };
    }

    // Step 4: Authorize — checks SUPER_ADMIN bypass → ADMIN ward scope → ownership
    const hasAccess = canAccessRecord(session, {
      userId: complaint.userId,
      wardNumber: complaint.incidentWard,
    });

    if (!hasAccess) {
      return {
        success: false,
        message: "You do not have permission to delete this complaint",
      };
    }

    // Step 5: Execute the deletion
    await prisma.complaint.delete({
      where: { id: complaintId },
    });

    // Step 6: Revalidate affected paths
    revalidatePath("/complaints");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Complaint "${complaint.title}" deleted successfully`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ---------------------------------------------------------------------------
// 2. UPDATE RECORD STATUS — Only ADMIN+ can change complaint status.
//    Admins are ward-scoped; Super Admins are unrestricted.
// ---------------------------------------------------------------------------

type ComplaintStatus = "Submitted" | "Acknowledged" | "In Progress" | "Resolved";

const VALID_STATUSES: ComplaintStatus[] = [
  "Submitted",
  "Acknowledged",
  "In Progress",
  "Resolved",
];

export async function updateRecordStatusAction(
  complaintId: string,
  newStatus: ComplaintStatus,
): Promise<ActionResult> {
  try {
    // Step 1: Require at minimum ADMIN role — throws 403 for regular users
    const session = await requireRole("ADMIN");

    // Step 2: Validate inputs
    if (!complaintId || typeof complaintId !== "string") {
      return { success: false, message: "Invalid complaint ID" };
    }
    if (!VALID_STATUSES.includes(newStatus)) {
      return {
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      };
    }

    // Step 3: Fetch the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: {
        id: true,
        userId: true,
        incidentWard: true,
        status: true,
      },
    });

    if (!complaint) {
      return { success: false, message: "Complaint not found" };
    }

    // Step 4: Ward-scope check for admins (Super Admins bypass)
    if (session.role === "ADMIN" && complaint.incidentWard !== session.wardNumber) {
      return {
        success: false,
        message: "You can only update complaints within your assigned ward",
      };
    }

    // Step 5: Execute the update
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: newStatus },
    });

    // Step 6: Revalidate
    revalidatePath("/complaints");
    revalidatePath("/admin");
    revalidatePath(`/complaints/${complaintId}`);

    return {
      success: true,
      message: `Status updated to "${newStatus}"`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ---------------------------------------------------------------------------
// 3. LIST RECORDS — Scoped by role. SUPER_ADMIN sees all; ADMIN sees their
//    ward; USER sees only their own complaints.
// ---------------------------------------------------------------------------

interface ListRecordsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
}

export async function listRecordsAction(
  options: ListRecordsOptions = {},
): Promise<ActionResult<{ complaints: any[]; total: number }>> {
  try {
    const session = await requireAuth();
    const { page = 1, pageSize = 20, status } = options;
    const skip = (page - 1) * pageSize;

    // Build the where clause based on role
    const where: any = {};

    if (session.role === "USER") {
      // Users can only see their own complaints
      where.userId = session.userId;
    } else if (session.role === "ADMIN") {
      // Admins see all complaints within their ward
      where.incidentWard = session.wardNumber;
    }
    // SUPER_ADMIN: no where filter — sees everything

    // Optional status filter (applies regardless of role)
    if (status && VALID_STATUSES.includes(status as ComplaintStatus)) {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          issueId: true,
          title: true,
          category: true,
          status: true,
          incidentWard: true,
          author: true,
          userId: true,
          imageUrl: true,
          upvotes: true,
          createdAt: true,
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      success: true,
      message: "Records retrieved",
      data: { complaints, total },
    };
  } catch (error) {
    return handleActionError<{ complaints: any[]; total: number }>(error);
  }
}

// ---------------------------------------------------------------------------
// 4. DELETE USER — Only SUPER_ADMIN can delete user accounts.
// ---------------------------------------------------------------------------

export async function deleteUserAction(
  targetUserId: string,
): Promise<ActionResult> {
  try {
    // Step 1: Only Super Admins can delete users
    const session = await requireRole("SUPER_ADMIN");

    // Step 2: Validate
    if (!targetUserId || typeof targetUserId !== "string") {
      return { success: false, message: "Invalid user ID" };
    }

    // Step 3: Prevent self-deletion
    if (targetUserId === session.userId) {
      return { success: false, message: "You cannot delete your own account" };
    }

    // Step 4: Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    // Step 5: Delete
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/super-admin");
    revalidatePath("/admin");

    return {
      success: true,
      message: `User "${targetUser.name}" deleted successfully`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}

// ---------------------------------------------------------------------------
// 5. UPDATE USER ROLE — Only SUPER_ADMIN can promote/demote users.
// ---------------------------------------------------------------------------

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: "SUPER_ADMIN" | "ADMIN" | "USER",
): Promise<ActionResult> {
  try {
    const session = await requireRole("SUPER_ADMIN");

    if (!targetUserId || typeof targetUserId !== "string") {
      return { success: false, message: "Invalid user ID" };
    }

    if (!["SUPER_ADMIN", "ADMIN", "USER"].includes(newRole)) {
      return { success: false, message: "Invalid role" };
    }

    // Prevent self-demotion (to avoid locking yourself out)
    if (targetUserId === session.userId && newRole !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "You cannot demote your own Super Admin account",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    revalidatePath("/super-admin");
    revalidatePath("/admin");

    return {
      success: true,
      message: `${targetUser.name}'s role updated to ${newRole}`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
