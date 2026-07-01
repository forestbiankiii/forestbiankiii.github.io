"use client";

import { useLayoutEffect, useState } from "react";
import GlassSurface from "@/components/GlassSurface";

const outerScreenEdgeSize = 1;
const innerEdgeSizeRatio = 0.03;

function getInnerEdgeSize(distanceToScreenEdge: number) {
  return Math.ceil(distanceToScreenEdge * innerEdgeSizeRatio);
}

function getEdgeBlur(edgeSize: number) {
  return edgeSize * 3;
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

interface GlassRegion {
  id: "top-left" | "nav" | "top-right" | "left" | "right" | "bottom";
  x: number;
  y: number;
  width: number;
  height: number;
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

function buildGlassRegions({
  width,
  height,
  frameWidth,
  radius,
  navLeft,
  navRight,
  navBottom,
  footerTop,
  pathData,
}: FrameGeometry) {
  if (!pathData) return [];

  const sideWidth = Math.min(width / 2, frameWidth + radius);
  const navRegionLeft = Math.max(
    sideWidth,
    Math.min(width - sideWidth, navLeft - radius),
  );
  const navRegionRight = Math.max(
    navRegionLeft,
    Math.min(width - sideWidth, navRight + radius),
  );
  const sideBottom = footerTop ?? height - frameWidth;

  return [
    {
      id: "top-left",
      x: 0,
      y: 0,
      width: navRegionLeft,
      height: frameWidth,
    },
    {
      id: "nav",
      x: navRegionLeft,
      y: 0,
      width: navRegionRight - navRegionLeft,
      height: navBottom,
    },
    {
      id: "top-right",
      x: navRegionRight,
      y: 0,
      width: width - navRegionRight,
      height: frameWidth,
    },
    {
      id: "left",
      x: 0,
      y: frameWidth,
      width: sideWidth,
      height: sideBottom - frameWidth,
    },
    {
      id: "right",
      x: width - sideWidth,
      y: frameWidth,
      width: sideWidth,
      height: sideBottom - frameWidth,
    },
    {
      id: "bottom",
      x: 0,
      y: sideBottom,
      width,
      height: height - sideBottom,
    },
  ].filter((region) => region.width > 0 && region.height > 0) as GlassRegion[];
}

function buildConnectedFrameMask(
  { pathData }: FrameGeometry,
  region: GlassRegion,
) {
  if (!pathData) return "none";

  const svg = `
    <svg
      width="${region.width}"
      height="${region.height}"
      viewBox="${region.x} ${region.y} ${region.width} ${region.height}"
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
  region: GlassRegion,
) {
  const outerEdgeBlur = getEdgeBlur(outerScreenEdgeSize);
  const frameInnerBlur = getEdgeBlur(frameInnerEdgeSize);
  const navInnerBlur = getEdgeBlur(navInnerEdgeSize);
  const footerInnerBlur = getEdgeBlur(footerInnerEdgeSize);
  const svg = `
    <svg
      width="${region.width}"
      height="${region.height}"
      viewBox="${region.x} ${region.y} ${region.width} ${region.height}"
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
          <rect
            x="0"
            y="0"
            width="${width}"
            height="${height}"
            fill="none"
            stroke="white"
            stroke-width="${outerScreenEdgeSize * 2}"
            style="filter:blur(${outerEdgeBlur}px)"
          />
        </mask>
        <mask id="frame-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path
            d="${frameInnerPath}"
            fill="none"
            stroke="white"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="${frameInnerEdgeSize * 2}"
            style="filter:blur(${frameInnerBlur}px)"
          />
        </mask>
        <mask id="nav-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path
            d="${navInnerPath}"
            fill="none"
            stroke="white"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="${navInnerEdgeSize * 2}"
            style="filter:blur(${navInnerBlur}px)"
          />
        </mask>
        <mask id="footer-inner-edge-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="black" />
          <path
            d="${footerInnerPath}"
            fill="none"
            stroke="white"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="${footerInnerEdgeSize * 2}"
            style="filter:blur(${footerInnerBlur}px)"
          />
        </mask>
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
        <g mask="url(#nav-inner-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>
        <g mask="url(#footer-inner-edge-region)">
          <rect width="${width}" height="${height}" fill="url(#frame-red-gradient)" />
          <rect width="${width}" height="${height}" fill="url(#frame-blue-gradient)" style="mix-blend-mode:difference" />
        </g>
      </g>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function ViewportFrame() {
  const [geometry, setGeometry] = useState<FrameGeometry>({
    width: 1,
    height: 1,
    frameWidth: 1,
    radius: 0,
    navLeft: 0,
    navRight: 1,
    navBottom: 1,
    footerTop: null,
    pathData: "",
    frameInnerPath: "",
    navInnerPath: "",
    footerInnerPath: "",
    frameInnerEdgeSize: getInnerEdgeSize(1),
    navInnerEdgeSize: getInnerEdgeSize(1),
    footerInnerEdgeSize: 0,
  });

  useLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>(".site-nav-shell");
    const footer = document.querySelector<HTMLElement>(".site-footer-shell");
    if (!nav || !footer) return;

    const updateShape = () => {
      const navRect = nav.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const styles = getComputedStyle(document.documentElement);
      const width = window.innerWidth;
      const height = window.innerHeight;

      const frameWidth = readCssPixelValue(styles, "--viewport-frame-width");
      const radius = readCssPixelValue(styles, "--viewport-frame-radius");
      const navBottom = navRect.height;
      const innerBottom = height - frameWidth;
      const footerIsConnected =
        footerRect.top <= innerBottom - radius * 2;
      const metrics: FrameMetrics = {
        width,
        height,
        frameWidth,
        radius,
        navLeft: navRect.left,
        navRight: navRect.right,
        navBottom,
        footerTop: footerIsConnected ? footerRect.top : null,
      };

      setGeometry({
        ...metrics,
        pathData: buildConnectedFramePath(metrics),
        ...buildConnectedFrameEdgePaths(metrics),
        frameInnerEdgeSize: getInnerEdgeSize(frameWidth),
        navInnerEdgeSize: getInnerEdgeSize(navBottom),
        footerInnerEdgeSize: footerIsConnected
          ? getInnerEdgeSize(height - footerRect.top)
          : 0,
      });
    };

    updateShape();

    let animationFrame = 0;
    const requestShapeUpdate = () => {
      if (animationFrame) return;

      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        updateShape();
      });
    };

    const resizeObserver = new ResizeObserver(requestShapeUpdate);
    resizeObserver.observe(nav);
    resizeObserver.observe(footer);
    window.addEventListener("resize", requestShapeUpdate);
    window.addEventListener("scroll", requestShapeUpdate, { passive: true });

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", requestShapeUpdate);
      window.removeEventListener("scroll", requestShapeUpdate);
    };
  }, []);

  const glassRegions = buildGlassRegions(geometry);

  return (
    <div className="viewport-frame-glass-regions">
      {glassRegions.map((region) => {
        const maskImage = buildConnectedFrameMask(geometry, region);
        const displacementMap = buildConnectedDisplacementMap(geometry, region);

        return (
          <GlassSurface
            key={region.id}
            width={region.width}
            height={region.height}
            borderRadius={0}
            brightness={50}
            opacity={0.93}
            displace={0.5}
            backgroundOpacity={0.1}
            saturation={1}
            distortionScale={-300}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            displacementMap={displacementMap}
            className="viewport-frame-glass"
            style={{
              left: region.x,
              top: region.y,
              WebkitMaskImage: maskImage,
              maskImage,
            }}
          />
        );
      })}
    </div>
  );
}
