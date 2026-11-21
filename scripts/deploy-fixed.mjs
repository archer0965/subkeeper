#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(
  fs.readFileSync(path.join(root, "deploy.config.json"), "utf8"),
);
const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN");
  process.exit(1);
}

const envLocal = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const get = (k) =>
  (envLocal.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1]?.trim();

const pairs = [
  ["NEXT_PUBLIC_SUPABASE_URL", get("NEXT_PUBLIC_SUPABASE_URL")],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", get("NEXT_PUBLIC_SUPABASE_ANON_KEY")],
  ["NEXT_PUBLIC_HUB_URL", get("NEXT_PUBLIC_HUB_URL")],
  ["NEXT_PUBLIC_SITE_URL", get("NEXT_PUBLIC_SITE_URL")],
];

const args = [
  "--yes",
  "vercel@latest",
  "deploy",
  "--yes",
  "--prod",
  "--token",
  token,
  "--scope",
  cfg.orgId,
];
for (const [k, v] of pairs) {
  if (!v) {
    console.error("Missing", k, "in .env.local");
    process.exit(1);
  }
  args.push("--env", `${k}=${v}`, "--build-env", `${k}=${v}`);
}

console.log("Deploying to", cfg.productionUrl);
const r = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    VERCEL_ORG_ID: cfg.orgId,
    VERCEL_PROJECT_ID: cfg.projectId,
  },
});
process.exit(r.status ?? 1);
