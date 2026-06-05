import { resolveLanguage } from "@/lib/content";
import { isStudioRequest, unauthorized } from "@/lib/server/studio-auth";
import { isTranslationConfigured, translatePost } from "@/lib/server/translation-service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStudioRequest(request)) {
    return unauthorized();
  }

  if (!isTranslationConfigured()) {
    return NextResponse.json({ error: "TRANSLATION_NOT_CONFIGURED" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const targetLanguage = resolveLanguage(body?.targetLanguage);

  try {
    const translation = await translatePost({
      targetLanguage,
      title: String(body?.title ?? ""),
      summary: String(body?.summary ?? ""),
      content: String(body?.content ?? ""),
      tags: Array.isArray(body?.tags) ? body.tags.map((tag: unknown) => String(tag)) : [],
      readingTime: String(body?.readingTime ?? ""),
    });

    return NextResponse.json({ translation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TRANSLATION_FAILED";
    console.error("[studio.translate] failed", {
      error: message,
      titleLength: String(body?.title ?? "").length,
      summaryLength: String(body?.summary ?? "").length,
      contentLength: String(body?.content ?? "").length,
      targetLanguage,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
