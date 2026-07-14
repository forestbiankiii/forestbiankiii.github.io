import assert from "node:assert/strict";
import test from "node:test";

import * as cardParams from "../components/liquidGlassCardParams.ts";

test("maps the pointer to the reference card's 25 degree tilt", () => {
  assert.equal(cardParams.LIQUID_GLASS_CARD_TILT_FACTOR, 25);
  assert.equal(cardParams.LIQUID_GLASS_CARD_PERSPECTIVE, 800);
  assert.equal(typeof cardParams.getLiquidGlassCardTilt, "function");

  const rect = { left: 100, top: 200, width: 340, height: 200 };

  assert.deepEqual(cardParams.getLiquidGlassCardTilt(rect, 270, 300), {
    rotateX: 0,
    rotateY: 0,
  });
  assert.deepEqual(cardParams.getLiquidGlassCardTilt(rect, 440, 200), {
    rotateX: 25,
    rotateY: 25,
  });
  assert.deepEqual(cardParams.getLiquidGlassCardTilt(rect, 100, 400), {
    rotateX: -25,
    rotateY: -25,
  });
});
