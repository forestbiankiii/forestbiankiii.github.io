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

test("moves the complete roster to a dedicated members page", async () => {
  const labPage = readFileSync(
    new URL("../app/academic/hu-lab/page.tsx", import.meta.url),
    "utf8",
  );
  const membersPageUrl = new URL(
    "../app/academic/hu-lab/members/page.tsx",
    import.meta.url,
  );
  const membersLayoutUrl = new URL(
    "../app/academic/hu-lab/members/layout.tsx",
    import.meta.url,
  );
  const membersData = await import(
    "../app/academic/hu-lab/members/members.ts"
  );
  const membersPage = readFileSync(membersPageUrl, "utf8");

  assert.equal(existsSync(membersPageUrl), true);
  assert.equal(existsSync(membersLayoutUrl), true);
  assert.match(labPage, /withBasePath\("\/academic\/hu-lab\/members"\)/);
  assert.doesNotMatch(labPage, /id="members"/);
  assert.doesNotMatch(labPage, /const memberGroups/);

  const students = membersData.HU_LAB_MEMBER_GROUPS.flatMap(
    ({ members }) => members,
  );

  assert.equal(students.length, 10);
  assert.equal(new Set(students.map(({ name }) => name)).size, 10);
  assert.equal(
    students.every(
      ({ research, contact, bio }) =>
        research === "" && contact === "" && bio === "",
    ),
    true,
  );

  const wangMaolin = students.find(({ name }) => name === "汪懋林");
  const otherStudents = students.filter(({ name }) => name !== "汪懋林");

  assert.equal(wangMaolin?.photo, "/profile.jpg");
  assert.equal(otherStudents.every(({ photo }) => photo === null), true);
  assert.equal(
    existsSync(new URL("../public/profile.jpg", import.meta.url)),
    true,
  );
  assert.match(membersPage, /withBasePath\(person\.photo\)/);

  assert.match(membersPage, /HU_LAB_MEMBER_GROUPS/);
  assert.match(membersPage, /照片待补充/);
  assert.match(membersPage, /研究方向/);
  assert.match(membersPage, /联系方式/);
  assert.match(membersPage, /个人简介/);

  for (const member of [
    "胡润杰",
    "丁正伟",
    "汪懋林",
    "林晗曦",
    "胡海菁",
    "李伟",
    "章楠",
    "胡亦琛",
    "徐业翔",
    "郑霖睿",
  ]) {
    assert.equal(students.some(({ name }) => name === member), true);
  }
});

test("publishes the PI email and a verified Google Scholar discovery link", () => {
  const page = readFileSync(
    new URL("../app/academic/hu-lab/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /mailto:jmhu0101@usst\.edu\.cn/);
  assert.match(page, /jmhu0101@usst\.edu\.cn/);
  assert.match(page, /scholar\.google\.(?:com|co\.uk)\/scholar/);
  assert.match(page, /Google Scholar/);
});

test("features a representative paper led by Jinming Hu", () => {
  const page = readFileSync(
    new URL("../app/academic/hu-lab/page.tsx", import.meta.url),
    "utf8",
  );
  const paperFigure = new URL(
    "../public/hu-lab-representative-work.jpg",
    import.meta.url,
  );

  assert.equal(existsSync(paperFigure), true);
  assert.match(page, /hu-lab-representative-work\.jpg/);
  assert.match(page, /10\.1002\/lpor\.202401458/);
  assert.match(page, /Laser &amp; Photonics Reviews/);
  assert.match(page, /胡津铭.*共同第一作者/s);
  assert.match(page, /上海理工大学光子芯片研究院成果报道/);
  assert.doesNotMatch(page, /10\.1038\/s41467-024-51148-5/);
});

test("keeps supporting typography at a readable size", () => {
  const css = readFileSync(
    new URL("../app/academic/hu-lab/hu-lab.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /--hu-text-xs:\s*12px/);
  assert.match(css, /--hu-text-sm:\s*14px/);
  assert.match(css, /--hu-text-base:\s*16px/);
  assert.doesNotMatch(css, /font-size:\s*(?:[7-9]|10)px/);
});

test("shows the PI portrait at its full vertical composition", () => {
  const css = readFileSync(
    new URL("../app/academic/hu-lab/hu-lab.css", import.meta.url),
    "utf8",
  );
  const portraitRule = css.match(
    /\.hu-lab-profile__portrait\s*\{(?<rule>[^}]*)\}/,
  )?.groups?.rule;

  assert.ok(portraitRule);
  assert.match(portraitRule, /width:\s*min\(72%,\s*249px\)/);
  assert.match(portraitRule, /height:\s*auto/);
  assert.match(portraitRule, /min-height:\s*0/);
  assert.match(portraitRule, /aspect-ratio:\s*249\s*\/\s*363/);
  assert.match(portraitRule, /object-fit:\s*contain/);
  assert.doesNotMatch(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*\.hu-lab-profile__portrait\s*\{[^}]*height:\s*390px/,
  );
});
