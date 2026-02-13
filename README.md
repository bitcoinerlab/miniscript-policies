# Miniscript Policies

`@bitcoinerlab/miniscript-policies` exposes the reference C++ Miniscript policy
compiler from [`sipa/miniscript`](https://github.com/sipa/miniscript) in
JavaScript via Emscripten.

It is designed for projects that want to compile human-friendly policies (like
`or(and(pk(A),older(8640)),pk(B))`) into Miniscript expressions.

Upstream Miniscript reference docs: https://bitcoin.sipa.be/miniscript/

## What this package provides

- `compilePolicy(policy)`: reference policy compiler output (P2WSH-oriented)
- `compilePolicyTaproot(policy)`: Taproot-focused policy compiler shim
- `ready`: promise you must await before using compiler functions

For Miniscript parsing/analysis/satisfier features, use
[`@bitcoinerlab/miniscript`](https://github.com/bitcoinerlab/miniscript).

## How Taproot support works

`compilePolicyTaproot` is a strict shim built on top of the same reference
compiler:

1. Compile policy with the reference C++ compiler.
2. Rewrite `multi(...)` to `multi_a(...)`.
3. Validate the rewritten expression in tapscript context using
   `@bitcoinerlab/miniscript`.
4. If reference compilation fails, forward the same reference error string
   (for example `"[compile error]"` or `"[exception: ...]"`) with
   `issane=false`.
5. If rewrite/validation fails, return a Taproot-specific error string with
   prefix `"[taproot rewrite error]"` (or `"[taproot rewrite exception]"`)
   and `issane=false`.

This gives a practical policy-to-miniscript path for Taproot while preserving
strict safety checks.

## Installation

```bash
npm install @bitcoinerlab/miniscript-policies
```

## Quick start

```javascript
import {
  compilePolicy,
  compilePolicyTaproot,
  ready
} from '@bitcoinerlab/miniscript-policies';

await ready;

const policy = 'or(and(pk(A),older(8640)),pk(B))';

// Reference compiler (includes asm)
const p2wsh = compilePolicy(policy);
if (!p2wsh.issane) {
  console.warn('Policy result is not sane for P2WSH:', p2wsh.miniscript);
} else {
  console.log(p2wsh.miniscript);
}

// Taproot shim (no asm)
const taproot = compilePolicyTaproot('thresh(2,pk(A),pk(B),pk(C))');
if (!taproot.issane) {
  console.warn('Policy result is not sane for tapscript:', taproot.miniscript);
} else {
  console.log(taproot.miniscript); // multi_a(2,A,B,C)
}
```

## API

### `compilePolicy(policy: string)`

Returns:

```ts
{
  miniscript: string;
  asm: string;
  issane: boolean;
  issanesublevel: boolean;
}
```

Notes:

- This follows the reference compiler behavior from
  [`sipa/miniscript`](https://github.com/sipa/miniscript).
- `asm`, `issane`, and `issanesublevel` are computed by the bundled C++
  reference implementation and are exposed for informational/compatibility
  purposes.
- On failure, `miniscript` and `asm` are `"[compile error]"`.

### `compilePolicyTaproot(policy: string)`

Returns:

```ts
{
  miniscript: string;
  issane: boolean;
}
```

Notes:

- Same result shape style as `compilePolicy`, but without `asm`.
- Recommended success check is `issane`.
- On failure, `issane` is `false` and `miniscript` is an error string:

```ts
{
  miniscript:
    | '[compile error]'
    | `[exception: ...]`
    | `[taproot rewrite error] ...`
    | `[taproot rewrite exception] ...`;
  issane: false;
}
```

### `ready: Promise<void>`

Await this once before calling any compiler function.

## Related package

If you need Miniscript analysis, parsing, satisfier, or tapscript checks beyond
policy-to-miniscript compilation, use
[`@bitcoinerlab/miniscript`](https://github.com/bitcoinerlab/miniscript).

For application-level validation in both P2WSH and Taproot contexts, prefer
using `@bitcoinerlab/miniscript` directly. In this package, the reference
`asm`/sanity fields are returned as informational outputs.

## Upstream credit

This package is built on top of Pieter Wuille's upstream Miniscript work:

- https://github.com/sipa/miniscript
- https://bitcoin.sipa.be/miniscript/

## Build

This package uses Emscripten.

```bash
make clean && make
npm run build
```

## Test

```bash
npm test
```
