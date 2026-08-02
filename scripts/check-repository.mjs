import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const failures = [];
const mustExist = [
  ".env.example",
  ".github/workflows/quality.yml",
  ".github/workflows/security.yml",
  "README-FIRST.md",
  "SECURITY.md",
  "scripts/validate-production-env.mjs",
  "supabase/migrations/20260802202000_case_workflow_security.sql",
  "tests/production-hardening.test.ts",
  "tests/operational-workflows.test.ts",
  "tests/go-live-readiness.test.ts",
  "native-shell/index.html",
  "ios/App/App.xcodeproj/project.pbxproj",
  "android/app/build.gradle",
  "playwright.config.ts",
  "src/routes/api/internal/retention.ts",
  "tests/e2e/public-smoke.spec.ts",
];
for (const path of mustExist)
  if (!existsSync(path)) failures.push(`Missing required file: ${path}`);
for (const path of [
  ".env",
  ".env.development",
  "download",
  "download (1)",
  "download (2)",
  "quality.yml",
  "production-hardening.test.ts",
  "operational-workflows.test.ts",
]) {
  if (existsSync(path)) failures.push(`Unsafe or misplaced file exists: ${path}`);
}

const auth = readFileSync("src/routes/auth.tsx", "utf8");
if (/DevLoginPanel|DEV_PASSWORD|admin@beistand\.de/.test(auth))
  failures.push("Development login code remains in auth route.");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}
const applicationSource = sourceFiles("src")
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
if (/beistand2026!|admin@beistand\.de|Dev-only test logins/.test(applicationSource)) {
  failures.push("Seeded development identities or shared passwords remain in application source.");
}

const capacitor = readFileSync("capacitor.config.ts", "utf8");
if (/lovable\.app|cleartext:\s*true|app\.lovable/.test(capacitor)) {
  failures.push("Capacitor contains a preview URL, cleartext traffic, or a development app ID.");
}
const pushClient = readFileSync("src/lib/push-client.ts", "utf8");
if (/VAPID_PUBLIC_KEY\s*=\s*["'][A-Za-z0-9_-]{40}/.test(pushClient)) {
  failures.push("A VAPID key is hardcoded in the client source.");
}

const rootSql = readdirSync("supabase", { withFileTypes: true }).filter(
  (entry) => entry.isFile() && entry.name.endsWith(".sql"),
);
if (rootSql.length) failures.push("SQL migrations must exist only in supabase/migrations.");

const migrationHashes = new Map();
for (const entry of readdirSync("supabase/migrations", { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".sql")) continue;
  const hash = createHash("sha256")
    .update(readFileSync(`supabase/migrations/${entry.name}`))
    .digest("hex");
  const duplicateOf = migrationHashes.get(hash);
  if (duplicateOf) {
    failures.push(`Duplicate migration content: ${entry.name} and ${duplicateOf}`);
  } else {
    migrationHashes.set(hash, entry.name);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Repository safety checks passed.");
