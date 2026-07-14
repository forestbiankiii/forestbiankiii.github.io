export const SITE_THEMES = ["black", "white"] as const;

export type SiteTheme = (typeof SITE_THEMES)[number];
