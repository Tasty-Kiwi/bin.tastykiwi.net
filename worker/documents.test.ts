import { describe, expect, it, vi } from "vitest";
import { getDocumentContent, type DocumentStorage, HTTPError } from "./documents";

describe("getDocumentContent", () => {
  it("uses the shared documents KV key and preserves empty stored strings", async () => {
    const storage: DocumentStorage = { get: vi.fn().mockResolvedValue("") };

    await expect(getDocumentContent("abc123", storage)).resolves.toBe("");
    expect(storage.get).toHaveBeenCalledWith("documents:abc123");
  });

  it("reports missing content with the representation's error format", async () => {
    const storage: DocumentStorage = { get: vi.fn().mockResolvedValue(null) };

    await expect(getDocumentContent("missing", storage, "html")).rejects.toEqual(
      new HTTPError(404, 'Document "missing" not found.', "html"),
    );
  });
});
