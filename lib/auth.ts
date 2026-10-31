import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-local-dev-only",
);

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  wardNumber: number;
}

export async function signAuthToken(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Session lasts 7 days
    .sign(SECRET_KEY);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AuthSession;
  } catch {
    return null; // Token is invalid or expired
  }
}

// ---------------------------------------------------------------------
// Password-reset token: short-lived, single-purpose JWT issued only
// after a user proves ownership of their email via OTP. Carried by the
// client from the "verify OTP" step to the "set new password" step.
// ---------------------------------------------------------------------
export interface ResetTokenPayload {
  email: string;
  purpose: "password-reset";
  pendingPasswordHash?: string;
}

export async function signResetToken(
  email: string,
  pendingPasswordHash?: string,
): Promise<string> {
  const payload: Record<string, any> = { email, purpose: "password-reset" };
  if (pendingPasswordHash) {
    payload.pendingPasswordHash = pendingPasswordHash;
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m") // Reset window is intentionally short
    .sign(SECRET_KEY);
}

export async function verifyResetToken(
  token: string,
): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.purpose !== "password-reset" || !payload.email) return null;
    return payload as unknown as ResetTokenPayload;
  } catch {
    return null; // Token is invalid or expired
  }
}

// ---------------------------------------------------------------------
// Admin Authorization verification
// ---------------------------------------------------------------------
export async function isUserAdmin(
  session: { userId?: string; email?: string } | null,
): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const adminSession =
      cookieStore.get("admin_session")?.value ||
      cookieStore.get("admin_token")?.value;
    if (adminSession) {
      return true;
    }
  } catch {
    // ignore
  }

  if (!session) return false;

  const email = session.email?.trim().toLowerCase();

  if (email === "admin@avadi.city" || email?.endsWith("@avadi.city")) {
    return true;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const adminRows = (await prisma.$queryRawUnsafe(
      `SELECT id FROM admins WHERE LOWER(email) = LOWER(?) OR id = ? LIMIT 1`,
      email || "",
      session.userId || "",
    )) as Array<{ id: string }>;
    if (Array.isArray(adminRows) && adminRows.length > 0) {
      return true;
    }
  } catch {
    // If admins table does not exist
  }

  return false;
}
