import assert from "node:assert/strict";
import test from "node:test";

import {
  OUTER_SCREEN_EDGE_SIZE,
  getButtonEdgeSize,
  getEdgeBlur,
  getScreenInnerEdgeSize,
} from "../components/glassEdgeSizing.ts";

test("uses the agreed screen-frame edge and blur calculations", () => {
  assert.equal(OUTER_SCREEN_EDGE_SIZE, 1);
  assert.equal(getScreenInnerEdgeSize(10), 1);
  assert.equal(getScreenInnerEdgeSize(84), 3);
  assert.equal(getEdgeBlur(3), 9);
});

test("uses the smaller button dimension for its edge and blur", () => {
  const edgeSize = getButtonEdgeSize(300, 80, 0.07);

  assert.ok(Math.abs(edgeSize - 2.8) < 1e-12);
  assert.ok(Math.abs(getEdgeBlur(edgeSize) - 8.4) < 1e-12);
});
