export const DEFAULT_MODEL_BACKGROUND_PATH_PRESET = {
  schemaVersion: 1,
  kind: "biankiii.model-background-path",
  exportedAt: "2026-07-14T08:37:58.242Z",
  model: {
    asset: "/models/2025_ferrari_296_gt3_verstappen_racing.glb",
    target: "site-model-background",
  },
  coordinateSystem: {
    position: "normalized-device-coordinate-offset",
    rotation: "degrees",
    scale: "multiplier",
  },
  keyframes: [
    {
      id: "start",
      at: 0,
      pose: {
        modelScale: 1.55,
        modelXOffset: 0.5,
        modelYOffset: 0.2,
        modelRotationX: 12,
        modelRotationY: -49,
        modelRotationZ: -1,
      },
    },
    {
      id: "end",
      at: 1,
      pose: {
        modelScale: 1.45,
        modelXOffset: -0.45,
        modelYOffset: 0.25,
        modelRotationX: 57,
        modelRotationY: 28,
        modelRotationZ: -3,
      },
    },
  ],
  transition: {
    durationMs: 1800,
    curve: "accelerated-overshoot-settle-v1",
    overshootRatio: 0.025,
    rotationMode: "shortest-path",
    reducedMotion: "jump-to-end",
  },
} as const;
