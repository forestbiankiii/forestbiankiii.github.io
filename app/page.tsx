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
import ModelViewer from "@/components/ModelViewer";
import ModelAdjustmentPanel from "@/components/ModelAdjustmentPanel";
import {
  hasSeenIntro,
  isPageReload,
  markIntroSeen,
} from "@/components/introVisit";
import {
  getSiteThemeFromIntroSide,
  type SiteTheme,
} from "@/components/siteTheme";
import { withBasePath } from "@/components/sitePath";
import {
  FERRARI_MODEL_PATH,
  getModelBackgroundColor,
  MODEL_BACKGROUND_VIEWER_PROPS,
} from "@/components/modelBackground";
import {
  clampModelControlValue,
  DEFAULT_MODEL_CONTROLS,
  toggleModelInteractionMode,
  type ModelNumericControl,
} from "@/components/modelControls";

type ThemeSweepDirection = "to-black" | "to-white";
const themeSweepDuration = 1800;

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
  const handleSweepEnd = (event: AnimationEvent) => {
    if (event.target !== snapshot) return;
    cleanup();
  };
  snapshot.addEventListener("animationend", handleSweepEnd);
  window.setTimeout(cleanup, themeSweepDuration + 120);
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [introResolved, setIntroResolved] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>("black");
  const [modelControls, setModelControls] = useState(
    DEFAULT_MODEL_CONTROLS,
  );
  const [modelResetVersion, setModelResetVersion] = useState(0);
  const [modelAdjustmentOpen, setModelAdjustmentOpen] = useState(false);
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

  function handleModelNumericChange(
    control: ModelNumericControl,
    value: number,
  ) {
    setModelControls((current) => ({
      ...current,
      [control]: clampModelControlValue(control, value),
    }));
  }

  function handleToggleModelInteractionMode() {
    setModelControls((current) => ({
      ...current,
      interactionMode: toggleModelInteractionMode(
        current.interactionMode,
      ),
    }));
  }

  function handleResetModelControls() {
    setModelControls(DEFAULT_MODEL_CONTROLS);
    setModelResetVersion((current) => current + 1);
  }

  return (
    <main
      data-site-theme={theme}
      data-model-interaction={modelControls.interactionMode}
      className="relative min-h-screen overflow-hidden text-text"
    >
      {entered && (
        <div
          aria-hidden="true"
          className="site-model-background"
          style={{ backgroundColor: getModelBackgroundColor(theme) }}
        >
          <ModelViewer
            url={withBasePath(FERRARI_MODEL_PATH)}
            width="100%"
            height="100%"
            {...MODEL_BACKGROUND_VIEWER_PROPS}
            modelScale={modelControls.modelScale}
            rotationResetKey={modelResetVersion}
            modelXOffset={modelControls.modelXOffset}
            modelYOffset={modelControls.modelYOffset}
            enableMouseParallax={
              modelControls.interactionMode === "browse"
            }
            enableHoverRotation={
              modelControls.interactionMode === "browse"
            }
            enableManualRotation={
              modelControls.interactionMode === "rotate"
            }
            manualRotationTarget="window"
          />
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
              className={`relative z-10 min-h-screen${modelAdjustmentOpen ? " is-model-adjustment-open" : ""}`}
            >
              <ModelAdjustmentPanel
                controls={modelControls}
                onNumericChange={handleModelNumericChange}
                onToggleInteractionMode={
                  handleToggleModelInteractionMode
                }
                onReset={handleResetModelControls}
                onOpenChange={setModelAdjustmentOpen}
              />

              <div className="site-content-layer" aria-hidden={modelAdjustmentOpen}>
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
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </main>
  );
}
