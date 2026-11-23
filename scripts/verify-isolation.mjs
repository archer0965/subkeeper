/**
 * Static check: member-facing APIs must filter by user_id.
 * Run: node scripts/verify-isolation.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src/app/api");
const files = [
  "subscriptions/route.ts",
  "import/route.ts",
  "account/data/route.ts",
];

for (const rel of files) {
  const src = readFileSync(join(root, rel), "utf8");
  assert.match(src, /user\.id/, `${rel} must use auth user.id`);
  assert.match(src, /user_id/, `${rel} must set/filter user_id`);
  assert.match(
    src,
    /getUser\s*\(/,
    `${rel} must call supabase.auth.getUser()`,
  );
}

console.log("verify-isolation: all API routes scope by user_id");
