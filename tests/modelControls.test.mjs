import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("../components/modelControls.ts", import.meta.url);
const modelPanelUrl = new URL(
  "../components/ModelAdjustmentPanel.tsx",
  import.meta.url,
);
const homePageUrl = new URL("../app/page.tsx", import.meta.url);
const globalStylesUrl = new URL("../app/globals.css", import.meta.url);

test("keeps model pose helpers for the automatic scene background", async () => {
  assert.equal(existsSync(moduleUrl), true);

  const controls = await import(moduleUrl.href);

  assert.deepEqual(controls.DEFAULT_MODEL_POSES.start, {
    modelScale: 1.55,
    modelXOffset: 0.5,
    modelYOffset: 0.2,
    modelRotationX: 12,
    modelRotationY: -49,
    modelRotationZ: -1,
  });
  assert.deepEqual(controls.DEFAULT_MODEL_POSES.end, {
    modelScale: 1.45,
    modelXOffset: -0.45,
    modelYOffset: 0.25,
    modelRotationX: 57,
    modelRotationY: 28,
    modelRotationZ: -3,
  });
  assert.deepEqual(
    controls.getModelPoseFromControls(controls.DEFAULT_MODEL_CONTROLS),
    controls.DEFAULT_MODEL_POSES.start,
  );
});

test("does not ship the 3D model adjustment button or panel", () => {
  const page = readFileSync(homePageUrl, "utf8");
  const globals = readFileSync(globalStylesUrl, "utf8");

  assert.equal(existsSync(modelPanelUrl), false);
  assert.doesNotMatch(page, /ModelAdjustmentPanel|modelAdjustmentOpen/);
  assert.doesNotMatch(page, /handleExportModelSettings|handlePreviewModelTransition/);
  assert.doesNotMatch(page, /data-model-controls|data-model-interaction/);
  assert.doesNotMatch(globals, /model-adjustment-|data-model-interaction/);
});
