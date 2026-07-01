"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Intro from "@/components/Intro";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import AcademicPreview from "@/components/AcademicPreview";
import Contact from "@/components/Contact";
import ViewportFrame from "@/components/ViewportFrame";
import LiquidEther from "@/components/LiquidEther";
import { LIQUID_ETHER_BACKGROUND_PROPS } from "@/components/liquidEtherBackground";
import {
  hasSeenIntro,
  isPageReload,
  markIntroSeen,
} from "@/components/introVisit";
import {
  getSiteThemeFromIntroSide,
  type SiteTheme,
} from "@/components/siteTheme";

type ThemeSweepDirection = "to-black" | "to-white";
const themeSweepDuration = 900;

function removeThemeSweepSnapshots() {
  document
    .querySelectorAll(".theme-sweep-snapshot")
    .forEach((snapshot) => snapshot.remove());
}

function createThemeSweepSnapshot(direction: ThemeSweepDirection) {
  const source = document.querySelector("main");
  if (!source) return;

  removeThemeSweepSnapshots();

  const snapshot = document.createElement("div");
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.className = `theme-sweep-snapshot theme-sweep-snapshot--${direction}`;
  snapshot.style.setProperty("--theme-sweep-scroll-y", `${window.scrollY}px`);

  const content = source.cloneNode(true) as HTMLElement;
  content.classList.add("theme-sweep-snapshot__content");
  snapshot.appendChild(content);
  document.body.appendChild(snapshot);

  const cleanup = () => snapshot.remove();
  snapshot.addEventListener("animationend", cleanup, { once: true });
  window.setTimeout(cleanup, themeSweepDuration + 120);
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [introResolved, setIntroResolved] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>("black");

  useEffect(() => {
    setEntered(hasSeenIntro() && !isPageReload());
    setIntroResolved(true);
  }, []);

  useEffect(() => {
    return removeThemeSweepSnapshots;
  }, []);

  function handleEnterTheme(introSide: SiteTheme) {
    markIntroSeen();
    setTheme(getSiteThemeFromIntroSide(introSide));
    setEntered(true);
  }

  function handleToggleTheme() {
    const nextTheme: SiteTheme = theme === "black" ? "white" : "black";
    const direction: ThemeSweepDirection =
      nextTheme === "black" ? "to-black" : "to-white";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!prefersReducedMotion) {
      createThemeSweepSnapshot(direction);
    }
    setTheme(nextTheme);
  }

  return (
    <main
      data-site-theme={theme}
      className="relative min-h-screen overflow-hidden text-text"
    >
      {entered && (
        <div aria-hidden="true" className="site-theme-background">
          <LiquidEther {...LIQUID_ETHER_BACKGROUND_PROPS} />
        </div>
      )}
      <AnimatePresence>
        {introResolved && (
          !entered ? (
            <Intro key="cover" onEnter={handleEnterTheme} />
          ) : (
            <motion.div
              key="site"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
              className="relative z-10 min-h-screen"
            >
              <ViewportFrame />

              {/* Navigation */}
              <Navbar onToggleTheme={handleToggleTheme} />

              {/* Hero Section */}
              <Hero />

              {/* Projects Section */}
              <Projects />

              {/* Academic Section */}
              <AcademicPreview />

              {/* Contact Section */}
              <Contact />

              {/* Footer */}
              <footer className="site-footer-shell">
                <div className="site-footer-content mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row">
                  <p className="site-footer-copy text-xs tracking-wide">
                    &copy; {new Date().getFullYear()} BIAN
                    <span>KIII</span>. All rights reserved.
                  </p>
                  <p className="site-footer-note text-xs">
                    Crafted with quantum precision
                  </p>
                </div>
              </footer>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </main>
  );
}
