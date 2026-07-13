import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import worker from "../workers/sites-static-worker.mjs";

test("Sites build reuses an already-compressed model asset", () => {
  const fixture = mkdtempSync(join(tmpdir(), "sites-static-build-"));
  const compressedModel = join(
    fixture,
    "out/models/2025_ferrari_296_gt3_verstappen_racing.glb.gz",
  );
  const workerEntry = join(fixture, "workers/sites-static-worker.mjs");
  const buildScript = new URL(
    "../scripts/build-sites-static.mjs",
    import.meta.url,
  );

  try {
    mkdirSync(join(fixture, "out/models"), { recursive: true });
    mkdirSync(join(fixture, "workers"), { recursive: true });
    writeFileSync(compressedModel, "already-compressed");
    writeFileSync(workerEntry, "export default {};\n");

    const result = spawnSync(process.execPath, [buildScript.pathname], {
      cwd: fixture,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(
        join(
          fixture,
          "dist/client/models/2025_ferrari_296_gt3_verstappen_racing.glb.gz",
        ),
        "utf8",
      ),
      "already-compressed",
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("Sites static worker resolves exported Next routes to index.html", async () => {
  const requestedPaths = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        requestedPaths.push(pathname);
        return pathname === "/academic/index.html"
          ? new Response("academic", { status: 200 })
          : new Response("missing", { status: 404 });
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://example.com/academic/"),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "academic");
  assert.deepEqual(requestedPaths, ["/academic/", "/academic/index.html"]);
});

test("Sites static worker serves the exported 404 page for unknown routes", async () => {
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        return pathname === "/404.html"
          ? new Response("not found", { status: 200 })
          : new Response("missing", { status: 404 });
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://example.com/does-not-exist"),
    env,
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "not found");
});

test("Sites static worker serves an oversized GLB from its gzip asset", async () => {
  const requestedPaths = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        requestedPaths.push(pathname);
        return pathname.endsWith(".glb.gz")
          ? new Response("compressed-model", { status: 200 })
          : new Response("missing", { status: 404 });
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://example.com/models/car.glb"),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-encoding"), "gzip");
  assert.equal(response.headers.get("content-type"), "model/gltf-binary");
  assert.deepEqual(requestedPaths, [
    "/models/car.glb",
    "/models/car.glb.gz",
  ]);
});
