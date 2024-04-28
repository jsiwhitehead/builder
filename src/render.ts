import {
  type Atom,
  type Data,
  type SemiData,
  type SignalData,
  isAtom,
  isValue,
} from "./types";
import { effect, resolve, resolveToAtom } from "./signal";

interface Context {
  size: number;
  line: number;
  inline: "inline" | "wrap" | false;
}

const isInline = (data: SemiData) => isValue(data) || isAtom(data.values.input);

const getHandlers = (
  values: Record<string, SignalData>,
  inputAtom?: Atom<SignalData>
) => {
  const res: any = {};

  if (inputAtom) {
    res.oninput = (e) => inputAtom.set(e.target.value);
  }

  return res;
};

const getItems = (
  items: SemiData[],
  values: Record<string, SignalData>
): SemiData[] => {
  const flow = values.flow && resolve(values.flow);
  if ((flow && flow !== "inline") || (values.gap && resolve(values.gap))) {
    return items.map((x) =>
      isInline(x) ? { __type: "block", values: {}, items: [x] } : x
    );
  }
  return items;
};

const getContext = (
  values: Record<string, SignalData>,
  items: SemiData[],
  context: Context
): Context => {
  const size = values.size && resolve(values.size);
  const line = values.line && resolve(values.line);
  const flow = values.flow && resolve(values.flow);
  return {
    size: (size as number) || context.size,
    line: (line as number) || context.line,
    inline: context.inline
      ? "inline"
      : flow === "inline" || items.some((x) => isInline(x))
        ? "wrap"
        : false,
  };
};

const getProps = (values: Record<string, Data>, handlers: any, node) => {
  const res: any = { ...handlers };

  if (handlers.oninput) {
    res.rows = "1";
    setTimeout(() => {
      node.style.height = "auto";
      node.style.height = node.scrollHeight + "px";
    });
  }

  return res;
};

const getNumeric = (x) => (x && x < 1 ? `${x * 100}%` : `${x || 0}px`);
const directions = (v) => [
  v.values.top ?? v.items[0],
  v.values.right ?? v.items[3] ?? v.items[1] ?? v.items[0],
  v.values.bottom ?? v.items[2] ?? v.items[0],
  v.values.left ?? v.items[1] ?? v.items[0],
];
const getStyle = (
  values: Record<string, Data>,
  handlers,
  node,
  context: Context
) => {
  const res: any = {};

  if (context.inline === "inline") {
    // res.display = "inline";
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
  }
  if (values.gap) {
    res.gap = `${values.gap}px`;
  }
  if (values.width) {
    res.width = values.width;
  }

  if (handlers.oninput) {
    res.height = node.scrollHeight + "px";
    res.overflowY = "hidden";
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

const onChanged = (prev, next, func) => {
  for (const key in { ...prev, ...next }) {
    if (next[key] !== prev) func(key, next[key], prev[key]);
  }
  return next;
};

const updateChildren = (node, children) => {
  if (
    node.childNodes.length !== children.length ||
    [...node.childNodes].some((c, i) => children[i] !== c)
  ) {
    node.replaceChildren(...children);
  }
};

const updateNode = (effect, node, data: SemiData, context: Context) => {
  if (isValue(data) || (data.values.input && !resolveToAtom(data.items[0]))) {
    const text = `${isValue(data) ? data : resolve(data.values.input)}`;
    const res =
      node?.nodeName === "#text" ? node : document.createTextNode(text);
    if (res.textContent !== text) res.textContent = text;
    return res;
  }

  const inputAtom = data.values.input
    ? resolveToAtom(data.items[0])
    : undefined;

  const tag = inputAtom ? "textarea" : "div";
  const items = getItems(
    data.items.map((x) => resolve(x)),
    data.values
  );
  const newContext = getContext(data.values, items, context);
  const res =
    node?.nodeName.toLowerCase() === tag ? node : document.createElement(tag);
  const handlers = getHandlers(data.values, inputAtom);

  effect(() => {
    const values = Object.keys(data.values).reduce(
      (res, k) => ({ ...res, [k]: resolve(data.values[k], true) }),
      {}
    );
    res.__props = onChanged(
      res.__props || {},
      getProps(values, handlers, res),
      (k, v) => {
        if (k === "focus") {
          if (v) setTimeout(() => res.focus());
        } else {
          res[k] = v === null || v === undefined ? null : v;
        }
      }
    );
    res.__style = onChanged(
      res.__style || {},
      getStyle(values, handlers, res, newContext),
      (k, v) => {
        res.style[k] = v || null;
      }
    );
  });

  effect(() => {
    updateChildren(
      res,
      items.map((x, i) => updateNode(effect, res.childNodes[i], x, newContext))
    );
  });

  return res;
};

export default (root, data: SignalData, size = 16, line = 1.5) => {
  effect((effect) => {
    updateChildren(root, [
      updateNode(effect, root.childNodes[0], resolve(data), {
        size,
        line,
        inline: false,
      }),
    ]);
  });
};
