"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import "./GooeyNav.css";

export interface GooeyNavItem {
  label: string;
  href: string;
}

interface Particle {
  start: [number, number];
  end: [number, number];
  time: number;
  scale: number;
  color: number;
  rotate: number;
}

interface GooeyNavProps {
  items?: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
  activeIndex?: number;
  transitionMode?: "manual" | "scroll";
  onActiveIndexChange?: (index: number) => void;
}

const GooeyNav = ({
  items = [],
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  activeIndex: controlledActiveIndex,
  transitionMode = "manual",
  onActiveIndexChange,
}: GooeyNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [internalActiveIndex, setInternalActiveIndex] = useState(initialActiveIndex);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (
    distance: number,
    pointIndex: number,
    totalPoints: number,
  ): [number, number] => {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (
    i: number,
    t: number,
    d: [number, number],
    r: number,
  ): Particle => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const appendParticle = (layer: HTMLSpanElement, p: Particle) => {
    const particle = document.createElement("span");
    const point = document.createElement("span");
    particle.classList.add("particle");
    particle.style.setProperty("--start-x", `${p.start[0]}px`);
    particle.style.setProperty("--start-y", `${p.start[1]}px`);
    particle.style.setProperty("--end-x", `${p.end[0]}px`);
    particle.style.setProperty("--end-y", `${p.end[1]}px`);
    particle.style.setProperty("--time", `${p.time}ms`);
    particle.style.setProperty("--scale", `${p.scale}`);
    particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
    particle.style.setProperty("--rotate", `${p.rotate}deg`);

    point.classList.add("point");
    particle.appendChild(point);
    layer.appendChild(particle);
    setTimeout(() => {
      try {
        layer.removeChild(particle);
      } catch {
        // Do nothing
      }
    }, p.time);
  };

  const clearParticles = (layer: HTMLSpanElement) => {
    const particles = layer.querySelectorAll(".particle");
    particles.forEach((p) => layer.removeChild(p));
  };

  const makeParticles = (filterLayer: HTMLSpanElement) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    filterLayer.style.setProperty("--time", `${bubbleTime}ms`);
    filterLayer.classList.remove("active");

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);

      setTimeout(() => {
        appendParticle(filterLayer, p);
        requestAnimationFrame(() => {
          filterLayer.classList.add("active");
        });
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const activateItem = (liEl: HTMLElement, index: number) => {
    if (activeIndex === index) return;

    setInternalActiveIndex(index);
    onActiveIndexChange?.(index);
    containerRef.current?.classList.remove("is-scroll-sync");
    updateEffectPosition(liEl);

    if (filterRef.current) {
      clearParticles(filterRef.current);
    }

    if (textRef.current) {
      textRef.current.classList.remove("active");

      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }

    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, index: number) => {
    const liEl = e.currentTarget.parentElement;
    if (liEl) {
      activateItem(liEl, index);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi);
      filterRef.current?.classList.add("active");
      textRef.current?.classList.add("active");
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <div
      className={`gooey-nav-container${
        transitionMode === "scroll" ? " is-scroll-sync" : ""
      }`}
      ref={containerRef}
    >
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={item.href} className={activeIndex === index ? "active" : ""}>
              <a
                href={item.href}
                onClick={(e) => handleClick(e, index)}
                onKeyDown={handleKeyDown}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <svg
        className="gooey-nav-filter-defs"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id="gooey-nav-alpha-filter"
            x="-150%"
            y="-150%"
            width="400%"
            height="400%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <span className="effect filter" ref={filterRef} aria-hidden="true" />
      <span className="effect text" ref={textRef} aria-hidden="true" />
    </div>
  );
};

export default GooeyNav;
