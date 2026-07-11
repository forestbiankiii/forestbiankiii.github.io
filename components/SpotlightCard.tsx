"use client";

import { type CSSProperties, type ReactNode } from "react";
import { LIQUID_GLASS_STUDIO_CONFIG } from "./liquidGlassStudioConfig";
import "./SpotlightCard.css";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  borderRadius?: number;
}

type CardGlassStyle = CSSProperties & {
  "--card-glass-blur": string;
  "--card-glass-radius": string;
};

const SpotlightCard = ({
  children,
  className = "",
  borderRadius = 28,
}: SpotlightCardProps) => {
  const { blurRadius, tint } = LIQUID_GLASS_STUDIO_CONFIG;
  const cardStyle: CardGlassStyle = {
    borderRadius: `${borderRadius}px`,
    "--card-glass-blur": `${blurRadius}px`,
    "--card-glass-radius": `${borderRadius}px`,
    background: `rgb(${tint.r} ${tint.g} ${tint.b} / ${tint.a})`,
  };

  return (
    <div
      className={`card-spotlight ${className}`.trim()}
      data-liquid-glass-source={LIQUID_GLASS_STUDIO_CONFIG.source}
      style={cardStyle}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
