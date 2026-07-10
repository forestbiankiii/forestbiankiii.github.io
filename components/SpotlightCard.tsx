"use client";

import { type CSSProperties, type ReactNode } from "react";
import { liquidGlassCardControls } from "./liquidGlassCardParams";
import "./SpotlightCard.css";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

type LiquidGlassCardStyle = CSSProperties & {
  "--liquid-glass-blur": string;
  "--liquid-glass-tint": string;
  "--liquid-glass-radius": string;
};

const SpotlightCard = ({
  children,
  className = "",
}: SpotlightCardProps) => {
  const { blurRadius, shapeRadius, tint } = liquidGlassCardControls;
  const cardStyle: LiquidGlassCardStyle = {
    borderRadius: `${shapeRadius}px`,
    "--liquid-glass-blur": `${blurRadius}px`,
    "--liquid-glass-tint": `rgb(${tint.r} ${tint.g} ${tint.b} / ${tint.a})`,
    "--liquid-glass-radius": `${shapeRadius}px`,
  };

  return (
    <div
      className={`card-spotlight ${className}`}
      data-liquid-glass-source="iyinchao/liquid-glass-studio"
      style={cardStyle}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
