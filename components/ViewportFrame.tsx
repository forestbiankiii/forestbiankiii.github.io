"use client";

import { useLayoutEffect, useRef, useState } from "react";
import StudioLiquidGlass from "@/components/StudioLiquidGlass";
import "@/components/GlassSurface.css";

const outerGradientLayers = [
  { width: 14, opacity: 0.035 },
  { width: 8, opacity: 0.06 },
  { width: 3, opacity: 0.12 },
] as const;

type OuterGradientRole = "nav" | "footer";

interface GlassMetrics {
  width: number;
  height: number;
  radius: number;
  navLeft: number;
  navTop: number;
  navWidth: number;
  navHeight: number;
  footerTop: number;
  footerHeight: number;
}

interface GlassGeometry extends GlassMetrics {
  navRadius: number;
  navOutlinePath: string;
  footerOutlinePath: string;
}

type StaticGlassMetrics = Omit<GlassMetrics, "footerTop">;

function renderOuterGradientPaths(role: OuterGradientRole, pathId: string) {
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

function buildGlassGeometry(metrics: GlassMetrics): GlassGeometry {
  const {
    width,
    radius,
    navLeft,
    navTop,
    navWidth,
    navHeight,
    footerTop,
  } = metrics;
  const navRight = navLeft + navWidth;
  const navRadius = navHeight / 2;

  const navOutlinePath = [
    `M ${navLeft + navRadius} ${navTop}`,
    `H ${navRight - navRadius}`,
    `A ${navRadius} ${navRadius} 0 0 1 ${navRight - navRadius} ${navTop + navHeight}`,
    `H ${navLeft + navRadius}`,
    `A ${navRadius} ${navRadius} 0 0 1 ${navLeft + navRadius} ${navTop}`,
    "Z",
  ].join(" ");

  const footerOutlinePath = [
    `M 0 ${footerTop + radius}`,
    `Q 0 ${footerTop} ${radius} ${footerTop}`,
    `H ${width - radius}`,
    `Q ${width} ${footerTop} ${width} ${footerTop + radius}`,
  ].join(" ");

  return { ...metrics, navRadius, navOutlinePath, footerOutlinePath };
}

function areGeometriesEqual(
  previous: GlassGeometry | null,
  next: GlassGeometry,
) {
  if (!previous) return false;

  return (
    previous.width === next.width &&
    previous.height === next.height &&
    previous.radius === next.radius &&
    previous.navLeft === next.navLeft &&
    previous.navTop === next.navTop &&
    previous.navWidth === next.navWidth &&
    previous.navHeight === next.navHeight &&
    previous.navRadius === next.navRadius &&
    previous.footerTop === next.footerTop &&
    previous.footerHeight === next.footerHeight
  );
}

function readCssPixelValue(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function applyGlassGeometryToDom(geometry: GlassGeometry) {
  const navGlass = document.querySelector<HTMLElement>(
    ".viewport-frame-glass--nav",
  );
  const footerGlass = document.querySelector<HTMLElement>(
    ".viewport-frame-glass--footer",
  );
  const gradient = document.querySelector<SVGSVGElement>(
    ".viewport-frame-outer-gradient",
  );
  const navPath = document.querySelector<SVGPathElement>(
    '[data-frame-gradient-geometry="nav"]',
  );
  const footerPath = document.querySelector<SVGPathElement>(
    '[data-frame-gradient-geometry="footer"]',
  );

  if (navGlass) {
    navGlass.style.left = `${geometry.navLeft}px`;
    navGlass.style.top = `${geometry.navTop}px`;
    navGlass.style.width = `${geometry.navWidth}px`;
    navGlass.style.height = `${geometry.navHeight}px`;
  }

  if (footerGlass) {
    footerGlass.style.left = "0px";
    footerGlass.style.top = `${geometry.footerTop}px`;
    footerGlass.style.width = `${geometry.width}px`;
    footerGlass.style.height = `${geometry.footerHeight + geometry.radius}px`;
  }

  if (gradient) {
    gradient.setAttribute("width", String(geometry.width));
    gradient.setAttribute("height", String(geometry.height));
    gradient.setAttribute("viewBox", `0 0 ${geometry.width} ${geometry.height}`);
  }

  navPath?.setAttribute("d", geometry.navOutlinePath);
  footerPath?.setAttribute("d", geometry.footerOutlinePath);
}

export default function ViewportFrame() {
  const [geometry, setGeometry] = useState<GlassGeometry | null>(null);
  const staticMetricsRef = useRef<StaticGlassMetrics | null>(null);
  const geometryRef = useRef<GlassGeometry | null>(null);

  useLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>(".site-nav-shell");
    const footer = document.querySelector<HTMLElement>(".site-footer-shell");
    if (!nav || !footer) return;

    let animationFrame = 0;

    const commitGeometry = (next: GlassGeometry, renderReact: boolean) => {
      if (areGeometriesEqual(geometryRef.current, next)) return;
      geometryRef.current = next;
      applyGlassGeometryToDom(next);
      if (renderReact) setGeometry(next);
    };

    const measureStaticGlass = () => {
      const navRect = nav.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const rootStyles = getComputedStyle(document.documentElement);
      const radius = readCssPixelValue(
        rootStyles.getPropertyValue("--viewport-frame-radius"),
        48,
      );
      const staticMetrics: StaticGlassMetrics = {
        width: window.innerWidth,
        height: window.innerHeight,
        radius,
        navLeft: navRect.left,
        navTop: readCssPixelValue(
          rootStyles.getPropertyValue("--nav-shell-block-inset"),
          8,
        ),
        navWidth: navRect.width,
        navHeight: navRect.height,
        footerHeight: footerRect.height,
      };
      staticMetricsRef.current = staticMetrics;
      commitGeometry(
        buildGlassGeometry({
          ...staticMetrics,
          footerTop: footerRect.top,
        }),
        true,
      );
    };

    const updateFooterGeometry = () => {
      const staticMetrics = staticMetricsRef.current;
      if (!staticMetrics) return;
      commitGeometry(
        buildGlassGeometry({
          ...staticMetrics,
          footerTop: footer.getBoundingClientRect().top,
        }),
        false,
      );
    };

    const scheduleFooterUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateFooterGeometry();
      });
    };

    measureStaticGlass();

    const resizeObserver = new ResizeObserver(measureStaticGlass);
    resizeObserver.observe(nav);
    resizeObserver.observe(footer);
    window.addEventListener("resize", measureStaticGlass);
    window.addEventListener("scroll", scheduleFooterUpdate, { passive: true });

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureStaticGlass);
      window.removeEventListener("scroll", scheduleFooterUpdate);
    };
  }, []);

  useLayoutEffect(() => {
    if (geometry) applyGlassGeometryToDom(geometry);
  }, [geometry]);

  if (!geometry) {
    return <div className="viewport-frame-glass-regions" aria-hidden="true" />;
  }

  return (
    <div className="viewport-frame-glass-regions" aria-hidden="true">
      <StudioLiquidGlass
        width={geometry.navWidth}
        height={geometry.navHeight}
        borderRadius={geometry.navRadius}
        blurRadius={0}
        maxDpr={1}
        capturePad={40}
        captureDomText
        highlightIntensity={0}
        shaderHalo={false}
        className="viewport-frame-glass viewport-frame-glass--nav"
        style={{
          left: `${geometry.navLeft}px`,
          top: `${geometry.navTop}px`,
        }}
      />
      <StudioLiquidGlass
        width={geometry.width}
        height={geometry.footerHeight + geometry.radius}
        borderRadius={geometry.radius}
        blurRadius={0}
        maxDpr={1}
        capturePad={40}
        highlightIntensity={0}
        shaderHalo={false}
        className="viewport-frame-glass viewport-frame-glass--footer"
        style={{ left: 0, top: `${geometry.footerTop}px` }}
      />

      <svg
        className="viewport-frame-outer-gradient"
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="viewport-frame-gradient-nav-path"
            data-frame-gradient-geometry="nav"
            d={geometry.navOutlinePath}
          />
          <path
            id="viewport-frame-gradient-footer-path"
            data-frame-gradient-geometry="footer"
            d={geometry.footerOutlinePath}
          />
        </defs>
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
