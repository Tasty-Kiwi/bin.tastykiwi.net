import {
  alternateLinkHeader,
  alternateRepresentations,
  buildCanonicalFallback,
  canonicalPastePath,
} from "./worker/canonical";
import {
  getDocumentContent,
  HTTPError,
} from "./worker/documents";
import { escapeHtml } from "./worker/escaping";
import {
  parseCanonicalPasteRoute,
  parseDocumentResourceRoute,
  type CanonicalPasteRoute,
} from "./worker/routes";
import {
  buildHtmlPreviewDocument,
  STANDALONE_HTML_CSP,
} from "./shared/html-preview";

export interface Env {
  STORAGE: KVNamespace;
  ASSETS: Fetcher;

  DOCUMENT_KEY_SIZE?: string;
  MAX_DOCUMENT_SIZE?: string;
  DOCUMENT_EXPIRE_TTL?: string;
}

export { HTTPError } from "./worker/documents";

const DEFAULT_CONFIG = {
  DOCUMENT_KEY_SIZE: 8,
  DOCUMENT_EXPIRE_TTL: 60 * 60 * 24 * 365,
  MAX_DOCUMENT_SIZE: 1_048_576,
};

const STATIC_ROOT_PATHS = new Set([
  "/",
  "/index.html",
  "/favicon.ico",
  "/logo.png",
  "/robots.txt",
]);

function generateId(size: number): string {
  const keyspace = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomValues = new Uint32Array(size);
  crypto.getRandomValues(randomValues);

  let id = "";
  for (const value of randomValues) {
    id += keyspace.charAt(value % keyspace.length);
  }
  return id;
}

function getConfig(env: Env) {
  return {
    DOCUMENT_KEY_SIZE: Number(env.DOCUMENT_KEY_SIZE) || DEFAULT_CONFIG.DOCUMENT_KEY_SIZE,
    DOCUMENT_EXPIRE_TTL: Number(env.DOCUMENT_EXPIRE_TTL) || DEFAULT_CONFIG.DOCUMENT_EXPIRE_TTL,
    MAX_DOCUMENT_SIZE: Number(env.MAX_DOCUMENT_SIZE) || DEFAULT_CONFIG.MAX_DOCUMENT_SIZE,
  };
}

async function handlePost(request: Request, env: Env): Promise<Response> {
  const config = getConfig(env);
  const length = Number(request.headers.get("Content-Length") || 0);

  if (!length) {
    throw new HTTPError(400, "Content must contain at least one character.");
  }

  if (length > config.MAX_DOCUMENT_SIZE) {
    throw new HTTPError(
      400,
      `Content must be shorter than ${config.MAX_DOCUMENT_SIZE} characters (was ${length}).`,
    );
  }

  const content = await request.text();
  const id = generateId(config.DOCUMENT_KEY_SIZE);

  await env.STORAGE.put(`documents:${id}`, content, {
    expirationTtl: config.DOCUMENT_EXPIRE_TTL,
  });

  const domain = new URL(request.url).hostname;

  return new Response(JSON.stringify({
    key: id,
    url: `https://${domain}/${id}`,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

async function handleGetDocument(id: string, env: Env): Promise<Response> {
  const content = await getDocumentContent(id, env.STORAGE);

  return new Response(JSON.stringify({ key: id, data: content }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

async function handleGetRaw(id: string, env: Env): Promise<Response> {
  const content = await getDocumentContent(id, env.STORAGE, "text");

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handleGetHtml(id: string, env: Env): Promise<Response> {
  const content = await getDocumentContent(id, env.STORAGE, "html");

  return new Response(buildHtmlPreviewDocument(content), {
    status: 200,
    headers: {
      "Content-Security-Policy": STANDALONE_HTML_CSP,
      "Content-Type": "text/html; charset=UTF-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handleCanonicalPaste(
  request: Request,
  env: Env,
  route: CanonicalPasteRoute,
): Promise<Response> {
  const content = await getDocumentContent(route.id, env.STORAGE, "html");
  const indexResponse = await env.ASSETS.fetch(
    new Request(new URL("/index.html", request.url)),
  );

  if (!indexResponse.ok) {
    throw new HTTPError(500, "The Kiwibin frontend is unavailable.", "html");
  }

  const alternateLinks = alternateRepresentations(route)
    .map(({ href, type }) => `<link rel="alternate" type="${type}" href="${escapeHtml(href)}">`)
    .join("");

  const transformed = new HTMLRewriter()
    .on("#app", {
      element(element) {
        element.setInnerContent(buildCanonicalFallback(route, content), { html: true });
      },
    })
    .on("head", {
      element(element) {
        element.append(alternateLinks, { html: true });
      },
    })
    .transform(indexResponse);

  return withCanonicalHeaders(transformed, route);
}

function withCanonicalHeaders(response: Response, route: CanonicalPasteRoute): Response {
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("X-Robots-Tag", "noindex,nofollow");
  headers.set(
    "Link",
    `<${canonicalPastePath(route)}>; rel="canonical", ${alternateLinkHeader(route)}`,
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withApiHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withRawHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex,nofollow");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withHtmlHeaders(response: Response, id: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", STANDALONE_HTML_CSP);
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex,nofollow");
  headers.set("Link", `</${encodeURIComponent(id)}.html>; rel="canonical"`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json; charset=UTF-8",
      "X-Robots-Tag": "noindex",
    },
  });
}

function textError(status: number, message: string): Response {
  return new Response(`${message}\n`, {
    status,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex,nofollow",
    },
  });
}

function htmlError(status: number, message: string): Response {
  return new Response(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>kiwibin</title></head>
  <body><main><a href="/about.md">kiwibin</a><h1>${escapeHtml(message)}</h1></main></body>
</html>`, {
    status,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/html; charset=UTF-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex,nofollow",
    },
  });
}

function responseForError(error: HTTPError): Response {
  switch (error.format) {
    case "html":
      return htmlError(error.status, error.message);
    case "text":
      return textError(error.status, error.message);
    case "json":
      return jsonError(error.status, error.message);
  }
}

function isKnownStaticAsset(pathname: string): boolean {
  return STATIC_ROOT_PATHS.has(pathname) || pathname.startsWith("/assets/");
}

async function serveKnownStaticAsset(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isKnownStaticAsset(url.pathname)) {
    return null;
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const { pathname } = url;

      if (request.method === "POST" && pathname === "/documents") {
        return withApiHeaders(await handlePost(request, env));
      }

      if (request.method === "GET") {
        const documentId = parseDocumentResourceRoute(pathname, "documents");
        if (documentId) {
          return withApiHeaders(await handleGetDocument(documentId, env));
        }

        const rawId = parseDocumentResourceRoute(pathname, "raw");
        if (rawId) {
          return withRawHeaders(await handleGetRaw(rawId, env));
        }

        const htmlId = parseDocumentResourceRoute(pathname, "html");
        if (htmlId) {
          return withHtmlHeaders(await handleGetHtml(htmlId, env), htmlId);
        }

        const staticResponse = await serveKnownStaticAsset(request, env);
        if (staticResponse) {
          return staticResponse;
        }

        const canonicalRoute = parseCanonicalPasteRoute(pathname);
        if (canonicalRoute) {
          return await handleCanonicalPaste(request, env, canonicalRoute);
        }
      }

      return htmlError(404, "That address is not a Kiwibin paste.");
    } catch (error) {
      if (error instanceof HTTPError) {
        return responseForError(error);
      }
      throw error;
    }
  },
};
