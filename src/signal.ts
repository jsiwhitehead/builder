import {
  computed as baseComputed,
  effect as baseEffect,
  signal as baseSignal,
} from "@preact/signals-core";

import {
  isSignal,
  isValue,
  type Code,
  type Data,
  type SemiCode,
  type SemiData,
  type Signal,
  type SignalCode,
  type SignalData,
} from "./types";

export const signal = <T>(initial: T): Signal<T> => {
  const s = baseSignal<T>(initial);
  return {
    type: "signal",
    get: () => s.value,
    set: (v) => {
      s.value = v;
    },
  };
};

export const computed = <T>(func: () => T): Signal<T> => {
  const s = baseComputed<T>(func);
  return {
    type: "signal",
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

export function resolve(data: SignalData): SemiData;
export function resolve(data: SignalCode): SemiCode;
export function resolve(data: SignalData, deep: true): Data;
export function resolve(data: SignalCode, deep: true): Code;
export function resolve(data, deep?) {
  if (data === undefined) throw new Error();
  const v = isSignal(data) ? resolve(data.get()) : data;
  if (!deep || isValue(v)) return v;
  return {
    ...v,
    values: Object.keys(v.values).reduce(
      (res, k) => ({ ...res, [k]: resolve(v.values[k], true) }),
      {}
    ),
    items: v.items.map((x) => resolve(x, true)),
  };
}
