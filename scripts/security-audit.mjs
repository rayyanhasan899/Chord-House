import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Temporary, development-only exception. Runtime dependencies have no exception.
const exception = {
  advisory: "https://github.com/advisories/GHSA-g3hv-75wg-m249",
  expires: "2026-12-11T00:00:00Z",
  reason:
    "Lint-only minimatch globparts amplification; no app request path uses these packages. Patched override broke workspace dependency validity; compatible upstream resolution is required.",
};
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run with npm run security:audit");
mkdirSync(".artifacts/security", { recursive: true });
function audit(args, filename) {
  const result = spawnSync(
    process.execPath,
    [npmCli, "audit", "--json", ...args],
    {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 120000,
    },
  );
  if (result.error || ![0, 1].includes(result.status))
    throw new Error(
      "Dependency audit did not complete: " +
        (result.error?.code || result.signal || result.status),
    );
  const report = JSON.parse(result.stdout);
  if (report.error || !report.metadata?.vulnerabilities)
    throw new Error("Dependency audit response is incomplete");
  writeFileSync(
    resolve(".artifacts/security", filename),
    JSON.stringify(report, null, 2),
  );
  return report;
}
const production = audit(["--omit=dev"], "npm-runtime.json");
if (production.metadata.vulnerabilities.total !== 0)
  throw new Error("Runtime dependency advisory requires remediation");
const full = audit([], "npm-full.json");
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
function covered(name, visited = new Set()) {
  if (visited.has(name)) return false;
  const vulnerability = full.vulnerabilities[name];
  if (!vulnerability || !["low", "moderate"].includes(vulnerability.severity))
    return false;
  if (!vulnerability.nodes.every((node) => lock.packages[node]?.dev === true))
    return false;
  const next = new Set(visited).add(name);
  return (
    vulnerability.via.length > 0 &&
    vulnerability.via.every((item) =>
      typeof item === "string"
        ? covered(item, next)
        : item.url === exception.advisory,
    )
  );
}
for (const name of Object.keys(full.vulnerabilities)) {
  if (Date.now() >= Date.parse(exception.expires) || !covered(name))
    throw new Error(
      "Unreviewed, expired or runtime dependency finding: " + name,
    );
}
writeFileSync(
  ".artifacts/security/npm-policy.json",
  JSON.stringify(
    { exception, findings: full.metadata.vulnerabilities },
    null,
    2,
  ),
);
console.log(
  `Runtime advisories: 0. Full scan: ${full.metadata.vulnerabilities.total}; only the documented development exception is permitted until ${exception.expires}.`,
);
