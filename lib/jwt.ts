import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);
console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET, "value length:", JWT_SECRET.length);

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT verify error:", error);
    return null;
  }
}
