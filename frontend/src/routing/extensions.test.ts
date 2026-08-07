import { describe, expect, it } from "vitest";
import {
  extensionToFormatChoice,
  extensionToHighlightLanguage,
  extensionToPreviewFormat,
  formatChoiceToExtension,
  languageToPreferredExtension,
} from "./extensions";

describe("extension mappings", () => {
  it("separates preview format from highlighting language", () => {
    expect(extensionToPreviewFormat("html")).toBe("html");
    expect(extensionToHighlightLanguage("html")).toBe("xml");
    expect(extensionToPreviewFormat("py")).toBeNull();
    expect(extensionToHighlightLanguage("py")).toBe("python");
  });

  it("maps Markdown aliases and text explicitly", () => {
    expect(extensionToPreviewFormat("markdown")).toBe("markdown");
    expect(extensionToFormatChoice("txt")).toBe("text");
    expect(formatChoiceToExtension("markdown")).toBe("md");
  });

  it("generates stable preferred extensions", () => {
    expect(languageToPreferredExtension("xml")).toBe("html");
    expect(languageToPreferredExtension("markdown")).toBe("md");
  });
});
