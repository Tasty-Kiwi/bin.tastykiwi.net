import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import { highlightSource } from "../highlighting/highlight";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code, language) {
    return highlightSource(code, language || undefined).html;
  },
});

const defaultLinkOpen = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];
  if (token) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};

export function renderMarkdown(source: string): string {
  const rendered = markdown.render(source);
  return String(
    DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
      FORBID_ATTR: ["style"],
      ADD_ATTR: ["target"],
      ALLOW_UNKNOWN_PROTOCOLS: false,
    }),
  );
}
