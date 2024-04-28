import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
import { atom } from "./signal";
import type { SignalCode } from "./types";

const code: SignalCode = {
  type: "scope",
  values: { text: atom<SignalCode>("'Hello world!'") },
  items: [
    {
      values: {
        gap: "20",
        pad: { values: {}, items: ["10", "20"] },
        bold: "yes",
      },
      items: ["Hello {10 + 10}", "{text}"],
    },
  ],
};

render(
  document.getElementById("app"),
  {
    values: {
      font: '"Source Code Pro", monospace',
      pad: 20,
      flow: "row",
      gap: 300,
    },
    items: [evaluate(map(code), {}, true), evaluate(code, {}, true)],
  },
  14
);
