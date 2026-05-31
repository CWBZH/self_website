import { Pool } from "pg";
import type {
  CommentStatus,
  MessageStatus,
  StoredComment,
  StoredMessage,
  StoredPresence,
} from "@/lib/server/personal-room-store";

let pool: Pool | null = null;
let initialized = false;

function getPool() {
  const connectionString = process.env.PERSONAL_ROOM_DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export function postgresAvailable() {
  return Boolean(process.env.PERSONAL_ROOM_DATABASE_URL);
}

async function ensureSchema() {
  const db = getPool();

  if (!db || initialized) {
    return db;
  }

  await db.query(`
    create table if not exists personal_comments (
      id uuid primary key,
      post_type text not null,
      post_slug text not null,
      parent_id uuid null,
      nickname text not null,
      avatar_seed text not null,
      visitor_id text not null,
      content text not null,
      like_count integer not null default 0,
      status text not null default 'visible',
      ip_hash text not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create index if not exists personal_comments_post_idx
      on personal_comments (post_type, post_slug, status, created_at desc);

    create table if not exists personal_room_messages (
      id uuid primary key,
      room_id text not null,
      nickname text not null,
      avatar_seed text not null,
      visitor_id text not null,
      content text not null,
      status text not null default 'visible',
      ip_hash text not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create index if not exists personal_room_messages_room_idx
      on personal_room_messages (room_id, status, created_at desc);

    create table if not exists personal_room_presence (
      room_id text not null,
      visitor_id text not null,
      nickname text not null,
      avatar_seed text not null,
      last_seen_at timestamptz not null,
      primary key (room_id, visitor_id)
    );

    create index if not exists personal_room_presence_seen_idx
      on personal_room_presence (room_id, last_seen_at desc);
  `);

  initialized = true;
  return db;
}

function toComment(row: Record<string, unknown>): StoredComment {
  return {
    id: String(row.id),
    postType: String(row.post_type),
    postSlug: String(row.post_slug),
    parentId: row.parent_id ? String(row.parent_id) : null,
    nickname: String(row.nickname),
    avatarSeed: String(row.avatar_seed),
    visitorId: String(row.visitor_id),
    content: String(row.content),
    likeCount: Number(row.like_count),
    status: String(row.status) as CommentStatus,
    ipHash: String(row.ip_hash),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function toMessage(row: Record<string, unknown>): StoredMessage {
  return {
    id: String(row.id),
    roomId: String(row.room_id),
    nickname: String(row.nickname),
    avatarSeed: String(row.avatar_seed),
    visitorId: String(row.visitor_id),
    content: String(row.content),
    status: String(row.status) as MessageStatus,
    ipHash: String(row.ip_hash),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function toPresence(row: Record<string, unknown>): StoredPresence {
  return {
    roomId: String(row.room_id),
    visitorId: String(row.visitor_id),
    nickname: String(row.nickname),
    avatarSeed: String(row.avatar_seed),
    lastSeenAt: new Date(String(row.last_seen_at)).toISOString(),
  };
}

export async function pgListVisibleComments(postType: string, postSlug: string) {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `select * from personal_comments
     where post_type = $1 and post_slug = $2 and status = 'visible'
     order by created_at desc`,
    [postType, postSlug]
  );

  return result.rows.map(toComment);
}

export async function pgListAllComments() {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    "select * from personal_comments order by created_at desc"
  );

  return result.rows.map(toComment);
}

export async function pgInsertComment(comment: StoredComment) {
  const db = await ensureSchema();
  if (!db) return null;

  await db.query(
    `insert into personal_comments (
      id, post_type, post_slug, parent_id, nickname, avatar_seed, visitor_id,
      content, like_count, status, ip_hash, created_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      comment.id,
      comment.postType,
      comment.postSlug,
      comment.parentId,
      comment.nickname,
      comment.avatarSeed,
      comment.visitorId,
      comment.content,
      comment.likeCount,
      comment.status,
      comment.ipHash,
      comment.createdAt,
      comment.updatedAt,
    ]
  );

  return comment;
}

export async function pgUpdateCommentStatus(id: string, status: CommentStatus) {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `update personal_comments
     set status = $2, updated_at = now()
     where id = $1
     returning *`,
    [id, status]
  );

  return result.rows[0] ? toComment(result.rows[0]) : null;
}

export async function pgLikeComment(id: string) {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `update personal_comments
     set like_count = like_count + 1, updated_at = now()
     where id = $1 and status = 'visible'
     returning *`,
    [id]
  );

  return result.rows[0] ? toComment(result.rows[0]) : null;
}

export async function pgDeleteOwnComment(id: string, visitorId: string) {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `update personal_comments
     set status = 'deleted', updated_at = now()
     where id = $1 and visitor_id = $2 and status = 'visible'
     returning *`,
    [id, visitorId]
  );

  return result.rows[0] ? toComment(result.rows[0]) : null;
}

export async function pgListVisibleMessages(roomId = "main") {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `select * from (
      select * from personal_room_messages
      where room_id = $1 and status = 'visible'
      order by created_at desc
      limit 120
    ) messages order by created_at asc`,
    [roomId]
  );

  return result.rows.map(toMessage);
}

export async function pgListAllMessages() {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    "select * from personal_room_messages order by created_at desc"
  );

  return result.rows.map(toMessage);
}

export async function pgInsertMessage(message: StoredMessage) {
  const db = await ensureSchema();
  if (!db) return null;

  await db.query(
    `insert into personal_room_messages (
      id, room_id, nickname, avatar_seed, visitor_id, content, status,
      ip_hash, created_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      message.id,
      message.roomId,
      message.nickname,
      message.avatarSeed,
      message.visitorId,
      message.content,
      message.status,
      message.ipHash,
      message.createdAt,
      message.updatedAt,
    ]
  );

  return message;
}

export async function pgUpdateMessageStatus(id: string, status: MessageStatus) {
  const db = await ensureSchema();
  if (!db) return null;

  const result = await db.query(
    `update personal_room_messages
     set status = $2, updated_at = now()
     where id = $1
     returning *`,
    [id, status]
  );

  return result.rows[0] ? toMessage(result.rows[0]) : null;
}

export async function pgUpsertRoomPresence(presence: StoredPresence) {
  const db = await ensureSchema();
  if (!db) return null;

  await db.query(
    `insert into personal_room_presence (
      room_id, visitor_id, nickname, avatar_seed, last_seen_at
    ) values ($1, $2, $3, $4, $5)
    on conflict (room_id, visitor_id)
    do update set
      nickname = excluded.nickname,
      avatar_seed = excluded.avatar_seed,
      last_seen_at = excluded.last_seen_at`,
    [
      presence.roomId,
      presence.visitorId,
      presence.nickname,
      presence.avatarSeed,
      presence.lastSeenAt,
    ]
  );

  return presence;
}

export async function pgListRoomPresence(roomId = "main") {
  const db = await ensureSchema();
  if (!db) return null;

  await db.query(
    "delete from personal_room_presence where last_seen_at < now() - interval '60 seconds'"
  );

  const result = await db.query(
    `select * from personal_room_presence
     where room_id = $1 and last_seen_at >= now() - interval '60 seconds'
     order by last_seen_at desc`,
    [roomId]
  );

  return result.rows.map(toPresence);
}
