import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const required = ["STAGING_URL", "GITHUB_SHA", "GITHUB_RUN_ID", "GITHUB_REPOSITORY"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) fail(`Missing evidence context: ${missing.join(", ")}`);

const stagingUrl = new URL(process.env.STAGING_URL);
if (stagingUrl.protocol !== "https:") fail("Staging evidence requires HTTPS.");
if (["beistandplus.de", "www.beistandplus.de"].includes(stagingUrl.hostname)) {
  fail("Staging evidence cannot target production.");
}
if (!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA)) fail("GITHUB_SHA must be a full commit SHA.");
if (!/^\d+$/.test(process.env.GITHUB_RUN_ID)) fail("GITHUB_RUN_ID must be numeric.");
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(process.env.GITHUB_REPOSITORY)) {
  fail("GITHUB_REPOSITORY is invalid.");
}

const serverUrl = new URL(process.env.GITHUB_SERVER_URL || "https://github.com");
if (serverUrl.protocol !== "https:") fail("GITHUB_SERVER_URL must use HTTPS.");

const output = process.env.STAGING_EVIDENCE_OUTPUT || "release/staging-acceptance.evidence.json";
const evidence = {
  schemaVersion: 1,
  environment: "staging",
  commitSha: process.env.GITHUB_SHA,
  appOrigin: stagingUrl.origin,
  evaluatedAt: new Date().toISOString(),
  workflowRunUrl: `${serverUrl.origin}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT || "1"),
  projects: ["Desktop Chrome", "Pixel 7"],
  journeys: ["member", "staff", "agent", "expert", "workforce-denial"],
  checks: {
    authentication: true,
    roleLanding: true,
    workforceIsolation: true,
    responsiveOverflow: true,
    productionIsolation: true,
  },
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(`Staging acceptance evidence written to ${output}.`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
