import type { Block, Data } from "./types";

interface Context {
  size: number;
  line: number;
  inline: "inline" | "wrap" | false;
}

const getNumeric = (x) => (x && x < 1 ? `${x * 100}%` : `${x || 0}px`);

const directions = (v) => [
  v.values.top ?? v.items[0],
  v.values.right ?? v.items[3] ?? v.items[1] ?? v.items[0],
  v.values.bottom ?? v.items[2] ?? v.items[0],
  v.values.left ?? v.items[1] ?? v.items[0],
];

const getContext = (
  values: { [key: string]: Data },
  items: Data[],
  context: Context
): Context => {
  return {
    size: (values.size as number) || context.size,
    line: (values.line as number) || context.line,
    inline: context.inline
      ? "inline"
      : values.flow === "inline" ||
          items.some((x) => typeof x === "number" || typeof x === "string")
        ? "wrap"
        : false,
  };
};

const getStyle = (values: { [key: string]: Data }, context: Context) => {
  const res: any = {};

  if (context.inline === "inline") {
    res.display = "inline";
  } else if (context.inline === "wrap") {
    const gap = ((context.line - 1) * context.size) / 2;
    res.marginTop = `${-gap}px`;
    res.marginBottom = `${-gap}px`;
    res.minHeight = `${context.line * context.size}px`;
  } else if (values.flow === "grid") {
    res.display = "grid";
    res.gridTemplateColumns = values.grid;
  } else {
    res.display = "flex";
    res.flexDirection = values.flow || "column";
    // res.width = "100%";
  }
  if (values.gap) {
    res.gap = `${values.gap}px`;
  }
  if (values.width) {
    res.width = values.width;
  }

  res.fontSize = `${context.size}px`;
  res.lineHeight = context.line;

  if (values.font) res.fontFamily = values.font;
  if (values.color) res.color = values.color;
  if (values.bold) res.fontWeight = "bold";
  if (values.italic) res.fontStyle = "italic";

  if (values.fill) res.background = values.fill;

  if (values.pad) {
    res.padding =
      typeof values.pad === "number"
        ? `${values.pad}px`
        : directions(values.pad)
            .map((x) => getNumeric(x))
            .join(" ");
  }

  if (values.border) {
    if (typeof values.border === "string") {
      res.border = values.border;
    } else {
      const dirs = directions(values.border);
      const labels = ["Top", "Right", "Bottom", "Left"];
      for (let i = 0; i < 4; i++) {
        res[`border${labels[i]}`] = dirs[i];
      }
    }
  }

  return res;
};

const getItems = (data: Block): Data[] => {
  if ((data.values.flow && data.values.flow !== "inline") || data.values.gap) {
    return data.items.map((x) =>
      typeof x === "number" || typeof x === "string"
        ? { __type: "block", values: {}, items: [x] }
        : x
    );
  }
  return data.items;
};

const getNode = (data: Data, context: Context) => {
  if (typeof data !== "object") {
    return document.createTextNode(`${data}`);
  }

  if (data.__type === "signal") {
    throw new Error();
  }

  const items = getItems(data);
  const newContext = getContext(data.values, items, context);
  const node = document.createElement("div");

  const style = getStyle(data.values, newContext);
  for (const key in style) node.style[key] = style[key];

  const children = getItems(data).map((x) => getNode(x, newContext));
  node.replaceChildren(...children);

  return node;
};

export default (root, data: Data, size = 16, line = 1.5) => {
  const node = getNode(data, { size, line, inline: false });
  root.replaceChildren(node);
};
