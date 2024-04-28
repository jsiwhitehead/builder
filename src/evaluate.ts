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
} from "./types";

export const escapeText = (s) => s.replace(/{/g, "\\{");
export const unescapeText = (s) => s.replace(/\\{/g, "{");

export const textToCode = (s) => `'${s.replace(/'/g, "\\'")}'`;
export const codeToText = (s) => s.slice(1, -1).replace(/\\'/, "'");

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
  if (op === "concat") return vals.join("");
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
      const s = `${resolve(code)}`;
      const ast = parse(isText ? textToCode(s) : s);
      return ast.type === "value";
    });
    return computed(() => {
      if (resolve(canWrap)) {
        return wrap(
          code,
          (v) => (isText ? unescapeText(`${v}`) : codeToText(`${v}`)),
          (v) => (isText ? escapeText(`${v}`) : textToCode(`${v}`))
        );
      }
      return evaluate(resolve(code), context, isText);
    });
  }

  if (isComputed(code)) {
    return evaluate(resolve(code), context, isText);
  }

  if (isValue(code)) {
    const s = `${code}`;
    const ast = parse(isText ? `'${s.replace(/'/g, "\\'")}'` : s);
    return evaluateAST(ast, context);
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
