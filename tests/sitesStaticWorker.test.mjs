import assert from "node:assert/strict";
import test from "node:test";

import worker from "../workers/sites-static-worker.mjs";

test("Sites static worker resolves exported Next routes to index.html", async () => {
  const requestedPaths = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        requestedPaths.push(pathname);
        return pathname === "/academic/hu-lab/index.html"
          ? new Response("lab", { status: 200 })
          : new Response("missing", { status: 404 });
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://example.com/academic/hu-lab/"),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "lab");
  assert.deepEqual(requestedPaths, [
    "/academic/hu-lab/",
    "/academic/hu-lab/index.html",
  ]);
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
