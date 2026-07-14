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
  assert.match(sectionSources.Hero, /<StudioLiquidGlass/);
  assert.match(sectionSources.Projects, /data-model-scene="projects"/);
  assert.match(sectionSources.Projects, /scene-section--model-left/);
  assert.match(sectionSources.AcademicPreview, /data-model-scene="academic"/);
  assert.match(sectionSources.AcademicPreview, /scene-section--model-right/);
  assert.match(sectionSources.Contact, /data-model-scene="contact"/);
  assert.match(sectionSources.Contact, /scene-section--model-left/);
});

test("renders Home as a BIANKIII liquid glass card with the animated logo", () => {
  const hero = sectionSources.Hero;

  assert.match(hero, /import StudioLiquidGlass/);
  assert.match(hero, /import \{ withBasePath \} from "@\/components\/sitePath"/);
  assert.match(hero, /className="hero-liquid-card"/);
  assert.match(hero, /width="100%"/);
  assert.match(hero, /height="100%"/);
  assert.match(hero, /borderRadius=\{20\}/);
  assert.match(hero, /blurRadius=\{1\}/);
  assert.match(hero, /src=\{withBasePath\("\/logo-animated\.svg"\)\}/);
  assert.match(hero, /className="hero-liquid-card__logo"/);
  assert.match(hero, />\s*BIANKIII\s*</);
  assert.doesNotMatch(hero, /GlassButton|SpotlightCard/);
  assert.doesNotMatch(
    hero,
    /Welcome to my quantum space|Forest|Creative Developer|View My Work|Academic Homepage/,
  );
  assert.match(
    globals,
    /\.scene-card--hero-liquid\s*\{[\s\S]*?aspect-ratio:\s*1\.7\s*\//,
  );
  assert.match(
    globals,
    /\.scene-card--hero-liquid\s*\{[\s\S]*?max-width:\s*28rem/,
  );
  assert.match(globals, /\.hero-liquid-card__identity\s*\{/);
  assert.match(globals, /\.hero-liquid-card__logo\s*\{/);
  assert.match(globals, /\.hero-liquid-card__name\s*\{/);
});

test("gives the liquid bank card pointer tilt and reset motion without a tracking glare", () => {
  const hero = sectionSources.Hero;

  assert.match(hero, /getLiquidGlassCardTilt/);
  assert.match(hero, /onPointerEnter=\{handlePointerEnter\}/);
  assert.match(hero, /onPointerMove=\{handlePointerMove\}/);
  assert.match(hero, /onPointerLeave=\{resetCardTilt\}/);
  assert.match(hero, /onPointerCancel=\{resetCardTilt\}/);
  assert.match(hero, /requestAnimationFrame/);
  assert.doesNotMatch(hero, /hero-liquid-card__glare|--hero-card-glare/);
  assert.doesNotMatch(globals, /hero-liquid-card__glare|--hero-card-glare/);
  assert.match(
    globals,
    /perspective\(800px\)[\s\S]*rotateX\(var\(--hero-card-rotate-x\)\)[\s\S]*rotateY\(var\(--hero-card-rotate-y\)\)/,
  );
  assert.match(globals, /transform 0\.12s cubic-bezier\(0\.33, 1, 0\.68, 1\)/);
  assert.match(globals, /transform 0\.4s cubic-bezier\(0\.33, 1, 0\.68, 1\)/);
  assert.match(globals, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-liquid-card-tilt/);
});

test("keeps a stable pointer hit area while only the inner card tilts", () => {
  const hero = sectionSources.Hero;

  assert.match(hero, /className="hero-liquid-card-hit-area"/);
  assert.match(
    hero,
    /className="hero-liquid-card-hit-area"[\s\S]*?onPointerMove=\{handlePointerMove\}[\s\S]*?className="hero-liquid-card-tilt"/,
  );
  assert.match(
    globals,
    /\.hero-liquid-card-hit-area\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/,
  );
  assert.match(
    globals,
    /\.hero-liquid-card-tilt\s*\{[\s\S]*?pointer-events:\s*none/,
  );
});

test("moves the fixed background between alternating section poses", () => {
  assert.match(pageSource, /MODEL_SCENE_ORDER/);
  assert.match(pageSource, /getModelSceneAtViewportAnchor/);
  assert.match(pageSource, /getModelScenePoseKey/);
  assert.match(pageSource, /beginModelTransition/);
  assert.match(pageSource, /pendingModelTargetRef/);
  assert.match(pageSource, /requestAnimationFrame/);
  assert.match(pageSource, /addEventListener\("scroll"/);
  assert.match(pageSource, /modelXOffset=\{modelPose\.modelXOffset\}/);
  assert.match(pageSource, /modelYOffset=\{modelPose\.modelYOffset\}/);
  assert.match(globals, /\.scene-section__layout\s*\{[\s\S]*grid-template-columns:\s*repeat\(12,/);
  assert.match(globals, /\.scene-section--model-right \.scene-section__content/);
  assert.match(globals, /\.scene-section--model-left \.scene-section__content/);
  assert.match(globals, /@media \(max-width: 767px\)[\s\S]*\.scene-section__content/);
});
