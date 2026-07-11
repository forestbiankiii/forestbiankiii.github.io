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
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.bgType, 2);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.shapeWidth, 200);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.shapeHeight, 200);
  assert.equal(studio.LIQUID_GLASS_STUDIO_CONFIG.showShape1, true);
  assert.deepEqual(studio.getLiquidGlassStudioUniforms(), {
    refThickness: 20,
    refFactor: 1.4,
    refDispersion: 7,
    fresnelRange: 14,
    fresnelHardness: 0.35,
    fresnelFactor: 0.2,
    glareRange: 14,
    glareHardness: 0.35,
    glareFactor: 0.9,
    glareConvergence: 0.5,
    glareOppositeFactor: 0.8,
    glareAngle: -Math.PI / 4,
    blurRadius: 20,
    tint: [1, 1, 1, 0],
    shadowExpand: 25,
    shadowFactor: 0.15,
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
  assert.match(source, /visibilitychange/);
  assert.match(source, /IntersectionObserver/);
  assert.doesNotMatch(source, /targetFps/);
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

test("uses a 0.25s open/close with matching reverse timing", async () => {
  const controls = await import(moduleUrl.href);

  assert.equal(controls.MODEL_PANEL_MORPH_DURATION_MS, 250);
  assert.equal(controls.MODEL_PANEL_PHASE1_MS, 50);
  assert.equal(controls.MODEL_PANEL_PHASE2_MS, 200);
  assert.equal(
    controls.MODEL_PANEL_CLOSE_DURATION_MS,
    controls.MODEL_PANEL_OPEN_DURATION_MS,
  );
  assert.equal(controls.MODEL_PANEL_PHASE1_END, 50 / 250);

  assert.equal(controls.getModelPanelTimedProgress(0.25, true), 0.25);
  assert.equal(controls.getModelPanelTimedProgress(0.25, false), 0.75);

  for (const elapsedRatio of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
    const opening = controls.getModelPanelTimedProgress(elapsedRatio, true);
    const closing = controls.getModelPanelTimedProgress(elapsedRatio, false);
    assert.ok(
      Math.abs(closing - (1 - opening)) < 1e-12,
      `close must exactly reverse open at ${elapsedRatio}`,
    );
  }

  assert.equal(controls.kinematicEaseOut(0), 0);
  assert.equal(controls.kinematicEaseOut(1), 1);
  assert.ok(controls.kinematicEaseOut(0.25) > 0.25);
  assert.ok(controls.kinematicEaseOut(0.75) < 0.75 + 0.25);
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

test("morphs with circular detach then circle-to-rect phases", async () => {
  const controls = await import(moduleUrl.href);
  const circleSize = controls.MODEL_PANEL_TRIGGER_SIZE;
  const borderRadius = controls.MODEL_PANEL_CORNER_RADIUS;
  const buttonR = circleSize / 2;

  assert.equal(borderRadius, buttonR);

  const closed = controls.getModelPanelGlassShape({
    progress: 0,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius,
    circleSize,
    gap: 14,
  });
  assert.equal(closed.phase, 1);
  assert.equal(closed.shapeWidth, circleSize);
  assert.equal(closed.shapeHeight, circleSize);
  assert.equal(closed.shapeRadius, buttonR);
  assert.equal(closed.centerX, 320 - buttonR);
  assert.equal(closed.centerY, 400 + 14 + buttonR);
  assert.equal(closed.shape1X, 320 - buttonR);
  assert.equal(closed.shape1Y, 400 + 14 + buttonR);
  assert.equal(closed.morphCanvasOpacity, 0);
  assert.equal(closed.triggerGlassOpacity, 1);

  // Phase 1: circle radius equals distance from center to button center.
  const detach = controls.getModelPanelGlassShape({
    progress: 0.2,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius,
    circleSize,
    gap: 14,
  });
  assert.equal(detach.phase, 1);
  assert.equal(detach.shapeWidth, detach.shapeHeight);
  assert.equal(detach.shapeRadius, detach.shapeWidth / 2);
  const detachDist = Math.hypot(
    detach.centerX - detach.shape1X,
    detach.centerY - detach.shape1Y,
  );
  assert.ok(Math.abs(detach.shapeRadius - Math.max(buttonR, detachDist)) < 1e-6);
  assert.ok(detach.shapeRadius > buttonR);

  // Still phase 1 near the 0.05s boundary (progress = PHASE1_END).
  const phase1End = controls.getModelPanelGlassShape({
    progress: controls.MODEL_PANEL_PHASE1_END,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius,
    circleSize,
    gap: 14,
  });
  assert.equal(phase1End.phase, 1);
  assert.equal(phase1End.shapeWidth, phase1End.shapeHeight);

  // Phase 2: rounded-rect morph + continued center travel.
  const mid = controls.getModelPanelGlassShape({
    progress: (controls.MODEL_PANEL_PHASE1_END + 1) / 2,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius,
    circleSize,
    gap: 14,
  });
  assert.equal(mid.phase, 2);
  assert.ok(mid.shapeWidth >= phase1End.shapeWidth - 1e-6);
  assert.ok(mid.shapeHeight >= phase1End.shapeHeight - 1e-6);
  assert.equal(mid.morphCanvasOpacity, 1);

  // Center decelerates within each segment (kinematic ease-out).
  assert.ok(controls.kinematicEaseOut(0.25) > 0.4);

  const open = controls.getModelPanelGlassShape({
    progress: 1,
    panelWidth: 320,
    panelHeight: 400,
    borderRadius,
    circleSize,
    gap: 14,
  });
  assert.equal(open.phase, 2);
  assert.equal(open.shapeWidth, 320);
  assert.equal(open.shapeHeight, 400);
  assert.equal(open.shapeRadius, borderRadius);
  assert.equal(open.centerX, 160);
  assert.equal(open.centerY, 200);
  assert.equal(open.contentOpacity, 1);
  assert.equal(open.showShape1, false);

  // Close is the identical mapping at the same progress.
  assert.deepEqual(
    controls.getModelPanelGlassShape({
      progress: (controls.MODEL_PANEL_PHASE1_END + 1) / 2,
      panelWidth: 320,
      panelHeight: 400,
      borderRadius,
      circleSize,
      gap: 14,
    }),
    mid,
  );
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
  assert.match(source, /MODEL_PANEL_CORNER_RADIUS/);
  assert.match(source, /MODEL_PANEL_TRIGGER_SIZE/);
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
