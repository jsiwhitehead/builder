// import { computed, resolve } from "./signal";
import {
  type Code,
  type Data,
  isCode,
  isCodeAssign,
  isCodeBlock,
  isSignal,
  isValue,
} from "./types";

const b = (values, ...items): Data => ({
  __type: "block",
  values,
  items,
});

const map = (code: Code): Data => {
  if (isSignal(code)) {
    // return computed(() => map(resolve(code) as Code));
    return b({ input: code });
  }

  if (isValue(code)) {
    return code;
  }

  if (isCodeBlock(code)) {
    const assignItems = code.items.filter(isCodeAssign);
    const otherItems = code.items.filter(isCode);
    return b(
      {
        width: "fit-content",
        border: b({ top: "1px solid #999" }),
      },
      ...(assignItems.length > 0
        ? [
            b(
              {
                flow: "grid",
                grid: "min-content auto",
                border: b({ left: "1px solid #999" }),
              },
              b({ fill: "#f4f4f4", size: 10 }, b({}, "")),
              b({ size: 10 }, ""),
              ...assignItems.flatMap((x) => [
                b(
                  {
                    fill: "#f4f4f4",
                    color: "blue",
                    pad: b({ left: 15, right: 5, bottom: 10 }),
                  },
                  b({}, `${x.values.key}:`)
                ),
                b(
                  {
                    pad: b({ left: 10, bottom: 10, right: 10 }),
                  },
                  map(x.values.value)
                ),
              ])
            ),
          ]
        : []),
      ...(otherItems.length > 0
        ? [
            b(
              {
                gap: 10,
                pad: b({ left: 15, top: 10, bottom: 10, right: 10 }),
                border: b({ left: "1px solid #999" }),
              },
              ...otherItems.map((x) => map(x))
            ),
          ]
        : [])
    );
  }
  throw new Error();
};

export default map;
