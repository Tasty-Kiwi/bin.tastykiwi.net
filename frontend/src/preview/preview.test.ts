import { describe, expect, it } from "vitest";
import { buildHtmlPreviewDocument, HTML_PREVIEW_SANDBOX } from "./html";
import { renderMarkdown } from "./markdown";

describe("Markdown preview security", () => {
  it("does not render raw HTML or executable links", () => {
    const output = renderMarkdown("<script>alert(1)</script>\n\n[run](javascript:alert(1))");
    expect(output).not.toContain("<script");
    expect(output).not.toContain('<a href="javascript:');
  });

  it("adds safe external-link attributes", () => {
    const output = renderMarkdown("[docs](https://example.test)");
    expect(output).toContain('target="_blank"');
    expect(output).toContain('rel="noopener noreferrer"');
  });
});

describe("HTML preview isolation", () => {
  it("uses a sandboxed iframe policy and restrictive CSP", () => {
    const output = buildHtmlPreviewDocument("<script>parent.document.body.innerHTML = ''</script>");
    expect(HTML_PREVIEW_SANDBOX).toBe("");
    expect(output).toContain("default-src 'none'");
    expect(output).toContain("form-action 'none'");
  });
});
