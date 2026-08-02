import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const rawLockfile = readFileSync("package-lock.json", "utf8");
const lockfile = JSON.parse(rawLockfile);
const failures = [];

if (lockfile.lockfileVersion !== 3) {
  failures.push("package-lock.json must use lockfileVersion 3.");
}

const root = lockfile.packages?.[""];
if (!root || root.name !== packageJson.name || root.version !== packageJson.version) {
  failures.push("The lockfile root package must match package.json name and version.");
}

const packages = Object.entries(lockfile.packages ?? {});
if (packages.length < 2) failures.push("package-lock.json does not contain a dependency tree.");

for (const [path, metadata] of packages) {
  if (!metadata?.resolved) continue;
  let resolved;
  try {
    resolved = new URL(metadata.resolved);
  } catch {
    failures.push(`${path || "root"} has a non-URL resolved source.`);
    continue;
  }

  if (resolved.protocol !== "https:" || resolved.hostname !== "registry.npmjs.org") {
    failures.push(
      `${path || "root"} resolves from ${resolved.origin}; only the public npm registry is allowed.`,
    );
  }
  if (!metadata.integrity?.startsWith("sha512-")) {
    failures.push(`${path || "root"} is missing SHA-512 package integrity.`);
  }
}

for (const marker of ["pkg.dev", "sandbox-npm-cache", "localhost", "127.0.0.1"]) {
  if (rawLockfile.includes(marker)) failures.push(`package-lock.json contains forbidden source: ${marker}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  console.error("Regenerate the lockfile with npm 10 against https://registry.npmjs.org/.");
  process.exit(1);
}

console.log(`Lockfile provenance passed for ${packages.length - 1} package entries.`);

