export const liquidGlassCardControls = {
  refThickness: 20,
  refFactor: 1.4,
  refDispersion: 0,
  refFresnelRange: 0,
  refFresnelHardness: 0,
  refFresnelFactor: 0,
  glareRange: 0,
  glareHardness: 0,
  glareFactor: 0,
  glareConvergence: 0,
  glareOppositeFactor: 0,
  glareAngle: -45,
  blurRadius: 50,
  blurEdge: false,
  tint: {
    r: 255,
    g: 255,
    b: 255,
    a: 0,
  },
  shadowExpand: 0,
  shadowFactor: 0,
  shadowPosition: {
    x: 0,
    y: 0,
  },
  bgType: 4,
  shapeWidth: 200,
  shapeHeight: 200,
  shapeRadius: 50.1,
  shapeRoundness: 2,
  mergeRate: 0,
  showShape1: true,
  springSizeFactor: 0,
  step: 9,
} as const;

export const LIQUID_GLASS_CARD_TILT_FACTOR = 25;
export const LIQUID_GLASS_CARD_PERSPECTIVE = 800;

interface LiquidGlassCardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LiquidGlassCardTilt {
  rotateX: number;
  rotateY: number;
}

export function getLiquidGlassCardTilt(
  rect: LiquidGlassCardRect,
  clientX: number,
  clientY: number,
  maxTilt = LIQUID_GLASS_CARD_TILT_FACTOR,
): LiquidGlassCardTilt {
  const halfWidth = Math.max(rect.width / 2, 1);
  const halfHeight = Math.max(rect.height / 2, 1);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pointerX = Math.max(
    -1,
    Math.min(1, (clientX - centerX) / halfWidth),
  );
  const pointerY = Math.max(
    -1,
    Math.min(1, (clientY - centerY) / halfHeight),
  );

  return {
    rotateX: pointerY === 0 ? 0 : -pointerY * maxTilt,
    rotateY: pointerX * maxTilt,
  };
}
