import { computed, resolve } from "./signal";
import {
  type Code,
  type Data,
  isCodeAssign,
  isCodeBlock,
  isSignal,
  isValue,
} from "./types";

const evaluate = (code: Code, context: Record<string, Data>): Data => {
  if (isSignal(code)) {
    return computed(() => evaluate(resolve(code) as Code, context));
  }

  if (isValue(code)) {
    return code;
  }

  // if (code.values.type === "reference") {
  //   return context[code.values.value];
  // }

  if (isCodeBlock(code)) {
    const res: Data = {
      __type: "block",
      values: {},
      items: [],
    };
    for (const x of code.items) {
      if (isCodeAssign(x)) {
        res.values[x.values.key] = evaluate(x.values.value, context);
      } else {
        res.items.push(evaluate(x, context));
      }
    }
    return res;
  }

  throw new Error();
};

export default evaluate;
