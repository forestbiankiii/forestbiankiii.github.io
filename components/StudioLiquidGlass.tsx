"use client";

/*
 * Liquid Glass surface powered by the WebGL2 multipass renderer and shaders
 * from iyinchao/liquid-glass-studio (https://liquid-glass-studio.vercel.app/).
 * Copyright (c) 2024 Charles Yin, MIT License.
 *
 * The background pass samples a live capture of the page/model behind this
 * panel; blur + main passes are the Studio pipeline. Outside-shape pixels are
 * transparent so this can sit over HTML UI.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { MultiPassRenderer } from "./liquid-glass-studio/GLUtils";
import { computeGaussianKernelByRadius } from "./liquid-glass-studio/kernel";
import {
  FragmentBgHblurShader,
  FragmentBgVblurShader,
  FragmentMainShader,
  VertexShader,
} from "./liquid-glass-studio/shaders";
import {
  LIQUID_GLASS_STUDIO_CONFIG,
  getLiquidGlassStudioUniforms,
} from "./liquidGlassStudioConfig";
import {
  MODEL_PANEL_GAP,
  MODEL_PANEL_MORPH_DURATION_MS,
  MODEL_PANEL_TRIGGER_SIZE,
  getModelPanelEase,
  getModelPanelGlassShape,
} from "./modelControls";
import styles from "./StudioLiquidGlass.module.css";

interface StudioLiquidGlassProps {
  children: ReactNode;
  className?: string;
  width: number | string;
  height: number | string;
  borderRadius: number;
  /** Override studio blur radius (panel uses config default, trigger can use 1). */
  blurRadius?: number;
  /** When set with morphFromCircle, animates glass SDF between circle and rect. */
  expanded?: boolean;
  morphFromCircle?: boolean;
  circleSize?: number;
  /** Reports morph progress (0 closed → 1 open). */
  onMorphProgress?: (progress: number) => void;
}

type StudioGlassStyle = CSSProperties & {
  "--studio-glass-pad": string;
  "--studio-shape-progress"?: string;
  "--studio-morph-canvas-opacity"?: string;
};

const CAPTURE_PAD = 96;

const OVERLAY_BG_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_bgTexture;
uniform int u_bgTextureReady;
uniform vec3 u_fallbackColor;

void main() {
  if (u_bgTextureReady != 1) {
    fragColor = vec4(u_fallbackColor, 1.0);
    return;
  }
  fragColor = texture(u_bgTexture, v_uv);
}
`;

function getThemeFallback(container: HTMLElement) {
  const themeRoot = container.closest<HTMLElement>("[data-site-theme]");
  return themeRoot?.dataset.siteTheme === "white"
    ? ([1, 1, 1] as const)
    : ([0, 0, 0] as const);
}

function captureBehindPanel(
  target: HTMLCanvasElement,
  glassRect: DOMRect,
  fill: string,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(1, Math.round(glassRect.width));
  const cssH = Math.max(1, Math.round(glassRect.height));
  const pixelW = Math.max(1, Math.round(cssW * dpr));
  const pixelH = Math.max(1, Math.round(cssH * dpr));

  if (target.width !== pixelW) target.width = pixelW;
  if (target.height !== pixelH) target.height = pixelH;

  const ctx = target.getContext("2d", { alpha: false });
  if (!ctx) return false;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const modelCanvas = document.querySelector<HTMLCanvasElement>(
    ".site-model-background canvas",
  );
  if (!modelCanvas || modelCanvas.width < 2 || modelCanvas.height < 2) {
    return false;
  }

  const modelRect = modelCanvas.getBoundingClientRect();
  if (modelRect.width < 1 || modelRect.height < 1) return false;

  const scaleX = modelCanvas.width / modelRect.width;
  const scaleY = modelCanvas.height / modelRect.height;

  try {
    ctx.drawImage(
      modelCanvas,
      (glassRect.left - modelRect.left) * scaleX,
      (glassRect.top - modelRect.top) * scaleY,
      cssW * scaleX,
      cssH * scaleY,
      0,
      0,
      pixelW,
      pixelH,
    );
    return true;
  } catch {
    return false;
  }
}

function uploadCanvasTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: HTMLCanvasElement,
) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

export default function StudioLiquidGlass({
  children,
  className = "",
  width,
  height,
  borderRadius,
  blurRadius: blurRadiusProp,
  expanded = true,
  morphFromCircle = false,
  circleSize = MODEL_PANEL_TRIGGER_SIZE,
  onMorphProgress,
}: StudioLiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const expandedRef = useRef(expanded);
  const onMorphProgressRef = useRef(onMorphProgress);
  const morphClockRef = useRef({
    progress: expanded ? 1 : 0,
    animating: false,
    opening: expanded,
    from: expanded ? 1 : 0,
    to: expanded ? 1 : 0,
    startTime: 0,
    duration: MODEL_PANEL_MORPH_DURATION_MS,
  });
  const lastFrameRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const uniforms = getLiquidGlassStudioUniforms();
  const blurRadius = Math.max(
    0,
    Math.min(
      200,
      blurRadiusProp ?? LIQUID_GLASS_STUDIO_CONFIG.blurRadius,
    ),
  );

  useEffect(() => {
    onMorphProgressRef.current = onMorphProgress;
  }, [onMorphProgress]);

  useEffect(() => {
    expandedRef.current = expanded;
    if (!morphFromCircle) {
      morphClockRef.current = {
        progress: expanded ? 1 : 0,
        animating: false,
        opening: expanded,
        from: expanded ? 1 : 0,
        to: expanded ? 1 : 0,
        startTime: 0,
        duration: MODEL_PANEL_MORPH_DURATION_MS,
      };
      return;
    }
    const clock = morphClockRef.current;
    const from = clock.progress;
    const to = expanded ? 1 : 0;
    if (Math.abs(from - to) < 0.0005) {
      clock.progress = to;
      clock.animating = false;
      return;
    }
    clock.animating = true;
    clock.opening = expanded;
    clock.from = from;
    clock.to = to;
    clock.startTime = performance.now();
    // Same full duration for open and close; scale only if interrupted mid-way.
    clock.duration = Math.max(
      120,
      MODEL_PANEL_MORPH_DURATION_MS * Math.abs(to - from),
    );
  }, [expanded, morphFromCircle]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let renderer: MultiPassRenderer | null = null;
    let gl: WebGL2RenderingContext | null = null;
    let bgTexture: WebGLTexture | null = null;
    let frameId = 0;
    let disposed = false;
    let lastBufferW = 0;
    let lastBufferH = 0;

    const captureCanvas = document.createElement("canvas");
    const blurWeights = computeGaussianKernelByRadius(blurRadius);
    while (blurWeights.length < 201) blurWeights.push(0);
    let markedReady = false;

    try {
      // MultiPassRenderer creates its own webgl2 context from the canvas.
      renderer = new MultiPassRenderer(canvas, [
        {
          name: "bgPass",
          shader: { vertex: VertexShader, fragment: OVERLAY_BG_SHADER },
        },
        {
          name: "vBlurPass",
          shader: { vertex: VertexShader, fragment: FragmentBgVblurShader },
          inputs: { u_prevPassTexture: "bgPass" },
        },
        {
          name: "hBlurPass",
          shader: { vertex: VertexShader, fragment: FragmentBgHblurShader },
          inputs: { u_prevPassTexture: "vBlurPass" },
        },
        {
          name: "mainPass",
          shader: { vertex: VertexShader, fragment: FragmentMainShader },
          inputs: { u_blurredBg: "hBlurPass", u_bg: "bgPass" },
          outputToScreen: true,
        },
      ]);
      gl = canvas.getContext("webgl2");
      if (!gl) throw new Error("WebGL2 unavailable");
      bgTexture = gl.createTexture();
      if (!bgTexture) throw new Error("Failed to create bg texture");
    } catch (error) {
      console.error("[StudioLiquidGlass] init failed", error);
      return;
    }

    const renderFrame = (now: number) => {
      if (disposed || !renderer || !gl || !bgTexture) return;

      const last = lastFrameRef.current ?? now;
      const dtMs = now - last;
      lastFrameRef.current = now;

      if (morphFromCircle) {
        const clock = morphClockRef.current;
        if (clock.animating) {
          const ratio = Math.min(
            1,
            Math.max(0, (now - clock.startTime) / clock.duration),
          );
          const eased = getModelPanelEase(ratio);
          clock.progress = clock.from + (clock.to - clock.from) * eased;
          if (ratio >= 1) {
            clock.progress = clock.to;
            clock.animating = false;
          }
        } else {
          clock.progress = expandedRef.current ? 1 : 0;
        }
      } else {
        morphClockRef.current.progress = expandedRef.current ? 1 : 0;
        morphClockRef.current.animating = false;
      }

      const progress = morphFromCircle ? morphClockRef.current.progress : 1;
      onMorphProgressRef.current?.(progress);

      const closing =
        morphFromCircle && !expandedRef.current && progress > 0.0005;
      const opening =
        morphFromCircle && expandedRef.current && progress < 0.9995;
      const morphing =
        morphFromCircle &&
        (closing || opening || morphClockRef.current.animating);
      container.dataset.morphing = morphing || closing ? "true" : "false";

      const panelRect = container.getBoundingClientRect();
      const styles = getComputedStyle(container);
      const visible =
        panelRect.width > 1 &&
        panelRect.height > 1 &&
        styles.visibility !== "hidden" &&
        (progress > 0.0005 || !morphFromCircle || expandedRef.current);

      if (!visible) {
        // Finish the close handoff even when we stop drawing, so the last
        // morph circle never pops away under a visibility:hidden cut.
        if (morphFromCircle && !expandedRef.current) {
          container.style.setProperty("--studio-morph-canvas-opacity", "0");
          container.style.setProperty("--studio-shape-progress", "0");
          const shell = container.parentElement;
          shell?.style.setProperty("--model-trigger-glass-opacity", "1");
          shell?.classList.remove("is-morphing");
          container.dataset.morphing = "false";
        }
        frameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const panelW = Math.max(1, container.clientWidth);
      const panelH = Math.max(1, container.clientHeight);
      const triggerEl = container.parentElement?.querySelector(
        ".model-adjustment-trigger",
      ) as HTMLElement | null;
      // Morph geometry always uses the resting trigger size so press-grow
      // (and its CSS width transition) cannot inflate the sticky circle.
      const liveCircleSize = Math.max(
        8,
        morphFromCircle
          ? circleSize
          : triggerEl?.clientWidth || circleSize,
      );
      // Extra bottom pad so the sticky blob can reach the trigger button.
      const bottomPad = Math.max(
        CAPTURE_PAD,
        MODEL_PANEL_GAP + liveCircleSize + CAPTURE_PAD * 0.35,
      );
      const cssW = Math.max(1, Math.round(panelW + CAPTURE_PAD * 2));
      const cssH = Math.max(1, Math.round(panelH + CAPTURE_PAD + bottomPad));
      const bufferW = Math.max(1, Math.round(cssW * dpr));
      const bufferH = Math.max(1, Math.round(cssH * dpr));

      // Keep bitmap size in device pixels, but CSS size in layout pixels.
      // Assigning canvas.width alone would also stretch the element and misalign the glass.
      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.style.top = `${-CAPTURE_PAD}px`;
      canvas.style.left = `${-CAPTURE_PAD}px`;

      if (bufferW !== lastBufferW || bufferH !== lastBufferH) {
        lastBufferW = bufferW;
        lastBufferH = bufferH;
        renderer.resize(bufferW, bufferH);
        gl.viewport(0, 0, bufferW, bufferH);
      }

      const canvasRect = canvas.getBoundingClientRect();
      const fallback = getThemeFallback(container);
      const fill = fallback[0] >= 1 ? "#ffffff" : "#000000";
      const captured = captureBehindPanel(captureCanvas, canvasRect, fill);
      uploadCanvasTexture(gl, bgTexture, captureCanvas);

      const shape = morphFromCircle
        ? getModelPanelGlassShape({
            progress,
            panelWidth: panelW,
            panelHeight: panelH,
            borderRadius,
            circleSize: liveCircleSize,
            gap: MODEL_PANEL_GAP,
          })
        : {
            shapeWidth: panelW,
            shapeHeight: panelH,
            shapeRadius: Math.min(borderRadius, panelW * 0.5, panelH * 0.5),
            centerX: panelW * 0.5,
            centerY: panelH * 0.5,
            shape1X: panelW * 0.5,
            shape1Y: panelH * 0.5,
            shape1Radius: liveCircleSize * 0.5,
            shape1Amount: 0,
            mergeRate: LIQUID_GLASS_STUDIO_CONFIG.mergeRate,
            showShape1: false,
            contentOpacity: 1,
            morphCanvasOpacity: 1,
            triggerGlassOpacity: 1,
            unifiedMorph: false,
            travelT: 1,
            growT: 1,
          };

      container.style.setProperty(
        "--studio-shape-progress",
        shape.contentOpacity.toFixed(4),
      );
      // Crossfade into the real trigger so close-out never pops from a fat circle.
      container.style.setProperty(
        "--studio-morph-canvas-opacity",
        morphFromCircle ? shape.morphCanvasOpacity.toFixed(4) : "1",
      );
      if (morphFromCircle) {
        const shell = container.parentElement;
        shell?.style.setProperty(
          "--model-trigger-glass-opacity",
          shape.triggerGlassOpacity.toFixed(4),
        );
        shell?.classList.toggle("is-morphing", shape.unifiedMorph);
      }

      // Panel coords are top-left; Studio / gl_FragCoord are bottom-left.
      const toGlX = (x: number) => (CAPTURE_PAD + x) * dpr;
      const toGlY = (y: number) => (cssH - (CAPTURE_PAD + y)) * dpr;
      const centerX = toGlX(shape.centerX);
      const centerY = toGlY(shape.centerY);
      const shape1X = toGlX(shape.shape1X);
      const shape1Y = toGlY(shape.shape1Y);

      renderer.setUniforms({
        u_resolution: [bufferW, bufferH],
        u_dpr: dpr,
        u_blurWeights: blurWeights,
        u_blurRadius: blurRadius,
        u_mouse: [centerX, centerY],
        u_mouseSpring: [centerX, centerY],
        u_shapeWidth: shape.shapeWidth,
        u_shapeHeight: shape.shapeHeight,
        u_shapeRadius: shape.shapeRadius,
        u_shapeRoundness: LIQUID_GLASS_STUDIO_CONFIG.shapeRoundness,
        u_mergeRate: shape.mergeRate,
        u_glareAngle: uniforms.glareAngle,
        u_showShape1: shape.showShape1 ? 1 : 0,
        u_shape1Pos: [shape1X, shape1Y],
        u_shape1Radius: shape.shape1Radius,
      });

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      renderer.render({
        bgPass: {
          u_bgTexture: bgTexture,
          u_bgTextureReady: captured ? 1 : 0,
          u_fallbackColor: [...fallback],
        },
        mainPass: {
          u_tint: uniforms.tint,
          u_refThickness: uniforms.refThickness,
          u_refFactor: uniforms.refFactor,
          u_refDispersion: uniforms.refDispersion,
          u_refFresnelRange: uniforms.fresnelRange,
          u_refFresnelHardness: uniforms.fresnelHardness,
          u_refFresnelFactor: uniforms.fresnelFactor,
          u_glareRange: uniforms.glareRange,
          u_glareHardness: uniforms.glareHardness,
          u_glareConvergence: uniforms.glareConvergence,
          u_glareOppositeFactor: uniforms.glareOppositeFactor,
          u_glareFactor: uniforms.glareFactor,
          u_blurEdge: LIQUID_GLASS_STUDIO_CONFIG.blurEdge ? 1 : 0,
          STEP: LIQUID_GLASS_STUDIO_CONFIG.step,
        },
      });

      if (!markedReady) {
        markedReady = true;
        setReady(true);
      }
      frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);

    return () => {
      disposed = true;
      lastFrameRef.current = null;
      window.cancelAnimationFrame(frameId);
      if (bgTexture && gl) gl.deleteTexture(bgTexture);
      renderer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blurRadius, borderRadius, morphFromCircle, circleSize]);

  const style: StudioGlassStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    "--studio-glass-pad": `${CAPTURE_PAD}px`,
  };
  if (morphFromCircle) {
    style["--studio-shape-progress"] = expanded ? "1" : "0";
    style["--studio-morph-canvas-opacity"] = expanded ? "1" : "0";
  } else {
    style["--studio-morph-canvas-opacity"] = "1";
  }

  return (
    <div
      ref={containerRef}
      className={`studio-liquid-glass ${styles.surface}${ready ? ` ${styles.ready}` : ""}${className ? ` ${className}` : ""}`}
      data-liquid-glass-renderer={ready ? "studio-webgl2" : "css"}
      data-morphing="false"
      style={style}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={`studio-liquid-glass__content ${styles.content}`}>
        {children}
      </div>
    </div>
  );
}
