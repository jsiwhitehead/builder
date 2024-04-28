// DATA

export type Value = boolean | number | string;

export interface Block<T> {
  values: Record<string, T>;
  items: T[];
}

export interface Computed<T> {
  type: "signal";
  get: () => T;
}

export interface Atom<T> extends Computed<T> {
  set: (value: T) => void;
}

export type Signal<T> = Computed<T> | Atom<T>;

export type Data = Value | Block<Data>;

export type SemiData = Value | Block<SignalData>;

export type SignalData = SemiData | Computed<SignalData> | Atom<SignalData>;

// CODE

export interface Scope<T> {
  type: "scope";
  values: Record<string, T>;
  items: T[];
}

export type Code = Value | Block<Code> | Scope<Code>;

export type SemiCode = Value | Block<SignalCode> | Scope<SignalCode>;

export type SignalCode = SemiCode | Computed<SignalCode> | Atom<SignalCode>;

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

export function isComputed(x: SignalData): x is Computed<SignalData>;
export function isComputed(x: SignalCode): x is Computed<SignalCode>;
export function isComputed(x) {
  return typeof x === "object" && x.type === "signal" && !x.set;
}

export function isAtom(x: SignalData): x is Atom<SignalData>;
export function isAtom(x: SignalCode): x is Atom<SignalCode>;
export function isAtom(x) {
  return typeof x === "object" && x.type === "signal" && x.set;
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
