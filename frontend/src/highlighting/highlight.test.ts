import { describe, expect, it } from "vitest";
import { splitHighlightedLines } from "./highlight";

describe("splitHighlightedLines", () => {
  it("splits plain highlighted text without changing the source line count", () => {
    expect(splitHighlightedLines("first\nsecond\n")).toEqual(["first", "second", ""]);
  });

  it("reopens syntax spans across wrapped source lines", () => {
    expect(splitHighlightedLines('<span class="hljs-comment">first\nsecond</span>\nthird')).toEqual([
      '<span class="hljs-comment">first',
      '<span class="hljs-comment">second</span>',
      "third",
    ]);
  });
});
