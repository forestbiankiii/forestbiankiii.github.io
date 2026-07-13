import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contactSource = readFileSync(
  new URL("../components/Contact.tsx", import.meta.url),
  "utf8",
);

test("shows the requested social profiles with English labels", () => {
  for (const platform of ["TikTok", "Bilibili", "GitHub", "Xiaohongshu"]) {
    assert.match(contactSource, new RegExp(`name: "${platform}"`));
  }

  assert.match(contactSource, /https:\/\/v\.douyin\.com\/2l1Qo0M6UKQ\//);
  assert.match(contactSource, /https:\/\/space\.bilibili\.com\/384707552/);
  assert.match(contactSource, /https:\/\/github\.com\/forestbiankiii/);
  assert.match(
    contactSource,
    /https:\/\/www\.xiaohongshu\.com\/user\/profile\/64afc4c9000000002b0081bf/,
  );
  assert.doesNotMatch(contactSource, /name: "(?:Email|LinkedIn|Twitter)"/);
  assert.doesNotMatch(contactSource, /name: "(?:抖音|B站|小红书)"/);
});
