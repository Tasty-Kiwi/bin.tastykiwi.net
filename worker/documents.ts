export type ErrorResponseFormat = "json" | "text" | "html";

export interface DocumentStorage {
  get(key: string): Promise<string | null>;
}

export class HTTPError extends Error {
  readonly status: number;
  readonly format: ErrorResponseFormat;

  constructor(status: number, message: string, format: ErrorResponseFormat = "json") {
    super(message);
    this.name = "HTTPError";
    this.status = status;
    this.format = format;
  }
}

export async function getDocumentContent(
  id: string,
  storage: DocumentStorage,
  notFoundFormat: ErrorResponseFormat = "json",
): Promise<string> {
  const content = await storage.get(`documents:${id}`);

  if (content === null) {
    throw new HTTPError(404, `Document "${id}" not found.`, notFoundFormat);
  }

  return content;
}
