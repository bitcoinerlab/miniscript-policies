# Miniscript Policies

This package exposes [the reference C++
Miniscript](https://github.com/sipa/miniscript) policy compiler in JavaScript
via Emscripten. It is a companion to
[https://github.com/bitcoinerlab/miniscript](https://github.com/bitcoinerlab/miniscript),
which does the heavy lifting for compilation and satisfactions.

Use this package when you need to compile policies into Miniscript expressions
for P2WSH.

## Usage

```javascript
import { compilePolicy, ready } from '@bitcoinerlab/miniscript-policies';

await ready;
const policy = 'or(and(pk(A),older(8640)),pk(B))';
const result = compilePolicy(policy);
console.log(result.miniscript);
```

## Build

This package uses Emscripten. Build with:

```bash
make clean && make
npm run build
```

## Test

```bash
npm test
```
