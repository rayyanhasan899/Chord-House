import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
const python =
  process.env.CHORD_PYTHON ||
  resolve(
    "backend/.venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
const schema = JSON.parse(
  execFileSync(
    python,
    [
      "-c",
      "import json; from app.main import create_app; from app.core.config import Settings; print(json.dumps(create_app(Settings(environment='test',database_url=None)).openapi()))",
    ],
    { cwd: resolve("backend"), encoding: "utf8" },
  ),
);
const contents = {
  "openapi.json": JSON.stringify(schema, null, 2) + "\n",
  "schema.d.ts": astToString(await openapiTS(schema)),
};
mkdirSync("frontend/src/lib/api", { recursive: true });
for (const [name, data] of Object.entries(contents)) {
  const path = "frontend/src/lib/api/" + name;
  if (process.argv.includes("--check")) {
    if (readFileSync(path, "utf8") !== data)
      throw new Error("API contract drift: " + path);
  } else writeFileSync(path, data);
}
console.log(
  "API contracts " + (process.argv.includes("--check") ? "match" : "generated"),
);
