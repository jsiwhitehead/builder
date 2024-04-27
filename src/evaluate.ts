import { computed, resolve } from "./signal";
import {
  type SignalCode,
  type SignalData,
  isBlock,
  isScope,
  isSignal,
  isValue,
} from "./types";

const evaluate = (
  code: SignalCode,
  context: Record<string, SignalData>
): SignalData => {
  if (isSignal(code)) {
    return computed(() => evaluate(resolve(code), context));
  }

  if (isValue(code)) {
    return code;
  }

  if (isScope(code) || isBlock(code)) {
    const values = Object.keys(code.values).reduce(
      (res, k) => ({ ...res, [k]: evaluate(code.values[k], context) }),
      {}
    );
    const newContext = { ...context, ...values };
    const items = code.items.map((x) => evaluate(x, newContext));
    if (isScope(code)) return items[0];
    return { values, items };
  }

  throw new Error();
};

export default evaluate;
