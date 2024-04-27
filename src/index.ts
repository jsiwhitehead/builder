import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
import { signal } from "./signal";
import type { SignalCode } from "./types";

const code: SignalCode = {
  type: "scope",
  values: { x: "100" },
  items: [
    {
      values: {
        gap: "20",
        pad: { values: {}, items: ["10", "20"] },
        bold: "yes",
      },
      items: [
        signal<SignalCode>("Hello world!"),
        "Hi",
        {
          values: { color: "red" },
          items: ["Hello World!"],
        },
      ],
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
    items: [map(code), evaluate(code, {})],
  },
  14
);
