import { cpSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const assets = [
  ["src/config/girlfriends.json", "dist/config/girlfriends.json"],
  ["src/config/forbidden-rules.json", "dist/config/forbidden-rules.json"],
  ["src/config/sensitive-topics.json", "dist/config/sensitive-topics.json"],
  ["src/config/events.json", "dist/config/events.json"],
  ["src/db/schema.sql", "dist/db/schema.sql"]
];

for (const [from, to] of assets) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}
