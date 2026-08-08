const HTML_ESCAPE_SEQUENCES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(source: string): string {
  return source.replace(/[&<>"']/g, (character) => HTML_ESCAPE_SEQUENCES[character] ?? character);
}
