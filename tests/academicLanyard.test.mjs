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
  assert.ok(
    statSync(cardUrl).size > 100_000,
    "card.glb is not the original React Bits model",
  );
  assert.ok(
    statSync(bandUrl).size > 1_000,
    "lanyard.png is not the original React Bits texture",
  );

  const source = read("../components/Lanyard.jsx");
  assert.match(source, /@react-three\/fiber/);
  assert.match(source, /@react-three\/rapier/);
  assert.match(source, /MeshLineGeometry/);
  assert.match(source, /useRopeJoint/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /materials\.base\.map/);
  assert.match(source, /map=\{cardMap\}/);
  assert.match(source, /scale=\{2\.25\}/);
  assert.match(source, /frontImage/);
  assert.match(source, /backImage/);
  assert.match(source, /lanyardImage/);
  assert.match(source, /\/lanyard\/card\.glb/);
  assert.match(source, /\/lanyard\/lanyard\.png/);
});

test("removes the personalized badge generator", () => {
  assert.equal(existsSync(url("../components/AcademicLanyard.jsx")), false);
  assert.equal(
    existsSync(url("../scripts/generate-lanyard-assets.mjs")),
    false,
  );
});

test("drops the original lanyard directly from its top-bar button", () => {
  const source = read("../app/academic/page.tsx");
  const lanyardSource = read("../components/Lanyard.jsx");
  const lanyardCss = read("../components/Lanyard.css");

  assert.match(source, /import\("@\/components\/Lanyard"\)/);
  assert.match(source, /ssr:\s*false/);
  assert.match(source, /const \[lanyardOpen, setLanyardOpen\] = useState\(false\)/);
  assert.match(source, /const \[lanyardReady, setLanyardReady\] = useState\(false\)/);
  assert.match(source, /setLanyardOpen\(!lanyardOpen\)/);
  assert.match(source, /aria-controls="academic-lanyard-hanger"/);
  assert.match(source, /id="academic-lanyard-hanger"/);
  assert.match(source, /academic-lanyard-trigger/);
  assert.match(source, /academic-lanyard-hanger/);
  assert.match(source, /academic-lanyard-drop/);
  assert.match(source, /<main className="[^"]*overflow-x-clip/);
  assert.match(source, /position:\s*fixed/);
  assert.match(source, /inset:\s*0/);
  assert.match(source, /width:\s*100vw/);
  assert.match(source, /height:\s*100vh/);
  assert.match(source, /height:\s*100dvh/);
  assert.match(source, /z-index:\s*40/);
  assert.doesNotMatch(source, /width:\s*min\(42rem,\s*100vw\)/);
  assert.doesNotMatch(source, /height:\s*min\(44rem,/);
  assert.doesNotMatch(source, /translate\(-50%,/);
  assert.doesNotMatch(source, /scale\(0\.94\)/);
  assert.match(
    source,
    /\.academic-lanyard-hanger \*\s*\{\s*pointer-events:\s*none\s*!important/,
  );
  assert.match(
    source,
    /\.academic-lanyard-drop \*\s*\{\s*pointer-events:\s*auto\s*!important/,
  );
  assert.match(source, /lanyardOpen && lanyardReady/);
  assert.match(source, /onReady=\{\(\) => setLanyardReady\(true\)\}/);
  assert.match(
    source,
    /<Lanyard[\s\S]*position=\{\[0, 0, 20\]\}[\s\S]*gravity=\{\[0, -40, 0\]\}/,
  );

  const triggerIndex = source.indexOf('aria-controls="academic-lanyard-hanger"');
  const headerIndex = source.indexOf("<header");
  assert.ok(triggerIndex > -1 && triggerIndex < headerIndex);

  assert.match(lanyardSource, /onReady = null/);
  assert.match(lanyardSource, /onReady\?\.\(\)/);
  assert.doesNotMatch(lanyardSource, /frameloop=/);
  assert.match(lanyardSource, /dpr=\{1\}/);
  assert.doesNotMatch(lanyardSource, /dpr=\{\[1,/);
  assert.doesNotMatch(lanyardCss, /transform:\s*scale\(0\.9\)/);
  assert.doesNotMatch(source, /active=\{lanyardOpen\}/);
  assert.doesNotMatch(
    source,
    /\{lanyardOpen && \(\s*<Lanyard/,
  );
  assert.doesNotMatch(source, /AcademicLanyard/);
  assert.doesNotMatch(source, /interactiveBadge/);
  assert.doesNotMatch(source, /Interactive academic badge/);
  assert.doesNotMatch(source, /aria-haspopup="dialog"/);
  assert.doesNotMatch(source, /role="dialog"/);
  assert.doesNotMatch(source, /aria-modal="true"/);
  assert.doesNotMatch(source, /fixed inset-0/);
  assert.doesNotMatch(source, /bg-neutral-950\/70/);
});

test("restarts the complete lanyard on every opening", () => {
  const source = read("../app/academic/page.tsx");

  assert.match(
    source,
    /const \[lanyardInstance, setLanyardInstance\] = useState\(0\)/,
  );
  assert.match(
    source,
    /if \(!lanyardOpen\)\s*setLanyardInstance\(\(instance\) => instance \+ 1\)/,
  );
  assert.match(source, /<Lanyard\s+key=\{lanyardInstance\}/);
});

test("declares the lanyard physics dependencies", () => {
  const packageJson = JSON.parse(read("../package.json"));

  assert.equal(typeof packageJson.dependencies.meshline, "string");
  assert.equal(typeof packageJson.dependencies["@react-three/rapier"], "string");
});
