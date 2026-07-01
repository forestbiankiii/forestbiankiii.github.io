export type ProximityFalloff = "linear" | "exponential" | "gaussian";

interface FontVariationAxisSetting {
  axis: string;
  value: number;
}

interface InterpolateFontVariationSettingsOptions {
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  distance: number;
  radius: number;
  falloff?: ProximityFalloff;
}

export function calculateProximityFalloff(
  distance: number,
  radius: number,
  falloff: ProximityFalloff = "linear",
) {
  if (radius <= 0) return distance <= 0 ? 1 : 0;

  const normalized = Math.min(
    Math.max(1 - distance / radius, 0),
    1,
  );

  switch (falloff) {
    case "exponential":
      return normalized ** 2;
    case "gaussian":
      return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
    case "linear":
    default:
      return normalized;
  }
}

export function interpolateFontVariationSettings({
  fromFontVariationSettings,
  toFontVariationSettings,
  distance,
  radius,
  falloff = "linear",
}: InterpolateFontVariationSettingsOptions) {
  const fromSettings = parseFontVariationSettings(
    fromFontVariationSettings,
  );
  const toSettings = new Map(
    parseFontVariationSettings(toFontVariationSettings).map(
      ({ axis, value }) => [axis, value],
    ),
  );
  const falloffValue = calculateProximityFalloff(
    distance,
    radius,
    falloff,
  );

  return fromSettings
    .map(({ axis, value }) => {
      const targetValue = toSettings.get(axis) ?? value;
      const interpolatedValue =
        value + (targetValue - value) * falloffValue;

      return `'${axis}' ${roundVariationValue(interpolatedValue)}`;
    })
    .join(", ");
}

function parseFontVariationSettings(
  settings: string,
): FontVariationAxisSetting[] {
  return settings
    .split(",")
    .map((setting) => setting.trim())
    .filter(Boolean)
    .map((setting) => {
      const [axis, value] = setting.split(/\s+/);
      return {
        axis: axis.replace(/['"]/g, ""),
        value: Number.parseFloat(value),
      };
    })
    .filter(({ axis, value }) => axis && Number.isFinite(value));
}

function roundVariationValue(value: number) {
  return Number(value.toFixed(4));
}
