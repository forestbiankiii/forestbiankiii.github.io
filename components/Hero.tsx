"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import StudioLiquidGlass from "@/components/StudioLiquidGlass";
import { getLiquidGlassCardTilt } from "@/components/liquidGlassCardParams";

export default function Hero() {
  const tiltRef = useRef<HTMLDivElement>(null);
  const baseRectRef = useRef<DOMRect | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  function applyCardTilt(clientX: number, clientY: number) {
    const target = tiltRef.current;
    if (!target || prefersReducedMotion) return;

    const rect = baseRectRef.current ?? target.getBoundingClientRect();
    const tilt = getLiquidGlassCardTilt(rect, clientX, clientY);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      target.style.setProperty(
        "--hero-card-rotate-x",
        `${tilt.rotateX}deg`,
      );
      target.style.setProperty(
        "--hero-card-rotate-y",
        `${tilt.rotateY}deg`,
      );
      animationFrameRef.current = null;
    });
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    baseRectRef.current = event.currentTarget.getBoundingClientRect();
    if (tiltRef.current) {
      tiltRef.current.dataset.tilted = "true";
    }
    applyCardTilt(event.clientX, event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!baseRectRef.current) {
      baseRectRef.current = event.currentTarget.getBoundingClientRect();
      if (tiltRef.current) {
        tiltRef.current.dataset.tilted = "true";
      }
    }
    applyCardTilt(event.clientX, event.clientY);
  }

  function resetCardTilt() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    baseRectRef.current = null;

    const target = tiltRef.current;
    if (!target) return;
    target.dataset.tilted = "false";
    target.style.setProperty("--hero-card-rotate-x", "0deg");
    target.style.setProperty("--hero-card-rotate-y", "0deg");
  }

  return (
    <section
      id="home"
      data-model-scene="home"
      className="scene-section scene-section--model-right"
    >
      <div className="scene-section__layout">
        <div className="scene-section__content">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="scene-card scene-card--hero-liquid"
          >
            <div
              className="hero-liquid-card-hit-area"
              onPointerEnter={handlePointerEnter}
              onPointerMove={handlePointerMove}
              onPointerLeave={resetCardTilt}
              onPointerCancel={resetCardTilt}
            >
              <div
                ref={tiltRef}
                className="hero-liquid-card-tilt"
                data-tilted="false"
              >
                <StudioLiquidGlass
                  width="100%"
                  height="100%"
                  borderRadius={20}
                  blurRadius={1}
                  capturePad={72}
                  className="hero-liquid-card"
                >
                  <h1 className="hero-liquid-card__name">BIANKIII</h1>
                </StudioLiquidGlass>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
