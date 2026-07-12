import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { computeGaussianKernelByRadius } from "../components/liquid-glass-studio/kernel.ts";
import {
  getCanvasFont,
  getLineBaseline,
} from "../components/liquid-glass-studio/domTextCapture.ts";

const studioSource = readFileSync(
  new URL("../components/StudioLiquidGlass.tsx", import.meta.url),
  "utf8",
);
const viewportSource = readFileSync(
  new URL("../components/ViewportFrame.tsx", import.meta.url),
  "utf8",
);
const glassButtonSource = readFileSync(
  new URL("../components/GlassButton.tsx", import.meta.url),
  "utf8",
);
const modelPanelSource = readFileSync(
  new URL("../components/ModelAdjustmentPanel.tsx", import.meta.url),
  "utf8",
);

test("prefers the upstream WebGPU multipass backend with WebGL2 fallback", () => {
  const gpuUtils = readFileSync(
    new URL(
      "../components/liquid-glass-studio/GPUUtils.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const gpuDetect = readFileSync(
    new URL(
      "../components/liquid-glass-studio/gpuDetect.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const wgslShaders = readFileSync(
    new URL(
      "../components/liquid-glass-studio/wgslShaders.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(gpuUtils, /class GPUMultiPassRenderer/);
  assert.match(gpuUtils, /copyExternalImageToTexture/);
  assert.match(gpuDetect, /navigator\.gpu\.requestAdapter/);
  assert.match(wgslShaders, /WgslFragmentMainShader/);
  assert.match(studioSource, /detectWebGPU/);
  assert.match(studioSource, /backend === "webgpu"/);
  assert.match(studioSource, /new GPUMultiPassRenderer/);
  assert.match(studioSource, /new MultiPassRenderer/);
  assert.match(studioSource, /studio-webgpu/);
  assert.match(studioSource, /studio-webgl2/);
});

test("composites a cached DOM text proxy into the navigation capture", () => {
  const textCapture = readFileSync(
    new URL(
      "../components/liquid-glass-studio/domTextCapture.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(studioSource, /captureDomText\?: boolean/);
  assert.match(studioSource, /paintDomLayer/);
  assert.match(studioSource, /domTextLayer/);
  assert.match(studioSource, /ctx\.drawImage\(domTextLayer/);
  assert.match(studioSource, /addEventListener\("scroll", markDomTextDirty/);
  assert.match(studioSource, /isDomTextCaptureMutation/);
  assert.match(studioSource, /attributes:\s*true/);
  assert.match(studioSource, /attributeFilter:\s*\["style", "class"\]/);
  assert.match(studioSource, /addEventListener\("transitionend", markDomTextDirty/);
  assert.match(textCapture, /paintElementTree/);
  assert.match(textCapture, /export function isDomTextCaptureMutation/);
  assert.match(textCapture, /getClientRects/);
  assert.match(textCapture, /fillText/);
  assert.match(viewportSource, /captureDomText/);
  assert.equal(viewportSource.match(/captureDomText/g)?.length, 1);
});

test("captures non-text DOM visuals into the navigation refraction texture", () => {
  const domCapture = readFileSync(
    new URL(
      "../components/liquid-glass-studio/domTextCapture.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(domCapture, /export function paintDomLayer/);
  assert.match(domCapture, /paintElementTree/);
  assert.match(domCapture, /backgroundColor/);
  assert.match(domCapture, /borderTopWidth/);
  assert.match(domCapture, /instanceof HTMLImageElement/);
  assert.match(domCapture, /instanceof HTMLCanvasElement/);
  assert.match(domCapture, /instanceof HTMLVideoElement/);
  assert.match(domCapture, /instanceof SVGSVGElement/);
  assert.match(studioSource, /paintDomLayer/);
});

test("preserves each DOM text node's computed font size in the canvas proxy", () => {
  assert.equal(
    getCanvasFont({
      fontStyle: "normal",
      fontWeight: "700",
      fontSize: "96px",
      fontFamily: '"Times New Roman"',
      fontStretch: "100%",
    }),
    'normal 700 96px "Times New Roman"',
  );
  assert.equal(
    getCanvasFont({
      fontStyle: "italic",
      fontWeight: "400",
      fontSize: "18px",
      fontFamily: "Arial",
      fontStretch: "condensed",
    }),
    "italic 400 18px Arial",
  );
});

test("keeps every glyph on the shared DOM line baseline", () => {
  assert.equal(
    getLineBaseline({ top: 100, height: 40 }, 80, 24, 6),
    49,
  );

  const textCapture = readFileSync(
    new URL(
      "../components/liquid-glass-studio/domTextCapture.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(textCapture, /measureText\("Mg"\)/);
  assert.doesNotMatch(textCapture, /measureText\(character\)/);
});

test("keeps navigation GPU work bounded to its existing local capture", () => {
  assert.match(viewportSource, /width=\{geometry\.navWidth\}/);
  assert.match(viewportSource, /height=\{geometry\.navHeight\}/);
  assert.match(viewportSource, /capturePad=\{40\}/);
  assert.doesNotMatch(studioSource, /window\.innerWidth[\s\S]*createTexture/);
  assert.doesNotMatch(studioSource, /window\.innerHeight[\s\S]*createTexture/);
});

test("removes the rectangular shader halo and softens optical highlights", () => {
  assert.match(studioSource, /highlightIntensity\?: number/);
  assert.match(studioSource, /shaderHalo\?: boolean/);
  assert.match(
    studioSource,
    /u_shadowFactor:\s*shaderHalo\s*\?\s*uniforms\.shadowFactor\s*:\s*0/,
  );
  assert.match(
    studioSource,
    /u_refFresnelFactor:\s*uniforms\.fresnelFactor\s*\*\s*opticalHighlight/,
  );
  assert.match(
    studioSource,
    /u_glareFactor:\s*uniforms\.glareFactor\s*\*\s*opticalHighlight/,
  );
  assert.equal(viewportSource.match(/shaderHalo=\{false\}/g)?.length, 2);
  assert.equal(viewportSource.match(/highlightIntensity=\{0\.2\}/g)?.length, 2);
});

test("disables the shader sampling halo around glass buttons", () => {
  assert.match(glassButtonSource, /shaderHalo=\{false\}/);
  assert.match(
    modelPanelSource,
    /className="model-adjustment-trigger-glass"[\s\S]*?shaderHalo=\{false\}/,
  );
});

test("disables navigation and footer blur with a valid identity kernel", () => {
  assert.equal(viewportSource.match(/blurRadius=\{0\}/g)?.length, 2);
  assert.deepEqual(computeGaussianKernelByRadius(0), [1]);
});
