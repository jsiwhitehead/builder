import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
import { atom } from "./signal";
import type { SignalCode } from "./types";

const code: SignalCode = {
  type: "scope",
  values: { hover: atom(false) },
  items: [
    {
      values: { hover: "hover", color: "hover ? 'red' : 'green'" },
      items: [atom("Hi there"), "another"],
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
