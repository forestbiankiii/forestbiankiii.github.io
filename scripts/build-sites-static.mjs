import {
  access,
  cp,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);

const root = process.cwd();
const outputDirectory = resolve(root, "out");
const distDirectory = resolve(root, "dist");
const clientDirectory = resolve(distDirectory, "client");
const serverDirectory = resolve(distDirectory, "server");

await rm(distDirectory, { recursive: true, force: true });
await mkdir(clientDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await cp(outputDirectory, clientDirectory, { recursive: true });
await copyFile(
  resolve(root, "workers", "sites-static-worker.mjs"),
  resolve(serverDirectory, "index.js"),
);

const oversizedModel = resolve(
  clientDirectory,
  "models",
  "2025_ferrari_296_gt3_verstappen_racing.glb",
);
const compressedModelPath = `${oversizedModel}.gz`;

try {
  const modelBytes = await readFile(oversizedModel);
  const compressedModel = await gzipAsync(modelBytes, { level: 9 });
  await writeFile(compressedModelPath, compressedModel);
  await rm(oversizedModel);
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }

  await access(compressedModelPath);
}

console.log("Prepared dist/ for Sites deployment.");
