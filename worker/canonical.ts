import { escapeHtml } from "./escaping";
import type { CanonicalPasteRoute } from "./routes";

export interface AlternateRepresentation {
  href: string;
  type: "text/plain" | "text/html";
}

function encodedKey(route: CanonicalPasteRoute): string {
  return encodeURIComponent(route.id);
}

export function canonicalPastePath(route: CanonicalPasteRoute): string {
  return `/${encodedKey(route)}${route.extension ? `.${route.extension}` : ""}`;
}

export function alternateRepresentations(route: CanonicalPasteRoute): AlternateRepresentation[] {
  const key = encodedKey(route);
  const representations: AlternateRepresentation[] = [
    { href: `/raw/${key}`, type: "text/plain" },
  ];

  if (route.extension === "html" || route.extension === "htm") {
    representations.push({ href: `/html/${key}`, type: "text/html" });
  }

  return representations;
}

export function alternateLinkHeader(route: CanonicalPasteRoute): string {
  return alternateRepresentations(route)
    .map(({ href, type }) => `<${href}>; rel="alternate"; type="${type}"`)
    .join(", ");
}

export function buildCanonicalFallback(route: CanonicalPasteRoute, content: string): string {
  const key = escapeHtml(route.id);
  const extension = route.extension ? escapeHtml(route.extension) : undefined;
  const rawHref = escapeHtml(`/raw/${encodedKey(route)}`);
  const htmlHref = escapeHtml(`/html/${encodedKey(route)}`);
  const renderedLink = route.extension === "html" || route.extension === "htm"
    ? ` <a href="${htmlHref}">Open rendered page</a>`
    : "";

  return `<main class="server-paste" data-kiwibin-fallback data-key="${key}" data-kiwibin-key="${key}"${extension ? ` data-extension="${extension}" data-kiwibin-extension="${extension}"` : ""}>
  <header class="server-paste-header">
    <a class="server-paste-brand" href="/about.md">kiwibin</a>
    <nav aria-label="Paste representations"><a href="${rawHref}">Raw text</a>${renderedLink}</nav>
  </header>
  <article class="server-paste-content">
    <pre><code>${escapeHtml(content)}</code></pre>
  </article>
</main>`;
}
