// BASE TYPE

export interface Block {
  __type: "block";
  values: { [key: string]: Data };
  items: Data[];
}

export interface Signal {
  __type: "signal";
  get: () => Data;
  set: (value: Data) => {};
}

export type Value = boolean | number | string;

export type Data = Value | Block | Signal;

export const isSignal = (data: Data): data is Signal => {
  return typeof data === "object" && data.__type === "signal";
};

// CODE TYPE

interface CodeValue extends Block {
  values: { type: "value"; value: string };
  items: [];
}

interface CodeAssign extends Block {
  values: { type: "assign"; key: string; value: Code };
  items: [];
}

interface CodeBlock extends Block {
  values: { type: "block" };
  items: (Code | CodeAssign)[];
}

export type Code = CodeValue | CodeBlock;

export const isCodeValue = (code: Code): code is CodeValue => {
  return code.__type === "block" && code.values.type === "value";
};

export const isCodeBlock = (code: Code): code is CodeBlock => {
  return code.__type === "block" && code.values.type === "block";
};

export const isCodeAssign = (code: Code | CodeAssign): code is CodeAssign => {
  return code.__type === "block" && code.values.type === "assign";
};

export const isCode = (code: Code | CodeAssign): code is Code => {
  return code.__type === "block" && code.values.type !== "assign";
};
