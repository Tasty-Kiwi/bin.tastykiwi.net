import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escaping";

describe("escapeHtml", () => {
  it("escapes markup delimiters and quotes", () => {
    expect(escapeHtml('&<>"\'')).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("keeps hostile paste content inside text markup", () => {
    const source = '</code></pre><script>alert("owned")</script>';
    const escaped = escapeHtml(source);

    expect(escaped).toBe("&lt;/code&gt;&lt;/pre&gt;&lt;script&gt;alert(&quot;owned&quot;)&lt;/script&gt;");
    expect(escaped).not.toContain("<script");
  });
});
