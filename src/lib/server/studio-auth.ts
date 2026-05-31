import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const cookieName = "studio_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getPasswordHash() {
  if (process.env.STUDIO_PASSWORD_HASH) {
    return process.env.STUDIO_PASSWORD_HASH;
  }

  if (process.env.STUDIO_PASSWORD) {
    return sha256(process.env.STUDIO_PASSWORD);
  }

  if (process.env.NODE_ENV !== "production") {
    return sha256("studio");
  }

  return null;
}

function getSessionSecret() {
  return (
    process.env.STUDIO_SESSION_SECRET ||
    process.env.STUDIO_PASSWORD ||
    "development-studio-session"
  );
}

function shouldUseSecureCookie() {
  if (process.env.STUDIO_COOKIE_SECURE) {
    return process.env.STUDIO_COOKIE_SECURE === "true";
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;
}

function createSessionValue() {
  const passwordHash = getPasswordHash();

  if (!passwordHash) {
    return null;
  }

  return createHmac("sha256", getSessionSecret())
    .update(passwordHash)
    .digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function studioAuthConfigured() {
  return Boolean(getPasswordHash());
}

export function verifyStudioPassword(password: string) {
  const passwordHash = getPasswordHash();

  if (!passwordHash) {
    return false;
  }

  return safeCompare(sha256(password), passwordHash);
}

export function isStudioRequest(request: Request) {
  const expected = createSessionValue();
  const session = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split("=")[1];

  return Boolean(expected && session && safeCompare(session, expected));
}

export function setStudioCookie(response: NextResponse) {
  const sessionValue = createSessionValue();

  if (!sessionValue) {
    return response;
  }

  response.cookies.set(cookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearStudioCookie(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
