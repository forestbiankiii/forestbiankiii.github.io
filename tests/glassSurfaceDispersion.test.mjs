import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const surface = readFileSync(
  new URL("../components/GlassSurface.tsx", import.meta.url),
  "utf8",
);
const frame = readFileSync(
  new URL("../components/ViewportFrame.tsx", import.meta.url),
  "utf8",
);

test("GlassSurface keeps the RGB displacement chain for non-frame uses", () => {
  assert.equal(surface.match(/<feDisplacementMap/g)?.length, 3);
  assert.equal(surface.match(/<feBlend/g)?.length, 2);
  assert.match(surface, /redChannelRef|greenChannelRef|blueChannelRef/);
});

test("viewport frame uses Studio liquid glass instead of SVG displacement", () => {
  assert.match(frame, /StudioLiquidGlass/);
  assert.doesNotMatch(frame, /redOffset=\{0\}/);
  assert.doesNotMatch(frame, /displacementMap=/);
  assert.doesNotMatch(frame, /import GlassSurface/);
});
