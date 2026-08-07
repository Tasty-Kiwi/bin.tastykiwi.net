import { useMemo } from "preact/hooks";
import { splitHighlightedLines, type HighlightedCode } from "../highlighting/highlight";

interface CodeViewProps {
  content: string;
  highlighted: HighlightedCode;
}

export function CodeView({ content, highlighted }: CodeViewProps) {
  const lineCount = useMemo(() => Math.max(1, content.split("\n").length), [content]);
  const lines = useMemo(() => {
    const highlightedLines = splitHighlightedLines(highlighted.html);
    return highlightedLines.length >= lineCount
      ? highlightedLines
      : [...highlightedLines, ...Array.from({ length: lineCount - highlightedLines.length }, () => "")];
  }, [highlighted.html, lineCount]);

  return (
    <section className="code-surface" aria-label="Paste source" tabIndex={0}>
      <div className="code-lines">
        {lines.map((html, index) => (
          <div className="code-line" key={index}>
            <span className="line-number" aria-hidden="true">{index + 1}</span>
            <code className="code-line-content" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ))}
      </div>
    </section>
  );
}
