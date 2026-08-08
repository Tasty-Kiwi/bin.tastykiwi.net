import { describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../index";

function testEnv(content: string | null): Env {
  return {
    STORAGE: {
      get: vi.fn().mockResolvedValue(content),
      put: vi.fn(),
    },
    ASSETS: {
      fetch: vi.fn().mockResolvedValue(new Response("asset", {
        headers: { "Content-Type": "application/javascript" },
      })),
    },
  } as unknown as Env;
}

describe("Worker representations", () => {
  it("keeps the JSON API response compatible", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/documents/abc123"),
      testEnv("hello"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ key: "abc123", data: "hello" });
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("serves raw source without interpretation", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/raw/abc123"),
      testEnv("<h1>source</h1>"),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("<h1>source</h1>");
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("serves standalone HTML with an isolated security policy", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/html/abc123"),
      testEnv("<h1>rendered</h1>"),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("<h1>rendered</h1>");
    expect(response.headers.get("Content-Security-Policy")).toContain("sandbox");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("returns representation-appropriate 404s", async () => {
    const env = testEnv(null);

    const [apiResponse, rawResponse, htmlResponse] = await Promise.all([
      worker.fetch(new Request("https://example.test/documents/missing"), env),
      worker.fetch(new Request("https://example.test/raw/missing"), env),
      worker.fetch(new Request("https://example.test/html/missing"), env),
    ]);

    expect(apiResponse.status).toBe(404);
    expect(apiResponse.headers.get("Content-Type")).toContain("application/json");
    expect(rawResponse.status).toBe(404);
    expect(rawResponse.headers.get("Content-Type")).toContain("text/plain");
    expect(htmlResponse.status).toBe(404);
    expect(htmlResponse.headers.get("Content-Type")).toContain("text/html");
  });

  it("does not turn unsupported paths into the application shell", async () => {
    const env = testEnv("hello");
    const response = await worker.fetch(new Request("https://example.test/foo/bar"), env);

    expect(response.status).toBe(404);
    expect((env.ASSETS.fetch as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
