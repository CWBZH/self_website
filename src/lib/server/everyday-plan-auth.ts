import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "everyday_plan_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getPasswordHash() {
  if (process.env.EVERYDAY_PLAN_PASSWORD_HASH) {
    return process.env.EVERYDAY_PLAN_PASSWORD_HASH;
  }

  if (process.env.EVERYDAY_PLAN_PASSWORD) {
    return sha256(process.env.EVERYDAY_PLAN_PASSWORD);
  }

  if (process.env.NODE_ENV !== "production") {
    return sha256("plan");
  }

  return null;
}

function getApiToken() {
  if (process.env.EVERYDAY_PLAN_API_TOKEN) {
    return process.env.EVERYDAY_PLAN_API_TOKEN;
  }

  if (process.env.NODE_ENV !== "production") {
    return "development-everyday-plan-token";
  }

  return null;
}

function getSessionSecret() {
  return (
    process.env.EVERYDAY_PLAN_SESSION_SECRET ||
    process.env.EVERYDAY_PLAN_PASSWORD ||
    process.env.STUDIO_SESSION_SECRET ||
    "development-everyday-plan-session"
  );
}

function shouldUseSecureCookie() {
  if (process.env.EVERYDAY_PLAN_COOKIE_SECURE) {
    return process.env.EVERYDAY_PLAN_COOKIE_SECURE === "true";
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

export function everydayPlanPasswordConfigured() {
  return Boolean(getPasswordHash());
}

export function everydayPlanApiConfigured() {
  return Boolean(getApiToken());
}

export function verifyEverydayPlanPassword(password: string) {
  const passwordHash = getPasswordHash();

  if (!passwordHash) {
    return false;
  }

  return safeCompare(sha256(password), passwordHash);
}

export function verifyEverydayPlanApiToken(request: Request) {
  const expected = getApiToken();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  return Boolean(expected && token && safeCompare(token, expected));
}

export async function isEverydayPlanSessionValid() {
  const expected = createSessionValue();
  const cookieStore = await cookies();
  const session = cookieStore.get(cookieName)?.value;

  return Boolean(expected && session && safeCompare(session, expected));
}

export async function setEverydayPlanSessionCookie() {
  const sessionValue = createSessionValue();

  if (!sessionValue) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearEverydayPlanSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
}
