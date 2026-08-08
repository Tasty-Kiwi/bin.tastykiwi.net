export interface CanonicalPasteRoute {
  id: string;
  extension?: string;
}

const CANONICAL_PASTE_PATH = /^\/([A-Za-z0-9]+)(?:\.([A-Za-z0-9]+))?$/;
const DOCUMENT_ID = /^[A-Za-z0-9]+$/;

export function parseCanonicalPasteRoute(pathname: string): CanonicalPasteRoute | null {
  const match = pathname.match(CANONICAL_PASTE_PATH);
  if (!match?.[1]) {
    return null;
  }

  return {
    id: match[1],
    ...(match[2] ? { extension: match[2].toLowerCase() } : {}),
  };
}

export function parseDocumentResourceRoute(
  pathname: string,
  resource: "documents" | "raw" | "html",
): string | null {
  const prefix = `/${resource}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const encodedId = pathname.slice(prefix.length);
  if (!encodedId || encodedId.includes("/")) {
    return null;
  }

  let id: string;
  try {
    id = decodeURIComponent(encodedId);
  } catch {
    return null;
  }

  return DOCUMENT_ID.test(id) ? id : null;
}
