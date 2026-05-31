"use client";

import { SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";

type Message = {
  id: string;
  name: string;
  time: string;
  content: string;
  mine?: boolean;
};

type Member = {
  nickname: string;
  avatarSeed: string;
  lastSeenAt: string;
};

type ApiMessage = {
  id: string;
  nickname: string;
  createdAt: string;
  content: string;
  mine?: boolean;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapApiMessages(messages: ApiMessage[]) {
  return messages.map((message) => ({
    id: message.id,
    name: message.nickname,
    time: formatTime(message.createdAt),
    content: message.content,
    mine: Boolean(message.mine),
  }));
}

export function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") {
      return "Guest";
    }

    return window.localStorage.getItem("room_nickname") || "Guest";
  });
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadSnapshot() {
      const response = await fetch("/api/room/messages?roomId=main");
      const data = (await response.json()) as {
        messages?: ApiMessage[];
      };
      const presenceResponse = await fetch("/api/room/presence?roomId=main");
      const presenceData = (await presenceResponse.json()) as {
        members?: Member[];
      };
      setMessages(mapApiMessages(data.messages ?? []));
      setMembers(presenceData.members ?? []);
    }

    let pollingInterval: number | undefined;
    let closed = false;

    function startPolling() {
      if (pollingInterval || closed) return;

      loadSnapshot().catch(() => {
        setMessages([]);
        setStatus("聊天室消息暂时无法加载。");
      });

      pollingInterval = window.setInterval(() => {
        loadSnapshot().catch(() => undefined);
      }, 3000);
    }

    if ("EventSource" in window) {
      const source = new EventSource("/api/room/events?roomId=main");

      source.addEventListener("snapshot", (event) => {
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as {
          messages?: ApiMessage[];
          members?: Member[];
        };

        setMessages(mapApiMessages(data.messages ?? []));
        setMembers(data.members ?? []);
        setStatus("");
      });

      source.onerror = () => {
        source.close();
        startPolling();
      };

      return () => {
        closed = true;
        source.close();
        if (pollingInterval) {
          window.clearInterval(pollingInterval);
        }
      };
    }

    startPolling();

    return () => {
      closed = true;
      if (pollingInterval) {
        window.clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    async function touchPresence() {
      const safeNickname = nickname.trim() || "Guest";
      window.localStorage.setItem("room_nickname", safeNickname);

      const response = await fetch("/api/room/presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: "main",
          nickname: safeNickname,
        }),
      });
      const data = (await response.json()) as { members?: Member[] };
      setMembers(data.members ?? []);
    }

    touchPresence().catch(() => undefined);
    const interval = window.setInterval(() => {
      touchPresence().catch(() => undefined);
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [nickname]);

  async function sendMessage() {
    const content = value.trim();
    if (!content) return;

    const safeNickname = nickname.trim() || "Guest";
    window.localStorage.setItem("room_nickname", safeNickname);
    setIsSending(true);
    setStatus("");

    try {
      const response = await fetch("/api/room/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: safeNickname,
          content,
          roomId: "main",
        }),
      });

      if (!response.ok) {
        setStatus(response.status === 429 ? "发送太频繁，稍后再试。" : "发送失败。");
        return;
      }

      const data = (await response.json()) as { message?: ApiMessage };
      const message = data.message;
      if (!message) return;

      setMessages((current) => [
        ...current,
        {
          id: message.id,
          name: message.nickname,
          time: "now",
          content: message.content,
          mine: true,
        },
      ]);
      setValue("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-[560px] flex-col border-y border-border">
        <div className="flex flex-1 flex-col gap-4 py-6">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              这里还很安静。你可以留下第一句话。
            </div>
          ) : null}
          {messages.map((message) => (
            <article
              key={message.id}
              className={["max-w-[82%]", message.mine ? "ml-auto text-right" : ""].join(
                " "
              )}
            >
              <p className="mb-2 text-xs text-muted-foreground">
                {message.name} · {message.time}
              </p>
              <div
                className={[
                  "inline-block rounded-lg border px-4 py-3 text-sm leading-6",
                  message.mine
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground",
                ].join(" ")}
              >
                {message.content}
              </div>
            </article>
          ))}
        </div>
        <form
          className="sticky bottom-0 grid grid-cols-1 gap-3 border-t border-border bg-background py-4 sm:grid-cols-[180px_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="昵称"
            className="min-w-0 rounded-md border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="写一句话..."
            className="min-w-0 rounded-md border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            aria-label="Send message"
            disabled={isSending}
            className="inline-grid size-12 place-items-center rounded-full bg-foreground text-background transition hover:opacity-85 disabled:opacity-50"
          >
            <SendHorizonal className="size-5" />
          </button>
          {status ? (
            <p className="text-xs text-muted-foreground sm:col-span-3">
              {status}
            </p>
          ) : null}
        </form>
      </section>
      <aside className="border-t border-border pt-5">
        <h2 className="text-3xl font-medium tracking-tight">
          {members.length || 1} online
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          在线列表每 15 秒刷新一次，离开一分钟后会自然消失。
        </p>
        <div className="mt-5 divide-y divide-border">
          {(members.length
            ? members
            : [{ nickname, avatarSeed: nickname, lastSeenAt: new Date().toISOString() }]
          ).map((member) => (
            <div
              key={`${member.nickname}-${member.avatarSeed}`}
              className="flex items-center justify-between py-4 text-sm"
            >
              <span>{member.nickname}</span>
              <span className="size-2 rounded-full bg-emerald-700" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
