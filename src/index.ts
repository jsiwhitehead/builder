// import evaluate from "./evaluate";
import evaluate from "./evaluate";
import map from "./map";
import render from "./render";
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
        value: {
          __type: "block",
          values: { type: "value", value: "20" },
          items: [],
        },
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
          items: [
            {
              __type: "block",
              values: { type: "value", value: "10" },
              items: [],
            },
            {
              __type: "block",
              values: { type: "value", value: "20" },
              items: [],
            },
          ],
        },
      },
      items: [],
    },
    {
      __type: "block",
      values: {
        type: "assign",
        key: "bold",
        value: {
          __type: "block",
          values: { type: "value", value: "yes" },
          items: [],
        },
      },
      items: [],
    },
    {
      __type: "block",
      values: { type: "value", value: "Hello world!" },
      items: [],
    },
    {
      __type: "block",
      values: { type: "block" },
      items: [
        {
          __type: "block",
          values: {
            type: "assign",
            key: "color",
            value: {
              __type: "block",
              values: { type: "value", value: "red" },
              items: [],
            },
          },
          items: [],
        },
        {
          __type: "block",
          values: { type: "value", value: "Hello world!" },
          items: [],
        },
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
