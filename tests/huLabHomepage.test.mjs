import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

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

test("does not keep any Hu Lab route in the app tree", () => {
  const routeUrl = new URL("../app/academic/hu-lab/", import.meta.url);

  assert.equal(existsSync(routeUrl), false);
});

test("does not keep Hu Lab public assets in the repository", () => {
  for (const file of [
    "../public/hu-jinming.jpg",
    "../public/hu-lab-og.png",
    "../public/hu-lab-representative-work.jpg",
  ]) {
    assert.equal(existsSync(new URL(file, import.meta.url)), false);
  }
});
