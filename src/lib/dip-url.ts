const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;
const LOCALHOST_PATTERN =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?(\/.*)?$/i;

export function normalizeDipBaseUrl(raw: string | null | undefined) {
  const trimmed = (raw ?? "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  if (SCHEME_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const scheme = LOCALHOST_PATTERN.test(trimmed) ? "http://" : "https://";

  return `${scheme}${trimmed}`;
}
