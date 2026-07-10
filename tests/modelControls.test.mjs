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
const homePageUrl = new URL("../app/page.tsx", import.meta.url);
const globalStylesUrl = new URL("../app/globals.css", import.meta.url);

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
    blurRadius: 1,
    tint: [1, 1, 1, 0],
    shadowExpand: 15,
    shadowFactor: 0.2,
  });
});

test("provides a WebGL Studio glass surface with a CSS fallback", () => {
  assert.equal(existsSync(studioSurfaceUrl), true);

  const source = readFileSync(studioSurfaceUrl, "utf8");
  assert.match(source, /MultiPassRenderer/);
  assert.match(source, /getLiquidGlassStudioUniforms/);
  assert.match(source, /FragmentMainShader/);
  assert.match(source, /computeGaussianKernelByRadius/);
  assert.match(source, /liquid-glass-studio/);
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

test("uses matching open/close duration with an exact reverse curve", async () => {
  const controls = await import(moduleUrl.href);

  assert.equal(controls.MODEL_PANEL_OPEN_DURATION_MS, 980);
  assert.equal(
    controls.MODEL_PANEL_CLOSE_DURATION_MS,
    controls.MODEL_PANEL_OPEN_DURATION_MS,
  );
  assert.equal(
    controls.MODEL_PANEL_MORPH_DURATION_MS,
    controls.MODEL_PANEL_OPEN_DURATION_MS,
  );

  const openingEarly = controls.getModelPanelTimedProgress(0.25, true);
  assert.ok(
    openingEarly < 0.2,
    "opening should spend more time near the trigger before growing",
  );

  for (const elapsedRatio of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
    const opening = controls.getModelPanelTimedProgress(elapsedRatio, true);
    const closing = controls.getModelPanelTimedProgress(elapsedRatio, false);
    assert.ok(
      Math.abs(closing - (1 - opening)) < 1e-12,
      `close must exactly reverse open at ${elapsedRatio}`,
    );
  }
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

test("morphs the panel glass from a trigger circle into the dialog rect", async () => {
  const controls = await import(moduleUrl.href);

  const closed = controls.getModelPanelGlassShape({
    progress: 0,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  assert.equal(closed.shapeWidth, 60);
  assert.equal(closed.shapeHeight, 60);
  assert.equal(closed.shapeRadius, 30);
  assert.equal(closed.centerX, 290);
  assert.equal(closed.centerY, 444);
  assert.equal(closed.shape1X, 290);
  assert.equal(closed.shape1Y, 444);
  assert.equal(closed.showShape1, false);
  assert.equal(closed.mergeRate, 0);
  assert.equal(closed.contentOpacity, 0);
  assert.equal(closed.morphCanvasOpacity, 0);
  assert.equal(closed.triggerGlassOpacity, 1);
  assert.equal(closed.unifiedMorph, false);

  const early = controls.getModelPanelGlassShape({
    progress: 0.3,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  // Move and enlarge together; grow starts slow (ease-in-out).
  assert.equal(early.travelT, early.growT);
  assert.ok(early.growT < 0.3 * 0.85, "early enlarge rate stays slow");
  assert.equal(early.showShape1, true);
  assert.equal(early.unifiedMorph, true);
  assert.ok(early.centerX - early.shapeWidth / 2 >= -0.5);
  assert.ok(early.centerX + early.shapeWidth / 2 <= 320 + 0.5);

  const mid = controls.getModelPanelGlassShape({
    progress: 0.5,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  assert.equal(mid.travelT, mid.growT);
  assert.ok(Math.abs(mid.growT - 0.5) < 1e-9);
  assert.ok(mid.shapeWidth > 100);
  assert.ok(mid.shapeWidth < 320);
  assert.equal(mid.morphCanvasOpacity, 1);
  assert.ok(mid.triggerGlassOpacity < 0.2);
  assert.equal(mid.unifiedMorph, true);
  assert.ok(mid.centerX - mid.shapeWidth / 2 >= -0.5);
  assert.ok(mid.centerX + mid.shapeWidth / 2 <= 320 + 0.5);

  const late = controls.getModelPanelGlassShape({
    progress: 0.85,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  // Late enlarge rate is small again (ease-out into the resting size).
  assert.equal(late.travelT, late.growT);
  assert.ok(late.growT > 0.9);
  assert.ok(1 - late.growT < 0.85 * 0.2);

  const nearClosed = controls.getModelPanelGlassShape({
    progress: 0.05,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  assert.ok(nearClosed.showShape1);
  assert.ok(nearClosed.mergeRate > 0);
  assert.ok(nearClosed.morphCanvasOpacity > 0.05);
  assert.ok(nearClosed.morphCanvasOpacity < 0.5);
  assert.ok(nearClosed.triggerGlassOpacity > 0.5);
  assert.ok(nearClosed.unifiedMorph);

  const open = controls.getModelPanelGlassShape({
    progress: 1,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  assert.equal(open.shapeWidth, 320);
  assert.equal(open.shapeHeight, 400);
  assert.equal(open.shapeRadius, 24);
  assert.equal(open.centerX, 160);
  assert.equal(open.centerY, 200);
  assert.equal(open.showShape1, false);
  assert.equal(open.mergeRate, 0);
  assert.equal(open.contentOpacity, 1);
  assert.equal(open.morphCanvasOpacity, 1);
  assert.ok(open.triggerGlassOpacity > 0.9);
  assert.equal(open.unifiedMorph, false);

  // Close path is the same mapping run backwards.
  const closingMid = controls.getModelPanelGlassShape({
    progress: 0.5,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  assert.deepEqual(closingMid, mid);

  const overshoot = controls.getModelPanelGlassShape({
    progress: 1.1,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius: 24,
    circleSize: 60,
    gap: 14,
  });
  // Progress above 1 is clamped — no size bounce past the resting panel.
  assert.equal(overshoot.shapeWidth, 320);
  assert.equal(overshoot.shapeHeight, 400);
});

test("scales the trigger up while pressed and recovers as the panel detaches", async () => {
  const controls = await import(moduleUrl.href);

  assert.equal(
    controls.getModelPanelTriggerScale({ pressed: true, openProgress: 0 }),
    controls.MODEL_PANEL_PRESS_SCALE,
  );
  assert.equal(
    controls.getModelPanelTriggerScale({ pressed: false, openProgress: 0 }),
    1,
  );
  // Close must not re-inflate the button (that caused the end snap).
  assert.equal(
    controls.getModelPanelTriggerScale({ pressed: false, openProgress: 0.05 }),
    1,
  );
  assert.equal(
    controls.getModelPanelTriggerScale({ pressed: false, openProgress: 0.5 }),
    1,
  );
});

test("uses timed morph progress instead of a bouncing spring", async () => {
  const controls = await import(moduleUrl.href);
  assert.equal(typeof controls.getModelPanelEase, "function");
  assert.equal(typeof controls.stepModelPanelSpring, "undefined");
  const midOpen = controls.getModelPanelTimedProgress(0.5, true);
  const midClose = controls.getModelPanelTimedProgress(0.5, false);
  assert.equal(midClose, 1 - midOpen);
});

test("uses circle-to-rect morph props on the model dialog glass", () => {
  const source = readFileSync(modelPanelUrl, "utf8");
  assert.match(source, /morphFromCircle/);
  assert.match(source, /expanded=\{open\}/);
  assert.match(source, /blurRadius=\{1\}/);
  assert.match(source, /model-adjustment-trigger-glass/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerUp/);
});

test("hides the site content while model adjustment mode is open", () => {
  const panelSource = readFileSync(modelPanelUrl, "utf8");
  const pageSource = readFileSync(homePageUrl, "utf8");
  const globalStyles = readFileSync(globalStylesUrl, "utf8");

  assert.match(panelSource, /onOpenChange\?: \(open: boolean\) => void/);
  assert.match(panelSource, /onOpenChange\?\.\(open\)/);
  assert.match(pageSource, /onOpenChange=\{setModelAdjustmentOpen\}/);
  assert.match(pageSource, /site-content-layer/);
  assert.match(pageSource, /is-model-adjustment-open/);
  assert.match(
    globalStyles,
    /\.site-content-layer[\s\S]*transition:\s*opacity 700ms/,
  );
  assert.match(
    globalStyles,
    /\.is-model-adjustment-open \.site-content-layer[\s\S]*opacity:\s*0/,
  );
});
