/* WGSL passes adapted from iyinchao/liquid-glass-studio (MIT). */

const UNIFORMS = String.raw`
struct Uniforms {
  u_resolution: vec2f,
  u_dpr: f32,
  _pad0: f32,
  u_mouse: vec2f,
  u_mouseSpring: vec2f,
  u_shapeWidth: f32,
  u_shapeHeight: f32,
  u_shapeRadius: f32,
  u_shapeRoundness: f32,
  u_mergeRate: f32,
  u_glareAngle: f32,
  u_shadowExpand: f32,
  u_shadowFactor: f32,
  u_shadowPosition: vec2f,
  u_bgTextureRatio: f32,
  u_bgType: i32,
  u_bgTextureReady: i32,
  u_showShape1: i32,
  u_blurRadius: i32,
  u_blurEdge: i32,
  u_tint: vec4f,
  u_refThickness: f32,
  u_refFactor: f32,
  u_refDispersion: f32,
  u_refFresnelRange: f32,
  u_refFresnelHardness: f32,
  u_refFresnelFactor: f32,
  u_glareRange: f32,
  u_glareHardness: f32,
  u_glareConvergence: f32,
  u_glareOppositeFactor: f32,
  u_glareFactor: f32,
  _pad1: f32,
  u_shape1Pos: vec2f,
  u_shape1Radius: f32,
  _pad2: f32,
};
`;

const SDF = String.raw`
fn sdCircle(p: vec2f, r: f32) -> f32 {
  return length(p) - r;
}

fn superellipseCornerSDF(p_in: vec2f, r: f32, n: f32) -> f32 {
  let p = abs(p_in);
  return pow(pow(p.x, n) + pow(p.y, n), 1.0 / n) - r;
}

fn roundedRectSDF(
  p_in: vec2f,
  center: vec2f,
  width: f32,
  height: f32,
  cornerRadius: f32,
  n: f32,
) -> f32 {
  let p = p_in - center;
  let cr = cornerRadius * u.u_dpr;
  let d = abs(p) - vec2f(width * u.u_dpr, height * u.u_dpr) * 0.5;
  var dist: f32;
  if (d.x > -cr && d.y > -cr) {
    let cornerCenter = sign(p) *
      (vec2f(width * u.u_dpr, height * u.u_dpr) * 0.5 - vec2f(cr));
    dist = superellipseCornerSDF(p - cornerCenter, cr, n);
  } else {
    dist = min(max(d.x, d.y), 0.0) + length(max(d, vec2f(0.0)));
  }
  return dist;
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
  let safeK = max(k, 0.00001);
  let h = clamp(0.5 + 0.5 * (b - a) / safeK, 0.0, 1.0);
  return mix(b, a, h) - safeK * h * (1.0 - h);
}

fn mainSDF(p1: vec2f, p2: vec2f, p: vec2f) -> f32 {
  let p1n = p1 + p / u.u_resolution.y;
  let p2n = p2 + p / u.u_resolution.y;
  var d1 = 1.0;
  if (u.u_showShape1 == 1) {
    d1 = sdCircle(
      p1n,
      u.u_shape1Radius * u.u_dpr / u.u_resolution.y,
    );
  }
  let d2 = roundedRectSDF(
    p2n,
    vec2f(0.0),
    u.u_shapeWidth / u.u_resolution.y,
    u.u_shapeHeight / u.u_resolution.y,
    u.u_shapeRadius / u.u_resolution.y,
    u.u_shapeRoundness,
  );
  return smin(d1, d2, u.u_mergeRate);
}
`;

const COLOR = String.raw`
const D65_WHITE: vec3f = vec3f(0.95045592705, 1.0, 1.08905775076);
const RGB_TO_XYZ_0: vec3f = vec3f(0.4124, 0.3576, 0.1805);
const RGB_TO_XYZ_1: vec3f = vec3f(0.2126, 0.7152, 0.0722);
const RGB_TO_XYZ_2: vec3f = vec3f(0.0193, 0.1192, 0.9505);
const XYZ_TO_RGB_0: vec3f = vec3f(3.2406255, -1.537208, -0.4986286);
const XYZ_TO_RGB_1: vec3f = vec3f(-0.9689307, 1.8757561, 0.0415175);
const XYZ_TO_RGB_2: vec3f = vec3f(0.0557101, -0.2040211, 1.0569959);

fn uncompandSRGB(a: f32) -> f32 {
  if (a > 0.04045) { return pow((a + 0.055) / 1.055, 2.4); }
  return a / 12.92;
}

fn compandRGB(a: f32) -> f32 {
  if (a <= 0.0031308) { return 12.92 * a; }
  return 1.055 * pow(a, 0.41666666666) - 0.055;
}

fn srgbToXyz(srgb: vec3f) -> vec3f {
  let rgb = vec3f(
    uncompandSRGB(srgb.x),
    uncompandSRGB(srgb.y),
    uncompandSRGB(srgb.z),
  );
  return vec3f(
    dot(rgb, RGB_TO_XYZ_0),
    dot(rgb, RGB_TO_XYZ_1),
    dot(rgb, RGB_TO_XYZ_2),
  );
}

fn xyzToSrgb(xyz: vec3f) -> vec3f {
  let rgb = vec3f(
    dot(xyz, XYZ_TO_RGB_0),
    dot(xyz, XYZ_TO_RGB_1),
    dot(xyz, XYZ_TO_RGB_2),
  );
  return vec3f(compandRGB(rgb.x), compandRGB(rgb.y), compandRGB(rgb.z));
}

fn xyzToLabF(x: f32) -> f32 {
  if (x > 0.00885645167) { return pow(x, 0.333333333); }
  return 7.78703703704 * x + 0.13793103448;
}

fn srgbToLch(srgb: vec3f) -> vec3f {
  let xyz = srgbToXyz(srgb);
  let scaled = vec3f(
    xyzToLabF(xyz.x / D65_WHITE.x),
    xyzToLabF(xyz.y / D65_WHITE.y),
    xyzToLabF(xyz.z / D65_WHITE.z),
  );
  let lab = vec3f(
    116.0 * scaled.y - 16.0,
    500.0 * (scaled.x - scaled.y),
    200.0 * (scaled.y - scaled.z),
  );
  return vec3f(
    lab.x,
    sqrt(dot(lab.yz, lab.yz)),
    atan2(lab.z, lab.y) * 57.2957795131,
  );
}

fn labToXyzF(x: f32) -> f32 {
  if (x > 0.206897) { return x * x * x; }
  return 0.12841854934 * (x - 0.137931034);
}

fn lchToSrgb(lch: vec3f) -> vec3f {
  let lab = vec3f(
    lch.x,
    lch.y * cos(lch.z * 0.01745329251),
    lch.y * sin(lch.z * 0.01745329251),
  );
  let w = (lab.x + 16.0) / 116.0;
  let xyz = D65_WHITE * vec3f(
    labToXyzF(w + lab.y / 500.0),
    labToXyzF(w),
    labToXyzF(w - lab.z / 200.0),
  );
  return xyzToSrgb(xyz);
}
`;

export const WgslVertexShader = String.raw`
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@location(0) position: vec2f) -> VertexOutput {
  var output: VertexOutput;
  let uv = (position + 1.0) * 0.5;
  output.uv = vec2f(uv.x, 1.0 - uv.y);
  output.position = vec4f(position, 0.0, 1.0);
  return output;
}
`;

export const WgslFragmentBgShader = `${UNIFORMS}
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(2) var backgroundSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return textureSampleLevel(backgroundTexture, backgroundSampler, uv, 0.0);
}
`;

function makeBlurShader(axis: "x" | "y") {
  const offset =
    axis === "x"
      ? "vec2f(f32(i) * texel.x, 0.0)"
      : "vec2f(0.0, f32(i) * texel.y)";
  return String.raw`
const MAX_BLUR_RADIUS: i32 = 200;
struct BlurUniforms {
  resolution: vec2f,
  radius: i32,
  _pad: i32,
};
@group(0) @binding(0) var<uniform> u: BlurUniforms;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var inputSampler: sampler;
@group(0) @binding(3) var<storage, read> weights: array<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let texel = 1.0 / u.resolution;
  var color = textureSampleLevel(inputTexture, inputSampler, uv, 0.0) * weights[0];
  for (var i: i32 = 1; i <= u.radius; i += 1) {
    if (i > MAX_BLUR_RADIUS) { break; }
    let offset = ${offset};
    color += textureSampleLevel(inputTexture, inputSampler, uv + offset, 0.0) * weights[i];
    color += textureSampleLevel(inputTexture, inputSampler, uv - offset, 0.0) * weights[i];
  }
  return color;
}
`;
}

export const WgslFragmentVBlurShader = makeBlurShader("y");
export const WgslFragmentHBlurShader = makeBlurShader("x");

export const WgslFragmentMainShader = `${UNIFORMS}
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var blurredBackground: texture_2d<f32>;
@group(0) @binding(2) var sharpBackground: texture_2d<f32>;
@group(0) @binding(3) var backgroundSampler: sampler;

${SDF}
${COLOR}

const PI: f32 = 3.14159265359;
const N_R: f32 = 0.98;
const N_G: f32 = 1.0;
const N_B: f32 = 1.02;

fn safeAsin(value: f32) -> f32 {
  return asin(clamp(value, -1.0, 1.0));
}

fn safeNormalize(value: vec2f) -> vec2f {
  let magnitude = length(value);
  if (magnitude < 0.00000001) { return vec2f(0.0); }
  return value / magnitude;
}

fn getNormal(p1: vec2f, p2: vec2f, pixel: vec2f) -> vec2f {
  let h = vec2f(1.0);
  let gradient = vec2f(
    mainSDF(p1, p2, pixel + vec2f(h.x, 0.0)) -
      mainSDF(p1, p2, pixel - vec2f(h.x, 0.0)),
    mainSDF(p1, p2, pixel + vec2f(0.0, h.y)) -
      mainSDF(p1, p2, pixel - vec2f(0.0, h.y)),
  ) / (2.0 * h);
  return gradient * 1.414213562 * 1000.0;
}

fn vectorAngle(value: vec2f) -> f32 {
  var angle = atan2(value.y, value.x);
  if (angle < 0.0) { angle += 2.0 * PI; }
  return angle;
}

fn dispersedTexture(
  uv: vec2f,
  mixRate: f32,
  offset: vec2f,
  factor: f32,
) -> vec4f {
  let offsetR = offset * (1.0 - (N_R - 1.0) * factor);
  let offsetG = offset * (1.0 - (N_G - 1.0) * factor);
  let offsetB = offset * (1.0 - (N_B - 1.0) * factor);
  let sharp = vec3f(
    textureSampleLevel(sharpBackground, backgroundSampler, uv + offsetR, 0.0).r,
    textureSampleLevel(sharpBackground, backgroundSampler, uv + offsetG, 0.0).g,
    textureSampleLevel(sharpBackground, backgroundSampler, uv + offsetB, 0.0).b,
  );
  let blurred = vec3f(
    textureSampleLevel(blurredBackground, backgroundSampler, uv + offsetR, 0.0).r,
    textureSampleLevel(blurredBackground, backgroundSampler, uv + offsetG, 0.0).g,
    textureSampleLevel(blurredBackground, backgroundSampler, uv + offsetB, 0.0).b,
  );
  return vec4f(mix(sharp, blurred, mixRate), 1.0);
}

@fragment
fn fs_main(
  @builtin(position) fragment: vec4f,
  @location(0) uv: vec2f,
) -> @location(0) vec4f {
  let resolution1x = u.u_resolution / u.u_dpr;
  let pixel = vec2f(fragment.x, u.u_resolution.y - fragment.y);
  let p1 = (vec2f(0.0) - u.u_shape1Pos) / u.u_resolution.y;
  let p2 = (vec2f(0.0) - u.u_mouseSpring) / u.u_resolution.y;
  let merged = mainSDF(p1, p2, pixel);
  var output = vec4f(0.0);

  if (merged < 0.005) {
    let inwardDistance = -(merged * resolution1x.y);
    let ratio = 1.0 - inwardDistance / max(u.u_refThickness, 0.0001);
    let thetaI = safeAsin(pow(ratio, 2.0));
    let thetaT = safeAsin(1.0 / u.u_refFactor * sin(thetaI));
    var edgeFactor = -tan(thetaT - thetaI);
    if (inwardDistance >= u.u_refThickness) { edgeFactor = 0.0; }

    if (edgeFactor <= 0.0) {
      output = textureSampleLevel(blurredBackground, backgroundSampler, uv, 0.0);
      output = mix(output, vec4f(u.u_tint.rgb, 1.0), u.u_tint.a * 0.8);
    } else {
      let edgeHeight = inwardDistance / max(u.u_refThickness, 0.0001);
      let normal = getNormal(p1, p2, pixel);
      var blurMix = edgeHeight;
      if (u.u_blurEdge > 0) { blurMix = 1.0; }
      let refractionOffset = -normal * edgeFactor * 0.05 * u.u_dpr * vec2f(
        u.u_resolution.y / (resolution1x.x * u.u_dpr),
        1.0,
      );
      let refracted = dispersedTexture(
        uv,
        blurMix,
        vec2f(refractionOffset.x, -refractionOffset.y),
        u.u_refDispersion,
      );
      output = mix(refracted, vec4f(u.u_tint.rgb, 1.0), u.u_tint.a * 0.8);

      let fresnel = clamp(pow(
        1.0 + merged * resolution1x.y / 1500.0 *
          pow(500.0 / u.u_refFresnelRange, 2.0) + u.u_refFresnelHardness,
        5.0,
      ), 0.0, 1.0);
      var fresnelLch = srgbToLch(mix(vec3f(1.0), u.u_tint.rgb, u.u_tint.a * 0.5));
      fresnelLch.x = clamp(
        fresnelLch.x + 20.0 * fresnel * u.u_refFresnelFactor,
        0.0,
        100.0,
      );
      output = mix(
        output,
        vec4f(lchToSrgb(fresnelLch), 1.0),
        fresnel * u.u_refFresnelFactor * 0.7 * length(normal),
      );

      let glareGeometry = clamp(pow(
        1.0 + merged * resolution1x.y / 1500.0 *
          pow(500.0 / u.u_glareRange, 2.0) + u.u_glareHardness,
        5.0,
      ), 0.0, 1.0);
      let glareAngle =
        (vectorAngle(safeNormalize(normal)) - PI / 4.0 + u.u_glareAngle) * 2.0;
      var glareSide = 1.2;
      if ((glareAngle > PI * 1.5 && glareAngle < PI * 3.5) || glareAngle < -PI * 0.5) {
        glareSide = 1.2 * u.u_glareOppositeFactor;
      }
      var glare = (0.5 + sin(glareAngle) * 0.5) * glareSide * u.u_glareFactor;
      glare = clamp(pow(glare, 0.1 + u.u_glareConvergence * 2.0), 0.0, 1.0);
      var glareLch = srgbToLch(mix(refracted.rgb, u.u_tint.rgb, u.u_tint.a * 0.5));
      glareLch.x = clamp(glareLch.x + 150.0 * glare * glareGeometry, 0.0, 120.0);
      glareLch.y += 30.0 * glare * glareGeometry;
      output = mix(
        output,
        vec4f(lchToSrgb(glareLch), 1.0),
        glare * glareGeometry * length(normal),
      );
    }
  }

  let edgeAa = max(fwidth(merged) * 0.75, 0.5 / u.u_resolution.y);
  output = mix(output, vec4f(0.0), smoothstep(-edgeAa, edgeAa, merged));
  let outside = smoothstep(-0.0008, 0.0012, merged);
  let distancePixels = max(merged, 0.0) * resolution1x.y;
  let falloff = max(u.u_shadowExpand, 1.0);
  let nearHalo = exp(-distancePixels / falloff);
  let farHalo = exp(-distancePixels / (falloff * 2.4));
  let shadowAlpha = mix(farHalo * 0.45, nearHalo, 0.62) *
    clamp(u.u_shadowFactor, 0.0, 1.0) * outside;
  let inverseAlpha = 1.0 - output.a;
  output = vec4f(
    output.rgb * output.a + vec3f(0.36, 0.36, 0.40) * shadowAlpha * inverseAlpha,
    output.a + shadowAlpha * inverseAlpha,
  );
  return output;
}
`;
