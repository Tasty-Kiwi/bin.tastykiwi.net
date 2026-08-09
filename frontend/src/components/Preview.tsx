import { buildHtmlPreviewDocument, HTML_PREVIEW_SANDBOX } from "../preview/html";
import type { PreviewFormat } from "../types/document";
import { renderMarkdown } from "../preview/markdown";

interface PreviewProps {
  content: string;
  format: PreviewFormat;
  htmlThemeEnabled: boolean;
}

export function Preview({ content, format, htmlThemeEnabled }: PreviewProps) {
  if (format === "markdown") {
    return (
      <article
        className="markdown-preview"
        aria-label="Markdown preview"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    );
  }

  if (format === "html") {
    return (
      <iframe
        className="html-preview"
        title="HTML preview"
        sandbox={HTML_PREVIEW_SANDBOX}
        srcDoc={buildHtmlPreviewDocument(
          content,
          htmlThemeEnabled ? "solarized" : "none",
        )}
      />
    );
  }

  return null;
}
