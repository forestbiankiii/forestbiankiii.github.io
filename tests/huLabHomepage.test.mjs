import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const offlineContentPattern =
  /Hu Lab|胡津铭|Jinming Hu|课题组|上海理工大学|doi\.org|jmhu0101|HU_LAB|hu-lab-og|representative-work/;

test("does not surface the Hu Lab entry directly on the public homepage", () => {
  const hero = readFileSync(
    new URL("../components/Hero.tsx", import.meta.url),
    "utf8",
  );
  const academicPreview = readFileSync(
    new URL("../components/AcademicPreview.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(hero, /withBasePath\("\/academic\/hu-lab"\)/);
  assert.doesNotMatch(hero, /Hu Lab 课题组/);
  assert.doesNotMatch(academicPreview, /withBasePath\("\/academic\/hu-lab"\)/);
  assert.doesNotMatch(academicPreview, /Research Group/);
  assert.doesNotMatch(academicPreview, /课题组入口/);
});

test("does not link the academic profile to the Hu Lab route", () => {
  const academic = readFileSync(
    new URL("../app/academic/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(academic, /\/academic\/hu-lab/);
  assert.doesNotMatch(academic, /胡津铭课题组/);
  assert.doesNotMatch(academic, /Research Group · 课题组/);
});

test("keeps the Hu Lab route present but blank", () => {
  const pageUrl = new URL("../app/academic/hu-lab/page.tsx", import.meta.url);

  assert.equal(existsSync(pageUrl), true);

  const page = readFileSync(pageUrl, "utf8");

  assert.match(page, /return null/);
  assert.doesNotMatch(page, offlineContentPattern);
  assert.doesNotMatch(page, /from "\.\/publications"/);
  assert.doesNotMatch(page, /from "next\/link"/);
});

test("keeps the Hu Lab members route present but blank", () => {
  const membersPageUrl = new URL(
    "../app/academic/hu-lab/members/page.tsx",
    import.meta.url,
  );

  assert.equal(existsSync(membersPageUrl), true);

  const membersPage = readFileSync(membersPageUrl, "utf8");

  assert.match(membersPage, /return null/);
  assert.doesNotMatch(membersPage, offlineContentPattern);
  assert.doesNotMatch(membersPage, /HU_LAB_MEMBER_GROUPS/);
  assert.doesNotMatch(membersPage, /from "next\/link"/);
});

test("marks the offline Hu Lab routes as non-indexable", () => {
  for (const file of [
    "../app/academic/hu-lab/layout.tsx",
    "../app/academic/hu-lab/members/layout.tsx",
  ]) {
    const layout = readFileSync(new URL(file, import.meta.url), "utf8");

    assert.match(layout, /robots/);
    assert.match(layout, /index:\s*false/);
    assert.match(layout, /follow:\s*false/);
    assert.doesNotMatch(layout, offlineContentPattern);
    assert.doesNotMatch(layout, /openGraph/);
    assert.doesNotMatch(layout, /twitter/);
  }
});
