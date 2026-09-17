const isDevelopment = process.env.NODE_ENV === "development";

const defaultStudioOrigin = isDevelopment ? "/studio" : "https://studio.qdip.ai";
const defaultObservatoryOrigin = isDevelopment ? "" : "https://observatory.qdip.ai";

export const PLATFORM_URLS = {
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://qdip.ai",
  studio: process.env.NEXT_PUBLIC_STUDIO_URL ?? defaultStudioOrigin,
  observatory:
    process.env.NEXT_PUBLIC_OBSERVATORY_URL ?? defaultObservatoryOrigin,
} as const;

export function studioHref(path = "") {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${PLATFORM_URLS.studio}${suffix}`;
}

export function observatoryHref(path = "") {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${PLATFORM_URLS.observatory}${suffix}` || "/";
}
