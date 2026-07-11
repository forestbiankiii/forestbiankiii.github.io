import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/ViewportFrame.tsx", import.meta.url),
  "utf8",
);

test("matches the deployed gray outer contour", () => {
  assert.match(source, /viewport-frame-outer-gradient/);
  assert.match(source, /renderOuterGradientPaths/);
  assert.match(source, /StudioLiquidGlass/);
  assert.doesNotMatch(source, /buildConnectedDisplacementMap/);
  assert.doesNotMatch(source, /import GlassSurface/);
});

test("renders the frame as one seamless liquid-glass surface", () => {
  assert.match(source, /className="viewport-frame-glass"/);
  assert.match(source, /buildConnectedFrameMask\(geometry\)/);
  assert.match(source, /maxDpr=\{1\}/);
  assert.doesNotMatch(source, /targetFps/);
  assert.doesNotMatch(source, /buildGlassWindows/);
  assert.doesNotMatch(source, /viewport-frame-glass--/);
  assert.doesNotMatch(source, /glassWindows\.map/);
});
