import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "upflow_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const PASSWORD_KEY_LEN = 64;

type SessionPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

const getAuthSecret = () => {
  const secret = process.env.UPFLOW_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing UPFLOW_AUTH_SECRET.");
  }
  return secret;
};

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const safeEqual = (a: Buffer, b: Buffer) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, PASSWORD_KEY_LEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const stored = Buffer.from(hashHex, "hex");
  const derived = crypto.scryptSync(password, salt, stored.length);
  return safeEqual(stored, derived);
};

export const createSessionToken = (payload: { userId: string; email: string }) => {
  const now = Math.floor(Date.now() / 1000);
  const body: SessionPayload = {
    sub: payload.userId,
    email: payload.email,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
};

export const verifySessionToken = (token: string): SessionPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = crypto
    .createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("base64url");
  if (!safeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
    if (!decoded?.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export const getSessionFromRequest = (request: NextRequest): SessionPayload | null => {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
};

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
};
