import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

test("build generates every static detail page and indexes only production", () => {
  for (const mode of ["production", "preview"]) {
    const output = spawnSync(process.execPath, ["src/build.mjs"], { encoding: "utf8", env: { ...process.env, VERCEL_ENV: mode } });
    assert.equal(output.status, 0, output.stderr);
    const read = path => readFileSync("dist/" + path, "utf8");
    const entries = JSON.parse(readFileSync("data/experiments.json", "utf8"));
    assert.equal(/noindex/.test(read("index.html")), mode === "preview");
    assert.match(read("index.html"), /canonical" href="https:\/\/playground\.sepideh\.io\//);
    assert.match(read("robots.txt"), mode === "production" ? /Allow: \// : /Disallow: \//);
    assert.equal((read("lab/index.html").match(/data-id="LAB-/g) ?? []).length, entries.length);
    for (const item of entries) {
      const html = read(`lab/${item.slug}/index.html`);
      assert.ok(html.includes(item.links.issue), item.id);
      assert.match(html, /Evaluation plan/);
      assert.match(html, /Actual hours Not logged/);
    }
    assert.equal(existsSync("dist/data/experiments.json"), false);
    assert.equal(existsSync("dist/404.html"), true);
  }
});
