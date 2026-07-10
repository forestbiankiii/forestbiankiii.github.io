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

export const MODEL_PANEL_TRIGGER_SIZE = 60;
export const MODEL_PANEL_GAP = 14;
export const MODEL_PANEL_PRESS_SCALE = 1.22;
/** Open and close share one duration so every phase mirrors at the same pace. */
export const MODEL_PANEL_MORPH_DURATION_MS = 980;
export const MODEL_PANEL_OPEN_DURATION_MS = MODEL_PANEL_MORPH_DURATION_MS;
export const MODEL_PANEL_CLOSE_DURATION_MS = MODEL_PANEL_MORPH_DURATION_MS;

/** Shared ease used by open and (reversed) close. Slow start favors travel before growth. */
export function getModelPanelEase(elapsedRatio: number) {
  const t = Math.min(1, Math.max(0, elapsedRatio));
  // Smootherstep with an extra ease-in so early frames stay near the trigger.
  const s = t * t * t * (t * (t * 6 - 15) + 10);
  return s * s * (3 - 2 * s);
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

/** Slow start + slow finish — enlarge rate is small at both ends. */
function easeInOutCubic(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Press enlarges the trigger. Morph open/close keep the resting size so the
 * close handoff never grows-then-snaps the real button.
 */
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
  // Geometry is a pure function of progress — close is open run backwards.
  const p = Math.min(1, Math.max(0, progress));
  const size = Math.max(8, circleSize);

  const shape1X = panelWidth - size * 0.5;
  const shape1Y = panelHeight + gap + size * 0.5;
  const buttonTop = shape1Y - size * 0.5;

  // Move and enlarge together. Shared ease-in-out: grow starts slow, ends small.
  const motionT = easeInOutCubic(p);
  const travelT = motionT;
  const growT = motionT;

  const shapeWidth = size + (panelWidth - size) * growT;
  const shapeHeight = size + (panelHeight - size) * growT;
  const targetRadius = Math.min(
    borderRadius,
    panelWidth * 0.5,
    panelHeight * 0.5,
  );
  const shapeRadius = size * 0.5 + (targetRadius - size * 0.5) * growT;

  const endX = panelWidth * 0.5;
  const endY = panelHeight * 0.5;

  // Shared-boundary sticky while fused; same motionT so it stays in sync.
  const onButtonCenterX = shape1X;
  const onButtonCenterY = shape1Y;
  const bottomAnchoredCenterX = shape1X + (endX - shape1X) * motionT;
  const bottomAnchoredCenterY = buttonTop - shapeHeight * 0.5;
  const anchorBlend = Math.min(1, motionT * 2.2);
  const stickyCenterX =
    onButtonCenterX + (bottomAnchoredCenterX - onButtonCenterX) * anchorBlend;
  const stickyCenterY =
    onButtonCenterY + (bottomAnchoredCenterY - onButtonCenterY) * anchorBlend;

  let centerX = stickyCenterX + (endX - stickyCenterX) * travelT;
  let centerY = stickyCenterY + (endY - stickyCenterY) * travelT;

  // Keep the growing rect inside the panel horizontally (no right-edge spill).
  const halfW = shapeWidth * 0.5;
  const halfH = shapeHeight * 0.5;
  centerX = Math.min(panelWidth - halfW, Math.max(halfW, centerX));
  const maxCenterY = panelHeight + gap + size - halfH;
  centerY = Math.min(maxCenterY, Math.max(halfH, centerY));

  const shape1Amount =
    smoothstep(0.01, 0.1, p) * (1 - smoothstep(0.55, 0.88, p));
  const shape1Radius = size * 0.5;
  const showShape1 = shape1Amount > 0.04;
  const mergeRate = 0.55 * shape1Amount * (1 - travelT * 0.4);

  const closeHandoff = smoothstep(0.0, 0.18, p);
  const openHandoff = smoothstep(0.86, 0.98, p);
  const morphCanvasOpacity = closeHandoff;
  const triggerGlassOpacity = 1 - closeHandoff + closeHandoff * openHandoff;
  const contentOpacity = smoothstep(0.35, 0.85, p);
  const unifiedMorph = closeHandoff > 0.08 && openHandoff < 0.92;

  return {
    shapeWidth,
    shapeHeight,
    shapeRadius,
    centerX,
    centerY,
    shape1X,
    shape1Y,
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
  };
}

export function getModelPanelPresentation(open: boolean) {
  return {
    className: `model-adjustment-dialog-glass ${open ? "is-open" : "is-closed"}`,
    ariaHidden: !open,
  };
}
