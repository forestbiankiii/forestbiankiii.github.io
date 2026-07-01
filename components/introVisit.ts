export const INTRO_SEEN_STORAGE_KEY = "biankiii-intro-seen";

export function hasSeenIntro() {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function isPageReload() {
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return false;
  }

  const navigationEntry = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  if (!navigationEntry || navigationEntry.type !== "reload") return false;

  try {
    return (
      new URL(navigationEntry.name).pathname === window.location.pathname
    );
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(INTRO_SEEN_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures in private or restricted browsing contexts.
  }
}
