import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const expectedDois = new Set([
  "10.1002/lpor.71473",
  "10.1021/acsphotonics.5c02472",
  "10.1021/acsphotonics.5c00478",
  "10.1063/5.0256795",
  "10.1002/lpor.202401458",
  "10.1038/s41467-024-51148-5",
  "10.1002/adfm.202407116",
  "10.1038/s43246-024-00553-w",
  "10.1021/acsphotonics.4c00137",
  "10.1016/j.optmat.2024.114847",
  "10.1039/d3tc04427k",
  "10.1142/S0218863523400143",
  "10.1016/j.matchemphys.2023.128096",
  "10.1016/j.jallcom.2023.170867",
  "10.1039/d1nr07893c",
]);

test("publishes the complete verified USST-affiliated corpus", async () => {
  const data = await import("../app/academic/hu-lab/publications.ts");

  assert.equal(data.HU_LAB_PUBLICATION_CUTOFF, "2026-07-13");
  assert.equal(data.HU_LAB_PUBLICATIONS.length, expectedDois.size);
  assert.deepEqual(
    new Set(data.HU_LAB_PUBLICATIONS.map(({ doi }) => doi)),
    expectedDois,
  );
  assert.equal(
    new Set(data.HU_LAB_PUBLICATIONS.map(({ doi }) => doi.toLowerCase())).size,
    expectedDois.size,
  );
  assert.equal(
    data.HU_LAB_PUBLICATIONS.every(
      ({ authors, title, venue }) =>
        authors.includes("Jinming Hu") && title.length > 20 && venue.length > 2,
    ),
    true,
  );
});

test("links the personal academic profile to the group homepage", () => {
  const academic = readFileSync(
    new URL("../app/academic/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(academic, /\/academic\/hu-lab/);
  assert.match(academic, /胡津铭课题组/);
  assert.match(academic, /15 篇/);
});

test("renders the evidence boundary and full publication collection", () => {
  const pageUrl = new URL("../app/academic/hu-lab/page.tsx", import.meta.url);

  assert.equal(existsSync(pageUrl), true);

  const page = readFileSync(pageUrl, "utf8");

  assert.match(page, /HU_LAB_PUBLICATIONS/);
  assert.match(page, /HU_LAB_PUBLICATION_CUTOFF/);
  assert.match(page, /上海理工大学/);
  assert.match(page, /doi\.org/);
  assert.match(page, /收录口径/);
});

test("publishes route-specific social metadata", () => {
  const layout = readFileSync(
    new URL("../app/academic/hu-lab/layout.tsx", import.meta.url),
    "utf8",
  );
  const socialCard = new URL("../public/hu-lab-og.png", import.meta.url);

  assert.equal(existsSync(socialCard), true);
  assert.match(layout, /openGraph/);
  assert.match(layout, /twitter/);
  assert.match(layout, /hu-lab-og\.png/);
});

test("keeps group metadata compatible with static export", () => {
  const layout = readFileSync(
    new URL("../app/academic/hu-lab/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(layout, /from "next\/headers"/);
  assert.doesNotMatch(layout, /headers\(\)/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);
});
