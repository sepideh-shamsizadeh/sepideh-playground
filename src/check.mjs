import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const directory of ["src", "tests"]) {
  for (const entry of readdirSync(directory, { recursive: true }).filter(file => /[.]([cm]js)$/.test(file))) {
    const check = spawnSync(process.execPath, ["--check", `${directory}/${entry}`], { stdio: "inherit" });
    if (check.status !== 0) process.exit(check.status || 1);
  }
}
