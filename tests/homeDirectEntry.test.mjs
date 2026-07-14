import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("homepage renders the main site directly without intro cover gating", () => {
  const pageSource = readFileSync(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(pageSource, /@\/components\/Intro/);
  assert.doesNotMatch(pageSource, /@\/components\/introVisit/);
  assert.doesNotMatch(pageSource, /\bentered\b/);
  assert.doesNotMatch(pageSource, /\bintroResolved\b/);
  assert.doesNotMatch(pageSource, /<Intro\b/);
  assert.match(pageSource, /<ModelViewer[\s\S]*url=\{withBasePath\(FERRARI_MODEL_PATH\)\}/);
  assert.match(pageSource, /<ViewportFrame \/>[\s\S]*<Navbar onToggleTheme=\{handleToggleTheme\} \/>[\s\S]*<Hero \/>/);
});

test("cover-only components and preview assets are removed", () => {
  for (const file of [
    "../components/Intro.tsx",
    "../components/introClipPaths.ts",
    "../components/introVisit.ts",
    "../components/VariableProximity.tsx",
    "../components/VariableProximity.module.css",
    "../components/variableProximitySettings.ts",
    "../public/font-preview.html",
  ]) {
    assert.equal(existsSync(new URL(file, import.meta.url)), false, file);
  }
});

test("global styles do not keep cover-specific font or panel styles", () => {
  const globalCss = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(globalCss, /Playfair\+Display|Playfair Display/);
  assert.doesNotMatch(globalCss, /\.intro-background-panel/);
});

test("academic page no longer marks cover state before returning home", () => {
  const academicSource = readFileSync(
    new URL("../app/academic/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(academicSource, /@\/components\/introVisit/);
  assert.doesNotMatch(academicSource, /markIntroSeen/);
});
