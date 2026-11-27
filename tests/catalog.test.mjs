import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { select, statistics, validate } from "../src/assets/model.mjs";

const seeds = JSON.parse(readFileSync(new URL("../data/experiments.json", import.meta.url), "utf8"));

test("all 16 issue-backed experiments validate, with no invented completed activity", () => {
  validate(seeds);
  assert.equal(seeds.length, 16);
  assert.equal(seeds[0].planned, "2026-12-01");
  assert.equal(seeds.at(-1).planned, "2027-01-21");
  for (const [index, item] of seeds.entries()) {
    assert.ok(item.links.issue.endsWith("/issues/" + (index + 1)));
    assert.equal(item.status, "Backlog");
    assert.equal(item.actualHours, null);
  }
  const dashboard = statistics(seeds);
  assert.equal(dashboard.total, 16);
  for (const key of ["completed", "active", "published", "actualHours", "hourEntries"]) assert.equal(dashboard[key], 0);
  assert.equal(dashboard.domains.reduce((total, group) => total + group.total, 0), 16);
});

test("search, exact filters, no results and sorting apply together", () => {
  assert.deepEqual(select(seeds, { query: "kalman numpy", domain: "State Estimation & Sensor Fusion", status: "Backlog" })
    .map(item => item.id), ["LAB-002", "LAB-006"]);
  assert.equal(select(seeds, { status: "Done" }).length, 0);
  assert.equal(select(seeds, { sort: "latest" })[0].id, "LAB-016");
  const sample = [{ ...seeds[0], planned: "2027-01-01" }, seeds[1]];
  assert.equal(select(sample)[0].id, "LAB-002");
  assert.equal(select(sample, { sort: "id" })[0].id, "LAB-001");
});

test("invalid states, URLs, duplicates and calendar dates are rejected", () => {
  const seed = seeds[0];
  const invalid = [
    { ...seed, slug: "../escape" }, { ...seed, status: "Closed" },
    { ...seed, planned: "2027-02-29" }, { ...seed, actualHours: -1 },
    { ...seed, status: "Done" }, { ...seed, completed: "2026-12-28" },
    { ...seed, links: { article: "javascript:alert(1)" } },
    { ...seed, links: { demo: "//example.org/demo/" } },
    { ...seed, links: { unknown: "https://example.org/" } },
    { ...seed, links: { source: "https://someone@example.org/" } },
    { ...seed, cover: { src: "/assets/../bad.png", alt: "alt" } },
    { ...seed, visualization: { kind: "Live", src: "/assets/result.png", caption: "Figure" } }
  ];
  for (const entry of invalid) assert.throws(() => validate([entry]));
  assert.throws(() => validate([seed, { ...seeds[1], slug: seed.slug }]), /duplicate/);
});

test("progress uses logged hours, active statuses and distinct published articles", () => {
  const link = "https://sepideh.io/sample-article/";
  const entries = validate([
    { ...seeds[0], status: "Done", completed: "2026-12-04", actualHours: 6.5, links: { article: link } },
    { ...seeds[1], status: "Implementation", actualHours: 2.5, links: { article: link } },
    { ...seeds[2], status: "Ready" }
  ]);
  const result = statistics(entries);
  assert.equal(result.completed, 1);
  assert.equal(result.active, 1);
  assert.equal(result.actualHours, 9);
  assert.equal(result.hourEntries, 2);
  assert.equal(result.published, 1);
});

test("a 120-row snapshot works without changes to presentation logic", () => {
  const entries = seeds.concat(Array.from({ length: 104 }, (_, index) => ({
    ...seeds[0], id: "LAB-" + (200 + index), slug: "planned-" + index, title: "Additional experiment " + index
  })));
  assert.equal(statistics(validate(entries)).total, 120);
  assert.equal(select(entries, { query: "additional", sort: "id" }).length, 104);
});
