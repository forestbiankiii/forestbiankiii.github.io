import { DEFAULT_MODEL_BACKGROUND_PATH_PRESET } from "./defaultModelBackgroundPath.ts";

export interface ModelPose {
  modelScale: number;
  modelXOffset: number;
  modelYOffset: number;
  modelRotationX: number;
  modelRotationY: number;
  modelRotationZ: number;
}

export type ModelPoseKey = "start" | "end";

export type ModelTransitionStatus = "idle" | "running" | "complete";

export interface ModelPoseTransitionRequest {
  id: number;
  from: ModelPose;
  to: ModelPose;
  durationMs: number;
  reducedMotion: boolean;
}

export const DEFAULT_MODEL_POSES: Record<ModelPoseKey, ModelPose> = {
  start: { ...DEFAULT_MODEL_BACKGROUND_PATH_PRESET.keyframes[0].pose },
  end: { ...DEFAULT_MODEL_BACKGROUND_PATH_PRESET.keyframes[1].pose },
};

export const DEFAULT_MODEL_CONTROLS: ModelPose = {
  ...DEFAULT_MODEL_POSES.start,
};

export const MODEL_TRANSITION_DURATION_MS =
  DEFAULT_MODEL_BACKGROUND_PATH_PRESET.transition.durationMs;

export function getModelPoseFromControls(controls: ModelPose): ModelPose {
  return { ...controls };
}

export function getModelControlsFromPose(pose: ModelPose): ModelPose {
  return { ...pose };
}

export function getModelTransitionProgress(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  if (t === 0 || t === 1) return t;

  const damping = 8;
  const frequency = 7;
  const response = (value: number) =>
    1 -
    Math.exp(-damping * value) *
      (Math.cos(frequency * value) +
        (damping / frequency) * Math.sin(frequency * value));

  return response(t) / response(1);
}

function getShortestAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

export function sampleModelPoseTransition(
  from: ModelPose,
  to: ModelPose,
  progress: number,
): ModelPose {
  const t = Math.min(1, Math.max(0, progress));
  if (t === 0) return { ...from };
  if (t === 1) return { ...to };

  const eased = getModelTransitionProgress(t);
  const mix = (start: number, end: number) =>
    start + (end - start) * eased;
  const mixAngle = (start: number, end: number) =>
    start + getShortestAngleDelta(start, end) * eased;

  return {
    modelScale: mix(from.modelScale, to.modelScale),
    modelXOffset: mix(from.modelXOffset, to.modelXOffset),
    modelYOffset: mix(from.modelYOffset, to.modelYOffset),
    modelRotationX: mixAngle(from.modelRotationX, to.modelRotationX),
    modelRotationY: mixAngle(from.modelRotationY, to.modelRotationY),
    modelRotationZ: mixAngle(from.modelRotationZ, to.modelRotationZ),
  };
}
