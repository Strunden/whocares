import assert from "node:assert/strict";
import test from "node:test";
import { decodeSlug } from "./path-slug.js";

test("good slugs decode", () => {
  assert.equal(decodeSlug("heliad"), "heliad");
  assert.equal(decodeSlug("company%2Dvoize"), "company-voize");
});

test("malformed escapes give null instead of throwing", () => {
  assert.equal(decodeSlug("%E0"), null);
  assert.equal(decodeSlug("%"), null);
});
