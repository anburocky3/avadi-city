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
  } catch (error) {
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
}

export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "password-reset" })
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
  } catch (error) {
    return null; // Token is invalid or expired
  }
}
