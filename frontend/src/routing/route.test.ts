import { describe, expect, it } from "vitest";
import { documentPath, parseRoute } from "./route";

describe("parseRoute", () => {
  it("parses a new document route", () => {
    expect(parseRoute("/")).toEqual({ type: "new" });
  });

  it("parses a document without an extension", () => {
    expect(parseRoute("/abc123")).toEqual({ type: "document", key: "abc123" });
  });

  it("parses a document extension", () => {
    expect(parseRoute("/abc123.MD")).toEqual({
      type: "document",
      key: "abc123",
      extension: "md",
    });
  });

  it("parses the preview anchor without sending it to the server", () => {
    expect(parseRoute("/abc123.md#preview")).toEqual({
      type: "document",
      key: "abc123",
      extension: "md",
      view: "preview",
    });
  });

  it("parses bare, dark, and light preview anchors", () => {
    expect(parseRoute("/abc123.html#preview+bare")).toEqual({
      type: "document",
      key: "abc123",
      extension: "html",
      view: "preview",
      previewTheme: "bare",
    });
    expect(parseRoute("/abc123.html#preview+dark")).toEqual({
      type: "document",
      key: "abc123",
      extension: "html",
      view: "preview",
      previewTheme: "dark",
    });
    expect(parseRoute("/abc123.html#preview+light")).toEqual({
      type: "document",
      key: "abc123",
      extension: "html",
      view: "preview",
      previewTheme: "light",
    });
  });

  it("parses the code anchor", () => {
    expect(parseRoute("/abc123.md#code")).toEqual({
      type: "document",
      key: "abc123",
      extension: "md",
      view: "code",
    });
  });

  it("ignores unrelated anchors", () => {
    expect(parseRoute("/abc123.md#details")).toEqual({
      type: "document",
      key: "abc123",
      extension: "md",
    });
  });

  it("keeps raw routes outside the SPA document route", () => {
    expect(parseRoute("/raw/abc123")).toEqual({ type: "raw", key: "abc123" });
  });
});

describe("documentPath", () => {
  it("generates extensionless and extension-bearing paths", () => {
    expect(documentPath("abc123")).toBe("/abc123");
    expect(documentPath("abc123", ".md")).toBe("/abc123.md");
  });
});
