const INITIAL_BLACK_CLIP = "polygon(0% 0%, 0% 100%, 100% 100%)";
const INITIAL_GREEN_CLIP = "polygon(0% 0%, 100% 0%, 100% 100%)";

function clampProgress(progress: number) {
  return Math.max(-1, Math.min(1, progress));
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 1000}%`;
}

export function getIntroClipPaths(progress: number) {
  const clamped = clampProgress(progress);

  if (clamped === 0) {
    return {
      black: INITIAL_BLACK_CLIP,
      green: INITIAL_GREEN_CLIP,
    };
  }

  if (clamped > 0) {
    const topX = percent(clamped * 100);
    const rightY = percent((1 - clamped) * 100);
    return {
      black: `polygon(0% 0%, ${topX} 0%, 100% ${rightY}, 100% 100%, 0% 100%)`,
      green: `polygon(${topX} 0%, 100% 0%, 100% ${rightY})`,
    };
  }

  const leftY = percent(-clamped * 100);
  const bottomX = percent((1 + clamped) * 100);
  return {
    black: `polygon(0% ${leftY}, ${bottomX} 100%, 0% 100%)`,
    green: `polygon(0% 0%, 100% 0%, 100% 100%, ${bottomX} 100%, 0% ${leftY})`,
  };
}

export function shouldContinueIntroAnimation(
  currentProgress: number,
  targetProgress: number,
) {
  return Math.abs(targetProgress - currentProgress) > 0.0001;
}
