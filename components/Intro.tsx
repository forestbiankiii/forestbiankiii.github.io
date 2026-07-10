"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Waves from "./Waves";
import VariableProximity from "./VariableProximity";
import {
  getIntroClipPaths,
  shouldContinueIntroAnimation,
} from "./introClipPaths";
import {
  WAVES_DARK_BACKGROUND_COLOR,
  WAVES_DARK_PROPS,
  WAVES_LIGHT_BACKGROUND_COLOR,
  WAVES_LIGHT_PROPS,
} from "./wavesBackground";
import type { SiteTheme } from "./siteTheme";
import { useWindowPointer } from "./useWindowPointer";

const BLACK_COLOR = "#000000";
const WHITE_COLOR = "#ffffff";
const DARK_BACKGROUND_COLOR = WAVES_DARK_BACKGROUND_COLOR;
const LIGHT_BACKGROUND_COLOR = WAVES_LIGHT_BACKGROUND_COLOR;
const INITIAL_CLIP_PATHS = getIntroClipPaths(0);

interface IntroProps {
  onEnter: (theme: SiteTheme) => void;
}

export default function Intro({ onEnter }: IntroProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const blackHalfRef = useRef<HTMLDivElement>(null);
  const whiteHalfRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const currentProgressRef = useRef(0);
  const enteringRef = useRef(false);
  const enterSideRef = useRef<SiteTheme | null>(null);
  const enteredRef = useRef(false);
  const scheduleUpdateRef = useRef<() => void>(() => {});
  const {
    pointerRef: mouseRef,
    pointerInsideRef: mouseInsideRef,
  } = useWindowPointer({
    onChange: () => scheduleUpdateRef.current(),
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const DEAD_ZONE = 80;
    const GROW_RANGE = 200;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let diagonalLength = Math.sqrt(
      viewportWidth * viewportWidth +
        viewportHeight * viewportHeight,
    );
    let animationFrame = 0;
    let lastBlackClip = INITIAL_CLIP_PATHS.black;
    let lastWhiteClip = INITIAL_CLIP_PATHS.green;

    function scheduleUpdate() {
      if (animationFrame) return;
      animationFrame = requestAnimationFrame(update);
    }

    function handleResize() {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      diagonalLength = Math.sqrt(
        viewportWidth * viewportWidth +
          viewportHeight * viewportHeight,
      );
      scheduleUpdate();
    }

    function update() {
      animationFrame = 0;
      const mouse = mouseRef.current;
      const signedDistance =
        (mouse.y * viewportWidth - mouse.x * viewportHeight) /
        diagonalLength;

      let targetProgress = 0;
      if (enteringRef.current) {
        targetProgress =
          enterSideRef.current === "black" ? 1 : -1;
      } else if (mouseInsideRef.current) {
        const absoluteDistance = Math.abs(signedDistance);
        if (absoluteDistance > DEAD_ZONE) {
          const distanceProgress = Math.min(
            (absoluteDistance - DEAD_ZONE) / GROW_RANGE,
            1,
          );
          targetProgress =
            distanceProgress * Math.sign(signedDistance);
        }
      }

      let nextProgress =
        currentProgressRef.current +
        (targetProgress - currentProgressRef.current) * 0.12;

      if (
        !shouldContinueIntroAnimation(
          nextProgress,
          targetProgress,
        )
      ) {
        nextProgress = targetProgress;
      }

      currentProgressRef.current = nextProgress;
      const { black, green: white } =
        getIntroClipPaths(nextProgress);

      if (blackHalfRef.current && black !== lastBlackClip) {
        blackHalfRef.current.style.clipPath = black;
        blackHalfRef.current.style.setProperty(
          "-webkit-clip-path",
          black,
        );
        lastBlackClip = black;
      }

      if (whiteHalfRef.current && white !== lastWhiteClip) {
        whiteHalfRef.current.style.clipPath = white;
        whiteHalfRef.current.style.setProperty(
          "-webkit-clip-path",
          white,
        );
        lastWhiteClip = white;
      }

      if (hintRef.current) {
        hintRef.current.style.opacity = String(
          enteringRef.current
            ? 0
            : Math.min(Math.abs(nextProgress) / 0.1, 1),
        );
        hintRef.current.style.color =
          nextProgress > 0 ? WHITE_COLOR : BLACK_COLOR;
      }

      if (
        shouldContinueIntroAnimation(
          nextProgress,
          targetProgress,
        )
      ) {
        scheduleUpdate();
      }
    }

    window.addEventListener("resize", handleResize);
    scheduleUpdateRef.current = scheduleUpdate;

    return () => {
      window.removeEventListener("resize", handleResize);
      scheduleUpdateRef.current = () => {};
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  function handleClick() {
    if (enteredRef.current) return;

    const progress = currentProgressRef.current;
    if (Math.abs(progress) <= 0.08) return;

    enteredRef.current = true;
    enterSideRef.current = progress > 0 ? "black" : "white";
    enteringRef.current = true;
    scheduleUpdateRef.current();

    setTimeout(
      () => onEnter(enterSideRef.current ?? "black"),
      450,
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
      ref={coverRef}
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div
        ref={blackHalfRef}
        className="absolute inset-0 intro-background-panel intro-background-panel--black"
        style={{
          backgroundColor: DARK_BACKGROUND_COLOR,
          clipPath: INITIAL_CLIP_PATHS.black,
          WebkitClipPath: INITIAL_CLIP_PATHS.black,
          willChange: "clip-path",
        }}
      >
        <Waves {...WAVES_DARK_PROPS} />
        <h1
          className="absolute z-10 top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black tracking-widest select-none pointer-events-none whitespace-nowrap"
          style={{
            fontSize: "clamp(60px, 15vw, 240px)",
            color: WHITE_COLOR,
          }}
        >
          <VariableProximity
            label="BIANKIII"
            fromFontVariationSettings="'wght' 650"
            toFontVariationSettings="'wght' 900"
            containerRef={coverRef}
            radius={220}
            falloff="gaussian"
          />
        </h1>
      </div>

      <div
        ref={whiteHalfRef}
        className="absolute inset-0 intro-background-panel intro-background-panel--white"
        style={{
          backgroundColor: LIGHT_BACKGROUND_COLOR,
          clipPath: INITIAL_CLIP_PATHS.green,
          WebkitClipPath: INITIAL_CLIP_PATHS.green,
          willChange: "clip-path",
        }}
      >
        <Waves {...WAVES_LIGHT_PROPS} />
        <h1
          className="absolute z-10 top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black tracking-widest select-none pointer-events-none whitespace-nowrap"
          style={{
            fontSize: "clamp(60px, 15vw, 240px)",
            color: BLACK_COLOR,
          }}
        >
          <VariableProximity
            label="BIANKIII"
            fromFontVariationSettings="'wght' 650"
            toFontVariationSettings="'wght' 900"
            containerRef={coverRef}
            radius={220}
            falloff="gaussian"
          />
        </h1>
      </div>

      <div
        ref={hintRef}
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-xs tracking-[0.4em] uppercase pointer-events-none z-10"
        style={{ opacity: 0, color: WHITE_COLOR }}
      >
        Click to enter
      </div>
    </motion.div>
  );
}
