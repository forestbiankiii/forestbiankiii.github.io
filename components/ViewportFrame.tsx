"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import StudioLiquidGlass from "@/components/StudioLiquidGlass";
import "@/components/GlassSurface.css";

const outerGradientLayers = [
  { width: 14, opacity: 0.035 },
  { width: 8, opacity: 0.06 },
  { width: 3, opacity: 0.12 },
] as const;

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
}

type StaticFrameMetrics = Omit<FrameMetrics, "footerTop">;

type FrameGlassStyle = CSSProperties & {
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
  return {
    ...metrics,
    pathData: buildConnectedFramePath(metrics),
    ...buildConnectedFrameEdgePaths(metrics),
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

function buildConnectedFrameMask({ width, height, pathData }: FrameGeometry) {
  if (!pathData) return "linear-gradient(transparent, transparent)";

  const svg = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="${pathData}" fill="white" fill-rule="evenodd" clip-rule="evenodd" />
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function applyFrameGeometryToDom(geometry: FrameGeometry) {
  const surface = document.querySelector<HTMLElement>(".viewport-frame-glass");
  if (surface) {
    surface.style.setProperty("--frame-window-width", `${geometry.width}px`);
    surface.style.setProperty("--frame-window-height", `${geometry.height}px`);
    surface.style.setProperty(
      "--frame-window-mask",
      buildConnectedFrameMask(geometry),
    );
  }

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
      applyFrameGeometryToDom(nextGeometry);
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

  const maskImage = buildConnectedFrameMask(geometry);
  const frameStyle: FrameGlassStyle = {
    "--frame-window-width": `${geometry.width}px`,
    "--frame-window-height": `${geometry.height}px`,
    "--frame-window-mask": maskImage,
    inset: 0,
    WebkitMaskImage: "var(--frame-window-mask)",
    maskImage: "var(--frame-window-mask)",
  };

  return (
    <div className="viewport-frame-glass-regions">
      <StudioLiquidGlass
        width="var(--frame-window-width)"
        height="var(--frame-window-height)"
        borderRadius={0}
        maxDpr={1}
        capturePad={40}
        className="viewport-frame-glass"
        style={frameStyle}
      />
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
