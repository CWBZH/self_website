import type { PersonalPostLanguage } from "@/lib/content";

export type TranslationRequest = {
  targetLanguage: PersonalPostLanguage;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readingTime?: string;
};

export type TranslationResult = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readingTime?: string;
};

function getTranslationConfig() {
  const apiKey = process.env.TRANSLATION_API_KEY ?? process.env.AI_WORKFLOW_LLM_API_KEY;
  const model = process.env.TRANSLATION_MODEL ?? process.env.AI_WORKFLOW_LLM_MODEL;
  const baseUrl =
    process.env.TRANSLATION_BASE_URL ??
    process.env.AI_WORKFLOW_LLM_BASE_URL ??
    "https://api.openai.com/v1";

  return {
    apiKey,
    model,
    baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  };
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("TRANSLATION_JSON_PARSE_FAILED");
  }
}

function normalizeResult(value: unknown): TranslationResult {
  if (!value || typeof value !== "object") {
    throw new Error("TRANSLATION_RESULT_INVALID");
  }

  const data = value as Record<string, unknown>;
  return {
    title: String(data.title ?? "").trim(),
    summary: String(data.summary ?? "").trim(),
    content: String(data.content ?? "").trim(),
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12)
      : [],
    readingTime: String(data.readingTime ?? "").trim() || undefined,
  };
}

export function isTranslationConfigured() {
  const config = getTranslationConfig();
  return Boolean(config.apiKey && config.model);
}

export async function translatePost(input: TranslationRequest): Promise<TranslationResult> {
  const config = getTranslationConfig();

  if (!config.apiKey || !config.model) {
    throw new Error("TRANSLATION_NOT_CONFIGURED");
  }

  const targetLabel = input.targetLanguage === "en" ? "English" : "Simplified Chinese";
  const response = await fetch(new URL("chat/completions", config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a careful literary and technical translator. Return strict JSON only. Preserve Markdown structure, image URLs, links, code fences, tables, blockquotes, and headings. Translate only human-readable prose.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Translate this personal website post to ${targetLabel}.`,
            output_schema: {
              title: "string",
              summary: "string",
              content: "markdown string",
              tags: ["string"],
              readingTime: "string, optional",
            },
            input,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`TRANSLATION_REQUEST_FAILED:${response.status}:${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("TRANSLATION_EMPTY_RESPONSE");
  }

  return normalizeResult(extractJsonObject(content));
}
