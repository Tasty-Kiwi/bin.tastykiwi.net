import { SOLARIZED_CSS } from "./solarized";

export const HTML_PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export const STANDALONE_HTML_CSP = `sandbox; ${HTML_PREVIEW_CSP}`;

const THEME_META_NAME = "kiwibin-theme";
const THEME_DISABLED_VALUE = "none";
const META_TAG_PATTERN = /<meta\b[^>]*>/gi;

export type HtmlPreviewTheme = "auto" | "solarized" | "none";

function readAttribute(tag: string, name: string): string | null {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`,
    "i",
  );
  const match = pattern.exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

export function usesSolarizedTheme(source: string): boolean {
  for (const tag of source.match(META_TAG_PATTERN) ?? []) {
    if (readAttribute(tag, "name")?.trim().toLowerCase() !== THEME_META_NAME) {
      continue;
    }

    if (readAttribute(tag, "content")?.trim().toLowerCase() === THEME_DISABLED_VALUE) {
      return false;
    }
  }

  return true;
}

export function buildHtmlPreviewDocument(
  source: string,
  theme: HtmlPreviewTheme = "auto",
): string {
  const themeEnabled = theme === "solarized"
    || (theme === "auto" && usesSolarizedTheme(source));
  const themeStyle = themeEnabled
    ? `\n    <style>${SOLARIZED_CSS}</style>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${HTML_PREVIEW_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1">${themeStyle}
  </head>
  <body>${source}</body>
</html>`;
}
