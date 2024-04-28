import { escapeText, unescapeText } from "./evaluate";
import { atom, computed, resolve, wrap } from "./signal";
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
            b({ fill: "'#eee'", size: 5 }, b({}, "")),
            b({ size: 5 }, ""),
            ...keys.flatMap((k) => [
              b(
                {
                  fill: "'#eee'",
                  color: "'blue'",
                  pad: b({
                    left: 10,
                    right: 5,
                    bottom: 5,
                    top:
                      isValue(code.values[k]) || isSignal(code.values[k])
                        ? 5
                        : 16,
                  }),
                },
                b({}, `${k}:`)
              ),
              {
                type: "scope",
                values: { hover: atom(false), focus: atom(false) },
                items: [
                  {
                    values: {
                      ...(isAtom(code.values[k])
                        ? { hover: "hover", pad: b({}, 5, 0) }
                        : { pad: b({ right: 10 }, 5) }),
                      border: b({
                        left: "focus ? '5px solid blue' : '5px solid transparent'",
                      }),
                      fill: "focus ? '#e5e5ff' : hover ? '#f2f2ff' : 'transparent'",
                    },
                    items: [map(code.values[k])],
                  },
                ],
              },
            ]),
            b({ fill: "'#eee'", size: 5 }, b({}, "")),
            b({ size: 5 }, "")
          ),
        ]
      : []),
    ...(code.items.length > 0
      ? [
          b(
            {
              pad: b({}, 5, 0),
              border: b({
                left: border,
                top: keys.length > 0 ? "'1px dashed #888'" : "''",
              }),
            },
            ...code.items
              .map((x) => {
                if (isAtom(x)) {
                  return map(
                    wrap(
                      x,
                      (v) => (isValue(v) ? escapeText(v) : v),
                      (v) => (isValue(v) ? unescapeText(v) : v)
                    )
                  );
                }
                if (isComputed(x)) {
                  return map(
                    computed(() => {
                      const v = resolve(x);
                      return isValue(v) ? escapeText(v) : v;
                    })
                  );
                }
                return map(isValue(x) ? escapeText(x) : x);
              })
              .map((x, i) => ({
                type: "scope",
                values: { hover: atom(false), focus: atom(false) },
                items: [
                  {
                    values: {
                      ...(isAtom(code.items[i])
                        ? { hover: "hover", pad: b({}, 5, 0) }
                        : { pad: b({ right: 10 }, 5) }),
                      border: b({
                        left: "focus ? '5px solid blue' : '5px solid transparent'",
                      }),
                      fill: "focus ? '#e5e5ff' : hover ? '#f2f2ff' : 'transparent'",
                    },
                    items: [x],
                  },
                ],
              }))
          ),
        ]
      : [])
  );
};

const map = (code: SignalCode): SignalCode => {
  if (isAtom(code)) {
    return {
      values: {
        input: "yes",
        focus: "focus",
        pad: b({ left: 5, right: 10 }),
      },
      items: [code],
    };
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
