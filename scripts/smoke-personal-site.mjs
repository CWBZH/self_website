const baseUrl = process.env.SITE_URL || "http://localhost:3001";
const studioPassword = process.env.STUDIO_PASSWORD || "studio";

async function request(path, init = {}) {
  const response = await fetch(new URL(path, baseUrl), init);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(body)}`);
  }

  return { response, body };
}

function getCookie(response) {
  const cookie = response.headers.get("set-cookie");
  return cookie?.split(";")[0] || "";
}

const stamp = new Date().toISOString();

console.log(`Smoke testing ${baseUrl}`);

await request("/api/health");
console.log("health ok");

const commentCreate = await request("/api/comments", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    postType: "journal",
    postSlug: "personal-digital-room",
    author: "Smoke Test",
    nickname: "Smoke Test",
    body: `comment smoke ${stamp}`,
    content: `comment smoke ${stamp}`,
  }),
});
const visitorCookie = getCookie(commentCreate.response);
const commentId = commentCreate.body.comment?.id;

if (!visitorCookie || !commentId) {
  throw new Error("comment creation did not return visitor cookie and id");
}

console.log("comment post ok");

await request(`/api/comments/${commentId}`, {
  method: "PATCH",
  headers: { cookie: visitorCookie },
});
console.log("comment like ok");

await request(`/api/comments/${commentId}`, {
  method: "DELETE",
  headers: { cookie: visitorCookie },
});
console.log("comment self-delete ok");

await request("/api/room/presence", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: visitorCookie,
  },
  body: JSON.stringify({
    roomId: "main",
    nickname: "Smoke Test",
  }),
});
console.log("room presence ok");

const eventController = new AbortController();
const eventTimeout = setTimeout(() => eventController.abort(), 3000);
const eventResponse = await fetch(new URL("/api/room/events?roomId=main", baseUrl), {
  headers: {
    cookie: visitorCookie,
  },
  signal: eventController.signal,
});

if (!eventResponse.ok || !eventResponse.body) {
  throw new Error("room events stream did not open");
}

const eventReader = eventResponse.body.getReader();
const eventChunk = await eventReader.read();
clearTimeout(eventTimeout);
await eventReader.cancel();

const eventText = new TextDecoder().decode(eventChunk.value);
if (!eventText.includes("event: snapshot")) {
  throw new Error("room events stream did not emit a snapshot");
}

console.log("room events stream ok");

await request("/api/room/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: visitorCookie,
  },
  body: JSON.stringify({
    author: "Smoke Test",
    nickname: "Smoke Test",
    body: `room smoke ${stamp}`,
    content: `room smoke ${stamp}`,
  }),
});
console.log("room message post ok");

const login = await request("/api/studio/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password: studioPassword }),
});

const studioCookie = getCookie(login.response);

if (!studioCookie) {
  throw new Error("studio login did not return a session cookie");
}

console.log("studio login ok");

await request("/api/studio/comments", {
  headers: { cookie: studioCookie },
});
console.log("studio comments ok");

await request("/api/studio/messages", {
  headers: { cookie: studioCookie },
});
console.log("studio messages ok");

console.log("smoke test complete");
