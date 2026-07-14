import type { SiteTheme } from "./siteTheme";

export const FERRARI_MODEL_PATH =
  "/models/2025_ferrari_296_gt3_verstappen_racing.glb";

export const MODEL_BACKGROUND_COLORS: Record<SiteTheme, string> = {
  black: "#000000",
  white: "#ffffff",
};

export const MODEL_BACKGROUND_VIEWER_PROPS = {
  modelXOffset: 0.3,
  modelYOffset: -0.3,
  defaultRotationX: -35,
  defaultRotationY: 12,
  defaultZoom: 1.5,
  minZoomDistance: 0.75,
  maxZoomDistance: 4,
  enableMouseParallax: true,
  enableManualRotation: false,
  enableHoverRotation: true,
  enableManualZoom: false,
  ambientIntensity: 0.55,
  keyLightIntensity: 1.6,
  fillLightIntensity: 0.8,
  rimLightIntensity: 1.1,
  environmentPreset: "local-studio",
  autoFrame: true,
  fadeIn: true,
  autoRotate: false,
  autoRotateSpeed: 0.2,
  showScreenshotButton: false,
} as const;

interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function getNormalizedModelTransform(
  center: Point3,
  radius: number,
  modelScale = 1,
) {
  const scale = (1 / (radius * 2)) * modelScale;

  return {
    scale,
    position: {
      x: -center.x * scale,
      y: -center.y * scale,
      z: -center.z * scale,
    },
  };
}

export function getNormalizedAutoFrameDistance(
  radius: number,
  fovDegrees: number,
  padding = 1.2,
) {
  const normalizedTransform = getNormalizedModelTransform(
    { x: 0, y: 0, z: 0 },
    radius,
  );
  const normalizedRadius = radius * normalizedTransform.scale;

  return (
    (normalizedRadius * padding) /
    Math.sin((fovDegrees * Math.PI) / 180 / 2)
  );
}

export function getModelBackgroundColor(theme: SiteTheme) {
  return MODEL_BACKGROUND_COLORS[theme];
}
