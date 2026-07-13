import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const url = (path) => new URL(path, import.meta.url);
const read = (path) => readFileSync(url(path), "utf8");

test("provides the React Bits lanyard interaction contract", () => {
  const componentUrl = url("../components/Lanyard.jsx");
  const cardUrl = url("../public/lanyard/card.glb");
  const bandUrl = url("../public/lanyard/lanyard.png");

  assert.equal(existsSync(componentUrl), true, "Lanyard component is missing");
  assert.equal(existsSync(cardUrl), true, "card.glb is missing");
  assert.equal(existsSync(bandUrl), true, "lanyard.png is missing");
  assert.ok(statSync(cardUrl).size > 1_000, "card.glb is unexpectedly small");
  assert.ok(statSync(bandUrl).size > 50, "lanyard.png is unexpectedly small");

  const source = read("../components/Lanyard.jsx");
  assert.match(source, /@react-three\/fiber/);
  assert.match(source, /@react-three\/rapier/);
  assert.match(source, /MeshLineGeometry/);
  assert.match(source, /useRopeJoint/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /frontImage/);
  assert.match(source, /backImage/);
  assert.match(source, /\/lanyard\/card\.glb/);
  assert.match(source, /\/lanyard\/lanyard\.png/);
});

test("builds a badge from the existing portrait and verified contacts", () => {
  const componentUrl = url("../components/AcademicLanyard.jsx");

  assert.equal(
    existsSync(componentUrl),
    true,
    "AcademicLanyard component is missing",
  );
  assert.equal(existsSync(url("../public/profile.jpg")), true);

  const source = read("../components/AcademicLanyard.jsx");
  assert.match(source, /profile\.jpg/);
  assert.match(source, /Wang Maolin/);
  assert.match(source, /2335060723@st\.usst\.edu\.cn/);
  assert.match(source, /forestbiankiii@gmail\.com/);
  assert.match(source, /github\.com\/forestbiankiii/);
  assert.match(source, /toDataURL\("image\/png"\)/);
  assert.match(source, /frontImage=\{faces\.front\}/);
  assert.match(source, /backImage=\{faces\.back\}/);
});

test("loads the WebGL badge client-side on the academic page", () => {
  const source = read("../app/academic/page.tsx");

  assert.match(source, /AcademicLanyard/);
  assert.match(source, /ssr:\s*false/);
  assert.match(source, /interactiveBadge/);
});

test("declares the lanyard physics dependencies", () => {
  const packageJson = JSON.parse(read("../package.json"));

  assert.equal(typeof packageJson.dependencies.meshline, "string");
  assert.equal(typeof packageJson.dependencies["@react-three/rapier"], "string");
});
