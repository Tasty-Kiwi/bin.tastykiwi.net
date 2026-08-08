import { render } from "preact";
import { App } from "./App";
import "./styles/app.css";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Kiwibin app root is missing.");
}

root.replaceChildren();
render(<App />, root);
