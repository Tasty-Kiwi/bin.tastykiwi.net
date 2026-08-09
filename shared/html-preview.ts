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

const HTML_TAG_PATTERN = /<html\b[^>]*>/i;
const HEAD_TAG_PATTERN = /<head\b[^>]*>/i;

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
  const previewHead = `<meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${HTML_PREVIEW_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1">${themeStyle}`;

  if (HTML_TAG_PATTERN.test(source)) {
    if (HEAD_TAG_PATTERN.test(source)) {
      return source.replace(HEAD_TAG_PATTERN, (head) => `${head}\n    ${previewHead}`);
    }

    return source.replace(
      HTML_TAG_PATTERN,
      (html) => `${html}\n  <head>\n    ${previewHead}\n  </head>`,
    );
  }

  return `<!doctype html>
<html lang="en">
  <head>
    ${previewHead}
  </head>
  <body>${source}</body>
</html>`;
}
