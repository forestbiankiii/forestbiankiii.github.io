import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const url = (path) => new URL(path, import.meta.url);

test("keeps a black strap with compact repeated sunburst marks", async () => {
  const textureUrl = url("../public/lanyard/sunburst-lanyard.png");
  assert.equal(existsSync(textureUrl), true, "the new lanyard texture is missing");
  assert.ok(statSync(textureUrl).size > 1_000);

  const png = readFileSync(textureUrl);
  assert.equal(png.readUInt32BE(16), 1025);
  assert.equal(png.readUInt32BE(20), 250);

  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(fileURLToPath(textureUrl))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const brightPixelsByQuarter = [0, 0, 0, 0];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const luminance =
        (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
      if (luminance > 180) {
        const quarter = Math.min(3, Math.floor((x * 4) / info.width));
        brightPixelsByQuarter[quarter] += 1;
      }
    }
  }
  assert.ok(data[0] < 24 && data[1] < 24 && data[2] < 24, "strap background must be black");
  for (const brightPixels of brightPixelsByQuarter) {
    assert.ok(brightPixels > 500, "each strap quarter needs a visible mark");
    assert.ok(brightPixels < 12_000, "each mark should stay compact");
  }

  const source = readFileSync(url("../components/Lanyard.jsx"), "utf8");
  assert.match(source, /\/lanyard\/sunburst-lanyard\.png/);
  assert.match(source, /repeat=\{\[-1,\s*1\]\}/);
  assert.doesNotMatch(source, /repeat=\{\[-4,\s*1\]\}/);
});

test("lets the badge keep its natural angular momentum", () => {
  const source = readFileSync(url("../components/Lanyard.jsx"), "utf8");

  assert.doesNotMatch(source, /setAngvel\(/);
  assert.doesNotMatch(source, /ang\.y\s*-\s*rot\.y\s*\*\s*0\.25/);
});

test("uses the supplied sunburst mark on the badge front", () => {
  const cardTextureUrl = url("../public/lanyard/sunburst-card.png");
  assert.equal(
    existsSync(cardTextureUrl),
    true,
    "the new badge-front texture is missing",
  );

  const png = readFileSync(cardTextureUrl);
  assert.equal(png.readUInt32BE(16), 800);
  assert.equal(png.readUInt32BE(20), 1208);

  const pageSource = readFileSync(url("../app/academic/page.tsx"), "utf8");
  assert.match(
    pageSource,
    /frontImage=\{withBasePath\("\/lanyard\/sunburst-card\.png"\)\}/,
  );
  assert.match(pageSource, /imageFit="cover"/);
});
