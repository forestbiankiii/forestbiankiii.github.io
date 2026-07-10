"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import GlassSurface from "@/components/GlassSurface";

const outerScreenEdgeSize = 1;
const innerEdgeSizeRatio = 0.03;
const outerGradientLayers = [
  { width: 14, opacity: 0.035 },
  { width: 8, opacity: 0.06 },
  { width: 3, opacity: 0.12 },
] as const;

function getInnerEdgeSize(distanceToScreenEdge: number) {
  return Math.ceil(distanceToScreenEdge * innerEdgeSizeRatio);
}

function getEdgeBlur(edgeSize: number) {
  return edgeSize * 3;
}

type OuterGradientRole = "frame" | "nav" | "footer";

function renderOuterGradientPaths(
  role: OuterGradientRole,
  pathId: string,
) {
  return outerGradientLayers.map(({ width, opacity }) => (
    <use
      key={`${role}-${width}`}
      href={`#${pathId}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
}

interface FrameMetrics {
  width: number;
  height: number;
  frameWidth: number;
  radius: number;
  navLeft: number;
  navRight: number;
  navBottom: number;
  footerTop: number | null;
}

interface FrameGeometry extends FrameMetrics {
  pathData: string;
  frameInnerPath: string;
  navInnerPath: string;
  footerInnerPath: string;
  frameInnerEdgeSize: number;
  navInnerEdgeSize: number;
  footerInnerEdgeSize: number;
}

interface GlassWindow {
  id: "top" | "bottom" | "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
}

type StaticFrameMetrics = Omit<FrameMetrics, "footerTop">;

type FrameGlassStyle = CSSProperties & {
  "--frame-window-left": string;
  "--frame-window-top": string;
  "--frame-window-width": string;
  "--frame-window-height": string;
  "--frame-window-mask": string;
};

function areFrameGeometriesEqual(
  currentGeometry: FrameGeometry,
  nextGeometry: FrameGeometry,
) {
  return (Object.keys(nextGeometry) as (keyof FrameGeometry)[]).every(
    (key) => currentGeometry[key] === nextGeometry[key],
  );
}

function buildFrameGeometry(metrics: FrameMetrics): FrameGeometry {
  const { frameWidth, navBottom, height, footerTop } = metrics;

  return {
    ...metrics,
    pathData: buildConnectedFramePath(metrics),
    ...buildConnectedFrameEdgePaths(metrics),
    frameInnerEdgeSize: getInnerEdgeSize(frameWidth),
    navInnerEdgeSize: getInnerEdgeSize(navBottom),
    footerInnerEdgeSize:
      footerTop === null ? 0 : getInnerEdgeSize(height - footerTop),
  };
}

function buildConnectedFramePath({
  width,
  height,
  frameWidth,
  radius,
  navLeft,
  navRight,
  navBottom,
  footerTop,
}: FrameMetrics) {
  const innerLeft = frameWidth;
  const innerTop = frameWidth;
  const innerRight = width - frameWidth;
  const innerBottom = height - frameWidth;
  const bottomOpening =
    footerTop === null
      ? [
          `V ${innerBottom - radius}`,
          `Q ${innerRight} ${innerBottom} ${innerRight - radius} ${innerBottom}`,
          `H ${innerLeft + radius}`,
          `Q ${innerLeft} ${innerBottom} ${innerLeft} ${innerBottom - radius}`,
        ]
      : [
          `V ${footerTop - radius}`,
          `A ${radius} ${radius} 0 0 1 ${innerRight - radius} ${footerTop}`,
          `H ${innerLeft + radius}`,
          `A ${radius} ${radius} 0 0 1 ${innerLeft} ${footerTop - radius}`,
        ];

  return [
    `M 0 0 H ${width} V ${height} H 0 Z`,
    `M ${innerLeft + radius} ${innerTop}`,
    `H ${navLeft - radius}`,
    `Q ${navLeft} ${innerTop} ${navLeft} ${innerTop + radius}`,
    `V ${navBottom - radius}`,
    `Q ${navLeft} ${navBottom} ${navLeft + radius} ${navBottom}`,
    `H ${navRight - radius}`,
    `Q ${navRight} ${navBottom} ${navRight} ${navBottom - radius}`,
    `V ${innerTop + radius}`,
    `Q ${navRight} ${innerTop} ${navRight + radius} ${innerTop}`,
    `H ${innerRight - radius}`,
    `Q ${innerRight} ${innerTop} ${innerRight} ${innerTop + radius}`,
    ...bottomOpening,
    `V ${innerTop + radius}`,
    `Q ${innerLeft} ${innerTop} ${innerLeft + radius} ${innerTop}`,
    "Z",
  ].join(" ");
}

function buildConnectedFrameEdgePaths({
  width,
  height,
  frameWidth,
  radius,
  navLeft,
  navRight,
  navBottom,
  footerTop,
}: FrameMetrics) {
  const innerLeft = frameWidth;
  const innerTop = frameWidth;
  const innerRight = width - frameWidth;
  const innerBottom = height - frameWidth;

  const navInnerPath = [
    `M ${navLeft - radius} ${innerTop}`,
    `Q ${navLeft} ${innerTop} ${navLeft} ${innerTop + radius}`,
    `V ${navBottom - radius}`,
    `Q ${navLeft} ${navBottom} ${navLeft + radius} ${navBottom}`,
    `H ${navRight - radius}`,
    `Q ${navRight} ${navBottom} ${navRight} ${navBottom - radius}`,
    `V ${innerTop + radius}`,
    `Q ${navRight} ${innerTop} ${navRight + radius} ${innerTop}`,
  ].join(" ");

  const frameInnerPath =
    footerTop === null
      ? [
          `M ${navRight + radius} ${innerTop}`,
          `H ${innerRight - radius}`,
          `Q ${innerRight} ${innerTop} ${innerRight} ${innerTop + radius}`,
          `V ${innerBottom - radius}`,
          `Q ${innerRight} ${innerBottom} ${innerRight - radius} ${innerBottom}`,
          `H ${innerLeft + radius}`,
          `Q ${innerLeft} ${innerBottom} ${innerLeft} ${innerBottom - radius}`,
          `V ${innerTop + radius}`,
          `Q ${innerLeft} ${innerTop} ${innerLeft + radius} ${innerTop}`,
          `H ${navLeft - radius}`,
        ].join(" ")
      : [
          `M ${navRight + radius} ${innerTop}`,
          `H ${innerRight - radius}`,
          `Q ${innerRight} ${innerTop} ${innerRight} ${innerTop + radius}`,
          `V ${footerTop - radius}`,
          `M ${innerLeft} ${footerTop - radius}`,
          `V ${innerTop + radius}`,
          `Q ${innerLeft} ${innerTop} ${innerLeft + radius} ${innerTop}`,
          `H ${navLeft - radius}`,
        ].join(" ");

  const footerInnerPath =
    footerTop === null
      ? ""
      : [
          `M ${innerRight} ${footerTop - radius}`,
          `A ${radius} ${radius} 0 0 1 ${innerRight - radius} ${footerTop}`,
          `H ${innerLeft + radius}`,
          `A ${radius} ${radius} 0 0 1 ${innerLeft} ${footerTop - radius}`,
        ].join(" ");

  return {
    frameInnerPath,
    navInnerPath,
    footerInnerPath,
  };
}

function readCssPixelValue(styles: CSSStyleDeclaration, property: string) {
  return Number.parseFloat(styles.getPropertyValue(property));
}

function buildGlassWindows({
  width,
  height,
  frameWidth,
  radius,
  navBottom,
  footerTop,
  pathData,
}: FrameGeometry) {
  if (!pathData) return [];

  const topHeight = Math.max(frameWidth, navBottom);
  const footerTopEdge = footerTop ?? height - frameWidth;
  const footerWindowTop = Math.min(
    height,
    Math.max(topHeight, footerTopEdge - radius),
  );
  const sideWidth = Math.min(width * 0.5, frameWidth + radius);
  const sideHeight = footerWindowTop - topHeight;

  return [
    {
      id: "top",
      x: 0,
      y: 0,
      width,
      height: topHeight,
    },
    {
      id: "bottom",
      x: 0,
      y: footerWindowTop,
      width,
      height: height - footerWindowTop,
    },
    {
      id: "left",
      x: 0,
      y: topHeight,
      width: sideWidth,
      height: sideHeight,
    },
    {
      id: "right",
      x: width - sideWidth,
      y: topHeight,
      width: sideWidth,
      height: sideHeight,
    },
  ] as GlassWindow[];
}

function buildConnectedFrameMask(
  { pathData }: FrameGeometry,
  glassWindow: GlassWindow,
) {
  if (!pathData) return "linear-gradient(transparent, transparent)";

  const svg = `
    <svg
      width="${glassWindow.width}"
      height="${glassWindow.height}"
      viewBox="${glassWindow.x} ${glassWindow.y} ${glassWindow.width} ${glassWindow.height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="${pathData}" fill="white" fill-rule="evenodd" clip-rule="evenodd" />
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function buildConnectedDisplacementMap(
  {
    width,
    height,
    pathData,
    frameInnerPath,
    navInnerPath,
    footerInnerPath,
    frameInnerEdgeSize,
    navInnerEdgeSize,
    footerInnerEdgeSize,
  }: FrameGeometry,
  glassWindow: GlassWindow,
) {
  const outerEdgeBlur = getEdgeBlur(outerScreenEdgeSize);
  const frameInnerBlur = getEdgeBlur(frameInnerEdgeSize);
  const navInnerBlur = getEdgeBlur(navInnerEdgeSize);
  const footerInnerBlur = getEdgeBlur(footerInnerEdgeSize);
  const includeNavInnerEdge = glassWindow.id === "top";
  const includeFooterInnerEdge = glassWindow.id !== "top";
  const navInnerEdgeMask = includeNavInnerEdge
    ? `
        <mask id="nav-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path d="${navInnerPath}" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="${navInnerEdgeSize * 2}" style="filter:blur(${navInnerBlur}px)" />
        </mask>`
    : "";
  const footerInnerEdgeMask = includeFooterInnerEdge
    ? `
        <mask id="footer-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path d="${footerInnerPath}" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="${footerInnerEdgeSize * 2}" style="filter:blur(${footerInnerBlur}px)" />
        </mask>`
    : "";
  const navInnerEdgeLayer = includeNavInnerEdge
    ? `
        <g mask="url(#nav-inner-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>`
    : "";
  const footerInnerEdgeLayer = includeFooterInnerEdge
    ? `
        <g mask="url(#footer-inner-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>`
    : "";
  const svg = `
    <svg
      width="${glassWindow.width}"
      height="${glassWindow.height}"
      viewBox="${glassWindow.x} ${glassWindow.y} ${glassWindow.width} ${glassWindow.height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="frame-red-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000" />
          <stop offset="100%" stop-color="red" />
        </linearGradient>
        <linearGradient id="frame-blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000" />
          <stop offset="100%" stop-color="blue" />
        </linearGradient>
        <mask id="frame-glass-shape" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path d="${pathData}" fill="white" fill-rule="evenodd" clip-rule="evenodd" />
        </mask>
        <mask id="outer-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="white" stroke-width="${outerScreenEdgeSize * 2}" style="filter:blur(${outerEdgeBlur}px)" />
        </mask>
        <mask id="frame-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path d="${frameInnerPath}" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="${frameInnerEdgeSize * 2}" style="filter:blur(${frameInnerBlur}px)" />
        </mask>
        ${navInnerEdgeMask}
        ${footerInnerEdgeMask}
      </defs>
      <rect width="${width}" height="${height}" fill="black" />
      <g mask="url(#frame-glass-shape)">
        <rect width="${width}" height="${height}" fill="hsl(0 0% 50% / 0.93)" />
        <g mask="url(#outer-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>
        <g mask="url(#frame-inner-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>
        ${navInnerEdgeLayer}
        ${footerInnerEdgeLayer}
      </g>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function applyFrameGeometryToDom(
  geometry: FrameGeometry,
  footerOnly = false,
) {
  buildGlassWindows(geometry).forEach((glassWindow) => {
    if (footerOnly && glassWindow.id === "top") return;

    const surface = document.querySelector<HTMLElement>(
      `.viewport-frame-glass--${glassWindow.id}`,
    );
    if (!surface) return;

    surface.style.setProperty("--frame-window-left", `${glassWindow.x}px`);
    surface.style.setProperty("--frame-window-top", `${glassWindow.y}px`);
    surface.style.setProperty("--frame-window-width", `${glassWindow.width}px`);
    surface.style.setProperty(
      "--frame-window-height",
      `${glassWindow.height}px`,
    );

    // Keep side masks in sync on footer scroll. Updating height alone used to
    // stretch a stale mask and make both side borders drift inward.
    const displacementMap = buildConnectedDisplacementMap(
      geometry,
      glassWindow,
    );

    surface.style.setProperty(
      "--frame-window-mask",
      buildConnectedFrameMask(geometry, glassWindow),
    );

    surface
      .querySelector("feImage")
      ?.setAttribute("href", displacementMap);
  });

  const gradientLayer = document.querySelector<SVGSVGElement>(
    ".viewport-frame-outer-gradient",
  );
  if (!gradientLayer) return;

  gradientLayer.setAttribute("width", geometry.width.toString());
  gradientLayer.setAttribute("height", geometry.height.toString());
  gradientLayer.setAttribute(
    "viewBox",
    `0 0 ${geometry.width} ${geometry.height}`,
  );
  (
    [
      ["frame", geometry.frameInnerPath],
      ["nav", geometry.navInnerPath],
      ["footer", geometry.footerInnerPath],
    ] as const
  ).forEach(([role, pathData]) => {
    gradientLayer
      .querySelector(`[data-frame-gradient-geometry="${role}"]`)
      ?.setAttribute("d", pathData);
  });
}

export default function ViewportFrame() {
  const [geometry, setGeometry] = useState<FrameGeometry | null>(null);
  const staticMetricsRef = useRef<StaticFrameMetrics | null>(null);
  const geometryRef = useRef<FrameGeometry | null>(null);

  useLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>(".site-nav-shell");
    const footer = document.querySelector<HTMLElement>(".site-footer-shell");
    if (!nav || !footer) return;

    const measureStaticFrame = () => {
      const navRect = nav.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const styles = getComputedStyle(document.documentElement);
      const width = window.innerWidth;
      const height = window.innerHeight;

      const frameWidth = readCssPixelValue(styles, "--viewport-frame-width");
      const radius = readCssPixelValue(styles, "--viewport-frame-radius");
      const navBottom = navRect.height;
      const innerBottom = height - frameWidth;
      const footerTop = Math.min(footerRect.top, innerBottom);
      const staticMetrics: StaticFrameMetrics = {
        width,
        height,
        frameWidth,
        radius,
        navLeft: navRect.left,
        navRight: navRect.right,
        navBottom,
      };
      const metrics: FrameMetrics = {
        ...staticMetrics,
        footerTop,
      };
      const nextGeometry = buildFrameGeometry(metrics);

      staticMetricsRef.current = staticMetrics;
      geometryRef.current = nextGeometry;

      setGeometry((currentGeometry) =>
        currentGeometry && areFrameGeometriesEqual(currentGeometry, nextGeometry)
          ? currentGeometry
          : nextGeometry,
      );
    };

    const updateFooterGeometry = () => {
      const staticMetrics = staticMetricsRef.current;
      if (!staticMetrics) return;

      const footerRect = footer.getBoundingClientRect();
      const innerBottom = staticMetrics.height - staticMetrics.frameWidth;
      const footerTop = Math.min(footerRect.top, innerBottom);
      const nextGeometry = buildFrameGeometry({
        ...staticMetrics,
        footerTop,
      });
      const currentGeometry = geometryRef.current;

      if (
        currentGeometry &&
        areFrameGeometriesEqual(currentGeometry, nextGeometry)
      ) {
        return;
      }

      geometryRef.current = nextGeometry;
      applyFrameGeometryToDom(nextGeometry, true);
    };

    measureStaticFrame();

    let animationFrame = 0;
    let staticMeasureRequested = false;
    const requestShapeUpdate = (measureStatic: boolean) => {
      staticMeasureRequested ||= measureStatic;
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        if (staticMeasureRequested) {
          staticMeasureRequested = false;
          measureStaticFrame();
          return;
        }
        updateFooterGeometry();
      });
    };

    const requestStaticMeasure = () => requestShapeUpdate(true);
    const requestFooterUpdate = () => requestShapeUpdate(false);
    const resizeObserver = new ResizeObserver(requestStaticMeasure);
    resizeObserver.observe(nav);
    resizeObserver.observe(footer);
    window.addEventListener("resize", requestStaticMeasure);
    window.addEventListener("scroll", requestFooterUpdate, { passive: true });

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", requestStaticMeasure);
      window.removeEventListener("scroll", requestFooterUpdate);
    };
  }, []);

  useLayoutEffect(() => {
    if (geometry) applyFrameGeometryToDom(geometry);
  }, [geometry]);

  if (!geometry) {
    return <div className="viewport-frame-glass-regions" />;
  }

  const glassWindows = buildGlassWindows(geometry);

  return (
    <div className="viewport-frame-glass-regions">
      {glassWindows.map((glassWindow) => {
        const maskImage = buildConnectedFrameMask(geometry, glassWindow);
        const displacementMap = buildConnectedDisplacementMap(
          geometry,
          glassWindow,
        );
        const frameStyle: FrameGlassStyle = {
          "--frame-window-left": `${glassWindow.x}px`,
          "--frame-window-top": `${glassWindow.y}px`,
          "--frame-window-width": `${glassWindow.width}px`,
          "--frame-window-height": `${glassWindow.height}px`,
          "--frame-window-mask": maskImage,
          top: "var(--frame-window-top)",
          ...(glassWindow.id === "right"
            ? { right: 0 }
            : { left: "var(--frame-window-left)" }),
          WebkitMaskImage: "var(--frame-window-mask)",
          maskImage: "var(--frame-window-mask)",
        };

        return (
          <GlassSurface
            key={glassWindow.id}
            width="var(--frame-window-width)"
            height="var(--frame-window-height)"
            borderRadius={0}
            brightness={50}
            opacity={0.93}
            displace={0.5}
            saturation={1}
            distortionScale={-300}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            displacementMap={displacementMap}
            className={`viewport-frame-glass viewport-frame-glass--${glassWindow.id}`}
            style={frameStyle}
          />
        );
      })}
      <svg
        className="viewport-frame-outer-gradient"
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        aria-hidden="true"
      >
        <defs>
          <path
            id="viewport-frame-gradient-frame-path"
            data-frame-gradient-geometry="frame"
            d={geometry.frameInnerPath}
          />
          <path
            id="viewport-frame-gradient-nav-path"
            data-frame-gradient-geometry="nav"
            d={geometry.navInnerPath}
          />
          <path
            id="viewport-frame-gradient-footer-path"
            data-frame-gradient-geometry="footer"
            d={geometry.footerInnerPath}
          />
        </defs>
        {renderOuterGradientPaths(
          "frame",
          "viewport-frame-gradient-frame-path",
        )}
        {renderOuterGradientPaths(
          "nav",
          "viewport-frame-gradient-nav-path",
        )}
        {renderOuterGradientPaths(
          "footer",
          "viewport-frame-gradient-footer-path",
        )}
      </svg>
    </div>
  );
}
