import assert from "node:assert/strict";
import test from "node:test";
import { buildIndex, countsFor } from "./index-shape.js";

test("empty database returns meta and an empty entries array", () => {
  const index = buildIndex(null, [], []);
  assert.deepEqual(index, {
    schema_version: 1,
    generated: null,
    title: "Who Cares",
    changelog: [],
    counts: {
      total: 0,
      companies: 0,
      ideas: 0,
      deep_dive_done: 0,
      deep_dive_pending: 0,
      ideas_standing: 0,
      ideas_open: 0,
      ideas_killed: 0,
      ideas_parked: 0,
    },
    entries: [],
  });
});

test("counts follow entry type and status", () => {
  const entries = [
    { type: "company", status: "deep_dive_done" },
    { type: "company", status: "deep_dive_pending" },
    { type: "idea", status: "standing" },
    { type: "idea", status: "open" },
    { type: "idea", status: "killed" },
    { type: "idea", status: "parked" },
  ];
  assert.deepEqual(countsFor(entries), {
    total: 6,
    companies: 2,
    ideas: 4,
    deep_dive_done: 1,
    deep_dive_pending: 1,
    ideas_standing: 1,
    ideas_open: 1,
    ideas_killed: 1,
    ideas_parked: 1,
  });
});

test("buildIndex keeps document order and changelog dates", () => {
  const index = buildIndex(
    { schema_version: 1, generated: "2026-10-05", title: "Who Cares" },
    [{ date: "2026-10-05", text: "Seeded companies." }],
    [{ id: "a", type: "company", status: "deep_dive_done", name: "A" }],
  );
  assert.equal(index.entries.length, 1);
  assert.equal(index.entries[0].id, "a");
  assert.equal(index.changelog[0].date, "2026-10-05");
  assert.equal(index.counts.total, 1);
  assert.equal(index.counts.companies, 1);
});
