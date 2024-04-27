import {
  computed as baseComputed,
  effect as baseEffect,
  signal as baseSignal,
} from "@preact/signals-core";

import {
  isSignal,
  isValue,
  type Block,
  type Data,
  type Signal,
  type Value,
} from "./types";

export const signal = (initial: Data): Signal => {
  const s = baseSignal<Data>(initial);
  return {
    __type: "signal",
    get: () => s.value,
    set: (v) => {
      s.value = v;
    },
  };
};

export const computed = (func: () => Data): Signal => {
  const s = baseComputed<Data>(func);
  return {
    __type: "signal",
    get: () => s.value,
  };
};

export const effect = (run) =>
  baseEffect(() => {
    const disposes = [] as any[];
    const nestedEffect = (nestedRun) => disposes.push(effect(nestedRun));
    const d = run(nestedEffect);
    if (d) disposes.push(d);
    return () => {
      for (const d of disposes) d();
    };
  });

export const resolve = (data: Data, deep?: true): Value | Block => {
  if (data === undefined) throw new Error();
  const v = isSignal(data) ? resolve(data.get()) : data;
  if (!deep || isValue(v)) return v;
  return {
    __type: "block",
    values: Object.keys(v.values).reduce(
      (res, k) => ({ ...res, [k]: resolve(v.values[k], true) }),
      {}
    ),
    items: v.items.map((x) => resolve(x, true)),
  };
};
