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

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const markdownChunkSize = 4500;

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

function targetLanguageLabel(language: PersonalPostLanguage) {
  return language === "en" ? "English" : "Simplified Chinese";
}

async function createChatCompletion(messages: ChatMessage[]) {
  const config = getTranslationConfig();

  if (!config.apiKey || !config.model) {
    throw new Error("TRANSLATION_NOT_CONFIGURED");
  }

  const response = await fetch(new URL("chat/completions", config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages,
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

  return content.trim();
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

function splitMarkdownBlocks(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && line.trim() === "") {
      if (current.length) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length) blocks.push(current.join("\n"));
  return blocks.length ? blocks : [markdown];
}

function chunkMarkdown(markdown: string) {
  const blocks = splitMarkdownBlocks(markdown);
  const chunks: string[] = [];
  let current = "";

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;

    if (candidate.length <= markdownChunkSize) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);

    if (block.length <= markdownChunkSize) {
      current = block;
      continue;
    }

    for (let index = 0; index < block.length; index += markdownChunkSize) {
      chunks.push(block.slice(index, index + markdownChunkSize));
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

function stripOuterMarkdownFence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

async function translateMetadata(input: TranslationRequest) {
  const targetLabel = targetLanguageLabel(input.targetLanguage);
  const content = await createChatCompletion([
    {
      role: "system",
      content:
        "You are a careful translator. Return strict JSON only. Do not include Markdown fences, comments, or extra text.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task: `Translate this post metadata to ${targetLabel}.`,
        output_schema: {
          title: "string",
          summary: "string",
          tags: ["string"],
          readingTime: "string, optional",
        },
        input: {
          title: input.title,
          summary: input.summary,
          tags: input.tags,
          readingTime: input.readingTime,
        },
      }),
    },
  ]);

  return normalizeResult({
    ...extractJsonObject(content),
    content: "",
  });
}

async function translateMarkdownChunk(chunk: string, targetLanguage: PersonalPostLanguage, index: number, total: number) {
  const targetLabel = targetLanguageLabel(targetLanguage);
  const content = await createChatCompletion([
    {
      role: "system",
      content:
        "You are a careful literary and technical Markdown translator. Return translated Markdown only. Preserve all Markdown syntax, image URLs, links, code fences, tables, blockquotes, headings, and spacing. Translate only human-readable prose. Do not wrap the result in JSON or a Markdown code fence.",
    },
    {
      role: "user",
      content: [
        `Translate chunk ${index + 1} of ${total} to ${targetLabel}.`,
        "Keep this chunk self-contained and preserve Markdown exactly where possible.",
        "",
        chunk,
      ].join("\n"),
    },
  ]);

  return stripOuterMarkdownFence(content);
}

export function isTranslationConfigured() {
  const config = getTranslationConfig();
  return Boolean(config.apiKey && config.model);
}

export async function translatePost(input: TranslationRequest): Promise<TranslationResult> {
  const metadata = await translateMetadata(input);
  const chunks = chunkMarkdown(input.content);
  const translatedChunks: string[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    try {
      translatedChunks.push(
        await translateMarkdownChunk(chunks[index], input.targetLanguage, index, chunks.length)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_TRANSLATION_ERROR";
      throw new Error(`TRANSLATION_CHUNK_FAILED:${index + 1}/${chunks.length}:${message}`);
    }
  }

  return {
    ...metadata,
    content: translatedChunks.join("\n\n"),
  };
}
