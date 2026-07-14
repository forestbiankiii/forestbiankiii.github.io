import type { ModelPose, ModelPoseKey } from "./modelControls";

export const MODEL_SCENE_ORDER = [
  "home",
  "projects",
  "academic",
  "contact",
] as const;

export type ModelScene = (typeof MODEL_SCENE_ORDER)[number];

export const MODEL_SCENE_POSE_KEYS: Record<ModelScene, ModelPoseKey> = {
  home: "start",
  projects: "end",
  academic: "start",
  contact: "end",
};

export interface ModelSceneMeasurement {
  scene: ModelScene;
  top: number;
  bottom: number;
}

export function getModelScenePoseKey(scene: ModelScene) {
  return MODEL_SCENE_POSE_KEYS[scene];
}

export function getModelSceneAtViewportAnchor(
  sections: ModelSceneMeasurement[],
  anchorY: number,
): ModelScene | null {
  let closestScene: ModelScene | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const section of sections) {
    if (section.top <= anchorY && section.bottom > anchorY) {
      return section.scene;
    }

    const distance = Math.abs(section.top - anchorY);
    if (distance < closestDistance) {
      closestScene = section.scene;
      closestDistance = distance;
    }
  }

  return closestScene;
}

export function areModelPosesEqual(a: ModelPose, b: ModelPose) {
  return (
    a.modelScale === b.modelScale &&
    a.modelXOffset === b.modelXOffset &&
    a.modelYOffset === b.modelYOffset &&
    a.modelRotationX === b.modelRotationX &&
    a.modelRotationY === b.modelRotationY &&
    a.modelRotationZ === b.modelRotationZ
  );
}
