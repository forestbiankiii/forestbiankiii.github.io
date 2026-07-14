import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const url = (path) => new URL(path, import.meta.url);
const read = (path) => readFileSync(url(path), "utf8");

test("retracts the lanyard with an underdamped physical spring", async () => {
  const physicsUrl = url("../components/lanyardRetraction.ts");
  assert.equal(
    existsSync(physicsUrl),
    true,
    "the lanyard retraction physics module is missing",
  );

  const {
    LANYARD_RETRACTION_TARGET,
    createLanyardRetractionState,
    stepLanyardRetraction,
  } = await import(physicsUrl.href);

  let state = createLanyardRetractionState();
  const offsets = [];
  for (let frame = 0; frame < 240; frame += 1) {
    state = stepLanyardRetraction(state, 1 / 60);
    offsets.push(state.offset);
  }

  const frameDistances = offsets
    .slice(1, 30)
    .map((offset, index) => offset - offsets[index]);
  assert.ok(offsets[10] > 0, "the anchor should start moving upward");
  assert.ok(
    Math.max(...frameDistances) - Math.min(...frameDistances) > 0.01,
    "spring motion must accelerate and decelerate instead of moving linearly",
  );
  assert.ok(
    Math.max(...offsets) > LANYARD_RETRACTION_TARGET,
    "the underdamped spring should overshoot its target",
  );
  assert.ok(
    Math.abs(offsets.at(-1) - LANYARD_RETRACTION_TARGET) < 0.01,
    "the spring should settle at its target",
  );
});

test("kicks the card sideways and spins it as retraction begins", async () => {
  const { getLanyardRetractionKick } = await import(
    url("../components/lanyardRetraction.ts").href
  );

  const fromLeft = getLanyardRetractionKick(-1);
  const fromRight = getLanyardRetractionKick(1);

  assert.notEqual(fromLeft.impulse.x, 0);
  assert.equal(Math.sign(fromLeft.impulse.x), -Math.sign(fromRight.impulse.x));
  assert.ok(fromLeft.impulse.y > 0);
  assert.notEqual(fromLeft.torque.z, 0);
  assert.equal(Math.sign(fromLeft.torque.z), -Math.sign(fromRight.torque.z));
});

test("keeps the lanyard visible during physical retraction without fading", () => {
  const pageSource = read("../app/academic/page.tsx");
  const lanyardSource = read("../components/Lanyard.jsx");

  assert.match(pageSource, /lanyardClosing/);
  assert.match(pageSource, /academic-lanyard-retract/);
  assert.match(pageSource, /retracting=\{lanyardClosing\}/);
  assert.match(pageSource, /onRetractComplete=/);
  assert.match(lanyardSource, /applyImpulse\(kick\.impulse/);
  assert.match(lanyardSource, /applyTorqueImpulse\(kick\.torque/);

  const retractRule = pageSource.match(
    /\.academic-lanyard-retract\s*\{([\s\S]*?)\}/,
  );
  assert.ok(retractRule, "the retraction state needs its own visible CSS rule");
  assert.doesNotMatch(retractRule[1], /opacity|transition|animation/);
});
