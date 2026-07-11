export type ModelInteractionMode = "browse" | "rotate";

export interface ModelControlState {
  modelScale: number;
  modelXOffset: number;
  modelYOffset: number;
  interactionMode: ModelInteractionMode;
}

export type ModelNumericControl = Exclude<
  keyof ModelControlState,
  "interactionMode"
>;

export const DEFAULT_MODEL_CONTROLS: ModelControlState = {
  modelScale: 1,
  modelXOffset: 0.3,
  modelYOffset: -0.3,
  interactionMode: "browse",
};

export const DEFAULT_MODEL_PANEL_OPEN = false;

export const MODEL_CONTROL_RANGES = {
  modelScale: { min: 0.5, max: 2, step: 0.05 },
  modelXOffset: { min: -1, max: 1, step: 0.05 },
  modelYOffset: { min: -1, max: 1, step: 0.05 },
} as const;

export function clampModelControlValue(
  control: ModelNumericControl,
  value: number,
) {
  const range = MODEL_CONTROL_RANGES[control];
  return Math.min(range.max, Math.max(range.min, value));
}

export function toggleModelInteractionMode(
  mode: ModelInteractionMode,
): ModelInteractionMode {
  return mode === "browse" ? "rotate" : "browse";
}

export function toggleModelPanel(open: boolean) {
  return !open;
}

export const MODEL_PANEL_TRIGGER_SIZE = 72;
/** Panel corner radius matches the circular button radius. */
export const MODEL_PANEL_CORNER_RADIUS = MODEL_PANEL_TRIGGER_SIZE / 2;
export const MODEL_PANEL_GAP = 14;
export const MODEL_PANEL_PRESS_SCALE = 1.22;

/** Total open/close duration. Phase 1 = circle detach, phase 2 = circle→rect. */
export const MODEL_PANEL_MORPH_DURATION_MS = 250;
export const MODEL_PANEL_PHASE1_MS = 50;
export const MODEL_PANEL_PHASE2_MS = 200;
export const MODEL_PANEL_OPEN_DURATION_MS = MODEL_PANEL_MORPH_DURATION_MS;
export const MODEL_PANEL_CLOSE_DURATION_MS = MODEL_PANEL_MORPH_DURATION_MS;
export const MODEL_PANEL_PHASE1_END =
  MODEL_PANEL_PHASE1_MS / MODEL_PANEL_MORPH_DURATION_MS;

/**
 * Linear clock so wall-clock phases (0.05s / 0.2s) map directly to progress.
 * Close uses the same samples in reverse.
 */
export function getModelPanelEase(elapsedRatio: number) {
  return Math.min(1, Math.max(0, elapsedRatio));
}

export function getModelPanelTimedProgress(
  elapsedRatio: number,
  opening: boolean,
) {
  const eased = getModelPanelEase(elapsedRatio);
  return opening ? eased : 1 - eased;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Constant negative acceleration, initial speed max, stop at the end:
 * s/S = u*(2-u) for normalized time u in [0, 1].
 */
export function kinematicEaseOut(u: number) {
  const t = Math.min(1, Math.max(0, u));
  return t * (2 - t);
}

export function getModelPanelTriggerScale({
  pressed,
}: {
  pressed: boolean;
  openProgress?: number;
}) {
  return pressed ? MODEL_PANEL_PRESS_SCALE : 1;
}

export function getModelPanelGlassShape({
  progress,
  panelWidth,
  panelHeight,
  borderRadius,
  circleSize = MODEL_PANEL_TRIGGER_SIZE,
  gap = MODEL_PANEL_GAP,
}: {
  progress: number;
  panelWidth: number;
  panelHeight: number;
  borderRadius: number;
  circleSize?: number;
  gap?: number;
}) {
  // Pure function of progress — close is open run backwards.
  const p = Math.min(1, Math.max(0, progress));
  const size = Math.max(8, circleSize);
  const buttonR = size * 0.5;
  const phase1End = MODEL_PANEL_PHASE1_END;

  const buttonX = panelWidth - buttonR;
  const buttonY = panelHeight + gap + buttonR;
  const endX = panelWidth * 0.5;
  const endY = panelHeight * 0.5;

  const dx = endX - buttonX;
  const dy = endY - buttonY;
  const fullDist = Math.hypot(dx, dy) || 1;
  const dirX = dx / fullDist;
  const dirY = dy / fullDist;

  // Phase-1 circle must fit the panel, so detach distance is capped.
  const maxDetachR = Math.min(panelWidth, panelHeight) * 0.5;
  const phase1Dist = Math.min(maxDetachR, fullDist * 0.5);

  const samplePhase1 = (u: number) => {
    const detach = kinematicEaseOut(u);
    const dist = phase1Dist * detach;
    const x = buttonX + dirX * dist;
    const y = buttonY + dirY * dist;
    // Radius matches distance to the button center (越远越大).
    const radius = Math.max(buttonR, dist);
    return {
      centerX: x,
      centerY: y,
      radius,
      detach,
    };
  };

  const phase1EndState = samplePhase1(1);
  const c1X = phase1EndState.centerX;
  const c1Y = phase1EndState.centerY;
  const r1 = phase1EndState.radius;

  let centerX: number;
  let centerY: number;
  let shapeWidth: number;
  let shapeHeight: number;
  let shapeRadius: number;
  let travelT: number;
  let growT: number;
  let phase: 1 | 2;

  if (p <= phase1End) {
    // 0–0.2s: circular detach. Radius = distance to button center.
    phase = 1;
    const u = phase1End <= 0 ? 1 : p / phase1End;
    const sample = samplePhase1(u);
    centerX = sample.centerX;
    centerY = sample.centerY;
    shapeWidth = sample.radius * 2;
    shapeHeight = sample.radius * 2;
    shapeRadius = sample.radius;
    travelT = sample.detach * (phase1Dist / fullDist);
    growT =
      (sample.radius - buttonR) / Math.max(1e-6, maxDetachR - buttonR);
  } else {
    // 0.2–0.5s: circle → rounded rect, center continues C1 → panel center.
    phase = 2;
    const v = (p - phase1End) / Math.max(1e-6, 1 - phase1End);
    const move = kinematicEaseOut(v);
    centerX = c1X + (endX - c1X) * move;
    centerY = c1Y + (endY - c1Y) * move;

    const targetRadius = Math.min(
      borderRadius,
      panelWidth * 0.5,
      panelHeight * 0.5,
    );
    // r1 <= maxDetachR = min(panel)/2, so width/height only grow toward the panel.
    shapeWidth = r1 * 2 + (panelWidth - r1 * 2) * v;
    shapeHeight = r1 * 2 + (panelHeight - r1 * 2) * v;
    shapeRadius = r1 + (targetRadius - r1) * v;
    travelT =
      phase1Dist / fullDist + (1 - phase1Dist / fullDist) * move;
    growT = 1;

    const halfW = shapeWidth * 0.5;
    const halfH = shapeHeight * 0.5;
    centerX = Math.min(panelWidth - halfW, Math.max(halfW, centerX));
    const maxCenterY = panelHeight + gap + size - halfH;
    centerY = Math.min(maxCenterY, Math.max(halfH, centerY));
  }

  // Light sticky only during circular detach (radius already tracks the button).
  const shape1Amount =
    phase === 1
      ? smoothstep(0.02, 0.15, p / phase1End) * (1 - smoothstep(0.75, 1, p / phase1End))
      : 0;
  const shape1Radius = buttonR * Math.max(0.2, 1 - growT);
  const showShape1 = shape1Amount > 0.05;
  const mergeRate = 0.12 * shape1Amount;

  const closeHandoff = smoothstep(0.0, 0.12, p);
  const openHandoff = smoothstep(0.88, 0.98, p);
  const morphCanvasOpacity = closeHandoff;
  const triggerGlassOpacity = 1 - closeHandoff + closeHandoff * openHandoff;
  const contentOpacity = smoothstep(0.45, 0.9, p);
  const unifiedMorph = closeHandoff > 0.08 && openHandoff < 0.92;

  return {
    shapeWidth,
    shapeHeight,
    shapeRadius,
    centerX,
    centerY,
    shape1X: buttonX,
    shape1Y: buttonY,
    shape1Radius,
    shape1Amount,
    mergeRate,
    showShape1,
    contentOpacity,
    morphCanvasOpacity,
    triggerGlassOpacity,
    unifiedMorph,
    travelT,
    growT,
    phase,
  };
}

export function getModelPanelPresentation(open: boolean) {
  return {
    className: `model-adjustment-dialog-glass ${open ? "is-open" : "is-closed"}`,
    ariaHidden: !open,
  };
}
