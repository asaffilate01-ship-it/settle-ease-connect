import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const capacitor = readFileSync("capacitor.config.ts", "utf8");
const android = readFileSync("android/app/build.gradle", "utf8");
const ios = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");

const version = packageJson.version;
if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  fail("package.json version must use semantic versioning.");
}

const androidVersion = capture(android, /versionName\s+"([^"]+)"/, "Android versionName");
const androidBuild = Number(capture(android, /versionCode\s+(\d+)/, "Android versionCode"));
const iosVersions = uniqueMatches(ios, /MARKETING_VERSION = ([^;]+);/g);
const iosBuilds = uniqueMatches(ios, /CURRENT_PROJECT_VERSION = ([^;]+);/g);

if (androidVersion !== version) fail(`Android versionName ${androidVersion} must equal ${version}.`);
if (!Number.isInteger(androidBuild) || androidBuild < 1) fail("Android versionCode must be positive.");
if (iosVersions.length !== 1 || iosVersions[0] !== version) {
  fail(`Every iOS MARKETING_VERSION must equal ${version}.`);
}
if (iosBuilds.length !== 1 || !/^\d+$/.test(iosBuilds[0]) || Number(iosBuilds[0]) < 1) {
  fail("Every iOS CURRENT_PROJECT_VERSION must use the same positive integer.");
}

for (const [source, pattern, label] of [
  [capacitor, /appId:\s*"de\.beistandplus\.app"/, "Capacitor app ID"],
  [android, /applicationId\s+"de\.beistandplus\.app"/, "Android application ID"],
  [ios, /PRODUCT_BUNDLE_IDENTIFIER = de\.beistandplus\.app;/, "iOS bundle ID"],
]) {
  if (!pattern.test(source)) fail(`${label} must equal de.beistandplus.app.`);
}

console.log(
  `Native identity passed: ${version}, Android build ${androidBuild}, iOS build ${iosBuilds[0]}.`,
);

function capture(value, pattern, label) {
  const match = value.match(pattern);
  if (!match) fail(`${label} is missing.`);
  return match[1];
}

function uniqueMatches(value, pattern) {
  return [...new Set([...value.matchAll(pattern)].map((match) => match[1]))];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
