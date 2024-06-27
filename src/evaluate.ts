import parse from "./parse";
import { computed, resolve, wrap } from "./signal";
import {
  type SignalCode,
  type SignalData,
  isAtom,
  isBlock,
  isComputed,
  isScope,
  isSignal,
  isValue,
  valueToString,
} from "./types";

export const escapeText = (v) =>
  typeof v === "string" ? v.replace(/{/g, "\\{") : v;
export const unescapeText = (v) =>
  typeof v === "string" ? v.replace(/\\{/g, "{") : v;

export const textToCode = (v) => (typeof v === "string" ? `±${v}` : v);
export const codeToText = (v) => (typeof v === "string" ? v.slice(1) : v);

export const simpleTextToCode = (v) =>
  typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` : v;
export const simpleCodeToText = (v) =>
  typeof v === "string" ? v.slice(1, -1).replace(/\\'/, "'") : v;

const isTruthy = (x) => !(x === false || x === null);
const unary = {
  "-": (a) => -a,
  "!": (a) => !a,
};
const binary = {
  "=": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<=": (a, b) => a <= b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  ">": (a, b) => a > b,
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
  "%": (a, b) => ((((a - 1) % b) + b) % b) + 1,
  "^": (a, b) => a ** b,
};
const doOperation = (op, vals) => {
  if (op === "concat") return vals.map(valueToString).join("");
  if (op === "ternary") return isTruthy(vals[0]) ? vals[1] : vals[2];
  return (vals.length === 2 ? binary : unary)[op](...vals);
};

const evaluateAST = (ast, context: Record<string, SignalData | undefined>) => {
  if (ast.type === "value") {
    return ast.value;
  }
  if (ast.type === "label") {
    return context[ast.value];
  }
  if (ast.type === "operation") {
    const values = ast.nodes.map((n) => evaluateAST(n, context));
    if (values.some((v) => isSignal(v))) {
      return computed(() =>
        doOperation(
          ast.operation,
          values.map((v) => resolve(v))
        )
      );
    }
    return doOperation(ast.operation, values);
  }
  throw new Error();
};

const evaluate = (
  code: SignalCode,
  context: Record<string, SignalData | undefined>,
  isText: boolean
): SignalData | undefined => {
  if (isAtom(code)) {
    const canWrap = computed(() => {
      const v = resolve(code);
      if (typeof v !== "string") return true;
      const ast = parse(isText ? textToCode(v) : v);
      if (ast === null) return false;
      return ast.type === "value" && typeof ast.value === "string";
    });
    return computed(() => {
      if (resolve(canWrap)) {
        return wrap(
          code,
          (v) => (isText ? unescapeText(v) : simpleCodeToText(v)),
          (v) => (isText ? escapeText(v) : simpleTextToCode(v))
        );
      }
      return evaluate(resolve(code), context, isText);
    }) as any;
  }

  if (isComputed(code)) {
    return evaluate(resolve(code), context, isText);
  }

  if (isValue(code)) {
    if (typeof code === "string") {
      const ast = parse(isText ? textToCode(code) : code);
      if (ast === null) return undefined;
      return evaluateAST(ast, context);
    }
    return code;
  }

  if (isScope(code) || isBlock(code)) {
    const keys = Object.keys(code.values);
    const values = keys.reduce(
      (res, k) => ({ ...res, [k]: evaluate(code.values[k], context, false) }),
      {}
    );
    const newContext = { ...context, ...values };
    const items = code.items.map((x) => evaluate(x, newContext, true));
    // if (isScope(code)) return items[0];
    // return { values, items };
    if (
      keys.every((k) => values[k] === undefined || !isSignal(values[k])) &&
      items.every((x) => x === undefined || !isSignal(x))
    ) {
      const filteredItems = items.filter(
        (x) => x !== undefined
      ) as SignalData[];
      if (isScope(code)) return filteredItems[0];
      const filteredValues = keys.reduce(
        (res, k) =>
          values[k] === undefined ? res : { ...res, [k]: values[k] },
        {}
      );
      return { values: filteredValues, items: filteredItems };
    } else {
      const definedKeys = computed(() =>
        JSON.stringify([
          keys.map((k) => values[k] !== undefined),
          items.map((x) => x !== undefined),
        ])
      );
      return computed(() => {
        const [dKeys, dItems] = JSON.parse(resolve(definedKeys));
        if (isScope(code)) return items.find((_, i) => dItems[i])!;
        return {
          values: keys.reduce(
            (res, k, i) => (dKeys[i] ? { ...res, [k]: values[k] } : res),
            {}
          ),
          items: items.filter((_, i) => dItems[i]) as SignalData[],
        };
      });
    }
  }

  throw new Error();
};

export default evaluate;
