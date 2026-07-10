import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL(
  "../components/modelBackground.ts",
  import.meta.url,
);

test("defines the local Ferrari background contract", async () => {
  assert.equal(existsSync(moduleUrl), true);

  const background = await import(moduleUrl.href);

  assert.equal(
    background.FERRARI_MODEL_PATH,
    "/models/2025_ferrari_296_gt3_verstappen_racing.glb",
  );
  assert.equal(
    background.getModelBackgroundColor("black"),
    "#000000",
  );
  assert.equal(
    background.getModelBackgroundColor("white"),
    "#ffffff",
  );
  assert.equal(
    background.MODEL_BACKGROUND_VIEWER_PROPS.showScreenshotButton,
    false,
  );
  assert.equal(
    background.MODEL_BACKGROUND_VIEWER_PROPS.modelXOffset,
    0.3,
  );
  assert.equal(
    background.MODEL_BACKGROUND_VIEWER_PROPS.modelYOffset,
    -0.3,
  );
  assert.equal(
    background.MODEL_BACKGROUND_VIEWER_PROPS.enableManualRotation,
    false,
  );
  assert.equal(
    background.MODEL_BACKGROUND_VIEWER_PROPS.enableManualZoom,
    false,
  );
});

test("centers an off-origin model after normalizing its radius", async () => {
  const background = await import(moduleUrl.href);

  assert.equal(
    typeof background.getNormalizedModelTransform,
    "function",
  );

  assert.deepEqual(
    background.getNormalizedModelTransform(
      { x: 0.4, y: -0.1, z: -0.5 },
      0.02,
    ),
    {
      scale: 25,
      position: { x: -10, y: 2.5, z: 12.5 },
    },
  );
});

test("preserves centering when applying a model scale multiplier", async () => {
  const background = await import(moduleUrl.href);

  assert.deepEqual(
    background.getNormalizedModelTransform(
      { x: 0.4, y: -0.1, z: -0.5 },
      0.02,
      1.5,
    ),
    {
      scale: 37.5,
      position: { x: -15, y: 3.75, z: 18.75 },
    },
  );
});
