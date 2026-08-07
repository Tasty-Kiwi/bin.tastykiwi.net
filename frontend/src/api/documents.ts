import type { CreateDocumentResponse, StoredDocument } from "../types/document";

export class ApiError extends Error {
  readonly status?: number;
  readonly data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function readSuccessfulJson(response: Response): Promise<unknown> {
  const data = await readJson(response);
  if (!response.ok) {
    const message = isRecord(data) && typeof data.message === "string"
      ? data.message
      : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, data);
  }
  return data;
}

function asStoredDocument(data: unknown): StoredDocument {
  if (!isRecord(data) || typeof data.key !== "string" || typeof data.data !== "string") {
    throw new ApiError("The server returned an invalid document.");
  }
  return { key: data.key, data: data.data };
}

function asCreateDocumentResponse(data: unknown): CreateDocumentResponse {
  if (!isRecord(data) || typeof data.key !== "string" || typeof data.url !== "string") {
    throw new ApiError("The server returned an invalid document key.");
  }
  return { key: data.key, url: data.url };
}

export async function getDocument(key: string): Promise<StoredDocument> {
  try {
    const response = await fetch(`/documents/${encodeURIComponent(key)}`, {
      headers: { Accept: "application/json" },
    });
    return asStoredDocument(await readSuccessfulJson(response));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Unable to load this paste.");
  }
}

export async function createDocument(content: string): Promise<CreateDocumentResponse> {
  try {
    const response = await fetch("/documents", {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: content,
    });
    return asCreateDocumentResponse(await readSuccessfulJson(response));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Unable to save this paste.");
  }
}
