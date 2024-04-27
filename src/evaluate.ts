import { type Code, type Data } from "./types.ts";

const evaluate = (code: Code, context: { [key: string]: Data }): Data => {
  if (code.values.type === "value") {
    return code.values.value;
  }

  // if (code.values.type === "reference") {
  //   return context[code.values.value];
  // }

  if (code.values.type === "block") {
    const res: Data = {
      __type: "block",
      values: {},
      items: [],
    };
    for (const x of code.items) {
      if (x.values.type === "assign") {
        res.values[x.values.key] = evaluate(x.values.value, context);
      } else {
        res.items.push(evaluate(x as Code, context));
      }
    }
    return res;
  }

  throw new Error();
};

export default evaluate;
