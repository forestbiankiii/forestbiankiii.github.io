import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(
  new URL("../components/GlassSurface.css", import.meta.url),
  "utf8",
);

test("exposes independent frame-only opacity sliders for both themes", () => {
  assert.match(page, /frameGlassOpacity/);
  assert.match(page, /深色主题·白色/);
  assert.match(page, /白色主题·黑色/);
  assert.match(styles, /--frame-glass-dark-opacity/);
  assert.match(styles, /--frame-glass-light-opacity/);
  assert.match(styles, /--viewport-frame-glass-opacity/);
});
