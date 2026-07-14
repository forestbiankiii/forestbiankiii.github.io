import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);

test("homepage shows the animated logo on black until the model is ready", () => {
  const pageSource = readFileSync(projectFile("app/page.tsx"), "utf8");
  const globalCss = readFileSync(projectFile("app/globals.css"), "utf8");

  assert.match(pageSource, /const \[siteReady, setSiteReady\] = useState\(false\)/);
  assert.match(pageSource, /const handleModelLoaded = useCallback\(/);
  assert.match(pageSource, /onModelLoaded=\{handleModelLoaded\}/);
  assert.match(
    pageSource,
    /className="site-entry-loader"[\s\S]*data-ready=\{siteReady\}/,
  );
  assert.match(pageSource, /role="status"/);
  assert.match(pageSource, /aria-label="Loading Biankiii portfolio"/);
  assert.match(pageSource, /src=\{withBasePath\("\/logo-animated\.svg"\)\}/);

  assert.match(
    globalCss,
    /\.site-entry-loader\s*\{[\s\S]*position:\s*fixed;[\s\S]*inset:\s*0;[\s\S]*z-index:\s*1000;[\s\S]*background:\s*#000000;/,
  );
  assert.match(
    globalCss,
    /\.site-entry-loader\[data-ready="true"\]\s*\{[\s\S]*opacity:\s*0;[\s\S]*visibility:\s*hidden;[\s\S]*pointer-events:\s*none;/,
  );
  assert.match(
    globalCss,
    /\.site-entry-loader__logo\s*\{[\s\S]*filter:\s*invert\(1\);/,
  );
});

test("entry loader cannot permanently block the site and respects reduced motion", () => {
  const pageSource = readFileSync(projectFile("app/page.tsx"), "utf8");
  const globalCss = readFileSync(projectFile("app/globals.css"), "utf8");
  const modelViewerSource = readFileSync(
    projectFile("components/ModelViewer.jsx"),
    "utf8",
  );

  assert.match(pageSource, /const entryLoaderFallbackMs = 8000;/);
  assert.match(pageSource, /window\.setTimeout\([\s\S]*setSiteReady\(true\)[\s\S]*entryLoaderFallbackMs/);
  assert.match(pageSource, /window\.clearTimeout\(fallbackTimer\)/);
  assert.match(
    globalCss,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.site-entry-loader\s*\{[\s\S]*transition:\s*none;/,
  );
  assert.match(
    modelViewerSource,
    /onModelLoaded = \/\*\* @type \{\(\(\) => void\) \| undefined\} \*\//,
  );
});
