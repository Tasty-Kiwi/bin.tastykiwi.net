import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument, getDocument } from "./documents";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("document API", () => {
  it("loads a document through the compatible endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ key: "abc", data: "hello" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getDocument("abc")).resolves.toEqual({ key: "abc", data: "hello" });
    expect(fetchMock).toHaveBeenCalledWith("/documents/abc", {
      headers: { Accept: "application/json" },
    });
  });

  it("preserves backend errors as typed errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Document expired." }), { status: 404 }),
      ),
    );

    await expect(getDocument("abc")).rejects.toMatchObject({
      message: "Document expired.",
      status: 404,
    });
  });

  it("creates a plain-text document", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ key: "abc", url: "https://example.test/abc" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDocument("hello")).resolves.toEqual({
      key: "abc",
      url: "https://example.test/abc",
    });
    expect(fetchMock).toHaveBeenCalledWith("/documents", {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "hello",
    });
  });
});
