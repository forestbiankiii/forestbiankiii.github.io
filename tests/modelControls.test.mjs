import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL(
  "../components/modelControls.ts",
  import.meta.url,
);
const studioConfigUrl = new URL(
  "../components/liquidGlassStudioConfig.ts",
  import.meta.url,
);
const studioSurfaceUrl = new URL(
  "../components/StudioLiquidGlass.tsx",
  import.meta.url,
);
const modelPanelUrl = new URL(
  "../components/ModelAdjustmentPanel.tsx",
  import.meta.url,
);

test("maps the exported Liquid Glass Studio preset to renderer uniforms", async () => {
  const studio = await import(studioConfigUrl.href);

  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.refThickness, 20);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.shapeRoundness, 2);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.language, "zh-CN");
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.bgType, 4);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.shapeWidth, 200);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.shapeHeight, 200);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.showShape1, true);
  assert.deepEqual(studio.getLiquidGlassStudioUniforms(), {
    refThickness: 20,
    refFactor: 1.4,
    refDispersion: 7,
    fresnelRange: 30,
    fresnelHardness: 0.2,
    fresnelFactor: 0.2,
    glareRange: 30,
    glareHardness: 0.2,
    glareFactor: 0.1044,
    glareConvergence: 0.8051,
    glareOppositeFactor: 0.8,
    glareAngle: -Math.PI / 4,
    blurRadius: 50,
    tint: [1, 1, 1, 0],
    shadowExpand: 15,
    shadowFactor: 0.2,
  });
});

test("provides a WebGL Studio glass surface with a CSS fallback", () => {
  assert.equal(existsSync(studioSurfaceUrl), true);

  const source = readFileSync(studioSurfaceUrl, "utf8");
  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /getLiquidGlassStudioUniforms/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /transparent: true/);
});

test("uses the Studio glass surface for the always-mounted model controls", () => {
  const source = readFileSync(modelPanelUrl, "utf8");

  assert.match(source, /import StudioLiquidGlass/);
  assert.match(source, /getModelPanelPresentation/);
  assert.match(source, /className=\{panelPresentation\.className\}/);
  assert.doesNotMatch(source, /import GlassSurface/);
  assert.doesNotMatch(source, /\{open && \(/);
});

test("defines the default model adjustment state", async () => {
  assert.equal(existsSync(moduleUrl), true);

  const controls = await import(moduleUrl.href);

  assert.deepEqual(controls.DEFAULT_MODEL_CONTROLS, {
    modelScale: 1,
    modelXOffset: 0.3,
    modelYOffset: -0.3,
    interactionMode: "browse",
  });
  assert.deepEqual(controls.MODEL_CONTROL_RANGES, {
    modelScale: { min: 0.5, max: 2, step: 0.05 },
    modelXOffset: { min: -1, max: 1, step: 0.05 },
    modelYOffset: { min: -1, max: 1, step: 0.05 },
  });
});

test("clamps model adjustments to their supported ranges", async () => {
  assert.equal(existsSync(moduleUrl), true);

  const controls = await import(moduleUrl.href);

  assert.equal(
    controls.clampModelControlValue("modelScale", 99),
    2,
  );
  assert.equal(
    controls.clampModelControlValue("modelXOffset", -99),
    -1,
  );
  assert.equal(
    controls.clampModelControlValue("modelYOffset", 0.25),
    0.25,
  );
});

test("switches between browse and rotate mouse modes", async () => {
  assert.equal(existsSync(moduleUrl), true);

  const controls = await import(moduleUrl.href);

  assert.equal(
    controls.toggleModelInteractionMode("browse"),
    "rotate",
  );
  assert.equal(
    controls.toggleModelInteractionMode("rotate"),
    "browse",
  );
});

test("keeps the adjustment dialog closed until the trigger is used", async () => {
  const controls = await import(moduleUrl.href);

  assert.equal(controls.DEFAULT_MODEL_PANEL_OPEN, false);
  assert.equal(controls.toggleModelPanel(false), true);
  assert.equal(controls.toggleModelPanel(true), false);
});

test("keeps the glass dialog mounted while toggling its visible state", async () => {
  const controls = await import(moduleUrl.href);

  assert.deepEqual(controls.getModelPanelPresentation(false), {
    className: "model-adjustment-dialog-glass is-closed",
    ariaHidden: true,
  });
  assert.deepEqual(controls.getModelPanelPresentation(true), {
    className: "model-adjustment-dialog-glass is-open",
    ariaHidden: false,
  });
});
