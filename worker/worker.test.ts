import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../index";

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>kiwibin</title>
    <script type="module" src="/assets/index-test.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`;

interface TestElementHandlers {
  element?(element: TestElement): void | Promise<void>;
}

class TestElement {
  constructor(private readonly node: Element) {}

  setInnerContent(content: string, options?: { html?: boolean }): this {
    if (options?.html) {
      this.node.innerHTML = content;
    } else {
      this.node.textContent = content;
    }
    return this;
  }

  append(content: string, options?: { html?: boolean }): this {
    if (options?.html) {
      (this.node as HTMLElement).insertAdjacentHTML("beforeend", content);
    } else {
      this.node.append(this.node.ownerDocument.createTextNode(content));
    }
    return this;
  }
}

/**
 * Vitest runs in JSdom, while HTMLRewriter is provided by the Workers runtime.
 * This adapter models the two operations used by the Worker so the request path
 * can still be tested end to end without hiding the HTTP response contract.
 */
class TestHTMLRewriter {
  private readonly handlers: Array<{
    selector: string;
    handlers: TestElementHandlers;
  }> = [];

  on(selector: string, handlers: TestElementHandlers): this {
    this.handlers.push({ selector, handlers });
    return this;
  }

  transform(response: Response): Response {
    const body = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const document = new JSDOM(await response.text()).window.document;

          for (const { selector, handlers } of this.handlers) {
            for (const node of document.querySelectorAll(selector)) {
              await handlers.element?.(new TestElement(node));
            }
          }

          controller.enqueue(new TextEncoder().encode(document.documentElement.outerHTML));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  }
}

interface TestEnvironment {
  env: Env;
  storageGet: ReturnType<typeof vi.fn>;
  assetFetch: ReturnType<typeof vi.fn>;
}

function testEnv(content: string | null): TestEnvironment {
  const storageGet = vi.fn().mockResolvedValue(content);
  const assetFetch = vi.fn(async (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    return new Response("not found", { status: 404 });
  });

  return {
    env: {
      STORAGE: {
        get: storageGet,
        put: vi.fn(),
      },
      ASSETS: { fetch: assetFetch },
    } as unknown as Env,
    storageGet,
    assetFetch,
  };
}

beforeAll(() => {
  vi.stubGlobal("HTMLRewriter", TestHTMLRewriter);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("Worker representations", () => {
  it("keeps the JSON API response compatible", async () => {
    const fixture = testEnv("hello");
    const response = await worker.fetch(
      new Request("https://example.test/documents/abc123"),
      fixture.env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ key: "abc123", data: "hello" });
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("serves raw source without interpretation", async () => {
    const fixture = testEnv("<h1>source</h1>");
    const response = await worker.fetch(
      new Request("https://example.test/raw/abc123"),
      fixture.env,
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("<h1>source</h1>");
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("serves standalone HTML with an isolated security policy", async () => {
    const fixture = testEnv("<h1>rendered</h1>");
    const response = await worker.fetch(
      new Request("https://example.test/html/abc123"),
      fixture.env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("background: #002b36");
    expect(html).toContain("<body><h1>rendered</h1></body>");
    expect(response.headers.get("Content-Security-Policy")).toContain("sandbox");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("serves the shared Solarized element stylesheet", async () => {
    const fixture = testEnv("hello");
    const [darkResponse, lightResponse] = await Promise.all([
      worker.fetch(new Request("https://example.test/solarized.css"), fixture.env),
      worker.fetch(
        new Request("https://example.test/solarized-light.css"),
        fixture.env,
      ),
    ]);

    expect(darkResponse.status).toBe(200);
    expect(darkResponse.headers.get("Content-Type")).toContain("text/css");
    expect(await darkResponse.text()).toContain("background: #002b36");
    expect(lightResponse.status).toBe(200);
    expect(lightResponse.headers.get("Content-Type")).toContain("text/css");
    expect(await lightResponse.text()).toContain("background: #fdf6e3");
    expect(fixture.storageGet).not.toHaveBeenCalled();
    expect(fixture.assetFetch).not.toHaveBeenCalled();
  });

  it("serves canonical paste content in the initial HTML response", async () => {
    const fixture = testEnv(
      "# Hello from Kiwibin\n\nThis text should be available without JavaScript.",
    );
    const response = await worker.fetch(
      new Request("https://example.test/abc123.md"),
      fixture.env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(fixture.storageGet).toHaveBeenCalledWith("documents:abc123");
    expect(fixture.assetFetch).toHaveBeenCalledTimes(1);

    const assetRequest = fixture.assetFetch.mock.calls[0]?.[0] as Request | undefined;
    expect(assetRequest).toBeInstanceOf(Request);
    expect(new URL(assetRequest!.url).pathname).toBe("/index.html");

    const html = await response.text();
    const document = new JSDOM(html).window.document;
    const fallback = document.querySelector("[data-kiwibin-fallback]");

    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toContain("# Hello from Kiwibin");
    expect(fallback?.textContent).toContain("This text should be available without JavaScript.");
    expect(fallback?.querySelector("pre > code")).not.toBeNull();
    expect(document.querySelector('a[href="/raw/abc123"]')).not.toBeNull();
    expect(document.querySelector('script[type="module"][src="/assets/index-test.js"]')).not.toBeNull();
    expect(html).not.toContain('href="/html/abc123"');
    expect(response.headers.get("Link")).toContain('</abc123.md>; rel="canonical"');
    expect(response.headers.get("Link")).toContain("</raw/abc123>");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("escapes hostile source through the complete canonical pipeline", async () => {
    const fixture = testEnv("</code></pre><script>window.evil = true</script>");
    const response = await worker.fetch(
      new Request("https://example.test/abc123.html"),
      fixture.env,
    );

    expect(response.status).toBe(200);

    const document = new JSDOM(await response.text()).window.document;
    const fallback = document.querySelector("[data-kiwibin-fallback]");
    const source = fallback?.querySelector(".server-paste-content code");
    const scripts = [...document.querySelectorAll("script")];

    expect(source?.textContent).toContain("<script>window.evil = true</script>");
    expect(source?.innerHTML).toContain("&lt;script&gt;");
    expect(scripts.some((script) => script.textContent?.includes("window.evil"))).toBe(false);
    expect(document.querySelector('a[href="/raw/abc123"]')).not.toBeNull();
    expect(document.querySelector('a[href="/html/abc123"]')).not.toBeNull();

    const link = response.headers.get("Link");
    expect(link).toContain("</raw/abc123>");
    expect(link).toContain("</html/abc123>");
  });

  it("returns an HTML 404 for a missing canonical paste", async () => {
    const fixture = testEnv(null);
    const response = await worker.fetch(
      new Request("https://example.test/missing.md"),
      fixture.env,
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("Document &quot;missing&quot; not found.");
    expect(html).not.toContain("index-test.js");
    expect(fixture.assetFetch).not.toHaveBeenCalled();
  });

  it("returns representation-appropriate 404s", async () => {
    const fixture = testEnv(null);

    const [apiResponse, rawResponse, htmlResponse] = await Promise.all([
      worker.fetch(new Request("https://example.test/documents/missing"), fixture.env),
      worker.fetch(new Request("https://example.test/raw/missing"), fixture.env),
      worker.fetch(new Request("https://example.test/html/missing"), fixture.env),
    ]);

    expect(apiResponse.status).toBe(404);
    expect(apiResponse.headers.get("Content-Type")).toContain("application/json");
    expect(rawResponse.status).toBe(404);
    expect(rawResponse.headers.get("Content-Type")).toContain("text/plain");
    expect(htmlResponse.status).toBe(404);
    expect(htmlResponse.headers.get("Content-Type")).toContain("text/html");
  });

  it("does not turn unsupported paths into the application shell", async () => {
    const fixture = testEnv("hello");
    const response = await worker.fetch(new Request("https://example.test/foo/bar"), fixture.env);

    expect(response.status).toBe(404);
    expect(fixture.assetFetch).not.toHaveBeenCalled();
  });
});
