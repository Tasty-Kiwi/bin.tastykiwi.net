import { describe, expect, it } from "vitest";
import {
  alternateLinkHeader,
  alternateRepresentations,
  buildCanonicalFallback,
  canonicalPastePath,
} from "./canonical";

describe("canonical paste representations", () => {
  it("builds canonical and alternate paths", () => {
    const route = { id: "abc123", extension: "md" };

    expect(canonicalPastePath(route)).toBe("/abc123.md");
    expect(alternateRepresentations(route)).toEqual([
      { href: "/raw/abc123", type: "text/plain" },
    ]);
    expect(alternateLinkHeader(route)).toBe(
      '</raw/abc123>; rel="alternate"; type="text/plain"',
    );
  });

  it("advertises rendered HTML only for HTML canonical pages", () => {
    const route = { id: "abc123", extension: "html" };

    expect(alternateRepresentations(route)).toEqual([
      { href: "/raw/abc123", type: "text/plain" },
      { href: "/html/abc123", type: "text/html" },
    ]);
    expect(alternateLinkHeader(route)).toContain(
      '</html/abc123>; rel="alternate"; type="text/html"',
    );
  });

  it("renders source as escaped semantic HTML", () => {
    const output = buildCanonicalFallback(
      { id: "abc123", extension: "html" },
      '</pre><script>alert("owned")</script>',
    );

    expect(output).toContain('<main class="server-paste"');
    expect(output).toContain("<pre><code>&lt;/pre&gt;&lt;script&gt;alert(&quot;owned&quot;)&lt;/script&gt;</code></pre>");
    expect(output).toContain('href="/raw/abc123"');
    expect(output).toContain('href="/html/abc123"');
    expect(output).not.toContain("<script>alert");
  });
});
