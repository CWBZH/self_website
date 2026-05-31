import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  pgInsertComment,
  pgInsertMessage,
  pgLikeComment,
  pgListAllComments,
  pgListAllMessages,
  pgListRoomPresence,
  pgListVisibleComments,
  pgListVisibleMessages,
  pgDeleteOwnComment,
  pgUpdateCommentStatus,
  pgUpdateMessageStatus,
  pgUpsertRoomPresence,
  postgresAvailable,
} from "@/lib/server/postgres-room-store";

export type CommentStatus = "visible" | "hidden" | "deleted";
export type MessageStatus = "visible" | "hidden" | "deleted";

export type StoredComment = {
  id: string;
  postType: string;
  postSlug: string;
  parentId: string | null;
  nickname: string;
  avatarSeed: string;
  visitorId: string;
  content: string;
  likeCount: number;
  status: CommentStatus;
  ipHash: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredMessage = {
  id: string;
  roomId: string;
  nickname: string;
  avatarSeed: string;
  visitorId: string;
  content: string;
  status: MessageStatus;
  ipHash: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredPresence = {
  roomId: string;
  visitorId: string;
  nickname: string;
  avatarSeed: string;
  lastSeenAt: string;
};

type StoreShape = {
  comments: StoredComment[];
  messages: StoredMessage[];
  presence: StoredPresence[];
};

const storePath = path.join(process.cwd(), "data", "personal-room.json");

const emptyStore: StoreShape = {
  comments: [],
  messages: [],
  presence: [],
};

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function clampText(value: unknown, maxLength: number, fallback = "") {
  return cleanText(value, fallback).slice(0, maxLength);
}

export function getIpHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  return createHash("sha256").update(ip).digest("hex");
}

export function getOrCreateVisitorId(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("visitor_id="))
    ?.split("=")[1] || randomUUID();
}

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;

    return {
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      presence: Array.isArray(parsed.presence) ? parsed.presence : [],
    };
  } catch {
    await writeStore(emptyStore);
    return emptyStore;
  }
}

async function writeStore(store: StoreShape) {
  await ensureStore();
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function listVisibleComments(
  postType: string,
  postSlug: string
): Promise<StoredComment[]> {
  if (postgresAvailable()) {
    const comments = await pgListVisibleComments(postType, postSlug);
    if (comments) return comments;
  }

  const store = await readStore();

  return store.comments
    .filter(
      (comment) =>
        comment.postType === postType &&
        comment.postSlug === postSlug &&
        comment.status === "visible"
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function listAllComments(): Promise<StoredComment[]> {
  if (postgresAvailable()) {
    const comments = await pgListAllComments();
    if (comments) return comments;
  }

  const store = await readStore();

  return [...store.comments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createComment(input: {
  postType: unknown;
  postSlug: unknown;
  parentId?: unknown;
  nickname: unknown;
  content: unknown;
  visitorId: string;
  ipHash: string;
}): Promise<StoredComment> {
  const now = new Date().toISOString();
  const nickname = clampText(input.nickname, 40, "Guest") || "Guest";
  const content = clampText(input.content, 800);
  const postType = clampText(input.postType, 40);
  const postSlug = clampText(input.postSlug, 160);

  if (!postType || !postSlug || !content) {
    throw new Error("INVALID_COMMENT");
  }

  const comment: StoredComment = {
    id: randomUUID(),
    postType,
    postSlug,
    parentId: input.parentId ? clampText(input.parentId, 80) : null,
    nickname,
    avatarSeed: nickname.toLowerCase(),
    visitorId: input.visitorId,
    content,
    likeCount: 0,
    status: "visible",
    ipHash: input.ipHash,
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  if (postgresAvailable()) {
    const inserted = await pgInsertComment(comment);
    if (inserted) return inserted;
  }

  store.comments.unshift(comment);
  await writeStore(store);
  return comment;
}

export async function updateCommentStatus(
  id: string,
  status: CommentStatus
): Promise<StoredComment | null> {
  if (postgresAvailable()) {
    const comment = await pgUpdateCommentStatus(id, status);
    if (comment) return comment;
  }

  const store = await readStore();
  const comment = store.comments.find((item) => item.id === id);

  if (!comment) {
    return null;
  }

  comment.status = status;
  comment.updatedAt = new Date().toISOString();
  await writeStore(store);
  return comment;
}

export async function likeComment(id: string): Promise<StoredComment | null> {
  if (postgresAvailable()) {
    const comment = await pgLikeComment(id);
    if (comment) return comment;
  }

  const store = await readStore();
  const comment = store.comments.find(
    (item) => item.id === id && item.status === "visible"
  );

  if (!comment) {
    return null;
  }

  comment.likeCount += 1;
  comment.updatedAt = new Date().toISOString();
  await writeStore(store);
  return comment;
}

export async function deleteOwnComment(
  id: string,
  visitorId: string
): Promise<StoredComment | null> {
  if (postgresAvailable()) {
    const comment = await pgDeleteOwnComment(id, visitorId);
    if (comment) return comment;
  }

  const store = await readStore();
  const comment = store.comments.find((item) => item.id === id);

  if (!comment || comment.status !== "visible") {
    return null;
  }

  if (comment.visitorId !== visitorId) {
    return null;
  }

  comment.status = "deleted";
  comment.updatedAt = new Date().toISOString();
  await writeStore(store);
  return comment;
}

export async function listVisibleMessages(
  roomId = "main"
): Promise<StoredMessage[]> {
  if (postgresAvailable()) {
    const messages = await pgListVisibleMessages(roomId);
    if (messages) return messages;
  }

  const store = await readStore();

  return store.messages
    .filter((message) => message.roomId === roomId && message.status === "visible")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .slice(-120);
}

export async function listAllMessages(): Promise<StoredMessage[]> {
  if (postgresAvailable()) {
    const messages = await pgListAllMessages();
    if (messages) return messages;
  }

  const store = await readStore();

  return [...store.messages].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createMessage(input: {
  roomId?: unknown;
  nickname: unknown;
  content: unknown;
  visitorId: string;
  ipHash: string;
}): Promise<StoredMessage> {
  const now = new Date().toISOString();
  const nickname = clampText(input.nickname, 40, "Guest") || "Guest";
  const content = clampText(input.content, 500);
  const roomId = clampText(input.roomId, 60, "main") || "main";

  if (!content) {
    throw new Error("INVALID_MESSAGE");
  }

  const message: StoredMessage = {
    id: randomUUID(),
    roomId,
    nickname,
    avatarSeed: nickname.toLowerCase(),
    visitorId: input.visitorId,
    content,
    status: "visible",
    ipHash: input.ipHash,
    createdAt: now,
    updatedAt: now,
  };

  if (postgresAvailable()) {
    const inserted = await pgInsertMessage(message);
    if (inserted) return inserted;
  }

  const store = await readStore();
  store.messages.push(message);
  await writeStore(store);
  return message;
}

export async function upsertRoomPresence(input: {
  roomId?: unknown;
  nickname: unknown;
  visitorId: string;
}): Promise<StoredPresence> {
  const now = new Date().toISOString();
  const nickname = clampText(input.nickname, 40, "Guest") || "Guest";
  const roomId = clampText(input.roomId, 60, "main") || "main";

  const presence: StoredPresence = {
    roomId,
    visitorId: input.visitorId,
    nickname,
    avatarSeed: nickname.toLowerCase(),
    lastSeenAt: now,
  };

  if (postgresAvailable()) {
    const updated = await pgUpsertRoomPresence(presence);
    if (updated) return updated;
  }

  const store = await readStore();
  const existing = store.presence.find(
    (item) => item.roomId === roomId && item.visitorId === input.visitorId
  );

  if (existing) {
    existing.nickname = presence.nickname;
    existing.avatarSeed = presence.avatarSeed;
    existing.lastSeenAt = presence.lastSeenAt;
  } else {
    store.presence.push(presence);
  }

  const cutoff = Date.now() - 60_000;
  store.presence = store.presence.filter(
    (item) => new Date(item.lastSeenAt).getTime() >= cutoff
  );

  await writeStore(store);
  return presence;
}

export async function listRoomPresence(
  roomId = "main"
): Promise<StoredPresence[]> {
  if (postgresAvailable()) {
    const members = await pgListRoomPresence(roomId);
    if (members) return members;
  }

  const store = await readStore();
  const cutoff = Date.now() - 60_000;

  return store.presence
    .filter(
      (item) =>
        item.roomId === roomId &&
        new Date(item.lastSeenAt).getTime() >= cutoff
    )
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus
): Promise<StoredMessage | null> {
  if (postgresAvailable()) {
    const message = await pgUpdateMessageStatus(id, status);
    if (message) return message;
  }

  const store = await readStore();
  const message = store.messages.find((item) => item.id === id);

  if (!message) {
    return null;
  }

  message.status = status;
  message.updatedAt = new Date().toISOString();
  await writeStore(store);
  return message;
}
