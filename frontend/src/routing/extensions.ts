import type { FormatChoice, PreviewFormat } from "../types/document";

const HIGHLIGHT_LANGUAGES: Record<string, string> = {
  rb: "ruby",
  py: "python",
  pl: "perl",
  php: "php",
  scala: "scala",
  go: "go",
  xml: "xml",
  html: "xml",
  htm: "xml",
  css: "css",
  js: "javascript",
  vbs: "vbscript",
  lua: "lua",
  pas: "delphi",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  m: "objectivec",
  vala: "vala",
  sql: "sql",
  sm: "smalltalk",
  lisp: "lisp",
  ini: "ini",
  diff: "diff",
  bash: "bash",
  sh: "bash",
  tex: "tex",
  erl: "erlang",
  hs: "haskell",
  md: "markdown",
  markdown: "markdown",
  coffee: "coffee",
  swift: "swift",
};

export function normalizeExtension(extension?: string): string | undefined {
  const normalized = extension?.trim().replace(/^\.+/, "").toLowerCase();
  return normalized || undefined;
}

export function extensionToHighlightLanguage(extension?: string): string | undefined {
  const normalized = normalizeExtension(extension);
  if (!normalized || normalized === "txt") {
    return undefined;
  }
  return HIGHLIGHT_LANGUAGES[normalized] ?? normalized;
}

export function extensionToPreviewFormat(extension?: string): PreviewFormat {
  const normalized = normalizeExtension(extension);
  if (normalized === "md" || normalized === "markdown") {
    return "markdown";
  }
  if (normalized === "html" || normalized === "htm") {
    return "html";
  }
  return null;
}

export function languageToPreferredExtension(language?: string): string | undefined {
  const normalized = language?.toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === "xml") {
    return "html";
  }
  if (normalized === "markdown") {
    return "md";
  }
  const match = Object.entries(HIGHLIGHT_LANGUAGES).find(([, value]) => value === normalized);
  return match?.[0];
}

export function formatChoiceToExtension(choice: FormatChoice): string | undefined {
  switch (choice) {
    case "text":
      return "txt";
    case "markdown":
      return "md";
    case "html":
      return "html";
    case "auto":
      return undefined;
  }
}

export function extensionToFormatChoice(extension?: string): FormatChoice {
  switch (normalizeExtension(extension)) {
    case "txt":
      return "text";
    case "md":
    case "markdown":
      return "markdown";
    case "html":
    case "htm":
      return "html";
    default:
      return "auto";
  }
}
