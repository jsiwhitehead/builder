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

export const textToCode = (v) =>
  typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` : v;
export const codeToText = (v) =>
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

const evaluateAST = (ast, context: Record<string, SignalData>) => {
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
  context: Record<string, SignalData>,
  isText: boolean
): SignalData => {
  if (isAtom(code)) {
    const canWrap = computed(() => {
      const v = resolve(code);
      if (typeof v !== "string") return true;
      const ast = parse(isText ? textToCode(v) : v);
      return ast.type === "value" && typeof ast.value === "string";
    });
    return computed(() => {
      if (resolve(canWrap)) {
        return wrap(
          code,
          (v) => (isText ? unescapeText(v) : codeToText(v)),
          (v) => (isText ? escapeText(v) : textToCode(v))
        );
      }
      return evaluate(resolve(code), context, isText);
    });
  }

  if (isComputed(code)) {
    return evaluate(resolve(code), context, isText);
  }

  if (isValue(code)) {
    if (typeof code === "string") {
      const ast = parse(isText ? textToCode(code) : code);
      return evaluateAST(ast, context);
    }
    return code;
  }

  if (isScope(code) || isBlock(code)) {
    const values = Object.keys(code.values).reduce(
      (res, k) => ({ ...res, [k]: evaluate(code.values[k], context, false) }),
      {}
    );
    const newContext = { ...context, ...values };
    const items = code.items.map((x) => evaluate(x, newContext, true));
    if (isScope(code)) return items[0];
    return { values, items };
  }

  throw new Error();
};

export default evaluate;
