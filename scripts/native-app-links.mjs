import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const mode = process.argv.includes("--write") ? "write" : "check";
const rootArgument = process.argv.find((argument) => argument.startsWith("--root="));
const targetsArgument = process.argv.find((argument) => argument.startsWith("--targets="));
const targets = targetsArgument?.slice("--targets=".length) ?? "both";
if (!new Set(["ios", "android", "both"]).has(targets)) {
  fail(["--targets must be ios, android or both."]);
}
const projectRoot = resolve(rootArgument?.slice("--root=".length) ?? process.cwd());
const publicDirectory = join(projectRoot, "public", ".well-known");
const applePath = join(publicDirectory, "apple-app-site-association");
const androidPath = join(publicDirectory, "assetlinks.json");

const configuration = readConfiguration(process.env, targets);
const expected = buildAssociationFiles(configuration);

if (mode === "write") {
  mkdirSync(publicDirectory, { recursive: true });
  if (expected.apple) writeFileSync(applePath, `${JSON.stringify(expected.apple, null, 2)}\n`);
  if (expected.android)
    writeFileSync(androidPath, `${JSON.stringify(expected.android, null, 2)}\n`);
  console.log(`Wrote native association files for ${configuration.domain}.`);
} else {
  const failures = [];
  if (expected.apple) validateFile(failures, applePath, expected.apple, "Apple Universal Links");
  if (expected.android) {
    validateFile(failures, androidPath, expected.android, "Android App Links");
  }
  if (failures.length > 0) fail(failures);
  console.log(`Native association files match the release identities for ${configuration.domain}.`);
}

export function readConfiguration(environment, targets = "both") {
  const failures = [];
  const includesIos = targets === "ios" || targets === "both";
  const includesAndroid = targets === "android" || targets === "both";
  const serverUrl = parseDeploymentUrl(failures, environment.CAPACITOR_SERVER_URL);
  const appleTeamId = environment.APPLE_TEAM_ID?.trim();
  const iosBundleId = environment.IOS_BUNDLE_ID?.trim();
  const androidPackageName = environment.ANDROID_PACKAGE_NAME?.trim();
  const fingerprints = (environment.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim().toUpperCase())
    .filter(Boolean);

  if (includesIos && !/^[A-Z0-9]{10}$/.test(appleTeamId ?? "")) {
    failures.push("APPLE_TEAM_ID must be the 10-character Apple Developer Team ID.");
  }
  if (includesIos && !/^[A-Za-z0-9.-]+$/.test(iosBundleId ?? "")) {
    failures.push("IOS_BUNDLE_ID must be a reverse-DNS bundle identifier.");
  }
  if (includesAndroid && !/^[A-Za-z0-9._]+$/.test(androidPackageName ?? "")) {
    failures.push("ANDROID_PACKAGE_NAME must be a valid Android application ID.");
  }
  if (includesIos && iosBundleId && iosBundleId !== "de.beistandplus.app") {
    failures.push("IOS_BUNDLE_ID must match the committed Capacitor ID de.beistandplus.app.");
  }
  if (includesAndroid && androidPackageName && androidPackageName !== "de.beistandplus.app") {
    failures.push(
      "ANDROID_PACKAGE_NAME must match the committed Capacitor ID de.beistandplus.app.",
    );
  }
  if (includesAndroid && fingerprints.length === 0) {
    failures.push("ANDROID_SHA256_FINGERPRINTS must contain at least one release fingerprint.");
  }
  for (const fingerprint of includesAndroid ? fingerprints : []) {
    if (!/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(fingerprint)) {
      failures.push(`Invalid Android SHA-256 signing fingerprint: ${fingerprint || "<empty>"}.`);
    }
  }
  if (failures.length > 0) fail(failures);

  return {
    domain: serverUrl.hostname,
    appleTeamId,
    iosBundleId,
    androidPackageName,
    fingerprints: [...new Set(fingerprints)],
    includesIos,
    includesAndroid,
  };
}

export function buildAssociationFiles(configuration) {
  return {
    apple: configuration.includesIos
      ? {
          applinks: {
            apps: [],
            details: [
              {
                appID: `${configuration.appleTeamId}.${configuration.iosBundleId}`,
                components: [
                  { "/": "/auth*", comment: "Authentication and recovery routes" },
                  { "/": "/app/*", comment: "Customer application routes" },
                  { "/": "/portal/*", comment: "Professional portal routes" },
                ],
              },
            ],
          },
        }
      : null,
    android: configuration.includesAndroid
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: configuration.androidPackageName,
              sha256_cert_fingerprints: configuration.fingerprints,
            },
          },
        ]
      : null,
  };
}

function parseDeploymentUrl(failures, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    failures.push("CAPACITOR_SERVER_URL must be an absolute HTTPS URL.");
    return new URL("https://invalid.example");
  }
  if (url.protocol !== "https:") failures.push("CAPACITOR_SERVER_URL must use HTTPS.");
  if (
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".lovable.app")
  ) {
    failures.push("CAPACITOR_SERVER_URL must be the reviewed deployment origin without a path.");
  }
  return url;
}

function validateFile(failures, path, expected, label) {
  if (!existsSync(path)) {
    failures.push(`${label} file is missing: ${path}`);
    return;
  }
  let actual;
  try {
    actual = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    failures.push(`${label} file is not valid JSON: ${path}`);
    return;
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label} file does not match the configured release identity. Regenerate it.`);
  }
}

function fail(failures) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
