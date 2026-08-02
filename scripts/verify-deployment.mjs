const appUrl = deploymentUrl(process.env.APP_URL);
const appVersion = required("APP_VERSION");
const readinessToken = required("READINESS_TOKEN", 32);

const home = await request(appUrl);
expectStatus(home, 200, "application home");
expectSameOrigin(home.url, appUrl, "application home");
for (const [header, expected] of [
  ["strict-transport-security", /max-age=/i],
  ["content-security-policy", /default-src/i],
  ["x-content-type-options", /^nosniff$/i],
  ["x-frame-options", /^deny$/i],
]) {
  const value = home.headers.get(header) ?? "";
  if (!expected.test(value)) fail(`Application response is missing a valid ${header} header.`);
}

const health = await request(new URL("/api/health", appUrl));
expectStatus(health, 200, "liveness endpoint");
expectSameOrigin(health.url, appUrl, "liveness endpoint");
const healthBody = await json(health, "liveness endpoint");
if (healthBody.status !== "ok" || healthBody.service !== "beistandplus-web") {
  fail("Liveness endpoint returned an unexpected service status.");
}
if (healthBody.version !== appVersion) {
  fail(`Liveness version '${healthBody.version}' does not match APP_VERSION '${appVersion}'.`);
}
if (!/no-store/i.test(health.headers.get("cache-control") ?? "")) {
  fail("Liveness endpoint must return Cache-Control: no-store.");
}

const readiness = await request(new URL("/api/internal/readiness", appUrl), {
  headers: { Authorization: `Bearer ${readinessToken}` },
});
expectStatus(readiness, 200, "readiness endpoint");
expectSameOrigin(readiness.url, appUrl, "readiness endpoint");
const readinessBody = await json(readiness, "readiness endpoint");
if (readinessBody.status !== "ready" || readinessBody.database !== "ok") {
  fail("Readiness endpoint did not confirm the database connection.");
}

const nativeTargets = process.env.NATIVE_TARGETS ?? "none";
if (!new Set(["none", "ios", "android", "both"]).has(nativeTargets)) {
  fail("NATIVE_TARGETS must be none, ios, android or both.");
}
if (nativeTargets === "ios" || nativeTargets === "both") {
  const appleTeamId = required("APPLE_TEAM_ID");
  const iosBundleId = required("IOS_BUNDLE_ID");

  const apple = await request(new URL("/.well-known/apple-app-site-association", appUrl));
  expectStatus(apple, 200, "Apple association file");
  const appleBody = await json(apple, "Apple association file");
  const appIds = appleBody.applinks?.details?.map((detail) => detail.appID) ?? [];
  if (!appIds.includes(`${appleTeamId}.${iosBundleId}`)) {
    fail("Deployed Apple association file does not contain the release application ID.");
  }
}

if (nativeTargets === "android" || nativeTargets === "both") {
  const androidPackageName = required("ANDROID_PACKAGE_NAME");

  const android = await request(new URL("/.well-known/assetlinks.json", appUrl));
  expectStatus(android, 200, "Android association file");
  const androidBody = await json(android, "Android association file");
  if (
    !Array.isArray(androidBody) ||
    !androidBody.some((entry) => entry.target?.package_name === androidPackageName)
  ) {
    fail("Deployed Android association file does not contain the release package name.");
  }
}

console.log(`Deployment checks passed for ${appUrl.origin} at version ${appVersion}.`);

async function request(url, init = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        ...init,
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "BeistandPlus-Release-Verification/1.0", ...init.headers },
      });
      if (response.status < 500 || attempt === 3) return response;
      await response.body?.cancel();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1_000));
  }
  fail(`Request to ${url} failed: ${lastError?.message ?? "unknown error"}`);
}

async function json(response, label) {
  try {
    return await response.json();
  } catch {
    fail(`${label} did not return valid JSON.`);
  }
}

function deploymentUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("APP_URL must be an absolute HTTPS deployment URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".lovable.app")
  ) {
    fail("APP_URL must be the reviewed HTTPS deployment origin without a path.");
  }
  return url;
}

function required(name, minimumLength = 1) {
  const value = process.env[name]?.trim() ?? "";
  if (value.length < minimumLength) {
    fail(`${name} must contain at least ${minimumLength} characters.`);
  }
  return value;
}

function expectStatus(response, expected, label) {
  if (response.status !== expected) {
    fail(`${label} returned HTTP ${response.status}; expected ${expected}.`);
  }
}

function expectSameOrigin(actual, expected, label) {
  if (new URL(actual).origin !== expected.origin) {
    fail(`${label} redirected outside the deployment origin.`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
