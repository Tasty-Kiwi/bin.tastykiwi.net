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

  it("applies the Solarized element theme by default", () => {
    const output = buildHtmlPreviewDocument("<h1>Report</h1>");

    expect(output).toContain("background: #002b36");
    expect(output).toContain("<h1>Report</h1>");
  });

  it("allows the viewer to request dark, light, or bare rendering", () => {
    expect(buildHtmlPreviewDocument("<h1>Report</h1>", "dark")).toContain(
      "background: #002b36",
    );
    expect(buildHtmlPreviewDocument("<h1>Report</h1>", "bare")).not.toContain(
      "background: #002b36",
    );
    const light = buildHtmlPreviewDocument("<h1>Report</h1>", "light");
    expect(light).toContain("color-scheme: light");
    expect(light).toContain("background: #fdf6e3");
  });

  it("injects preview controls into complete HTML documents", () => {
    const output = buildHtmlPreviewDocument(`<!doctype html>
<html lang="en">
  <head><title>Plan</title></head>
  <body><main><h1>Visible report</h1></main></body>
</html>`, "light");
    const document = new DOMParser().parseFromString(output, "text/html");

    expect(document.title).toBe("Plan");
    expect(document.body.textContent).toContain("Visible report");
    expect(document.querySelectorAll("html")).toHaveLength(1);
    expect(document.querySelector("style")?.textContent).toContain(
      "background: #fdf6e3",
    );
    expect(output).toContain("default-src 'none'");
  });
});
