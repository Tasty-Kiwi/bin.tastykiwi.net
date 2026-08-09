import { buildHtmlPreviewDocument, HTML_PREVIEW_SANDBOX } from "../preview/html";
import type { PreviewFormat, PreviewTheme } from "../types/document";
import { renderMarkdown } from "../preview/markdown";

interface PreviewProps {
  content: string;
  format: PreviewFormat;
  htmlPreviewTheme: PreviewTheme;
}

export function Preview({ content, format, htmlPreviewTheme }: PreviewProps) {
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
        srcDoc={buildHtmlPreviewDocument(content, htmlPreviewTheme)}
      />
    );
  }

  return null;
}
