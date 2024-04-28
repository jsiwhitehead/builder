import {
  computed as baseComputed,
  effect as baseEffect,
  signal as baseSignal,
} from "@preact/signals-core";

import {
  isAtom,
  isComputed,
  isSignal,
  isValue,
  type Atom,
  type Code,
  type Computed,
  type Data,
  type SemiCode,
  type SemiData,
  type Signal,
  type SignalCode,
  type SignalData,
} from "./types";

export const atom = <T>(initial: T): Atom<T> => {
  const s = baseSignal<T>(initial);
  return {
    type: "signal",
    get: () => s.value,
    set: (v) => {
      s.value = v;
    },
  };
};

export const wrap = <T, U>(
  signal: Atom<T>,
  wrap: (v: T) => U,
  unwrap: (v: U) => T
): Atom<U> => {
  return {
    type: "signal",
    get: () => wrap(signal.get()),
    set: (v) => {
      signal.set!(unwrap(v));
    },
  };
};

export const computed = <T>(func: () => T): Computed<T> => {
  let prev;
  const s = baseComputed<T>(() => {
    const next = func();
    if (next !== undefined) prev = next;
    return prev;
  });
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

export function resolve<T>(data: Signal<T>): T;
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

export function resolveToAtom(data: SignalData): Atom<SignalData> | undefined;
export function resolveToAtom(data: SignalCode): Atom<SignalCode> | undefined;
export function resolveToAtom(data) {
  if (data === undefined) throw new Error();
  const v = isComputed(data) ? resolveToAtom(data.get()) : data;
  return isAtom(v) ? v : undefined;
}
