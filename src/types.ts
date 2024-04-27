// BASE TYPE

export interface Block {
  __type: "block";
  values: Record<string, Data>;
  items: Data[];
}

export interface Signal {
  __type: "signal";
  get: () => Data;
  set?: (value: Data) => void;
}

export type Value = boolean | number | string;

export type Data = Value | Block | Signal;

export const isValue = (data: Data): data is Value => {
  return typeof data !== "object";
};

export const isSignal = (data: Data): data is Signal => {
  return typeof data === "object" && data.__type === "signal";
};

// CODE TYPE

interface CodeAssign extends Block {
  values: { type: "assign"; key: string; value: Code };
  items: [];
}

interface CodeBlock extends Block {
  values: { type: "block" };
  items: (Code | CodeAssign)[];
}

export type Code = Value | CodeBlock | Signal;

export const isCodeBlock = (code: Code): code is CodeBlock => {
  return (
    typeof code === "object" &&
    code.__type === "block" &&
    code.values.type === "block"
  );
};

export const isCodeAssign = (code: Code | CodeAssign): code is CodeAssign => {
  return (
    typeof code === "object" &&
    code.__type === "block" &&
    code.values.type === "assign"
  );
};

export const isCode = (code: Code | CodeAssign): code is Code => {
  return !isCodeAssign(code);
};
