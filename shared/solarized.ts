export const SOLARIZED_DARK_CSS = `html {
  color-scheme: dark;
  background: #002b36;
  color: #839496;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

body {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 4vw, 3rem) 4rem;
  background: #002b36;
  color: #839496;
}

header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #073642;
}

main {
  display: block;
}

section {
  margin: 2rem 0;
}

article {
  margin: 1.5rem 0;
}

footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid #073642;
  color: #586e75;
}

h1 {
  margin: 0 0 1rem;
  color: #fdf6e3;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
}

h2 {
  margin: 2rem 0 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #073642;
  color: #eee8d5;
  font-size: 1.5rem;
  line-height: 1.2;
}

h3 {
  margin: 1.5rem 0 0.5rem;
  color: #93a1a1;
  font-size: 1.2rem;
  line-height: 1.3;
}

h4 {
  margin: 1.25rem 0 0.5rem;
  color: #b58900;
  font-size: 1rem;
  line-height: 1.4;
}

p {
  margin: 0.75rem 0;
}

strong {
  color: #eee8d5;
  font-weight: 700;
}

em {
  color: #93a1a1;
}

small {
  color: #586e75;
  font-size: 0.875rem;
}

ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

ol {
  margin: 0.75rem 0;
  padding-left: 1.75rem;
}

li {
  margin: 0.3rem 0;
}

dl {
  margin: 1rem 0;
}

dt {
  margin-top: 0.75rem;
  color: #eee8d5;
  font-weight: 700;
}

dd {
  margin: 0.2rem 0 0 1.5rem;
}

a {
  color: #268bd2;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.16em;
}

a:hover {
  color: #2aa198;
}

a:focus-visible {
  outline: 2px solid #b58900;
  outline-offset: 2px;
}

blockquote {
  margin: 1.25rem 0;
  padding: 0.25rem 0 0.25rem 1rem;
  border-left: 3px solid #859900;
  color: #93a1a1;
}

code {
  padding: 0.12em 0.32em;
  background: #073642;
  color: #2aa198;
  font-family: monospace;
  font-size: 0.92em;
}

pre {
  overflow: auto;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #073642;
  background: #00222b;
  color: #839496;
  font-family: monospace;
  line-height: 1.5;
}

pre code {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
}

kbd {
  padding: 0.1em 0.4em;
  border: 1px solid #586e75;
  border-bottom-width: 2px;
  background: #073642;
  color: #eee8d5;
  font-family: monospace;
  font-size: 0.85em;
}

table {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
}

thead {
  background: #073642;
}

tbody {
  background: #002b36;
}

tr {
  border-bottom: 1px solid #073642;
}

th {
  padding: 0.6rem 0.75rem;
  color: #eee8d5;
  font-weight: 700;
  text-align: left;
}

td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  vertical-align: top;
}

hr {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid #586e75;
}

figure {
  margin: 1.5rem 0;
}

figcaption {
  margin-top: 0.5rem;
  color: #586e75;
  font-size: 0.875rem;
}

img {
  max-width: 100%;
  height: auto;
}

details {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid #073642;
}

summary {
  color: #eee8d5;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 700px) {
  body {
    padding: 1.25rem 1rem 2.5rem;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
`;

const SOLARIZED_LIGHT_COLORS: Record<string, string> = {
  "#00222b": "#eee8d5",
  "#002b36": "#fdf6e3",
  "#073642": "#eee8d5",
  "#586e75": "#93a1a1",
  "#839496": "#657b83",
  "#93a1a1": "#586e75",
  "#eee8d5": "#073642",
  "#fdf6e3": "#002b36",
};

export const SOLARIZED_LIGHT_CSS = SOLARIZED_DARK_CSS
  .replace("color-scheme: dark", "color-scheme: light")
  .replace(/#[0-9a-f]{6}/gi, (color) =>
    SOLARIZED_LIGHT_COLORS[color.toLowerCase()] ?? color
  );
