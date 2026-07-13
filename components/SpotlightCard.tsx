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
  const cardStyle: CardGlassStyle = {
    "--card-glass-blur": `${LIQUID_GLASS_STUDIO_CONFIG.blurRadius}px`,
    "--card-glass-radius": `${borderRadius}px`,
  };

  return (
    <div
      className={`card-spotlight ${className}`.trim()}
      data-liquid-glass-surface="css"
      style={cardStyle}
    >
      <div className="card-spotlight__content">{children}</div>
    </div>
  );
};

export default SpotlightCard;
