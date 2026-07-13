import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

class NodeFileReader {
  result = null;
  error = null;
  onloadend = null;

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.();
      })
      .catch((error) => {
        this.error = error;
        this.onloadend?.();
      });
  }

  readAsDataURL(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        const base64 = Buffer.from(result).toString("base64");
        this.result = `data:${blob.type};base64,${base64}`;
        this.onloadend?.();
      })
      .catch((error) => {
        this.error = error;
        this.onloadend?.();
      });
  }
}

globalThis.FileReader ??= NodeFileReader;

const projectRoot = resolve(import.meta.dirname, "..");
const cardPath = resolve(projectRoot, "public/lanyard/card.glb");
const bandPath = resolve(projectRoot, "public/lanyard/lanyard.png");

function createNamedMesh(name, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  return mesh;
}

async function generateCardModel() {
  const scene = new THREE.Scene();
  const base = new THREE.MeshStandardMaterial({
    name: "base",
    color: 0xf4f5ef,
    roughness: 0.72,
    metalness: 0.08,
  });
  const metal = new THREE.MeshStandardMaterial({
    name: "metal",
    color: 0xb8bec6,
    roughness: 0.28,
    metalness: 0.9,
  });

  scene.add(
    createNamedMesh("card", new THREE.BoxGeometry(1.6, 2.25, 0.08), base),
    createNamedMesh(
      "clip",
      new THREE.BoxGeometry(0.32, 0.26, 0.09),
      metal,
      [0, 1.23, 0],
    ),
    createNamedMesh(
      "clamp",
      new THREE.BoxGeometry(0.58, 0.13, 0.1),
      metal,
      [0, 1.08, 0],
    ),
  );

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
  });

  await mkdir(dirname(cardPath), { recursive: true });
  await writeFile(cardPath, Buffer.from(glb));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.concat([typeBuffer, data]);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBuffer.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(chunk), 8 + data.length);
  return output;
}

function createBandTexture(width = 128, height = 24) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const navy = [13, 24, 42, 255];
  const slate = [39, 52, 70, 255];
  const lime = [190, 242, 100, 255];

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const stripe = (x + y * 2) % 48;
      const color = stripe < 5 ? lime : stripe < 24 ? navy : slate;
      const pixelOffset = rowOffset + 1 + x * 4;
      raw.set(color, pixelOffset);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

await generateCardModel();
await writeFile(bandPath, createBandTexture());

