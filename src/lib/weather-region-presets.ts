export type WeatherRegionPreset = {
  value: string;
  label: string;
};

export const WEATHER_REGION_PRESETS = [
  {
    value: "Germany",
    label: "Germany",
  },
  {
    value: "France",
    label: "France",
  },
  {
    value: "Italy",
    label: "Italy",
  },
  {
    value: "Netherlands",
    label: "Netherlands",
  },
  {
    value: "United Kingdom",
    label: "United Kingdom",
  },
] as const satisfies readonly WeatherRegionPreset[];
