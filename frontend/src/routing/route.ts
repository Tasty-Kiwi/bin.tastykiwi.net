import type { PreviewTheme } from "../types/document";

export type Route =
  | { type: "new" }
  | {
      type: "document";
      key: string;
      extension?: string;
      view?: "preview" | "code";
      previewTheme?: PreviewTheme;
    }
  | { type: "raw"; key: string }
  | { type: "unsupported" };

export function parseRoute(location: string): Route {
  const [locationWithoutHash, hash] = location.split("#", 2);
  const path = (locationWithoutHash?.split("?", 1)[0] ?? "/");
  const previewHash = hash?.match(/^preview\+(bare|dark|light)$/);
  const previewTheme = previewHash?.[1] as PreviewTheme | undefined;
  const view = hash === "preview" || previewTheme
    ? "preview"
    : hash === "code"
      ? "code"
      : undefined;
  if (path === "/" || path === "") {
    return { type: "new" };
  }

  const rawMatch = path.match(/^\/raw\/([^/]+)$/);
  if (rawMatch?.[1]) {
    return { type: "raw", key: decodeURIComponent(rawMatch[1]) };
  }

  const documentMatch = path.match(/^\/([^/]+)$/);
  if (!documentMatch?.[1]) {
    return { type: "unsupported" };
  }

  const [key, extension] = documentMatch[1].split(".", 2);
  if (!key) {
    return { type: "unsupported" };
  }

  return {
    type: "document",
    key: decodeURIComponent(key),
    ...(extension ? { extension: extension.toLowerCase() } : {}),
    ...(view ? { view } : {}),
    ...(previewTheme ? { previewTheme } : {}),
  };
}

export function documentPath(key: string, extension?: string): string {
  const normalizedExtension = extension?.replace(/^\.+/, "").toLowerCase();
  return `/${encodeURIComponent(key)}${normalizedExtension ? `.${normalizedExtension}` : ""}`;
}
