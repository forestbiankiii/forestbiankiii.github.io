import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../components/ViewportFrame.tsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("keeps gray contours only for the navigation and footer", () => {
  assert.match(source, /viewport-frame-outer-gradient/);
  assert.match(source, /renderOuterGradientPaths/);
  assert.match(source, /StudioLiquidGlass/);
  assert.doesNotMatch(source, /OuterGradientRole = "frame"/);
  assert.doesNotMatch(source, /viewport-frame-gradient-frame-path/);
});

test("renders only two minimal WebGL windows for navigation and footer", () => {
  assert.equal(source.match(/<StudioLiquidGlass/g)?.length, 2);
  assert.match(source, /viewport-frame-glass--nav/);
  assert.match(source, /viewport-frame-glass--footer/);
  assert.match(source, /navWidth: navRect\.width/);
  assert.match(source, /footerHeight: footerRect\.height/);
  assert.match(source, /height=\{geometry\.navHeight\}/);
  assert.match(source, /height=\{geometry\.footerHeight \+ geometry\.radius\}/);
  assert.match(source, /maxDpr=\{1\}/);
  assert.match(source, /capturePad=\{40\}/);
  assert.doesNotMatch(source, /buildConnectedFrameMask/);
  assert.doesNotMatch(source, /frameInnerPath/);
  assert.doesNotMatch(source, /pathData/);
});

test("uses one rectangle with two semicircular ends for the navigation", () => {
  assert.match(source, /const navRadius = navHeight \/ 2/);
  assert.match(source, /height=\{geometry\.navHeight\}/);
  assert.match(source, /borderRadius=\{geometry\.navRadius\}/);
  assert.match(source, /navTop:\s*readCssPixelValue/);
  assert.match(source, /navGlass\.style\.top = `\$\{geometry\.navTop\}px`/);
  assert.match(
    globalStyles,
    /\.site-nav-shell\s*\{[\s\S]*?border-radius:\s*calc\(var\(--nav-shell-height\)\s*\/\s*2\)/,
  );
  assert.doesNotMatch(source, /height=\{geometry\.navHeight \+ geometry\.radius\}/);
});

test("moves the complete navigation glass stack down by eight pixels", () => {
  assert.match(globalStyles, /--nav-shell-block-inset:\s*8px/);
  assert.match(
    globalStyles,
    /\.site-nav-shell\s*\{[\s\S]*?top:\s*var\(--nav-shell-block-inset\)/,
  );
  assert.match(
    source,
    /getPropertyValue\("--nav-shell-block-inset"\)/,
  );
  assert.match(source, /top:\s*`\$\{geometry\.navTop\}px`/);
});
