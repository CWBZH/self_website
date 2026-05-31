import { createHash, randomBytes } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run studio:hash -- "your strong password"');
  process.exit(1);
}

if (password.length < 12) {
  console.error("Use at least 12 characters for the studio password.");
  process.exit(1);
}

const hash = createHash("sha256").update(password).digest("hex");
const sessionSecret = randomBytes(32).toString("hex");

console.log("STUDIO_PASSWORD_HASH=" + hash);
console.log("STUDIO_SESSION_SECRET=" + sessionSecret);
console.log("");
console.log("Put these values in .env.production. Do not commit them.");

