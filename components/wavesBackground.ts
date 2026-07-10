import type { SiteTheme } from "./siteTheme";

export const WAVES_LIGHT_BACKGROUND_COLOR = "#d6eadf";
export const WAVES_DARK_BACKGROUND_COLOR = "#000000";
export const WAVES_DARK_LINE_COLOR = "#0a2d2e";

const WAVES_LIGHT_LINE_COLOR = "#15291e";

const SHARED_WAVES_PROPS = {
  waveSpeedX: 0.0025,
  waveSpeedY: 0.0015,
  waveAmpX: 16,
  waveAmpY: 8,
  friction: 0.9,
  tension: 0.003,
  maxCursorMove: 45,
  lineWidth: 1.5,
  xGap: 28,
  yGap: 24,
};

export const WAVES_LIGHT_PROPS = {
  ...SHARED_WAVES_PROPS,
  lineColor: WAVES_LIGHT_LINE_COLOR,
  backgroundColor: WAVES_LIGHT_BACKGROUND_COLOR,
};

export const WAVES_DARK_PROPS = {
  ...SHARED_WAVES_PROPS,
  lineColor: WAVES_DARK_LINE_COLOR,
  backgroundColor: WAVES_DARK_BACKGROUND_COLOR,
};

export function getWavesPropsForTheme(theme: SiteTheme) {
  return theme === "black" ? WAVES_DARK_PROPS : WAVES_LIGHT_PROPS;
}
