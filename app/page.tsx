"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import AcademicPreview from "@/components/AcademicPreview";
import Contact from "@/components/Contact";
import ViewportFrame from "@/components/ViewportFrame";
import ModelViewer from "@/components/ModelViewer";
import type { SiteTheme } from "@/components/siteTheme";
import { withBasePath } from "@/components/sitePath";
import {
  FERRARI_MODEL_PATH,
  getModelBackgroundColor,
  MODEL_BACKGROUND_VIEWER_PROPS,
} from "@/components/modelBackground";
import {
  DEFAULT_MODEL_POSES,
  getModelControlsFromPose,
  MODEL_TRANSITION_DURATION_MS,
  type ModelPose,
  type ModelPoseKey,
  type ModelPoseTransitionRequest,
  type ModelTransitionStatus,
} from "@/components/modelControls";
import {
  MODEL_SCENE_ORDER,
  areModelPosesEqual,
  getModelSceneAtViewportAnchor,
  getModelScenePoseKey,
  type ModelScene,
} from "@/components/modelScenePath";

type ThemeSweepDirection = "to-black" | "to-white";

const themeSweepDuration = 1800;
const entryLoaderFallbackMs = 8000;

interface PendingModelTarget {
  pose: ModelPose;
  poseKey: ModelPoseKey;
}

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
  const [theme, setTheme] = useState<SiteTheme>("black");
  const [siteReady, setSiteReady] = useState(false);
  const [modelPose, setModelPose] = useState<ModelPose>(() =>
    getModelControlsFromPose(DEFAULT_MODEL_POSES.start),
  );
  const [modelTransitionStatus, setModelTransitionStatus] =
    useState<ModelTransitionStatus>("idle");
  const [modelPoseTransition, setModelPoseTransition] =
    useState<ModelPoseTransitionRequest | null>(null);
  const modelTransitionIdRef = useRef(0);
  const currentModelPoseRef = useRef<ModelPose>({
    ...DEFAULT_MODEL_POSES.start,
  });
  const activeTransitionTargetRef = useRef<ModelPose | null>(null);
  const activeTransitionPoseKeyRef = useRef<ModelPoseKey>("start");
  const pendingModelTargetRef = useRef<PendingModelTarget | null>(null);
  const modelTransitionStatusRef =
    useRef<ModelTransitionStatus>("idle");
  const activeModelSceneRef = useRef<ModelScene>("home");

  const handleModelLoaded = useCallback(() => {
    setSiteReady(true);
  }, []);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setSiteReady(true);
    }, entryLoaderFallbackMs);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    return removeThemeSweepSnapshots;
  }, []);

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

  function beginModelTransition(
    from: ModelPose,
    to: ModelPose,
    targetPoseKey: ModelPoseKey,
  ) {
    const fromPose = { ...from };
    const targetPose = { ...to };

    if (areModelPosesEqual(fromPose, targetPose)) {
      currentModelPoseRef.current = targetPose;
      activeTransitionTargetRef.current = null;
      activeTransitionPoseKeyRef.current = targetPoseKey;
      modelTransitionStatusRef.current = "complete";
      setModelPose(getModelControlsFromPose(targetPose));
      setModelTransitionStatus("complete");
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    modelTransitionIdRef.current += 1;
    currentModelPoseRef.current = fromPose;
    activeTransitionTargetRef.current = targetPose;
    activeTransitionPoseKeyRef.current = targetPoseKey;
    modelTransitionStatusRef.current = "running";
    setModelPose(getModelControlsFromPose(fromPose));
    setModelTransitionStatus("running");
    setModelPoseTransition({
      id: modelTransitionIdRef.current,
      from: fromPose,
      to: targetPose,
      durationMs: reducedMotion ? 0 : MODEL_TRANSITION_DURATION_MS,
      reducedMotion,
    });
  }

  function handleModelTransitionComplete() {
    const completedTarget = {
      ...(activeTransitionTargetRef.current ?? currentModelPoseRef.current),
    };
    currentModelPoseRef.current = completedTarget;
    activeTransitionTargetRef.current = null;
    setModelPose(getModelControlsFromPose(completedTarget));

    const pendingTarget = pendingModelTargetRef.current;
    pendingModelTargetRef.current = null;
    if (
      pendingTarget &&
      !areModelPosesEqual(completedTarget, pendingTarget.pose)
    ) {
      beginModelTransition(
        completedTarget,
        pendingTarget.pose,
        pendingTarget.poseKey,
      );
      return;
    }

    modelTransitionStatusRef.current = "complete";
    setModelTransitionStatus("complete");
  }

  useEffect(() => {
    let animationFrame = 0;
    const updateActiveModelScene = () => {
      animationFrame = 0;
      const sections: Array<{
        scene: ModelScene;
        top: number;
        bottom: number;
      }> = [];

      MODEL_SCENE_ORDER.forEach((scene) => {
        const section = document.querySelector<HTMLElement>(
          `[data-model-scene="${scene}"]`,
        );
        if (!section) return;
        const bounds = section.getBoundingClientRect();
        sections.push({ scene, top: bounds.top, bottom: bounds.bottom });
      });

      const nextScene = getModelSceneAtViewportAnchor(
        sections,
        window.innerHeight * 0.42,
      );
      if (!nextScene) return;

      activeModelSceneRef.current = nextScene;
      const targetPoseKey = getModelScenePoseKey(nextScene);
      const targetPose = {
        ...DEFAULT_MODEL_POSES[targetPoseKey],
      };

      if (modelTransitionStatusRef.current === "running") {
        if (
          activeTransitionTargetRef.current &&
          areModelPosesEqual(activeTransitionTargetRef.current, targetPose)
        ) {
          pendingModelTargetRef.current = null;
        } else {
          pendingModelTargetRef.current = {
            pose: targetPose,
            poseKey: targetPoseKey,
          };
        }
        return;
      }

      if (areModelPosesEqual(currentModelPoseRef.current, targetPose)) {
        return;
      }

      beginModelTransition(
        currentModelPoseRef.current,
        targetPose,
        targetPoseKey,
      );
    };
    const requestSceneUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveModelScene);
    };

    updateActiveModelScene();
    window.addEventListener("scroll", requestSceneUpdate, { passive: true });
    window.addEventListener("resize", requestSceneUpdate);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("scroll", requestSceneUpdate);
      window.removeEventListener("resize", requestSceneUpdate);
    };
  }, []);

  return (
    <main
      data-site-theme={theme}
      className="relative min-h-screen overflow-hidden text-text"
    >
      <div
        className="site-entry-loader"
        data-ready={siteReady}
        role="status"
        aria-label="Loading Biankiii portfolio"
        aria-live="polite"
      >
        <img
          className="site-entry-loader__logo"
          src={withBasePath("/logo-animated.svg")}
          alt=""
          width={512}
          height={512}
        />
      </div>
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
          modelScale={modelPose.modelScale}
          modelRotationX={modelPose.modelRotationX}
          modelRotationY={modelPose.modelRotationY}
          modelRotationZ={modelPose.modelRotationZ}
          modelXOffset={modelPose.modelXOffset}
          modelYOffset={modelPose.modelYOffset}
          poseTransition={modelPoseTransition}
          onModelLoaded={handleModelLoaded}
          onPoseTransitionComplete={handleModelTransitionComplete}
          enableMouseParallax={modelTransitionStatus !== "running"}
          enableHoverRotation={modelTransitionStatus !== "running"}
          enableManualRotation={false}
          manualRotationTarget="window"
        />
      </div>
      <div className="relative z-10 min-h-screen">
        <div className="site-content-layer">
          <ViewportFrame />

          <Navbar onToggleTheme={handleToggleTheme} />

          <Hero />

          <Projects />

          <AcademicPreview />

          <Contact />

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
      </div>
    </main>
  );
}
