import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/GlassSurface.tsx", import.meta.url),
  "utf8",
);

test("preserves the deployed refracted alpha instead of forcing black pixels", () => {
  assert.doesNotMatch(source, /result="refractedOutput"/);
  assert.doesNotMatch(source, /0 0 0 0 1/);
});
