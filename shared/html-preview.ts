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

export type HtmlPreviewTheme = "dark" | "bare";

export function buildHtmlPreviewDocument(
  source: string,
  theme: HtmlPreviewTheme = "dark",
): string {
  const themeStyle = theme === "dark"
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
