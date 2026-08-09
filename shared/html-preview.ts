import {
  SOLARIZED_DARK_CSS,
  SOLARIZED_LIGHT_CSS,
} from "./solarized";

export const HTML_PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export const STANDALONE_HTML_CSP = `sandbox; ${HTML_PREVIEW_CSP}`;

export type HtmlPreviewTheme = "dark" | "light" | "bare";

export function buildHtmlPreviewDocument(
  source: string,
  theme: HtmlPreviewTheme = "dark",
): string {
  const stylesheet = theme === "dark"
    ? SOLARIZED_DARK_CSS
    : theme === "light"
      ? SOLARIZED_LIGHT_CSS
      : null;
  const themeStyle = stylesheet ? `\n    <style>${stylesheet}</style>` : "";

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
