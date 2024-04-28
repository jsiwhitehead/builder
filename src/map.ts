import { escapeText, unescapeText } from "./evaluate";
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

const b = (values, ...items): SignalData => ({
  values,
  items,
});

const mapBlock = (code, border) => {
  const keys = Object.keys(code.values);
  return b(
    {
      width: "'fit-content'",
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
              flow: "'grid'",
              grid: "'min-content auto'",
              border: b({ left: border }),
            },
            b({ fill: "'#eee'", size: 10 }, b({}, "")),
            b({ size: 10 }, ""),
            ...keys.flatMap((k) => [
              b(
                {
                  fill: "'#eee'",
                  color: "'blue'",
                  pad: b({
                    left: 10,
                    right: 5,
                    bottom: 10,
                    top:
                      isValue(code.values[k]) || isSignal(code.values[k])
                        ? 0
                        : 11,
                  }),
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
              border: b({
                left: border,
                top: keys.length > 0 ? "'1px dashed #888'" : "''",
              }),
            },
            ...code.items.map((x) => {
              if (isAtom(x)) {
                return map(
                  wrap(
                    x,
                    (v) => (isValue(v) ? escapeText(`${v}`) : v),
                    (v) => (isValue(v) ? unescapeText(`${v}`) : v)
                  )
                );
              }
              if (isComputed(x)) {
                return map(
                  computed(() => {
                    const v = resolve(x);
                    return isValue(v) ? escapeText(`${v}`) : v;
                  })
                );
              }
              return map(isValue(x) ? escapeText(`${x}`) : x);
            })
          ),
        ]
      : [])
  );
};

const map = (code: SignalCode): SignalCode => {
  if (isAtom(code)) {
    return b({ input: "yes" }, code);
  }

  if (isComputed(code)) {
    return code;
  }

  if (isValue(code)) {
    return code;
  }

  if (isScope(code)) {
    return mapBlock(code, "'1px dashed #888'");
  }

  if (isBlock(code)) {
    return mapBlock(code, "'1px solid #888'");
  }

  throw new Error();
};

export default map;
