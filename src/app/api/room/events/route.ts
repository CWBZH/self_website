import {
  getOrCreateVisitorId,
  listRoomPresence,
  listVisibleMessages,
  type StoredMessage,
  type StoredPresence,
} from "@/lib/server/personal-room-store";
import { publicInteractionsEnabled } from "@/lib/public-interactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPublicMessage(message: StoredMessage, visitorId: string) {
  return {
    id: message.id,
    roomId: message.roomId,
    nickname: message.nickname,
    avatarSeed: message.avatarSeed,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    mine: message.visitorId === visitorId,
  };
}

function toPublicPresence(member: StoredPresence) {
  return {
    nickname: member.nickname,
    avatarSeed: member.avatarSeed,
    lastSeenAt: member.lastSeenAt,
  };
}

export async function GET(request: Request) {
  if (!publicInteractionsEnabled) {
    return new Response(JSON.stringify({ error: "PUBLIC_INTERACTIONS_DISABLED" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") ?? "main";
  const visitorId = getOrCreateVisitorId(request);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      async function sendSnapshot() {
        if (closed) return;

        const [messages, members] = await Promise.all([
          listVisibleMessages(roomId),
          listRoomPresence(roomId),
        ]);

        const payload = {
          messages: messages.map((message) =>
            toPublicMessage(message, visitorId)
          ),
          members: members.map(toPublicPresence),
          onlineCount: members.length,
          serverTime: new Date().toISOString(),
        };

        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      }

      await sendSnapshot();

      const interval = setInterval(() => {
        sendSnapshot().catch((error) => {
          closed = true;
          clearInterval(interval);
          controller.error(error);
        });
      }, 2000);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // The client may already have closed the connection.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Set-Cookie": `visitor_id=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
    },
  });
}
