"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import GooeyNav, { type GooeyNavItem } from "@/components/GooeyNav";

const navLinks: GooeyNavItem[] = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Academic", href: "#academic" },
  { label: "Contact", href: "#contact" },
];
const sectionIds = Array.from(navLinks, (link) => link.href.replace("#", ""));

interface NavbarProps {
  onToggleTheme: () => void;
}

interface ActiveNav {
  index: number;
  source: "manual" | "scroll";
}

function ThemeIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Navbar({ onToggleTheme }: NavbarProps) {
  const manualTargetRef = useRef<number | null>(null);
  const [activeNav, setActiveNav] = useState<ActiveNav>({
    index: 0,
    source: "manual",
  });

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const anchorY = window.innerHeight * 0.38;
      let nextIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      sectionIds.forEach((id, index) => {
        const section = document.getElementById(id);
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const containsAnchor = rect.top <= anchorY && rect.bottom > anchorY;
        const distance = containsAnchor ? 0 : Math.abs(rect.top - anchorY);

        if (containsAnchor || distance < closestDistance) {
          nextIndex = index;
          closestDistance = distance;
        }
      });

      if (manualTargetRef.current !== null) {
        if (nextIndex !== manualTargetRef.current) return;

        manualTargetRef.current = null;
        setActiveNav({ index: nextIndex, source: "manual" });
        return;
      }

      setActiveNav((current) =>
        current.index === nextIndex
          ? current
          : { index: nextIndex, source: "scroll" },
      );
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  function handleThemeClick() {
    onToggleTheme();
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="site-nav-shell fixed z-50 transition-all duration-300"
    >
      <div className="site-nav-content flex h-full w-full items-center justify-between px-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleThemeClick}
            aria-label="Toggle color theme"
            className="site-theme-toggle inline-flex size-11 items-center justify-center rounded-full bg-transparent transition-colors duration-200"
          >
            <ThemeIcon />
          </button>

          {/* Logo */}
          <a
            href="#home"
            className="site-nav-brand text-xl font-bold tracking-wider transition-colors"
          >
            Bian<span>Kiii</span>
          </a>
        </div>

        {/* Desktop Nav */}
        <div className="ml-auto hidden md:block pr-10">
          <GooeyNav
            items={navLinks}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            activeIndex={activeNav.index}
            transitionMode={activeNav.source}
            onActiveIndexChange={(index) => {
              manualTargetRef.current = index;
              setActiveNav({ index, source: "manual" });
            }}
            animationTime={600}
            timeVariance={300}
          />
        </div>
      </div>
    </motion.nav>
  );
}
