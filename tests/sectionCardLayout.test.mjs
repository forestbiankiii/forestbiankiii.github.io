import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const spotlightSource = readFileSync(
  new URL("../components/SpotlightCard.tsx", import.meta.url),
  "utf8",
);
const spotlightStyles = readFileSync(
  new URL("../components/SpotlightCard.css", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const globals = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const sectionSources = Object.fromEntries(
  ["Hero", "Projects", "AcademicPreview", "Contact"].map((name) => [
    name,
    readFileSync(
      new URL(`../components/${name}.tsx`, import.meta.url),
      "utf8",
    ),
  ]),
);

test("keeps repeated cards GPU-free while matching the button glass material", () => {
  assert.doesNotMatch(spotlightSource, /import StudioLiquidGlass/);
  assert.doesNotMatch(spotlightSource, /<canvas/);
  assert.match(spotlightSource, /data-liquid-glass-surface="css"/);
  assert.match(spotlightStyles, /backdrop-filter:\s*blur\(var\(--card-glass-blur/);
  assert.match(spotlightStyles, /border:\s*0\.5px solid color-mix/);
  assert.match(spotlightStyles, /0 0\.5rem 1\.25rem color-mix/);
});

test("assigns every homepage section an opposing model-aware layout", () => {
  assert.match(sectionSources.Hero, /data-model-scene="home"/);
  assert.match(sectionSources.Hero, /scene-section--model-right/);
  assert.match(sectionSources.Hero, /<SpotlightCard/);
  assert.match(sectionSources.Projects, /data-model-scene="projects"/);
  assert.match(sectionSources.Projects, /scene-section--model-left/);
  assert.match(sectionSources.AcademicPreview, /data-model-scene="academic"/);
  assert.match(sectionSources.AcademicPreview, /scene-section--model-right/);
  assert.match(sectionSources.Contact, /data-model-scene="contact"/);
  assert.match(sectionSources.Contact, /scene-section--model-left/);
});

test("keeps the background fixed while collapsing page cards on mobile", () => {
  assert.doesNotMatch(pageSource, /getSectionModelPosition/);
  assert.doesNotMatch(pageSource, /setActiveScene/);
  assert.match(pageSource, /modelXOffset=\{modelControls\.modelXOffset\}/);
  assert.match(pageSource, /modelYOffset=\{modelControls\.modelYOffset\}/);
  assert.match(globals, /\.scene-section__layout\s*\{[\s\S]*grid-template-columns:\s*repeat\(12,/);
  assert.match(globals, /\.scene-section--model-right \.scene-section__content/);
  assert.match(globals, /\.scene-section--model-left \.scene-section__content/);
  assert.match(globals, /@media \(max-width: 767px\)[\s\S]*\.scene-section__content/);
});
