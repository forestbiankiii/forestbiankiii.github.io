"use client";

import { useEffect, useRef, useState } from "react";
import StudioLiquidGlass from "./StudioLiquidGlass";
import {
  DEFAULT_MODEL_PANEL_OPEN,
  getModelPanelPresentation,
  getModelPanelTriggerScale,
  MODEL_CONTROL_RANGES,
  MODEL_PANEL_CORNER_RADIUS,
  MODEL_PANEL_TRIGGER_SIZE,
  type ModelControlState,
  type ModelNumericControl,
} from "./modelControls";

interface ModelAdjustmentPanelProps {
  controls: ModelControlState;
  onNumericChange: (
    control: ModelNumericControl,
    value: number,
  ) => void;
  onToggleInteractionMode: () => void;
  onReset: () => void;
  onOpenChange?: (open: boolean) => void;
}

const controlDefinitions: Array<{
  key: ModelNumericControl;
  label: string;
}> = [
  { key: "modelScale", label: "模型大小" },
  { key: "modelXOffset", label: "水平位置" },
  { key: "modelYOffset", label: "垂直位置" },
];

export default function ModelAdjustmentPanel({
  controls,
  onNumericChange,
  onToggleInteractionMode,
  onReset,
  onOpenChange,
}: ModelAdjustmentPanelProps) {
  const [open, setOpen] = useState(DEFAULT_MODEL_PANEL_OPEN);
  const [pressed, setPressed] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const pressedRef = useRef(false);
  const morphProgressRef = useRef(0);
  const isRotateMode = controls.interactionMode === "rotate";
  const panelPresentation = getModelPanelPresentation(open);

  const syncTriggerScale = (nextPressed = pressedRef.current) => {
    const scale = getModelPanelTriggerScale({
      pressed: nextPressed,
    });
    shellRef.current?.style.setProperty(
      "--model-trigger-scale",
      String(scale),
    );
  };

  useEffect(() => {
    pressedRef.current = pressed;
    syncTriggerScale(pressed);
  }, [pressed]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell) return;
      if (shell.contains(event.target as Node)) return;
      setPressed(false);
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const releasePress = (shouldOpen: boolean) => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    setPressed(false);
    syncTriggerScale(false);
    if (shouldOpen && !open) {
      setOpen(true);
    }
  };

  const triggerSize = `calc(${MODEL_PANEL_TRIGGER_SIZE}px * var(--model-trigger-scale, 1))`;

  return (
    <div
      ref={shellRef}
      data-model-controls
      className={`model-adjustment-shell${open ? " is-open" : ""}${pressed ? " is-pressed" : ""}`}
    >
      <StudioLiquidGlass
        width="min(20rem, calc(100vw - 2rem))"
        height="auto"
        borderRadius={MODEL_PANEL_CORNER_RADIUS}
        className={panelPresentation.className}
        expanded={open}
        morphFromCircle
        circleSize={MODEL_PANEL_TRIGGER_SIZE}
        onMorphProgress={(progress) => {
          morphProgressRef.current = progress;
          syncTriggerScale();
        }}
      >
        <section
          id="model-adjustment-dialog"
          role="dialog"
          aria-labelledby="model-adjustment-title"
          aria-hidden={panelPresentation.ariaHidden}
          className="model-adjustment-panel"
        >
          <div className="model-adjustment-panel__header">
            <div>
              <p className="model-adjustment-panel__eyebrow">3D MODEL</p>
              <h2 id="model-adjustment-title">调整模型</h2>
            </div>
            <button
              type="button"
              className="model-adjustment-panel__close"
              aria-label="关闭模型调整"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="model-adjustment-panel__body">
            {controlDefinitions.map(({ key, label }) => {
              const range = MODEL_CONTROL_RANGES[key];
              const value = controls[key];

              return (
                <label className="model-adjustment-panel__control" key={key}>
                  <span>
                    {label}
                    <output>{value.toFixed(2)}</output>
                  </span>
                  <input
                    aria-label={label}
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value}
                    onInput={(event) =>
                      onNumericChange(
                        key,
                        Number(event.currentTarget.value),
                      )
                    }
                  />
                </label>
              );
            })}

            <div className="model-adjustment-panel__actions">
              <button
                type="button"
                className={`model-adjustment-panel__mode${isRotateMode ? " is-active" : ""}`}
                aria-pressed={isRotateMode}
                onClick={onToggleInteractionMode}
              >
                {isRotateMode ? "返回浏览" : "旋转模型"}
              </button>
              <button
                type="button"
                className="model-adjustment-panel__reset"
                onClick={onReset}
              >
                重置
              </button>
            </div>

            <p className="model-adjustment-panel__hint">
              {isRotateMode
                ? "拖动页面空白区域旋转模型"
                : "浏览模式下页面可正常点击和滚动"}
            </p>
          </div>
        </section>
      </StudioLiquidGlass>

      <StudioLiquidGlass
        width={triggerSize}
        height={triggerSize}
        borderRadius={999}
        capturePad={48}
        className="model-adjustment-trigger-glass"
      >
        <button
          type="button"
          className="model-adjustment-trigger"
          aria-label={open ? "收起模型调整" : "打开模型调整"}
          aria-expanded={open}
          aria-controls="model-adjustment-dialog"
          aria-haspopup="dialog"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            if (open) {
              setOpen(false);
              return;
            }
            pressedRef.current = true;
            setPressed(true);
            syncTriggerScale(true);
          }}
          onPointerUp={() => releasePress(true)}
          onPointerCancel={() => releasePress(false)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            if (open) {
              setOpen(false);
              return;
            }
            pressedRef.current = true;
            setPressed(true);
            syncTriggerScale(true);
          }}
          onKeyUp={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            releasePress(true);
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="model-adjustment-trigger__icon"
          >
            <path d="M12 2.75 20 7.1v9.8l-8 4.35-8-4.35V7.1l8-4.35Z" />
            <path d="m4.35 7.3 7.65 4.2 7.65-4.2M12 11.5v9.25" />
          </svg>
        </button>
      </StudioLiquidGlass>
    </div>
  );
}
