"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type RefObject,
} from "react";
import { motion } from "framer-motion";
import styles from "./VariableProximity.module.css";
import {
  interpolateFontVariationSettings,
  type ProximityFalloff,
} from "./variableProximitySettings";

type VariableProximityProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> & {
  label: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  containerRef?: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: ProximityFalloff;
};

const DEFAULT_FROM_FONT_VARIATION_SETTINGS =
  "'wght' 650";
const DEFAULT_TO_FONT_VARIATION_SETTINGS =
  "'wght' 900";

function useAnimationFrame(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let frameId = 0;

    function loop() {
      callbackRef.current();
      frameId = requestAnimationFrame(loop);
    }

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, []);
}

function useMousePositionRef(
  containerRef?: RefObject<HTMLElement | null>,
) {
  const positionRef = useRef({
    x: Number.POSITIVE_INFINITY,
    y: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    function updatePosition(x: number, y: number) {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        positionRef.current = {
          x: x - rect.left,
          y: y - rect.top,
        };
        return;
      }

      positionRef.current = { x, y };
    }

    function handleMouseMove(event: MouseEvent) {
      updatePosition(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;

      updatePosition(touch.clientX, touch.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);

  return positionRef;
}

function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

const VariableProximity = forwardRef<
  HTMLSpanElement,
  VariableProximityProps
>(function VariableProximity(
  {
    label,
    fromFontVariationSettings = DEFAULT_FROM_FONT_VARIATION_SETTINGS,
    toFontVariationSettings = DEFAULT_TO_FONT_VARIATION_SETTINGS,
    containerRef,
    radius = 50,
    falloff = "linear",
    className = "",
    style,
    onClick,
    ...restProps
  },
  ref,
) {
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const interpolatedSettingsRef = useRef<string[]>([]);
  const mousePositionRef = useMousePositionRef(containerRef);
  const lastPositionRef = useRef<{ x: number | null; y: number | null }>(
    { x: null, y: null },
  );
  const words = useMemo(() => label.split(" "), [label]);
  const classNames = [styles.variableProximity, className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    lastPositionRef.current = { x: null, y: null };
  }, [
    fromFontVariationSettings,
    toFontVariationSettings,
    radius,
    falloff,
  ]);

  useAnimationFrame(() => {
    if (!containerRef?.current) return;

    const mousePosition = mousePositionRef.current;
    if (
      !Number.isFinite(mousePosition.x) ||
      !Number.isFinite(mousePosition.y)
    ) {
      return;
    }

    if (
      lastPositionRef.current.x === mousePosition.x &&
      lastPositionRef.current.y === mousePosition.y
    ) {
      return;
    }

    lastPositionRef.current = {
      x: mousePosition.x,
      y: mousePosition.y,
    };

    const containerRect =
      containerRef.current.getBoundingClientRect();

    letterRefs.current.forEach((letterRef, index) => {
      if (!letterRef) return;

      const rect = letterRef.getBoundingClientRect();
      const letterCenterX =
        rect.left + rect.width / 2 - containerRect.left;
      const letterCenterY =
        rect.top + rect.height / 2 - containerRect.top;
      const distance = calculateDistance(
        mousePosition.x,
        mousePosition.y,
        letterCenterX,
        letterCenterY,
      );
      const newSettings = interpolateFontVariationSettings({
        fromFontVariationSettings,
        toFontVariationSettings,
        distance,
        radius,
        falloff,
      });

      interpolatedSettingsRef.current[index] = newSettings;
      letterRef.style.fontVariationSettings = newSettings;
    });
  });

  let letterIndex = 0;

  return (
    <span
      ref={ref}
      className={classNames}
      onClick={onClick}
      style={style}
      {...restProps}
    >
      {words.map((word, wordIndex) => (
        <span className={styles.word} key={wordIndex}>
          {word.split("").map((letter) => {
            const currentLetterIndex = letterIndex++;

            return (
              <motion.span
                aria-hidden="true"
                className={styles.letter}
                key={currentLetterIndex}
                ref={(element) => {
                  letterRefs.current[currentLetterIndex] = element;
                }}
                style={{
                  fontVariationSettings:
                    interpolatedSettingsRef.current[
                      currentLetterIndex
                    ] ?? fromFontVariationSettings,
                }}
              >
                {letter}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 && (
            <span aria-hidden="true" className={styles.space}>
              &nbsp;
            </span>
          )}
        </span>
      ))}
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
});

VariableProximity.displayName = "VariableProximity";

export default VariableProximity;
