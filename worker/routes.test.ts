import { describe, expect, it } from "vitest";
import { parseCanonicalPasteRoute, parseDocumentResourceRoute } from "./routes";

describe("parseCanonicalPasteRoute", () => {
  it.each([
    ["/abc", { id: "abc" }],
    ["/abc.md", { id: "abc", extension: "md" }],
    ["/abc.html", { id: "abc", extension: "html" }],
    ["/abc.py", { id: "abc", extension: "py" }],
    ["/ABC123.MD", { id: "ABC123", extension: "md" }],
  ])("parses %s", (pathname, expected) => {
    expect(parseCanonicalPasteRoute(pathname)).toEqual(expected);
  });

  it.each([
    "/",
    "/raw/abc",
    "/html/abc",
    "/documents/abc",
    "/foo/bar",
    "/assets/foo.js",
    "/abc/",
    "/abc%ZZ.md",
  ])("rejects %s", (pathname) => {
    expect(parseCanonicalPasteRoute(pathname)).toBeNull();
  });
});

describe("parseDocumentResourceRoute", () => {
  it("parses one encoded document id", () => {
    expect(parseDocumentResourceRoute("/raw/ABC123", "raw")).toBe("ABC123");
    expect(parseDocumentResourceRoute("/documents/abc123", "documents")).toBe("abc123");
  });

  it("rejects nested, empty, and malformed resource paths", () => {
    expect(parseDocumentResourceRoute("/html/", "html")).toBeNull();
    expect(parseDocumentResourceRoute("/raw/abc/extra", "raw")).toBeNull();
    expect(parseDocumentResourceRoute("/raw/%ZZ", "raw")).toBeNull();
  });
});
