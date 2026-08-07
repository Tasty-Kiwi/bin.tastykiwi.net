export interface Env {
  STORAGE: KVNamespace;
  ASSETS: Fetcher;

  DOCUMENT_KEY_SIZE?: string;
  MAX_DOCUMENT_SIZE?: string;
  DOCUMENT_EXPIRE_TTL?: string;
}

export class HTTPError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_CONFIG = {
  DOCUMENT_KEY_SIZE: 8,
  DOCUMENT_EXPIRE_TTL: 60 * 60 * 24 * 365,
  MAX_DOCUMENT_SIZE: 1_048_576,
};

function generateId(size: number): string {
  let id = "";
  const keyspace = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let idx = 0; idx < size; idx++) {
    id += keyspace.charAt(Math.random() * keyspace.length);
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

  const json = {
    key: id,
    url: `https://${domain}/${id}`,
  };

  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

async function handleGetDocument(id: string, env: Env): Promise<Response> {
  const content = await env.STORAGE.get(`documents:${id}`);

  if (!content) {
    throw new HTTPError(404, `Document "${id}" not found.`);
  }

  return new Response(JSON.stringify({ key: id, data: content }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
  });
}

async function handleGetRaw(id: string, env: Env): Promise<Response> {
  const content = await env.STORAGE.get(`documents:${id}`);

  if (!content) {
    throw new HTTPError(404, `Document "${id}" not found.`);
  }

  return new Response(content, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=UTF-8" },
  });
}

function addHeaders(response: Response, request: Request): Response {
  const url = new URL(request.url);
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex");
  headers.set("Link", `<https://${url.hostname}${url.pathname}>; rel="canonical"`);

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
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const { pathname } = url;

      if (request.method === "POST" && pathname === "/documents") {
        return addHeaders(await handlePost(request, env), request);
      }

      if (request.method === "GET") {
        const docMatch = pathname.match(/^\/documents\/(.+)$/);
        if (docMatch?.[1]) {
          return addHeaders(await handleGetDocument(docMatch[1], env), request);
        }

        const rawMatch = pathname.match(/^\/raw\/(.+)$/);
        if (rawMatch?.[1]) {
          return addHeaders(await handleGetRaw(rawMatch[1], env), request);
        }
      }

      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      const indexResponse = await env.ASSETS.fetch(
        new Request(new URL("/index.html", request.url)),
      );
      return addHeaders(indexResponse, request);
    } catch (e) {
      if (e instanceof HTTPError) {
        return jsonError(e.status, e.message);
      }
      throw e;
    }
  },
};
