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
