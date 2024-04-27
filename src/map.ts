import {
  type SignalCode,
  type SignalData,
  isBlock,
  isScope,
  isSignal,
  isValue,
} from "./types";

const b = (values, ...items): SignalData => ({
  values,
  items,
});

const mapBlock = (code, border) => {
  const keys = Object.keys(code.values);
  return b(
    {
      width: "fit-content",
      border: b({
        top: border,
        right: border,
        bottom: border,
      }),
    },
    ...(keys.length > 0
      ? [
          b(
            {
              flow: "grid",
              grid: "min-content auto",
              border: b({ left: border }),
            },
            b({ fill: "#eee", size: 10 }, b({}, "")),
            b({ size: 10 }, ""),
            ...keys.flatMap((k) => [
              b(
                {
                  fill: "#eee",
                  color: "blue",
                  pad: b({ left: 10, right: 5, bottom: 10 }),
                },
                b({}, `${k}:`)
              ),
              b(
                {
                  pad: b({ left: 10, bottom: 10, right: 10 }),
                },
                map(code.values[k])
              ),
            ])
          ),
        ]
      : []),
    ...(code.items.length > 0
      ? [
          b(
            {
              gap: 10,
              pad: b({ left: 10, top: 10, bottom: 10, right: 10 }),
              border: b({ left: border }),
            },
            ...code.items.map((x) => map(x))
          ),
        ]
      : [])
  );
};

const map = (code: SignalCode): SignalData => {
  if (isSignal(code)) {
    return b({ input: code });
  }

  if (isValue(code)) {
    return code;
  }

  if (isScope(code)) {
    return mapBlock(code, "1px dashed #999");
  }

  if (isBlock(code)) {
    return mapBlock(code, "1px solid #999");
  }

  throw new Error();
};

export default map;
