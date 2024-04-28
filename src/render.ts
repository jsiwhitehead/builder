import {
  type Data,
  type SignalData,
  isAtom,
  isValue,
  valueToString,
} from "./types";
import { effect, resolve, resolveToAtom } from "./signal";

interface Context {
  size: number;
  line: number;
  inline: "inline" | "wrap" | false;
}

const isInline = (data: SignalData) => isAtom(data) || isValue(data);

const getHandlers = (
  values: Record<string, SignalData>,
  hoverAtom: SignalData
) => {
  const res: any = {};

  if (isAtom(hoverAtom)) {
    res.onmouseover = () => hoverAtom.set(true);
    res.onmouseleave = () => hoverAtom.set(false);
  }

  return res;
};

const getItems = (
  items: SignalData[],
  values: Record<string, SignalData>
): SignalData[] => {
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
  items: SignalData[],
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

const getProps = (values: Record<string, Data>, handlers: any) => {
  const res: any = { ...handlers };

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

const createEditNode = () => {
  const wrap = document.createElement("span");
  wrap.style.position = "relative";
  wrap.style.display = "flex";

  const text = document.createElement("span");
  text.style.display = "flex";
  text.style.visibility = "hidden";

  const input = document.createElement("textarea");
  input.style.position = "absolute";
  input.style.top = "0";
  input.style.left = "0";
  input.style.width = "100%";
  input.style.height = "100%";

  wrap.replaceChildren(text, input);
  return wrap;
};

const updateNode = (effect, node, signal: SignalData, context: Context) => {
  if (isAtom(signal)) {
    const res = node?.__atom === signal ? node : createEditNode();
    res.__atom = signal;
    if (!res.childNodes[1].oninput) {
      res.childNodes[1].oninput = (e) => signal.set(e.target.value);
    }
    effect(() => {
      const text = valueToString(resolve(signal));
      const html = text.replace(/\n/g, "<br>").replace(/ /g, "&nbsp");
      if (res.childNodes[0].innerHTML !== html) {
        res.childNodes[0].innerHTML = html;
      }
      if (res.childNodes[1].value !== text) {
        res.childNodes[1].value = text;
      }
    });
    return res;
  }

  const data = resolve(signal);

  if (isValue(data)) {
    const text = valueToString(data);
    const res =
      node?.nodeName === "#text" ? node : document.createTextNode(text);
    if (res.textContent !== text) res.textContent = text;
    return res;
  }

  const hoverAtom = data.values.hover && resolveToAtom(data.values.hover);

  const tag = "div";
  const items = getItems(
    data.items.map((x) => resolveToAtom(x)),
    data.values
  );
  const newContext = getContext(data.values, items, context);
  const res =
    node?.nodeName.toLowerCase() === tag ? node : document.createElement(tag);
  const handlers = getHandlers(data.values, hoverAtom);

  effect(() => {
    const values = Object.keys(data.values).reduce(
      (res, k) => ({ ...res, [k]: resolve(data.values[k], true) }),
      {}
    );
    res.__props = onChanged(
      res.__props || {},
      getProps(values, handlers),
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
      updateNode(effect, root.childNodes[0], resolveToAtom(data), {
        size,
        line,
        inline: false,
      }),
    ]);
  });
};
