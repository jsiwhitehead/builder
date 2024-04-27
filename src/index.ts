import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
import { signal } from "./signal";
import type { Code } from "./types";

const code: Code = {
  __type: "block",
  values: { type: "block" },
  items: [
    {
      __type: "block",
      values: {
        type: "assign",
        key: "gap",
        value: 20,
      },
      items: [],
    },
    {
      __type: "block",
      values: {
        type: "assign",
        key: "pad",
        value: {
          __type: "block",
          values: { type: "block" },
          items: [10, 20],
        },
      },
      items: [],
    },
    {
      __type: "block",
      values: {
        type: "assign",
        key: "bold",
        value: "yes",
      },
      items: [],
    },
    signal("Hello world!"),
    {
      __type: "block",
      values: { type: "block" },
      items: [
        {
          __type: "block",
          values: {
            type: "assign",
            key: "color",
            value: "red",
          },
          items: [],
        },
        "Hello world!",
      ],
    },
  ],
};

render(
  document.getElementById("app"),
  {
    __type: "block",
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
