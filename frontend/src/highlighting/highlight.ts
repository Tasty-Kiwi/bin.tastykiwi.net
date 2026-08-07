import hljs from "highlight.js/lib/common";
import { extensionToHighlightLanguage, normalizeExtension } from "../routing/extensions";

export interface HighlightedCode {
  html: string;
  language?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export function splitHighlightedLines(html: string): string[] {
  const lines: string[] = [];
  const openTags: string[] = [];
  let current = "";
  let cursor = 0;
  const tagPattern = /<[^>]+>/g;

  const appendText = (text: string) => {
    let start = 0;
    let newlineIndex = text.indexOf("\n", start);
    while (newlineIndex !== -1) {
      current += text.slice(start, newlineIndex);
      lines.push(current);
      current = openTags.join("");
      start = newlineIndex + 1;
      newlineIndex = text.indexOf("\n", start);
    }
    current += text.slice(start);
  };

  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const index = match.index ?? cursor;
    appendText(html.slice(cursor, index));
    current += tag;

    if (tag.startsWith("</")) {
      openTags.pop();
    } else if (!tag.startsWith("<!") && !tag.startsWith("<?") && !tag.endsWith("/>")) {
      openTags.push(tag);
    }
    cursor = index + tag.length;
  }

  appendText(html.slice(cursor));
  lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export function highlightSource(content: string, extension?: string): HighlightedCode {
  const normalized = normalizeExtension(extension);
  if (normalized === "txt") {
    return { html: escapeHtml(content) };
  }

  const language = extensionToHighlightLanguage(normalized);
  if (language && hljs.getLanguage(language)) {
    const highlighted = hljs.highlight(content, { language });
    return { html: highlighted.value, language: highlighted.language };
  }

  const highlighted = hljs.highlightAuto(content);
  return { html: highlighted.value, language: highlighted.language };
}
