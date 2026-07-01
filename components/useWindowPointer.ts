"use client";

import {
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";
import type { PointerPosition } from "./particlePhysics";

interface UseWindowPointerOptions {
  enabled?: boolean;
  onChange?: () => void;
}

interface WindowPointerState {
  pointerRef: MutableRefObject<PointerPosition>;
  pointerInsideRef: MutableRefObject<boolean>;
}

export function useWindowPointer({
  enabled = true,
  onChange,
}: UseWindowPointerOptions = {}): WindowPointerState {
  const pointerRef = useRef<PointerPosition>({
    x: -1000,
    y: -1000,
  });
  const pointerInsideRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;

    function handleMouseMove(event: MouseEvent) {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      pointerInsideRef.current = true;
      onChangeRef.current?.();
    }

    function handleMouseLeave() {
      pointerRef.current.x = -1000;
      pointerRef.current.y = -1000;
      pointerInsideRef.current = false;
      onChangeRef.current?.();
    }

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled]);

  return { pointerRef, pointerInsideRef };
}
