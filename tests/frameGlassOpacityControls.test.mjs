import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(
  new URL("../components/GlassSurface.css", import.meta.url),
  "utf8",
);
const globals = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("removes frame theme tint controls and leaves the frame background transparent", () => {
  assert.doesNotMatch(page, /FrameGlassOpacityControls|frameGlassOpacity/);
  assert.doesNotMatch(globals, /frame-glass-opacity-controls/);
  assert.doesNotMatch(globals, /--glass-tint-(rgb|opacity)/);
  assert.doesNotMatch(styles, /frame-glass-(dark|light)-opacity/);
  assert.doesNotMatch(styles, /viewport-frame-glass-opacity/);
  assert.match(
    styles,
    /\.studio-liquid-glass\.viewport-frame-glass\s*\{[\s\S]*?background:\s*transparent/,
  );
  assert.equal(
    existsSync(
      new URL("../components/FrameGlassOpacityControls.tsx", import.meta.url),
    ),
    false,
  );
});
