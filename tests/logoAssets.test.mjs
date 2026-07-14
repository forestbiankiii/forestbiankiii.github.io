import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);

function readOptional(path) {
  try {
    return readFileSync(projectFile(path), "utf8");
  } catch {
    return "";
  }
}

function findLogoAssets() {
  return readdirSync(projectFile("public/"))
    .filter((name) => /^logo(?:[-_.].*)?\.(?:svg|png|jpe?g|webp|gif)$/i.test(name))
    .sort();
}

function attributesFor(source, id) {
  return source.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0] ?? "";
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]+)"`))?.[1] ?? "";
}

function rayGeometry(source) {
  return new Map(
    [...source.matchAll(/<path\s+id="(ray-\d{2}|primary-beam)"[^>]+d="([^"]+)"[^>]*>/g)].map(
      ([, id, d]) => [id, d],
    ),
  );
}

test("ships only the canonical static and animated vector logo assets", () => {
  assert.deepEqual(findLogoAssets(), ["logo-animated.svg", "logo.svg"]);
});

test("draws a mathematically regular black hexagon around the centered white core", () => {
  const logo = readOptional("public/logo.svg");
  const hexagon = attributesFor(logo, "hexagon");
  const core = attributesFor(logo, "quantum-core");

  assert.match(logo, /viewBox="0 0 512 512"/);
  assert.equal(attribute(hexagon, "fill"), "#000000");
  assert.equal(attribute(core, "cx"), "256");
  assert.equal(attribute(core, "cy"), "256");
  assert.equal(attribute(core, "r"), "64");
  assert.equal(attribute(core, "fill"), "#ffffff");
  assert.doesNotMatch(logo, /<(?:image|text)\b|data:image\//);

  const points = attribute(hexagon, "points")
    .trim()
    .split(/\s+/)
    .map((point) => point.split(",").map(Number));
  assert.equal(points.length, 6);

  const sideLengths = points.map(([x1, y1], index) => {
    const [x2, y2] = points[(index + 1) % points.length];
    return Math.hypot(x2 - x1, y2 - y1);
  });
  assert.ok(Math.max(...sideLengths) - Math.min(...sideLengths) < 0.002);
});

test("uses one continuous dominant laser beam and irregular vector-only rays", () => {
  const logo = readOptional("public/logo.svg");
  const rays = rayGeometry(logo);

  assert.equal(rays.size, 19);
  assert.equal([...rays.keys()].filter((id) => id === "primary-beam").length, 1);
  assert.match(attributesFor(logo, "primary-beam"), /fill="#ffffff"/);
  assert.equal(new Set(rays.values()).size, rays.size);
});

test("turns the incident beam directly into the core before a staggered radial burst", () => {
  const staticLogo = readOptional("public/logo.svg");
  const animatedLogo = readOptional("public/logo-animated.svg");
  const rayDelays = [...animatedLogo.matchAll(/style="--delay: ([.\d]+)s"/g)].map(
    ([, delay]) => Number(delay),
  );
  const animatedRays = rayGeometry(animatedLogo);
  const primaryBeam = animatedRays.get("primary-beam") ?? "";

  assert.deepEqual(rayGeometry(animatedLogo), rayGeometry(staticLogo));
  assert.match(primaryBeam, /^M250 249\b/);
  assert.match(animatedLogo, /animation:\s*incident-beam 5\.2s/);
  assert.match(animatedLogo, /animation:\s*core-expand 5\.2s/);
  assert.match(animatedLogo, /animation:\s*radial-burst 5\.2s/);
  assert.match(
    animatedLogo,
    /@keyframes incident-beam\s*\{[\s\S]*?0%, 2%\s*\{ clip-path: inset\(0 0 0 100%\); opacity: 0; \}[\s\S]*?16%\s*\{ clip-path: inset\(0\); opacity: 1; \}[\s\S]*?21%\s*\{ clip-path: inset\(0 100% 0 0\); opacity: 1; \}/,
  );
  assert.match(
    animatedLogo,
    /@keyframes core-expand\s*\{[\s\S]*?0%, 14%\s*\{ transform: scale\(0\); opacity: 0; \}[\s\S]*?15%\s*\{ transform: scale\(\.06\); opacity: 1; \}[\s\S]*?16%\s*\{ transform: scale\(\.18\); opacity: 1; \}[\s\S]*?24%\s*\{ transform: scale\(1\.16\); opacity: 1; \}/,
  );
  assert.match(
    animatedLogo,
    /@keyframes radial-burst\s*\{[\s\S]*?0%, 27%\s*\{ transform: scaleX\(\.04\); opacity: 0; \}[\s\S]*?30%\s*\{ transform: scaleX\(\.12\); opacity: 1; \}[\s\S]*?43%\s*\{ transform: scaleX\(1\.05\); opacity: 1; \}/,
  );
  assert.equal(rayDelays.length, 18);
  assert.ok(rayDelays.every((delay, index) => index === 0 || delay > rayDelays[index - 1]));
  assert.ok(rayDelays.at(-1) <= 0.34);
  for (const [id, path] of animatedRays) {
    if (!id.startsWith("ray-")) continue;

    const points = [...path.matchAll(/[ML](\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g)];
    const innerEdge = [Number(points[0][1]), Number(points.at(-1)[1])];
    const scaledInnerEdge = 256 + (Math.max(...innerEdge) - 256) * 1.05;

    assert.ok(scaledInnerEdge <= 316, `${id} must remain beneath the core at peak overshoot`);
  }
  assert.match(animatedLogo, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(animatedLogo, /<(?:image|text)\b|data:image\//);
});

test("uses a theme-aware static logo in navigation and the animated logo on Home", () => {
  const navbar = readOptional("components/Navbar.tsx");
  const hero = readOptional("components/Hero.tsx");
  const styles = readOptional("app/globals.css");
  const layout = readOptional("app/layout.tsx");

  assert.match(navbar, /withBasePath\("\/logo\.svg"\)/);
  assert.doesNotMatch(navbar, /withBasePath\("\/logo-animated\.svg"\)/);
  assert.match(navbar, /className="site-nav-logo"/);
  assert.match(navbar, /aria-label="Biankiii — Home"/);
  assert.doesNotMatch(navbar, />\s*Bian<span>Kiii<\/span>\s*</);
  assert.match(hero, /withBasePath\("\/logo-animated\.svg"\)/);
  assert.match(hero, /className="hero-liquid-card__logo"/);
  assert.match(
    styles,
    /\[data-site-theme="black"\] \.site-nav-logo[\s\S]*?filter:\s*invert\(1\)/,
  );
  assert.match(
    styles,
    /\[data-site-theme="white"\] \.site-nav-logo[\s\S]*?filter:\s*none/,
  );
  assert.match(layout, /icon:\s*"\/logo\.svg"/);
  assert.match(layout, /shortcut:\s*"\/logo\.svg"/);
  assert.match(layout, /apple:\s*"\/logo\.svg"/);
});

test("centers the logo and theme toggle on the navigation end caps", () => {
  const navbar = readOptional("components/Navbar.tsx");
  const styles = readOptional("app/globals.css");
  const brandIndex = navbar.indexOf('className="site-nav-brand"');
  const linksIndex = navbar.indexOf('className="site-nav-links hidden md:block"');
  const toggleIndex = navbar.indexOf('className="site-theme-toggle');

  assert.ok(brandIndex >= 0);
  assert.ok(linksIndex > brandIndex);
  assert.ok(toggleIndex > linksIndex);
  assert.match(
    navbar,
    /className="site-nav-content flex h-full w-full items-center justify-between"/,
  );
  assert.match(navbar, /className="site-theme-toggle[^\"]*size-11/);
  assert.match(
    styles,
    /\.site-nav-content\s*\{[\s\S]*?padding-inline:\s*calc\(\(var\(--nav-shell-height\) - 2\.75rem\) \/ 2\)/,
  );
});
