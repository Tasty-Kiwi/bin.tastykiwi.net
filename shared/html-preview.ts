export const HTML_PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export const STANDALONE_HTML_CSP = `sandbox; ${HTML_PREVIEW_CSP}`;

const HTML_PREVIEW_STYLE =
  "html,body{background:#fff;color:#111;font:16px/1.5 system-ui,sans-serif;margin:0;padding:1rem}img{max-width:100%}";

export function buildHtmlPreviewDocument(source: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${HTML_PREVIEW_CSP}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${HTML_PREVIEW_STYLE}</style>
  </head>
  <body>${source}</body>
</html>`;
}
