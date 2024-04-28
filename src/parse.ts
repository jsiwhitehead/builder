import { grammar as ohmGrammar } from "ohm-js";

const grammar = String.raw`Maraca {

  start
    = space* value? space*

  value
    = ternary

  ternary
    = or space* "?" space* or space* ":" space* ternary -- ternary
    | or

  or
    = or space* "|" space* and -- or
    | and

  and
    = and space* "&" space* equal -- and
    | equal

  equal
    = equal space* ("!=" | "=") space* compare -- equal
    | compare

  compare
    = compare space* ("<=" | ">=" | "<" | ">") space* sum -- compare
    | sum

  sum
    = sum space* ("+" | "-") space+ product -- sum
    | product

  product
    = product space* ("*" | "/" | "%") space* power -- product
    | power

  power
    = power space* "^" space* unary -- power
    | unary

  unary
    = ("-" | "!") space* unary -- unary
    | apply

  apply
    = apply "." label -- key
    | apply "[" space* value space* "]" -- get
    | atom

  atom
    = string | number | boolean | label | brackets


  string
    = "'" (s_value | s_chunk)* "'"

  s_value
    = "{" space* value space* "}"

  s_chunk
    = (s_char | escape)+

  s_char
    = ~("'" | "\\" | "{") any

  escape
    = "\\" any

  number
    = digit+ ("." digit+)?

  boolean
    = ("yes" | "no") ~alnum

  label
    = alnum+

  brackets
    = "(" space* value space* ")"
}`;

const g = ohmGrammar(grammar);
const s = g.createSemantics() as any;

const binary = (a, _1, b, _2, c) => ({
  type: "operation",
  operation: b.sourceString,
  nodes: [a.ast, c.ast],
});

s.addAttribute("ast", {
  start: (_1, a, _2) => a.ast[0],

  value: (a) => a.ast,

  ternary_ternary: (a, _1, _2, _3, b, _4, _5, _6, c) => ({
    type: "operation",
    operation: "ternary",
    nodes: [a.ast, b.ast, c.ast],
  }),

  or_or: binary,
  or: (a) => a.ast,

  and_and: binary,
  and: (a) => a.ast,

  equal_equal: binary,
  equal: (a) => a.ast,

  compare_compare: binary,
  compare: (a) => a.ast,

  sum_sum: binary,
  sum: (a) => a.ast,

  product_product: binary,
  product: (a) => a.ast,

  power_power: binary,
  power: (a) => a.ast,

  unary_unary: (a, _1, b) => ({
    type: "operation",
    operation: a.sourceString,
    nodes: [b.ast],
  }),
  unary: (a) => a.ast,

  apply_key: (a, _1, b) => ({
    type: "get",
    nodes: [a.ast, { type: "value", value: b.ast.value }],
  }),
  apply_get: (a, _1, _2, b, _3, _4) => ({
    type: "get",
    nodes: [a.ast, b.ast],
  }),
  apply: (a) => a.ast,

  atom: (a) => a.ast,

  string: (_1, a, _2) =>
    a.ast.length === 0 || a.ast.length === 1
      ? a.ast[0] || { type: "value", value: "" }
      : { type: "operation", operation: "concat", nodes: a.ast },

  s_value: (_1, _2, a, _3, _4) => a.ast,

  s_chunk: (a) => ({
    type: "value",
    value: a.sourceString.replace(/\\(.)/g, (_, a) => a),
  }),

  s_char: (_) => null,

  escape: (_1, _2) => null,

  number: (a, b, c) => ({
    type: "value",
    value: parseFloat([a, b, c].map((x) => x.sourceString).join("")),
  }),

  boolean: (a) => ({ type: "value", value: a.sourceString === "yes" }),

  label: (a) => ({ type: "label", value: a.sourceString }),

  brackets: (_1, _2, a, _3, _4) => a.ast,

  listOf: (a) => a.ast,
  nonemptyListOf: (a, _1, b) => [a.ast, ...b.ast],
  emptyListOf: () => [],

  _iter: (...children) => children.map((c) => c.ast),
  _terminal: () => null,
});

export default (script) => {
  const m = g.match(script);
  if (m.failed()) {
    // console.warn(m.message);
    // throw new Error("Parser error");
    return null;
  }
  return s(m).ast;
};
