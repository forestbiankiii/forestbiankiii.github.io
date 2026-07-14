import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scenePathUrl = new URL(
  "../components/modelScenePath.ts",
  import.meta.url,
);
const pageUrl = new URL("../app/page.tsx", import.meta.url);

test("alternates the supplied path across the four homepage sections", async () => {
  const path = await import(scenePathUrl.href);

  assert.deepEqual(path.MODEL_SCENE_ORDER, [
    "home",
    "projects",
    "academic",
    "contact",
  ]);
  assert.deepEqual(path.MODEL_SCENE_POSE_KEYS, {
    home: "start",
    projects: "end",
    academic: "start",
    contact: "end",
  });
  assert.equal(path.getModelScenePoseKey("academic"), "start");
  assert.equal(path.getModelScenePoseKey("contact"), "end");
});

test("selects the section containing the viewport anchor", async () => {
  const path = await import(scenePathUrl.href);
  const sections = [
    { scene: "home", top: -600, bottom: 120 },
    { scene: "projects", top: 120, bottom: 920 },
    { scene: "academic", top: 920, bottom: 1720 },
    { scene: "contact", top: 1720, bottom: 2520 },
  ];

  assert.equal(path.getModelSceneAtViewportAnchor(sections, 420), "projects");
  assert.equal(path.getModelSceneAtViewportAnchor(sections, 950), "academic");
  assert.equal(
    path.getModelSceneAtViewportAnchor(
      [
        { scene: "home", top: -900, bottom: -40 },
        { scene: "projects", top: 80, bottom: 940 },
      ],
      20,
    ),
    "projects",
  );
});

test("compares complete model poses before scheduling transitions", async () => {
  const path = await import(scenePathUrl.href);
  const pose = {
    modelScale: 1.55,
    modelXOffset: 0.5,
    modelYOffset: 0.2,
    modelRotationX: 12,
    modelRotationY: -49,
    modelRotationZ: -1,
  };

  assert.equal(path.areModelPosesEqual(pose, { ...pose }), true);
  assert.equal(
    path.areModelPosesEqual(pose, { ...pose, modelRotationY: -48 }),
    false,
  );
});

test("queues the latest section target while a transition is running", () => {
  const page = readFileSync(pageUrl, "utf8");

  assert.match(page, /activeTransitionTargetRef/);
  assert.match(page, /pendingModelTargetRef/);
  assert.match(page, /modelTransitionStatusRef/);
  assert.match(page, /activeModelSceneRef/);
  assert.match(page, /window\.innerHeight \* 0\.42/);
});
