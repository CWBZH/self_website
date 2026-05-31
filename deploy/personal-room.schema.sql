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
