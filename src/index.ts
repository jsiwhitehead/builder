import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
import { atom } from "./signal";
import type { SignalCode } from "./types";

const code = {
  values: {
    x: atom("10 + 10"),
    y: { values: {}, items: [atom(10), atom(20)] },
    gap: 20,
  },
  items: [
    atom("Hi! {x}"),
    { values: { input: "yes" }, items: [atom("another")] },
  ],
};

render(
  document.getElementById("app"),
  {
    values: {
      font: '"Source Code Pro", monospace',
      pad: 20,
      flow: "row",
      gap: 50,
    },
    items: [
      {
        values: { width: "400px" },
        items: [evaluate(map(code), {}, true)],
      },
      evaluate(code, {}, true),
    ].filter((x) => x) as SignalCode[],
  },
  14
);
