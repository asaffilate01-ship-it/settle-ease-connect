import { readFileSync, writeFileSync } from "node:fs";

const minimumMigration = "20260802202000_case_workflow_security.sql";
const commonChecks = [
  "quality",
  "security",
  "databaseMigrations",
  "rlsMatrix",
  "anonymousWrites",
  "rollbackTest",
  "backupsAndRestore",
  "monitoring",
  "incidentResponse",
  "accessibility",
];
const productionChecks = [
  "credentialRotation",
  "legalApproval",
  "providerContracts",
  "livePayments",
  "emailAuthentication",
  "partnerDelivery",
  "penetrationTest",
];
const nativeChecks = ["nativeSigning", "nativeDeviceTests", "storeCompliance", "appLinks"];

const options = parseArguments(process.argv.slice(2));
const evidenceFile = options.file;
const expectedEnvironment = options.environment;
const expectedCommit = options.commit;
const expectedNativeTargets = options.native;
const outputFile = options.output;

if (!evidenceFile || !expectedEnvironment) {
  fail([
    "Usage: node scripts/validate-release-evidence.mjs --file <path> --environment <staging|production> [--commit <sha>] [--native <none|ios|android|both>] [--output <path>]",
  ]);
}
if (!new Set(["staging", "production"]).has(expectedEnvironment)) {
  fail(["--environment must be staging or production."]);
}
if (
  expectedNativeTargets &&
  !new Set(["none", "ios", "android", "both"]).has(expectedNativeTargets)
) {
  fail(["--native must be none, ios, android or both."]);
}

let evidence;
try {
  evidence = JSON.parse(readFileSync(evidenceFile, "utf8"));
} catch (error) {
  fail([`Could not read release evidence at ${evidenceFile}: ${error.message}`]);
}

const failures = validateEvidence(evidence, {
  environment: expectedEnvironment,
  commit: expectedCommit,
  nativeTargets: expectedNativeTargets,
});
if (failures.length > 0) fail(failures);

const resolvedEvidence = structuredClone(evidence);
if (resolvedEvidence.commitSha === "FROM_WORKFLOW") resolvedEvidence.commitSha = expectedCommit;
if (outputFile) {
  writeFileSync(
    outputFile,
    `${JSON.stringify({ ...resolvedEvidence, validatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

const targets = Object.entries(evidence.releaseTargets)
  .filter(([, enabled]) => enabled)
  .map(([target]) => target)
  .join(", ");
console.log(
  `Release evidence passed for ${evidence.environment} ${evidence.version} (${targets}) at ${resolvedEvidence.commitSha}.`,
);

export function validateEvidence(evidence, expected) {
  const failures = [];
  if (!isRecord(evidence)) return ["Release evidence must be a JSON object."];

  requireEqual(failures, evidence.schemaVersion, 1, "schemaVersion");
  requireEqual(failures, evidence.environment, expected.environment, "environment");
  requireString(failures, evidence.version, "version", /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
  if (evidence.commitSha === "FROM_WORKFLOW") {
    if (!expected.commit || !/^[a-f0-9]{40}$/i.test(expected.commit)) {
      failures.push("commitSha FROM_WORKFLOW requires --commit with a full Git commit SHA.");
    }
  } else {
    requireString(failures, evidence.commitSha, "commitSha", /^[a-f0-9]{40}$/i);
    if (expected.commit) requireEqual(failures, evidence.commitSha, expected.commit, "commitSha");
  }
  requireHttpsUrl(failures, evidence.appUrl, "appUrl", { forbidPreview: true });
  requireDate(failures, evidence.evaluatedAt, "evaluatedAt", { past: true, maxAgeDays: 30 });
  requireDate(failures, evidence.expiresAt, "expiresAt", { future: true, maxFutureDays: 30 });
  requireEqual(failures, evidence.migration, minimumMigration, "migration");

  if (!isRecord(evidence.releaseTargets)) {
    failures.push("releaseTargets must be an object.");
  } else {
    for (const target of ["web", "ios", "android"]) {
      if (typeof evidence.releaseTargets[target] !== "boolean") {
        failures.push(`releaseTargets.${target} must be true or false.`);
      }
    }
    if (
      !evidence.releaseTargets.web &&
      !evidence.releaseTargets.ios &&
      !evidence.releaseTargets.android
    ) {
      failures.push("At least one release target must be enabled.");
    }
  }

  const actualNativeTargets = nativeTargetName(evidence.releaseTargets);
  if (expected.nativeTargets && actualNativeTargets !== expected.nativeTargets) {
    failures.push(
      `releaseTargets declares native target '${actualNativeTargets}', but --native expected '${expected.nativeTargets}'.`,
    );
  }

  requireObject(failures, evidence.approval, "approval");
  requireString(failures, evidence.approval?.releaseManager, "approval.releaseManager");
  requireString(failures, evidence.approval?.security, "approval.security");
  if (expected.environment === "production") {
    requireString(failures, evidence.approval?.legal, "approval.legal");
  }

  requireObject(failures, evidence.rollback, "rollback");
  requireString(failures, evidence.rollback?.owner, "rollback.owner");
  requireString(failures, evidence.rollback?.threshold, "rollback.threshold");
  requireString(failures, evidence.rollback?.procedure, "rollback.procedure");
  requireDate(failures, evidence.rollback?.backupVerifiedAt, "rollback.backupVerifiedAt", {
    past: true,
    maxAgeDays: 90,
  });

  requireObject(failures, evidence.checks, "checks");
  for (const check of commonChecks)
    requireTrue(failures, evidence.checks?.[check], `checks.${check}`);
  if (expected.environment === "production") {
    for (const check of productionChecks) {
      requireTrue(failures, evidence.checks?.[check], `checks.${check}`);
    }
  }
  if (actualNativeTargets !== "none") {
    for (const check of nativeChecks)
      requireTrue(failures, evidence.checks?.[check], `checks.${check}`);
  }

  requireObject(failures, evidence.artifacts, "artifacts");
  for (const artifact of [
    "qualityRunUrl",
    "securityRunUrl",
    "migrationEvidenceUrl",
    "restoreEvidenceUrl",
  ]) {
    requireHttpsUrl(failures, evidence.artifacts?.[artifact], `artifacts.${artifact}`);
  }
  if (expected.environment === "production") {
    for (const artifact of ["sbomUrl", "legalApprovalUrl", "penetrationTestUrl"]) {
      requireHttpsUrl(failures, evidence.artifacts?.[artifact], `artifacts.${artifact}`);
    }
  }
  if (actualNativeTargets !== "none") {
    requireHttpsUrl(
      failures,
      evidence.artifacts?.nativeTestEvidenceUrl,
      "artifacts.nativeTestEvidenceUrl",
    );
  }

  return failures;
}

function nativeTargetName(targets) {
  if (!isRecord(targets)) return "none";
  if (targets.ios && targets.android) return "both";
  if (targets.ios) return "ios";
  if (targets.android) return "android";
  return "none";
}

function parseArguments(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) continue;
    const [rawName, inlineValue] = argument.slice(2).split("=", 2);
    const value = inlineValue ?? args[index + 1];
    parsed[rawName] = value;
    if (inlineValue === undefined) index += 1;
  }
  return parsed;
}

function requireEqual(failures, actual, expected, name) {
  if (actual !== expected) failures.push(`${name} must equal ${JSON.stringify(expected)}.`);
}

function requireObject(failures, value, name) {
  if (!isRecord(value)) failures.push(`${name} must be an object.`);
}

function requireString(failures, value, name, pattern) {
  if (typeof value !== "string" || !value.trim()) {
    failures.push(`${name} must be a non-empty string.`);
  } else if (pattern && !pattern.test(value)) {
    failures.push(`${name} has an invalid format.`);
  }
}

function requireTrue(failures, value, name) {
  if (value !== true) failures.push(`${name} must be true and backed by evidence.`);
}

function requireDate(
  failures,
  value,
  name,
  { past = false, future = false, maxAgeDays, maxFutureDays } = {},
) {
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(timestamp)) {
    failures.push(`${name} must be an ISO-8601 date.`);
  } else if (past && timestamp > Date.now()) {
    failures.push(`${name} cannot be in the future.`);
  } else if (future && timestamp <= Date.now()) {
    failures.push(`${name} must be in the future.`);
  } else if (maxAgeDays && timestamp < Date.now() - maxAgeDays * 24 * 60 * 60 * 1000) {
    failures.push(`${name} must be no more than ${maxAgeDays} days old.`);
  } else if (maxFutureDays && timestamp > Date.now() + maxFutureDays * 24 * 60 * 60 * 1000) {
    failures.push(`${name} must be no more than ${maxFutureDays} days in the future.`);
  }
}

function requireHttpsUrl(failures, value, name, { forbidPreview = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    failures.push(`${name} must be an absolute HTTPS URL.`);
    return;
  }
  if (url.protocol !== "https:") failures.push(`${name} must use HTTPS.`);
  if (url.username || url.password) failures.push(`${name} must not include credentials.`);
  if (
    forbidPreview &&
    (url.hostname === "localhost" ||
      url.hostname.endsWith(".localhost") ||
      url.hostname.endsWith(".lovable.app"))
  ) {
    failures.push(
      `${name} must use the reviewed deployment domain, not localhost or a preview host.`,
    );
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fail(failures) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
