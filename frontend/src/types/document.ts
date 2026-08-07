export interface StoredDocument {
  key: string;
  data: string;
}

export interface CreateDocumentResponse {
  key: string;
  url: string;
}

export type PreviewFormat = "markdown" | "html" | null;
export type FormatChoice = "auto" | "text" | "markdown" | "html";
export type ViewMode = "edit" | "code" | "preview";

export interface AppState {
  content: string;
  key?: string;
  locked: boolean;
  extension?: string;
  language?: string;
  formatChoice: FormatChoice;
  previewFormat: PreviewFormat;
  view: ViewMode;
  loading: boolean;
  saving: boolean;
  error?: string;
}
