// DATA

export type Value = boolean | number | string;

export interface Block<T> {
  values: Record<string, T>;
  items: T[];
}

export interface Signal<T> {
  type: "signal";
  get: () => T;
  set?: (value: T) => void;
}

export type Data = Value | Block<Data>;

export type SemiData = Value | Block<SignalData>;

export type SignalData = SemiData | Signal<SignalData>;

// CODE

export interface Scope<T> {
  type: "scope";
  values: Record<string, T>;
  items: T[];
}

export type Code = Value | Block<Code> | Scope<Code>;

export type SemiCode = Value | Block<SignalCode> | Scope<SignalCode>;

export type SignalCode = SemiCode | Signal<SignalCode>;

// TESTS

export function isValue(
  x: Data | SemiData | SignalData | Code | SemiCode | SignalCode
): x is Value {
  return typeof x !== "object";
}

export function isBlock(x: Data): x is Block<Data>;
export function isBlock(x: Code): x is Block<Code>;
export function isBlock(x: SemiData | SignalData): x is Block<SignalData>;
export function isBlock(x: SemiCode | SignalCode): x is Block<SignalCode>;
export function isBlock(x) {
  return typeof x === "object" && !x.type;
}

export function isSignal(x: SignalData): x is Signal<SignalData>;
export function isSignal(x: SignalCode): x is Signal<SignalCode>;
export function isSignal(x) {
  return typeof x === "object" && x.type === "signal";
}

export function isScope(x: Code): x is Scope<Code>;
export function isScope(x: SemiCode | SignalCode): x is Scope<SignalCode>;
export function isScope(x) {
  return typeof x === "object" && x.type === "scope";
}
