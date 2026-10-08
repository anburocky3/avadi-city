/**
 * Role-Based Access Control (RBAC) guard utilities.
 *
 * These are the server-side building blocks used by Server Actions,
 * API routes, and RSC layouts to enforce authorization.  Every function
 * operates on the `avadi_session` JWT cookie — no client-side trust.
 *
 * Usage patterns:
 *   const session = await requireAuth();          // throws on failure
 *   const session = await requireRole("ADMIN");   // throws if role < ADMIN
 *   await assertCanModifyRecord(session, record); // throws if not owner/admin
 */

import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import type { AuthSession, Role, AuthResult } from "@/types/auth";
import { hasMinimumRole } from "@/types/auth";

// Re-export for convenience
export { hasMinimumRole };
export type { AuthSession, Role, AuthResult };

// ---------------------------------------------------------------------------
// Error class for authorization failures
// ---------------------------------------------------------------------------

export class AuthorizationError extends Error {
  public readonly status: 401 | 403;

  constructor(message: string, status: 401 | 403 = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Session extraction
// ---------------------------------------------------------------------------

/**
 * Reads the session from the cookie jar and verifies it.
 * Returns `null` if no valid session exists.
 * Safe to call in any server context (RSC, Server Action, API route).
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;
  if (!token) return null;
  const session = await verifyAuthToken(token);
  if (!session) return null;
  return {
    ...session,
    role: session.role || "USER",
  };
}

/**
 * Same as `getSession()` but returns a typed result discriminated union
 * (useful when you want to return a 401/403 response instead of throwing).
 */
export async function checkAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { authorized: false, reason: "Not authenticated", status: 401 };
  }
  return { authorized: true, session };
}

/**
 * Extracts and verifies the session from cookies.
 * **Throws** an `AuthorizationError` if no valid session exists.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new AuthorizationError("Authentication required", 401);
  }
  return session;
}

// ---------------------------------------------------------------------------
// Role guards
// ---------------------------------------------------------------------------

/**
 * Verifies the session exists AND the user's role meets the minimum level.
 * Returns a result union — does NOT throw.
 */
export async function checkRole(minimumRole: Role): Promise<AuthResult> {
  const result = await checkAuth();
  if (!result.authorized) return result;

  if (!hasMinimumRole(result.session.role, minimumRole)) {
    return {
      authorized: false,
      reason: `Requires ${minimumRole} role or higher`,
      status: 403,
    };
  }

  return result;
}

/**
 * Verifies the session exists AND the user's role meets the minimum level.
 * **Throws** an `AuthorizationError` if either check fails.
 */
export async function requireRole(minimumRole: Role): Promise<AuthSession> {
  const session = await requireAuth();

  if (!hasMinimumRole(session.role, minimumRole)) {
    throw new AuthorizationError(
      `Forbidden: requires ${minimumRole} role or higher`,
    );
  }

  return session;
}

// ---------------------------------------------------------------------------
// Record-level ownership + role checks
// ---------------------------------------------------------------------------

/** Minimal shape that any owned record must satisfy. */
interface OwnedRecord {
  userId?: string | null;
  /** For ward-scoped admin checks (e.g., Complaint.incidentWard) */
  wardNumber?: number | null;
}

/**
 * Checks whether `session` is authorized to access/modify `record`.
 *
 * Rules (evaluated top-down, first match wins):
 *   1. SUPER_ADMIN  → always allowed
 *   2. ADMIN        → allowed if the record's ward matches the admin's ward
 *   3. USER/any     → allowed only if the record's userId matches session.userId
 */
export function canAccessRecord(
  session: AuthSession,
  record: OwnedRecord,
): boolean {
  // 1. Super admins bypass all checks
  if (session.role === "SUPER_ADMIN") return true;

  // 2. Admins can manage records within their ward
  if (session.role === "ADMIN") {
    // If the record has a ward, check scope; otherwise fall through to ownership
    if (record.wardNumber !== undefined && record.wardNumber !== null) {
      return record.wardNumber === session.wardNumber;
    }
    // Records without a ward scope fall through to ownership check
  }

  // 3. Standard ownership check
  return !!record.userId && record.userId === session.userId;
}

/**
 * Same as `canAccessRecord` but **throws** on failure.
 * Use this in Server Actions where you want to bail immediately.
 */
export function assertCanModifyRecord(
  session: AuthSession,
  record: OwnedRecord,
): void {
  if (!canAccessRecord(session, record)) {
    throw new AuthorizationError(
      "You do not have permission to modify this record",
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers for Server Action error responses
// ---------------------------------------------------------------------------

/**
 * Standardized error shape returned from Server Actions.
 * Compatible with React 19's `useActionState` pattern.
 */
export interface ActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Wraps an AuthorizationError into an `ActionResult`.
 * Falls back to a generic 500 message for unknown errors.
 */
export function handleActionError<T = undefined>(error: unknown): ActionResult<T> {
  if (error instanceof AuthorizationError) {
    return { success: false, message: error.message };
  }
  console.error("[Action Error]", error);
  return { success: false, message: "An unexpected error occurred" };
}
